/**
 * Platform Fee Calculation Utility
 * 
 * Platform fee is split into 5 components:
 * - Digital Security Fee: 1.2%
 * - Merchant Verification: 1.0%
 * - Transit Care: 0.8%
 * - Platform Maintenance: 0.5%
 * - Quality & Handling: 0.0% (configurable by admin)
 * Total: 3.5% (default, can be adjusted)
 */

export const PLATFORM_FEE_BREAKDOWN = {
    digitalSecurityFee: {
        percent: 1.2,
        label: 'Digital Security Fee',
        description: 'Secure payment processing and fraud protection'
    },
    merchantVerification: {
        percent: 1.0,
        label: 'Merchant Verification',
        description: 'Seller verification and quality assurance'
    },
    transitCare: {
        percent: 0.8,
        label: 'Transit Care',
        description: 'Safe delivery and package handling'
    },
    platformMaintenance: {
        percent: 0.5,
        label: 'Platform Maintenance',
        description: 'Platform upkeep and customer support'
    },
    qualityHandling: {
        percent: 0.0,
        label: 'Quality & Handling',
        description: 'Quality assurance and order handling'
    }
};

/**
 * Calculate total platform fee percentage
 * @param {Object} breakdown - Platform fee breakdown object
 * @returns {number} - Total percentage
 */
export const calculateTotalPlatformFeePercent = (breakdown = PLATFORM_FEE_BREAKDOWN) => {
    return Object.values(breakdown).reduce((sum, item) => sum + (item.percent || 0), 0);
};

/**
 * Calculate platform fee breakdown for a given amount
 * @param {number} amount - Base amount to calculate fee on
 * @param {Object} breakdown - Platform fee breakdown (optional, uses default if not provided)
 * @returns {Object} - Breakdown with calculated amounts
 */
export const calculatePlatformFeeBreakdown = (amount, breakdown = PLATFORM_FEE_BREAKDOWN) => {
    const result = {};
    let total = 0;
    
    Object.entries(breakdown).forEach(([key, value]) => {
        const feeAmount = (amount * value.percent) / 100;
        result[key] = {
            ...value,
            amount: Math.round(feeAmount * 100) / 100 // Round to 2 decimal places
        };
        total += feeAmount;
    });
    
    result.total = {
        percent: calculateTotalPlatformFeePercent(breakdown),
        amount: Math.round(total * 100) / 100
    };
    
    return result;
};

/**
 * Calculate total platform fee amount
 * @param {number} amount - Base amount
 * @param {number} percent - Platform fee percentage (optional, uses default 3.5% if not provided)
 * @returns {number} - Total platform fee amount
 */
export const calculatePlatformFee = (amount, percent = null) => {
    const feePercent = percent !== null ? percent : calculateTotalPlatformFeePercent();
    return Math.round((amount * feePercent / 100) * 100) / 100;
};

/**
 * Format platform fee breakdown for display
 * @param {Object} breakdown - Calculated breakdown from calculatePlatformFeeBreakdown
 * @returns {Array} - Array of formatted items for display
 */
export const formatPlatformFeeBreakdown = (breakdown) => {
    const items = [];
    
    Object.entries(breakdown).forEach(([key, value]) => {
        if (key !== 'total') {
            items.push({
                key,
                label: value.label,
                percent: value.percent,
                amount: value.amount,
                description: value.description
            });
        }
    });
    
    return items;
};

/**
 * Get platform fee breakdown from admin config
 * @param {Object} adminConfig - Admin configuration object
 * @returns {Object} - Platform fee breakdown
 */
export const getPlatformFeeBreakdownFromConfig = (adminConfig) => {
    if (adminConfig?.platformFeeBreakdown) {
        // Convert admin config format to utility format
        const breakdown = {};
        Object.entries(adminConfig.platformFeeBreakdown).forEach(([key, percent]) => {
            const defaultItem = PLATFORM_FEE_BREAKDOWN[key];
            breakdown[key] = {
                percent: percent,
                label: defaultItem?.label || key,
                description: defaultItem?.description || ''
            };
        });
        return breakdown;
    }
    
    return PLATFORM_FEE_BREAKDOWN;
};

