'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');

const CONSUMER_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Get user cart.
 */
const getCart = async (req, res) => {
    try {
        const { uid } = req.params;
        const cacheKey = `cart_${uid}`;
        const cached = cache.get(cacheKey);
        if (cached !== null) return res.json({ success: true, cart: cached });

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ success: false, message: "User not found" });
        const cart = userDoc.data().cart || [];
        cache.set(cacheKey, cart, CONSUMER_CACHE_TTL);
        return res.json({ success: true, cart });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch cart" });
    }
};

/**
 * Update user cart.
 */
const updateCart = async (req, res) => {
    try {
        const { uid } = req.params;
        const { cart, action, item, itemId } = req.body;

        const userRef = db.collection('users').doc(uid);

        if (cart) {
            // Overwrite entire cart
            await userRef.update({ cart });
            cache.invalidate(`cart_${uid}`);
        } else if (action) {
            const userDoc = await userRef.get();
            let currentCart = userDoc.data()?.cart || [];

            if (action === 'add' && item) {
                const existingIdx = currentCart.findIndex(i => i.id === item.id);
                if (existingIdx > -1) {
                    currentCart[existingIdx].quantity += (item.quantity || 1);
                } else {
                    currentCart.push(item);
                }
            } else if (action === 'remove' && itemId) {
                currentCart = currentCart.filter(i => i.id !== itemId);
            } else if (action === 'clear') {
                currentCart = [];
            }

            await userRef.update({ cart: currentCart });
            cache.invalidate(`cart_${uid}`);
        }

        return res.json({ success: true, message: "Cart updated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update cart" });
    }
};

/**
 * Get user addresses.
 */
const getAddresses = async (req, res) => {
    try {
        const { uid } = req.params;
        const cacheKey = `addresses_${uid}`;
        const cached = cache.get(cacheKey);
        if (cached !== null) return res.json({ success: true, addresses: cached });

        const doc = await db.collection('users').doc(uid).get();
        const addresses = doc.data()?.addresses || [];
        cache.set(cacheKey, addresses, CONSUMER_CACHE_TTL);
        return res.json({ success: true, addresses });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
    }
};

/**
 * Save/Update user address.
 */
const saveAddress = async (req, res) => {
    try {
        const { uid } = req.params;
        const { address } = req.body;
        const userRef = db.collection("users").doc(uid);
        const doc = await userRef.get();
        let addresses = doc.data()?.addresses || [];

        if (address.isDefault) addresses = addresses.map(a => ({ ...a, isDefault: false }));

        const existingIdx = addresses.findIndex(a => a.id === address.id);
        if (existingIdx > -1) addresses[existingIdx] = address;
        else addresses.push({ ...address, id: Date.now() });

        await userRef.update({ addresses });
        cache.invalidate(`addresses_${uid}`);
        return res.json({ success: true, message: "Address saved" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to save address" });
    }
};

/**
 * Get user wishlist.
 */
const getWishlist = async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.collection("users").doc(uid).collection("wishlist").get();
        const items = [];
        
        // Fetch fresh product data for each wishlist item
        for (const doc of snapshot.docs) {
            const wishlistItem = doc.data();
            
            try {
                // Get latest product data from products collection
                const productDoc = await db.collection("products").doc(doc.id).get();
                
                if (productDoc.exists) {
                    const productData = productDoc.data();
                    // Merge wishlist item with fresh product data (prioritize fresh data)
                    items.push({
                        id: doc.id,
                        ...wishlistItem,
                        // Update with fresh data - always use database rating, not wishlist cache
                        rating: productData.rating !== undefined ? productData.rating : 0,
                        reviewCount: productData.reviewCount || 0,
                        price: productData.price || wishlistItem.price,
                        oldPrice: productData.oldPrice || wishlistItem.oldPrice,
                        stock: productData.stock,
                        status: productData.status
                    });
                } else {
                    // Product no longer exists, keep wishlist item as is
                    items.push({ id: doc.id, ...wishlistItem });
                }
            } catch (err) {
                console.error(`Error fetching product ${doc.id}:`, err);
                // If error, use wishlist data
                items.push({ id: doc.id, ...wishlistItem });
            }
        }
        
        return res.status(200).json({ success: true, items });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch wishlist", items: [] });
    }
};

/**
 * Add to user wishlist.
 */
const addToWishlist = async (req, res) => {
    try {
        const { uid } = req.params;
        const { product } = req.body;

        if (!product || !product.id) {
            return res.status(400).json({ success: false, message: "Invalid product data" });
        }

        await db.collection("users").doc(uid).collection("wishlist").doc(product.id).set(product);
        return res.status(200).json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to add to wishlist" });
    }
};

/**
 * Remove from user wishlist.
 */
const removeFromWishlist = async (req, res) => {
    try {
        const { uid, productId } = req.params;

        if (!productId) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        await db.collection("users").doc(uid).collection("wishlist").doc(productId).delete();
        return res.status(200).json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to remove from wishlist" });
    }
};

/**
 * Delete user address.
 */
const deleteAddress = async (req, res) => {
    try {
        const { uid, addressId } = req.params;
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        let addresses = doc.data()?.addresses || [];

        addresses = addresses.filter(a => a.id !== Number(addressId) && a.id !== addressId);
        
        await userRef.update({ addresses });
        cache.invalidate(`addresses_${uid}`);
        return res.json({ success: true, message: "Address deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete address" });
    }
};

/**
 * Get user profile.
 */
const getProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ success: false, message: "User not found" });
        
        const userData = userDoc.data();
        return res.json({ 
            success: true, 
            profile: {
                uid: userData.uid,
                fullName: userData.fullName || userData.displayName || userData.name || userData.extractedName || "User",
                email: userData.email || "",
                phone: userData.phone || userData.phoneNumber || "",
                photoURL: userData.photoURL || userData.profilePhoto || null,
                role: userData.role,
                dateOfBirth: userData.dateOfBirth || null
            }
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};

/**
 * Update user profile.
 */
const updateProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const { profileData } = req.body;
        
        if (!profileData) return res.status(400).json({ success: false, message: "Profile data is required" });

        const updateData = {};
        if (profileData.fullName !== undefined) updateData.fullName = profileData.fullName;
        if (profileData.displayName !== undefined) updateData.fullName = profileData.displayName; // Fallback
        if (profileData.phone !== undefined) updateData.phone = profileData.phone;
        if (profileData.photoURL !== undefined) updateData.photoURL = profileData.photoURL;

        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(uid).update(updateData);
        }

        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

/**
 * Delete consumer account data.
 */
const deleteAccount = async (req, res) => {
    try {
        const { uid } = req.params;
        
        // Delete user's Firestore data
        await db.collection('users').doc(uid).delete();
        
        // Also clear any cached carts/addresses
        cache.invalidate(`cart_${uid}`);
        cache.invalidate(`addresses_${uid}`);

        return res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ success: false, message: "Failed to delete account" });
    }
};

module.exports = {
    getCart,
    updateCart,
    getAddresses,
    saveAddress,
    deleteAddress,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getProfile,
    updateProfile,
    deleteAccount
};
