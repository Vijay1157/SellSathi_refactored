'use strict';
const { getAdminConfig } = require('../../../shared/services/adminConfigService');

/**
 * Get public admin configuration
 * Returns non-sensitive admin config for use in frontend
 */
const getPublicAdminConfig = async (req, res) => {
    try {
        const config = await getAdminConfig();
        
        console.log('[GetPublicAdminConfig] Returning config:', {
            platformFeeBreakdown: config.platformFeeBreakdown,
            defaultShippingHandlingPercent: config.defaultShippingHandlingPercent,
            categoryGstRatesCount: config.categoryGstRates ? Object.keys(config.categoryGstRates).length : 0
        });
        
        // Return only public information
        const publicConfig = {
            websiteName: config.websiteName,
            websiteInfo: config.websiteInfo,
            platformFeeBreakdown: config.platformFeeBreakdown || {
                digitalSecurityFee: 1.2,
                merchantVerification: 1.0,
                transitCare: 0.8,
                platformMaintenance: 0.5,
                qualityHandling: 0.0
            },
            defaultPlatformFeePercent: config.defaultPlatformFeePercent,
            defaultGstPercent: config.defaultGstPercent,
            defaultShippingHandlingPercent: config.defaultShippingHandlingPercent,
            categoryGstRates: config.categoryGstRates || {}
        };
        
        return res.status(200).json({ success: true, config: publicConfig });
    } catch (error) {
        console.error('[GetPublicAdminConfig] ERROR:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch configuration',
            config: {
                websiteName: 'SellSathi',
                websiteInfo: 'Your Trusted E-Commerce Platform',
                platformFeeBreakdown: {
                    digitalSecurityFee: 1.2,
                    merchantVerification: 1.0,
                    transitCare: 0.8,
                    platformMaintenance: 0.5,
                    qualityHandling: 0.0
                },
                defaultPlatformFeePercent: 3.5,
                defaultGstPercent: 18,
                defaultShippingHandlingPercent: 0
            }
        });
    }
};

module.exports = {
    getPublicAdminConfig
};