/**
 * Validate platform fee breakdown
 * @param {Object} breakdown - Platform fee breakdown to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validatePlatformFeeBreakdown = (breakdown) => {
    if (!breakdown || typeof breakdown !== 'object') {
        return { valid: false, error: 'Invalid breakdown format' };
    }
    
    const total = calculateTotalPlatformFeePercent(breakdown);
    
    if (total < 0) {
        return { valid: false, error: 'Total fee cannot be negative' };
    }
    
    if (total > 20) {
        return { valid: false, error: 'Total fee cannot exceed 20%' };
    }
    
    // Check individual components
    for (const [key, value] of Object.entries(breakdown)) {
        if (value.percent < 0) {
            return { valid: false, error: `${value.label} cannot be negative` };
        }
        if (value.percent > 10) {
            return { valid: false, error: `${value.label} cannot exceed 10%` };
        }
    }
    
    return { valid: true, error: '' };
};

/**
 * Get cap amount for a given product price from platformFeeCapRanges
 * @param {number} basePrice - Product base price
 * @param {Array} platformFeeCapRanges - Array of cap range configs from adminConfig
 * @returns {number} - Cap amount in ₹ (0 = no cap)
 */
export const getCapAmountForPrice = (basePrice, platformFeeCapRanges) => {
    if (!platformFeeCapRanges || platformFeeCapRanges.length === 0) return 0;
    
    const matched = platformFeeCapRanges.find(range =>
        basePrice >= range.min && (range.max === null || basePrice <= range.max)
    );
    
    return matched ? (matched.capAmount ?? 0) : 0;
};

/**
 * Split cap amount proportionally across breakdown components
 * @param {number} capAmount - The cap amount to split
 * @param {Object} breakdown - Platform fee breakdown with percentages
 * @returns {Object} - Breakdown with amounts split proportionally
 */
export const splitCapAmountByBreakdown = (capAmount, breakdown) => {
    const total = Object.values(breakdown).reduce((sum, v) => sum + (v.percent || v), 0);
    if (total === 0) return breakdown; // avoid divide by zero
    
    const result = {};
    Object.entries(breakdown).forEach(([key, value]) => {
        const percent = value.percent || value;
        const amount = parseFloat(((percent / total) * capAmount).toFixed(2));
        result[key] = {
            ...value,
            amount: amount
        };
    });
    
    return result;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
};

/**
 * Calculate order totals with GST-inclusive product pricing
 * Platform fee is calculated as percentage of base price, then capped if configured
 * 
 * @param {Array} items - Cart items with price info
 * @param {Object} options - Configuration options
 * @param {Object} options.adminConfig - The full admin config from Firebase
 * @param {number} options.couponDiscount - Discount amount in ₹
 * @param {number} options.shippingFee - Shipping fee in ₹
 * @returns {Object} - Complete order calculation
 */
