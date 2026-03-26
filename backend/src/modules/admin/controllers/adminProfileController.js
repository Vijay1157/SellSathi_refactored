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
        const { name, dateOfBirth, address, websiteName, websiteInfo, adminEmail, phone, defaultPlatformFeePercent, defaultGstPercent, defaultShippingHandlingPercent, categoryGstRates } = req.body;
        
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
        if (categoryGstRates && typeof categoryGstRates === 'object') {
            // Validate all values are numbers between 0-100
            const validated = {};
            for (const [cat, rate] of Object.entries(categoryGstRates)) {
                const r = parseFloat(rate);
                if (!isNaN(r) && r >= 0 && r <= 100) validated[cat] = r;
            }
            if (Object.keys(validated).length > 0) updateData.categoryGstRates = validated;
        }
        
        // Update or create admin profile
        // Use set with merge for most fields, but categoryGstRates needs direct replacement
        if (categoryGstRates && typeof categoryGstRates === 'object') {
            // First set the other fields with merge
            await db.collection("adminProfiles").doc(uid).set(updateData, { merge: true });
            // Then explicitly replace categoryGstRates (not merge)
            await db.collection("adminProfiles").doc(uid).update({ categoryGstRates: updateData.categoryGstRates });
        } else {
            await db.collection("adminProfiles").doc(uid).set(updateData, { merge: true });
        }

        // Update phone in users collection if provided
        if (phone !== undefined) {
            await db.collection("users").doc(uid).update({ phone: phone.trim() });
        }
        
        // Invalidate admin config cache so changes reflect immediately
        invalidateAdminConfig();
        
        console.log(`[UpdateAdminProfile] Profile updated for admin ${uid}`);
        
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
