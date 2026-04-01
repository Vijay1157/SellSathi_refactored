'use strict';
const { db } = require('../../config/firebase');
const cache = require('../../utils/cache');

const ADMIN_CONFIG_CACHE_KEY = 'adminConfig';
const ADMIN_CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (reduced from 30 for faster updates)

/**
 * Get admin configuration
 * Returns admin details for use in emails, PDFs, and notifications
 */
const getAdminConfig = async () => {
    try {
        // Check cache first
        const cached = cache.get(ADMIN_CONFIG_CACHE_KEY);
        if (cached) {
            console.log('[AdminConfig] Returning cached config');
            return cached;
        }

        console.log('[AdminConfig] Cache miss, fetching from database');

        // Get ALL admin users (no limit) to find the one with settings
        let usersSnap = await db.collection("users")
            .where("role", "==", "ADMIN")
            .get();

        if (usersSnap.empty) {
            usersSnap = await db.collection("users")
                .where("role", "==", "admin")
                .get();
        }

        if (usersSnap.empty) {
            console.warn('[AdminConfig] No admin user found, using defaults');
            return getDefaultConfig();
        }

        // Find the admin who has an adminProfiles document with actual settings
        let adminUid = null;
        let adminProfile = {};
        let userData = {};

        for (const doc of usersSnap.docs) {
            const uid = doc.id;
            const profileDoc = await db.collection("adminProfiles").doc(uid).get();
            if (profileDoc.exists) {
                const profileData = profileDoc.data();
                // Prefer the admin that has actual settings saved
                if (profileData.platformFeeBreakdown || profileData.categoryGstRates || profileData.defaultShippingHandlingPercent !== undefined) {
                    adminUid = uid;
                    adminProfile = profileData;
                    userData = doc.data();
                    console.log(`[AdminConfig] Found admin with settings: ${uid}`);
                    break;
                }
                // Fall back to first admin with any profile
                if (!adminUid) {
                    adminUid = uid;
                    adminProfile = profileData;
                    userData = doc.data();
                }
            }
        }

        // If no profile found at all, use first admin user
        if (!adminUid) {
            const firstAdmin = usersSnap.docs[0];
            adminUid = firstAdmin.id;
            userData = firstAdmin.data();
            adminProfile = {};
            console.log(`[AdminConfig] No profile found, using first admin: ${adminUid}`);
        }

        console.log('[AdminConfig] Fetched admin profile from database:', {
            exists: adminProfileDoc.exists,
            hasplatformFeeBreakdown: !!adminProfile.platformFeeBreakdown,
            platformFeeBreakdown: adminProfile.platformFeeBreakdown,
            defaultShippingHandlingPercent: adminProfile.defaultShippingHandlingPercent,
            categoryGstRatesCount: adminProfile.categoryGstRates ? Object.keys(adminProfile.categoryGstRates).length : 0
        });

        const DEFAULT_CATEGORY_GST = {
            "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12,
            "Electronics": 18, "Home & Living": 18, "Handicrafts": 5,
            "Artworks": 12, "Beauty & Personal Care": 18, "Sports & Fitness": 18,
            "Books & Stationery": 12, "Food & Beverages": 5, "Gifts & Customization": 18,
            "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
            "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
            "Automotive & Accessories": 18, "Travel & Utility": 18,
            "Sustainability & Eco-Friendly": 12, "Others": 18
        };

        // Platform fee breakdown (new structure)
        const DEFAULT_PLATFORM_FEE_BREAKDOWN = {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        };

        const platformFeeBreakdown = adminProfile.platformFeeBreakdown || DEFAULT_PLATFORM_FEE_BREAKDOWN;
        
        // Calculate total platform fee from breakdown
        const calculatedPlatformFee = Object.values(platformFeeBreakdown).reduce((sum, val) => sum + val, 0);

        const config = {
            name: adminProfile.name || userData.name || userData.fullName || 'Admin',
            email: adminProfile.adminEmail || userData.email || 'admin@sellsathi.com',
            phone: userData.phone || 'Not provided',
            address: adminProfile.address || 'Not provided',
            websiteName: adminProfile.websiteName || 'SellSathi',
            websiteInfo: adminProfile.websiteInfo || 'Your Trusted E-Commerce Platform',
            profileImage: adminProfile.profileImage || null,
            platformChargeRate: adminProfile.platformChargeRate ?? 0.10,
            platformFeeBreakdown: platformFeeBreakdown,
            defaultPlatformFeePercent: calculatedPlatformFee, // Computed from breakdown
            defaultGstPercent: adminProfile.defaultGstPercent ?? 18,
            defaultShippingHandlingPercent: adminProfile.defaultShippingHandlingPercent ?? 0,
            categoryGstRates: adminProfile.categoryGstRates || DEFAULT_CATEGORY_GST,
            uid: adminUid
        };

        // Cache the config
        cache.set(ADMIN_CONFIG_CACHE_KEY, config, ADMIN_CONFIG_CACHE_TTL);

        return config;
    } catch (error) {
        console.error('[AdminConfig] Error fetching admin config:', error);
        return getDefaultConfig();
    }
};

/**
 * Get default admin configuration
 */
const getDefaultConfig = () => {
    const DEFAULT_PLATFORM_FEE_BREAKDOWN = {
        digitalSecurityFee: 1.2,
        merchantVerification: 1.0,
        transitCare: 0.8,
        platformMaintenance: 0.5,
        qualityHandling: 0.0
    };
    
    const calculatedPlatformFee = Object.values(DEFAULT_PLATFORM_FEE_BREAKDOWN).reduce((sum, val) => sum + val, 0);
    
    return {
        name: 'Admin',
        email: 'admin@sellsathi.com',
        phone: 'Not provided',
        address: 'Not provided',
        websiteName: 'SellSathi',
        websiteInfo: 'Your Trusted E-Commerce Platform',
        profileImage: null,
        platformFeeBreakdown: DEFAULT_PLATFORM_FEE_BREAKDOWN,
        defaultPlatformFeePercent: calculatedPlatformFee, // 3.5%
        defaultGstPercent: 18,
        defaultShippingHandlingPercent: 0,
        categoryGstRates: {
            "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12,
            "Electronics": 18, "Home & Living": 18, "Handicrafts": 5,
            "Artworks": 12, "Beauty & Personal Care": 18, "Sports & Fitness": 18,
            "Books & Stationery": 12, "Food & Beverages": 5, "Gifts & Customization": 18,
            "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
            "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
            "Automotive & Accessories": 18, "Travel & Utility": 18,
            "Sustainability & Eco-Friendly": 12, "Others": 18
        },
        uid: null
    };
};

/**
 * Invalidate admin config cache
 * Call this when admin profile is updated
 */
const invalidateAdminConfig = () => {
    cache.invalidate(ADMIN_CONFIG_CACHE_KEY);
    console.log('[AdminConfig] Cache invalidated');
};

/**
 * Get admin email for sending notifications
 */
const getAdminEmail = async () => {
    const config = await getAdminConfig();
    return config.email;
};

/**
 * Get admin name
 */
const getAdminName = async () => {
    const config = await getAdminConfig();
    return config.name;
};

/**
 * Get website details
 */
const getWebsiteDetails = async () => {
    const config = await getAdminConfig();
    return {
        name: config.websiteName,
        info: config.websiteInfo
    };
};

module.exports = {
    getAdminConfig,
    invalidateAdminConfig,
    getAdminEmail,
    getAdminName,
    getWebsiteDetails
};