export const calculateOrderTotalsWithGSTInclusive = (items, options = {}) => {
    const { adminConfig, couponDiscount = 0, shippingFee = 0 } = options;
    
    let productPricingTotal = 0;
    let totalBasePrice = 0;
    
    // Calculate product totals
    items.forEach(item => {
        const gstPercent = item.gstPercent || 18;
        const basePrice = item.basePrice || item.price;
        const priceWithGST = item.priceWithGST || (basePrice * (1 + gstPercent / 100));
        const itemTotal = priceWithGST * item.quantity;
        productPricingTotal += itemTotal;
        totalBasePrice += basePrice * item.quantity;
    });

    // Get platform fee breakdown from config
    const breakdown = getPlatformFeeBreakdownFromConfig(adminConfig);
    const percentageTotal = Object.values(breakdown).reduce((sum, v) => sum + (v.percent || v), 0);
    
    // Calculate platform fee for each item
    let totalPlatformFee = 0;
    const mergedBreakdown = {};
    
    items.forEach(item => {
        const basePrice = item.basePrice || item.price;
        const quantity = item.quantity;
        
        // Calculate percentage-based fee for this item
        const calculatedFee = (basePrice * percentageTotal / 100) * quantity;
        
        // Check if a cap applies for this item's price
        const capAmount = getCapAmountForPrice(basePrice, adminConfig.platformFeeCapRanges);
        
        let effectiveFee;
        let effectiveBreakdown;
        
        if (capAmount > 0 && calculatedFee > capAmount * quantity) {
            // Cap applies — use cap amount × quantity as effective fee
            effectiveFee = capAmount * quantity;
            // Split cap proportionally for display
            effectiveBreakdown = splitCapAmountByBreakdown(capAmount, breakdown);
        } else {
            // No cap — use calculated fee
            effectiveFee = calculatedFee;
            // Calculate breakdown normally
            effectiveBreakdown = calculatePlatformFeeBreakdown(basePrice * quantity, breakdown);
        }
        
        totalPlatformFee += effectiveFee;
        
        // Merge breakdown amounts across all items
        Object.entries(effectiveBreakdown).forEach(([key, value]) => {
            if (key !== 'total') {
                if (!mergedBreakdown[key]) {
                    mergedBreakdown[key] = { ...value, amount: 0 };
                }
                mergedBreakdown[key].amount += value.amount;
            }
        });
    });
    
    // Round total platform fee
    totalPlatformFee = Math.round(totalPlatformFee * 100) / 100;
    
    // Round merged breakdown amounts
    Object.keys(mergedBreakdown).forEach(key => {
        mergedBreakdown[key].amount = Math.round(mergedBreakdown[key].amount * 100) / 100;
    });
    
    // Add total to breakdown
    mergedBreakdown.total = {
        percent: percentageTotal,
        amount: totalPlatformFee
    };

    const serviceGST = Math.round((totalPlatformFee * 0.18) * 100) / 100;
    const platformFeeAndServiceGST = totalPlatformFee + serviceGST;
    const total = productPricingTotal + platformFeeAndServiceGST + shippingFee - couponDiscount;

    return {
        productPricingTotal: Math.round(productPricingTotal * 100) / 100,
        basePrice: Math.round(totalBasePrice * 100) / 100,
        platformFee: totalPlatformFee,
        platformFeeBreakdown: mergedBreakdown,
        serviceGST,
        platformFeeAndServiceGST: Math.round(platformFeeAndServiceGST * 100) / 100,
        shippingFee,
        couponDiscount,
        total: Math.round(total * 100) / 100,
        breakdown: {
            ...mergedBreakdown,
            serviceGST: {
                label: 'GST (18% on Platform Fee)',
                amount: serviceGST,
                percent: 18
            }
        }
    };
};

/**
 * Calculate order totals with platform fee breakdown
 * @param {Array} items - Cart items
 * @param {Object} options - { adminConfig, couponDiscount, shippingFee }
 * @returns {Object} - Complete order calculation
 */
export const calculateOrderTotals = (items, options = {}) => {
    const { adminConfig, couponDiscount = 0, shippingFee = 0 } = options;
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    // Get platform fee breakdown
    const breakdown = getPlatformFeeBreakdownFromConfig(adminConfig);
    const platformFeeDetails = calculatePlatformFeeBreakdown(subtotal, breakdown);
    
    // Calculate GST
    const gstPercent = adminConfig?.defaultGstPercent || 18;
    const gst = Math.round((subtotal * gstPercent / 100) * 100) / 100;
    
    // Calculate total
    const total = subtotal + platformFeeDetails.total.amount + gst + shippingFee - couponDiscount;
    
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        platformFee: platformFeeDetails.total.amount,
        platformFeeBreakdown: platformFeeDetails,
        gst: gst,
        gstPercent: gstPercent,
        shippingFee: shippingFee,
        couponDiscount: couponDiscount,
        total: Math.round(total * 100) / 100
    };
};
