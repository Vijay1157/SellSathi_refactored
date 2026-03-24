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
            profileImage: adminData.profileImage || null
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
        const { name, dateOfBirth, address, websiteName, websiteInfo, adminEmail, phone } = req.body;
        
        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }
        
        // Validate email if provided
        if (adminEmail && adminEmail.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(adminEmail.trim())) {
                return res.status(400).json({ success: false, message: "Invalid email format" });
            }
        }
        
        // Prepare update data
        const updateData = {
            name: name.trim(),
            dateOfBirth: dateOfBirth || '',
            address: address || '',
            websiteName: websiteName || 'SellSathi',
            websiteInfo: websiteInfo || 'Your Trusted E-Commerce Platform',
            adminEmail: adminEmail ? adminEmail.trim() : '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Update or create admin profile
        await db.collection("adminProfiles").doc(uid).set(updateData, { merge: true });

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
