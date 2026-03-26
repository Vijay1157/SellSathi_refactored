'use strict';
const { getAdminConfig } = require('../../../shared/services/adminConfigService');

/**
 * Get public admin configuration
 * Returns non-sensitive admin config for use in frontend
 */
const getPublicAdminConfig = async (req, res) => {
    try {
        const config = await getAdminConfig();
        
        // Return only public information
        const publicConfig = {
            websiteName: config.websiteName,
            websiteInfo: config.websiteInfo,
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
                defaultPlatformFeePercent: 7,
                defaultGstPercent: 18,
                defaultShippingHandlingPercent: 0
            }
        });
    }
};

module.exports = {
    getPublicAdminConfig
};
