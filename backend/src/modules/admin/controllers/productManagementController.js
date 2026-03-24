'use strict';
const { admin, db } = require('../../../config/firebase');
const { formatDateDDMMYYYY } = require('../../../utils/dateFormat');
const cache = require('../../../utils/cache');
const emailService = require('../../../shared/services/emailService');

/**
 * Get all products for admin management.
 */
const getAllProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        
        const products = productsSnap.docs.map(doc => {
            const data = doc.data();
            
            let formattedDate = 'N/A';
            let timestamp = 0;
            
            if (data.createdAt) {
                try {
                    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    if (!isNaN(date.getTime())) {
                        formattedDate = formatDateDDMMYYYY(date);
                        timestamp = date.getTime();
                    }
                } catch (e) {
                    console.error('Date formatting error for product:', doc.id, e);
                }
            }
            
            if (formattedDate === 'N/A' || formattedDate === 'NN/NN/NNNN') {
                const now = new Date();
                formattedDate = formatDateDDMMYYYY(now);
                timestamp = now.getTime();
            }
            
            return {
                id: doc.id,
                ...data,
                name: data.name || data.title,
                price: data.price || 0,
                category: data.category || 'Uncategorized',
                sellerId: data.sellerId || 'Unknown',
                stock: data.stock ?? 0,
                status: data.status || 'Active',
                createdAt: data.createdAt || null,
                date: formattedDate,
                timestamp: timestamp
            };
        });

        products.sort((a, b) => b.timestamp - a.timestamp);

        return res.status(200).json({ 
            success: true, 
            products: products,
            count: products.length
        });
    } catch (error) {
        console.error("[GetAllProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
};

/**
 * Get inactive (removed) products — status !== 'Active'
 */
const getInactiveProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();

        const inactive = [];
        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') {
                // Removal date: use updatedAt, removedAt, or createdAt
                let removalDate = 'N/A';
                const removalTs = data.removedAt || data.updatedAt || data.createdAt || null;
                if (removalTs) {
                    try {
                        const d = removalTs.toDate ? removalTs.toDate() : new Date(removalTs);
                        if (!isNaN(d.getTime())) removalDate = formatDateDDMMYYYY(d);
                    } catch (_) {}
                }
                inactive.push({
                    id: doc.id,
                    name: data.name || data.title || 'Unnamed Product',
                    category: data.category || 'Uncategorized',
                    sellerId: data.sellerId || 'Unknown',
                    price: data.price || 0,
                    status: status,
                    removalDate,
                });
            }
        });

        return res.status(200).json({ success: true, products: inactive, count: inactive.length });
    } catch (error) {
        console.error("[GetInactiveProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch inactive products" });
    }
};

/**
 * Permanently delete a single product from DB
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection("products").doc(id);
        const snap = await productRef.get();
        if (!snap.exists) return res.status(404).json({ success: false, message: "Product not found" });

        const { sellerId } = snap.data();
        await productRef.delete();

        // Also remove from seller sub-collection
        if (sellerId) {
            await db.collection("sellers").doc(sellerId)
                .collection("listedproducts").doc(id).delete().catch(() => {});
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }
        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        return res.status(200).json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error("[DeleteProduct] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete product" });
    }
};

/**
 * Permanently delete ALL inactive products
 */
const deleteAllInactiveProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        const batch = db.batch();
        let count = 0;
        const sellerIds = new Set();

        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') {
                batch.delete(doc.ref);
                count++;
                if (data.sellerId) sellerIds.add(data.sellerId);
            }
        });

        if (count === 0) return res.status(200).json({ success: true, message: "No inactive products to delete", deleted: 0 });

        await batch.commit();

        // Clean up seller sub-collections
        for (const sellerId of sellerIds) {
            const subSnap = await db.collection("sellers").doc(sellerId)
                .collection("listedproducts").get();
            const subBatch = db.batch();
            subSnap.forEach(doc => {
                const d = doc.data();
                if (d.status && d.status.toLowerCase() !== 'active') subBatch.delete(doc.ref);
            });
            await subBatch.commit().catch(() => {});
            cache.invalidate(`sellerDash_${sellerId}`, `sellerProducts_${sellerId}`);
        }

        cache.invalidate('adminStats');
        cache.invalidatePrefix('products_');

        return res.status(200).json({ success: true, message: `Deleted ${count} inactive products`, deleted: count });
    } catch (error) {
        console.error("[DeleteAllInactiveProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to delete inactive products" });
    }
};

/**
 * Get out-of-stock products — status === 'Active' but stock <= 0
 * Excludes products already notified (outOfStockNotifiedAt is set)
 */
const getOutOfStockProducts = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        const outOfStock = [];

        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') return;

            const stockVal = data.stock ?? data.quantity ?? data.stockQuantity ?? data.availableStock ?? null;
            if (stockVal === null || Number(stockVal) > 0) return;

            // Skip already-notified products
            if (data.outOfStockNotifiedAt) return;

            outOfStock.push({
                id: doc.id,
                name: data.name || data.title || 'Unnamed Product',
                category: data.category || 'Uncategorized',
                sellerId: data.sellerId || 'Unknown',
                price: data.price || 0,
                stock: Number(stockVal),
            });
        });

        return res.status(200).json({ success: true, products: outOfStock, count: outOfStock.length });
    } catch (error) {
        console.error("[GetOutOfStockProducts] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch out-of-stock products" });
    }
};

