'use strict';
const { db } = require('../../../config/firebase');
const { formatDateDDMMYYYY } = require('../../../utils/dateFormat');

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
                stock: data.stock || 0,
                status: data.status || 'active',
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

module.exports = { getAllProducts };
