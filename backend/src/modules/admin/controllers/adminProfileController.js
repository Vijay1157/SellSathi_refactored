'use strict';
const { admin, db } = require('../../../config/firebase');
const cloudinary = require('../../../config/cloudinary');
const { invalidateAdminConfig } = require('../../../shared/services/adminConfigService');

/**
 * Get admin profile
 */
const getAdminProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        
        // Get user data
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const userData = userDoc.data();
        
        // Get admin profile data
        const adminDoc = await db.collection("adminProfiles").doc(uid).get();
        const adminData = adminDoc.exists ? adminDoc.data() : {};
        
        const profile = {
            name: adminData.name || userData.name || userData.fullName || 'Admin',
            phone: userData.phone || 'Not provided',
            email: userData.email || 'Not provided',
            adminEmail: adminData.adminEmail || userData.email || '',
            dateOfBirth: adminData.dateOfBirth || '',
            address: adminData.address || '',
            websiteName: adminData.websiteName || 'SellSathi',
            websiteInfo: adminData.websiteInfo || 'Your Trusted E-Commerce Platform',
            profileImage: adminData.profileImage || null,
            // Default platform charges
            defaultPlatformFeePercent: adminData.defaultPlatformFeePercent || 7,
            defaultGstPercent: adminData.defaultGstPercent || 18,
            defaultShippingHandlingPercent: adminData.defaultShippingHandlingPercent || 0
        };
        
        return res.status(200).json({ success: true, profile });
    } catch (error) {
        console.error("[GetAdminProfile] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};

/**
 * Update admin profile
 */
const updateAdminProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, dateOfBirth, address, websiteName, websiteInfo, adminEmail, phone, defaultPlatformFeePercent, defaultGstPercent, defaultShippingHandlingPercent, categoryGstRates, platformFeeBreakdown } = req.body;
        
        // Validate required fields — name only required for profile updates, not settings-only updates
        if (name !== undefined && (!name || !name.trim())) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }
        
        // Validate email if provided
        if (adminEmail && adminEmail.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(adminEmail.trim())) {
                return res.status(400).json({ success: false, message: "Invalid email format" });
            }
        }
        
        // Validate platform fee breakdown if provided
        if (platformFeeBreakdown && typeof platformFeeBreakdown === 'object') {
            const breakdown = {};
            let total = 0;
            
            for (const [key, percent] of Object.entries(platformFeeBreakdown)) {
                const val = parseFloat(percent);
                if (isNaN(val) || val < 0 || val > 10) {
                    return res.status(400).json({ success: false, message: `${key} must be between 0 and 10` });
                }
                breakdown[key] = val;
                total += val;
            }
            
            if (total > 20) {
                return res.status(400).json({ success: false, message: "Total platform fee cannot exceed 20%" });
            }
        }
        
        // Validate default charges if provided
        if (defaultPlatformFeePercent !== undefined) {
            const fee = parseFloat(defaultPlatformFeePercent);
            if (isNaN(fee) || fee < 0 || fee > 100) {
                return res.status(400).json({ success: false, message: "Platform fee must be between 0 and 100" });
            }
        }
        
        if (defaultGstPercent !== undefined) {
            const gst = parseFloat(defaultGstPercent);
            if (isNaN(gst) || gst < 0 || gst > 100) {
                return res.status(400).json({ success: false, message: "GST must be between 0 and 100" });
            }
        }
        
        if (defaultShippingHandlingPercent !== undefined) {
            const shipping = parseFloat(defaultShippingHandlingPercent);
            if (isNaN(shipping) || shipping < 0 || shipping > 100) {
                return res.status(400).json({ success: false, message: "Shipping handling must be between 0 and 100" });
            }
        }
        
        // Prepare update data
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (name !== undefined) updateData.name = name.trim();
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || '';
        if (address !== undefined) updateData.address = address || '';
        if (websiteName !== undefined) updateData.websiteName = websiteName || 'SellSathi';
        if (websiteInfo !== undefined) updateData.websiteInfo = websiteInfo || 'Your Trusted E-Commerce Platform';
        if (adminEmail !== undefined) updateData.adminEmail = adminEmail ? adminEmail.trim() : '';
        
        // Add platform fee breakdown if provided
        // IMPORTANT: We always set this field to replace it completely (not merge)
        if (platformFeeBreakdown !== undefined && typeof platformFeeBreakdown === 'object') {
            const validated = {};
            for (const [key, percent] of Object.entries(platformFeeBreakdown)) {
                const val = parseFloat(percent);
                if (!isNaN(val) && val >= 0 && val <= 10) {
                    validated[key] = val;
                }
            }
            // Always set it, even if empty, to replace the field completely
            updateData.platformFeeBreakdown = validated;
        }
        
        // Add default charges if provided
        if (defaultPlatformFeePercent !== undefined) {
            updateData.defaultPlatformFeePercent = parseFloat(defaultPlatformFeePercent);
        }
        if (defaultGstPercent !== undefined) {
            updateData.defaultGstPercent = parseFloat(defaultGstPercent);
        }
        if (defaultShippingHandlingPercent !== undefined) {
            updateData.defaultShippingHandlingPercent = parseFloat(defaultShippingHandlingPercent);
        }
        // Add category GST rates if provided
        // IMPORTANT: We always set this field to replace it completely (not merge)
        if (categoryGstRates !== undefined && typeof categoryGstRates === 'object') {
            // Validate all values are numbers between 0-100
            const validated = {};
            for (const [cat, rate] of Object.entries(categoryGstRates)) {
                const r = parseFloat(rate);
                if (!isNaN(r) && r >= 0 && r <= 100) validated[cat] = r;
            }
            // Always set it, even if empty, to replace the field completely
            updateData.categoryGstRates = validated;
        }
        
        // Update or create admin profile
        // Check if document exists first
        const adminDocRef = db.collection("adminProfiles").doc(uid);
        const adminDocSnap = await adminDocRef.get();
        
        console.log(`[UpdateAdminProfile] Saving data for admin ${uid}:`, {
            exists: adminDocSnap.exists,
            platformFeeBreakdown: updateData.platformFeeBreakdown,
            categoryGstRates: updateData.categoryGstRates,
            defaultShippingHandlingPercent: updateData.defaultShippingHandlingPercent
        });
        
        if (adminDocSnap.exists) {
            // Document exists, use update to replace fields completely
            await adminDocRef.update(updateData);
        } else {
            // Document doesn't exist, create it
            await adminDocRef.set(updateData);
        }

        // Update phone in users collection if provided
        if (phone !== undefined) {
            await db.collection("users").doc(uid).update({ phone: phone.trim() });
        }
        
        // Invalidate admin config cache so changes reflect immediately
        invalidateAdminConfig();
        
        // Verify the data was saved by reading it back
        const verifyDoc = await adminDocRef.get();
        const savedData = verifyDoc.data();
        console.log(`[UpdateAdminProfile] Verified saved data:`, {
            platformFeeBreakdown: savedData.platformFeeBreakdown,
            categoryGstRates: savedData.categoryGstRates ? Object.keys(savedData.categoryGstRates).length + ' categories' : 'none',
            defaultShippingHandlingPercent: savedData.defaultShippingHandlingPercent
        });
        
        return res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully",
            profile: updateData
        });
    } catch (error) {
        console.error("[UpdateAdminProfile] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

/**
 * Upload admin profile image
 */
const uploadProfileImage = async (req, res) => {
    try {
        const uid = req.user.uid;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'admin_profiles',
                    public_id: `admin_${uid}`,
                    overwrite: true,
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });
        
        const imageUrl = result.secure_url;
        
        // Update admin profile with image URL
        await db.collection("adminProfiles").doc(uid).set({
            profileImage: imageUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Invalidate admin config cache
        invalidateAdminConfig();
        
        console.log(`[UploadProfileImage] Image uploaded for admin ${uid}`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Profile image uploaded successfully",
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error("[UploadProfileImage] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to upload image" });
    }
};

module.exports = {
    getAdminProfile,
    updateAdminProfile,
    uploadProfileImage
};