/**
 * Notify seller of a single out-of-stock product, then mark as notified
 */
const notifySellerOutOfStock = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection("products").doc(id);
        const snap = await productRef.get();
        if (!snap.exists) return res.status(404).json({ success: false, message: "Product not found" });

        const data = snap.data();
        const sellerId = data.sellerId;
        if (!sellerId) return res.status(400).json({ success: false, message: "No sellerId on product" });

        // Get seller email — check sellers.contactEmail first (set during onboarding),
        // then fall back to users.email
        const [sellerDoc, userDoc] = await Promise.all([
            db.collection('sellers').doc(sellerId).get(),
            db.collection('users').doc(sellerId).get()
        ]);

        if (!sellerDoc.exists && !userDoc.exists) {
            return res.status(400).json({ success: false, message: `Seller docs not found for sellerId: ${sellerId}` });
        }

        const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
        const userData = userDoc.exists ? userDoc.data() : {};

        // contactEmail is set during seller onboarding; email is set during user registration
        const sellerEmail = sellerData.contactEmail || sellerData.emailId || userData.email;
        const sellerName = userData.fullName || sellerData.shopName || sellerData.supplierName || 'Seller';

        if (!sellerEmail || !sellerEmail.includes('@')) {
            return res.status(400).json({ success: false, message: `No valid email found for seller ${sellerId}. contactEmail: ${sellerData.contactEmail}, userEmail: ${userData.email}` });
        }

        const emailResult = await emailService.sendOutOfStockNotification(sellerEmail, sellerName, data.name || data.title, {
            category: data.category,
            price: data.price,
        });

        if (!emailResult) {
            // Email failed but we still mark as notified attempt — or return error
            console.error("[NotifySellerOutOfStock] Email send returned null for", sellerEmail);
            return res.status(500).json({ success: false, message: "Email delivery failed. Check mailer config." });
        }

        // Mark as notified so it disappears from the section
        await productRef.update({ outOfStockNotifiedAt: new Date().toISOString() });

        return res.status(200).json({ success: true, message: "Seller notified successfully" });
    } catch (error) {
        console.error("[NotifySellerOutOfStock] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to notify seller: " + error.message });
    }
};

/**
 * Notify ALL sellers of their out-of-stock products at once
 */
const notifyAllSellersOutOfStock = async (req, res) => {
    try {
        const productsSnap = await db.collection("products").get();
        const toNotify = [];

        productsSnap.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'Active';
            if (status.toLowerCase() !== 'active') return;
            const stockVal = data.stock ?? data.quantity ?? data.stockQuantity ?? data.availableStock ?? null;
            if (stockVal === null || Number(stockVal) > 0) return;
            if (data.outOfStockNotifiedAt) return;
            toNotify.push({ id: doc.id, data });
        });

        if (toNotify.length === 0) {
            return res.status(200).json({ success: true, message: "No unnotified out-of-stock products", notified: 0 });
        }

        // Group by sellerId
        const bySellerMap = {};
        for (const { id, data } of toNotify) {
            const sid = data.sellerId || 'unknown';
            if (!bySellerMap[sid]) bySellerMap[sid] = [];
            bySellerMap[sid].push({ id, data });
        }

        let notifiedCount = 0;
        const batch = db.batch();

        for (const [sellerId, items] of Object.entries(bySellerMap)) {
            if (sellerId === 'unknown') continue;

            let sellerEmail = null;
            let sellerName = 'Seller';

            const [uDoc, sDoc] = await Promise.all([
                db.collection('users').doc(sellerId).get(),
                db.collection('sellers').doc(sellerId).get()
            ]);
            const uData = uDoc.exists ? uDoc.data() : {};
            const sData = sDoc.exists ? sDoc.data() : {};
            sellerEmail = sData.contactEmail || sData.emailId || uData.email;
            sellerName = uData.fullName || sData.shopName || sData.supplierName || 'Seller';

            if (!sellerEmail || !sellerEmail.includes('@')) continue;

            // Send one email per product
            for (const { id, data } of items) {
                await emailService.sendOutOfStockNotification(sellerEmail, sellerName, data.name || data.title, {
                    category: data.category,
                    price: data.price,
                }).catch(err => console.error(`[NotifyAll] email failed for ${id}:`, err));

                batch.update(db.collection("products").doc(id), { outOfStockNotifiedAt: new Date().toISOString() });
                notifiedCount++;
            }
        }

        await batch.commit();

        return res.status(200).json({ success: true, message: `Notified sellers for ${notifiedCount} product(s)`, notified: notifiedCount });
    } catch (error) {
        console.error("[NotifyAllSellersOutOfStock] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to notify all sellers" });
    }
};

module.exports = { getAllProducts, getInactiveProducts, deleteProduct, deleteAllInactiveProducts, getOutOfStockProducts, notifySellerOutOfStock, notifyAllSellersOutOfStock };
