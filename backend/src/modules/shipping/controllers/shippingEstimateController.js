'use strict';

/**
 * Shipping Estimate Controller
 * Calculates estimated shipping charges BEFORE order placement
 */

/**
 * Calculate estimated shipping charges based on address and cart items
 * 
 * This uses a simplified calculation since Shiprocket requires an order_id
 * to get exact courier rates. We'll use average rates or admin-configured rates.
 * 
 * Alternative: Create a temporary "quote" order in Shiprocket, get rates, then cancel it
 */
exports.estimateShipping = async (req, res) => {
    try {
        const { shippingAddress, cartItems, totalWeight } = req.body;

        if (!shippingAddress || !shippingAddress.pincode) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address with pincode is required'
            });
        }

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items are required'
            });
        }

        // Get admin config for shipping handling percentage
        const { getAdminConfig } = require('../../shared/services/adminConfigService');
        const adminConfig = await getAdminConfig();
        const shippingHandlingPercent = adminConfig.defaultShippingHandlingPercent || 0;

        // Calculate total weight (if not provided)
        const weight = totalWeight || (cartItems.length * 0.5); // Default 0.5kg per item

        // Calculate base estimated shipping
        const estimatedShipping = calculateShippingEstimate(
            shippingAddress.pincode,
            weight,
            cartItems.length
        );

        // Apply shipping handling percentage if configured
        let finalShippingCharge = estimatedShipping.charge;
        if (shippingHandlingPercent > 0) {
            // Calculate cart subtotal for percentage-based shipping
            const cartSubtotal = cartItems.reduce((sum, item) => {
                const price = item.price || item.basePrice || 0;
                const quantity = item.quantity || 1;
                return sum + (price * quantity);
            }, 0);

            // Add percentage-based handling charge
            const handlingCharge = (cartSubtotal * shippingHandlingPercent) / 100;
            finalShippingCharge = estimatedShipping.charge + handlingCharge;
        }

        // Round to nearest rupee
        finalShippingCharge = Math.round(finalShippingCharge);

        // Free shipping if charge is 0 (when admin sets 0%)
        if (shippingHandlingPercent === 0 && estimatedShipping.charge === 0) {
            finalShippingCharge = 0;
        }

        return res.status(200).json({
            success: true,
            shippingCharge: finalShippingCharge,
            estimatedDeliveryDays: estimatedShipping.deliveryDays,
            courierName: estimatedShipping.courierName || 'Standard Delivery',
            message: 'Estimated shipping charge calculated',
            breakdown: {
                baseShipping: estimatedShipping.charge,
                handlingPercent: shippingHandlingPercent,
                handlingCharge: finalShippingCharge - estimatedShipping.charge,
                total: finalShippingCharge
            }
        });

    } catch (error) {
        console.error('Shipping estimate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to calculate shipping estimate'
        });
    }
};

/**
 * Calculate shipping estimate based on pincode, weight, and item count
 * 
 * This is a simplified calculation. You can:
 * 1. Use fixed rates from admin config
 * 2. Use pincode-based zones (metro/tier1/tier2/tier3)
 * 3. Integrate with Shiprocket's serviceability API (requires temp order)
 * 4. Use historical average rates
 */
function calculateShippingEstimate(pincode, weight, itemCount) {
    // Define shipping zones based on pincode patterns
    const metroZones = ['110', '400', '560', '600', '700', '800']; // Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad
    const isMetro = metroZones.some(zone => pincode.startsWith(zone));

    // Base rates (in INR)
    let baseRate = 40; // Base shipping charge
    let perKgRate = 20; // Additional charge per kg
    let perItemRate = 10; // Additional charge per item

    // Zone-based multiplier
    const zoneMultiplier = isMetro ? 1.0 : 1.2; // 20% more for non-metro

    // Calculate total shipping charge
    const weightCharge = weight * perKgRate;
    const itemCharge = (itemCount - 1) * perItemRate; // First item included in base
    const totalCharge = (baseRate + weightCharge + itemCharge) * zoneMultiplier;

    // Round to nearest 5
    const roundedCharge = Math.ceil(totalCharge / 5) * 5;

    // Estimated delivery days
    const deliveryDays = isMetro ? '2-4 days' : '3-6 days';

    return {
        charge: roundedCharge,
        deliveryDays: deliveryDays,
        courierName: 'Standard Delivery',
        breakdown: {
            baseRate: baseRate,
            weightCharge: weightCharge,
            itemCharge: itemCharge,
            zoneMultiplier: zoneMultiplier,
            zone: isMetro ? 'Metro' : 'Non-Metro'
        }
    };
}

/**
 * Get shipping zones and rates (for admin configuration)
 */
exports.getShippingRates = async (req, res) => {
    try {
        // Return current shipping rate configuration
        const rates = {
            baseRate: 40,
            perKgRate: 20,
            perItemRate: 10,
            metroMultiplier: 1.0,
            nonMetroMultiplier: 1.2,
            freeShippingThreshold: 500, // Free shipping above this amount
            zones: {
                metro: ['110', '400', '560', '600', '700', '800'],
                tier1: ['201', '302', '380', '411', '500'],
                tier2: [] // All others
            }
        };

        return res.status(200).json({
            success: true,
            rates: rates
        });
    } catch (error) {
        console.error('Get shipping rates error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch shipping rates'
        });
    }
};

module.exports = {
    estimateShipping: exports.estimateShipping,
    getShippingRates: exports.getShippingRates
};
