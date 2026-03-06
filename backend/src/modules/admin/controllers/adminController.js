'use strict';
const { admin, db } = require('../../../config/firebase');
const cache = require('../../../utils/cache');

/**
 * Get overall admin dashboard statistics.
 */
const getStats = async (req, res) => {
    try {
        const cached = cache.get('adminStats');
        if (cached) return res.status(200).json({ success: true, stats: cached });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [
            totalSellersCount,
            pendingSellersSnap,
            approvedSellersCount,
            totalProductsCount,
            totalOrdersCount,
            todayOrdersCount,
            ordersToDeliverCount,
            totalReviewsCount
        ] = await Promise.all([
            db.collection("sellers").count().get(),
            db.collection("sellers").where("sellerStatus", "==", "PENDING").get(),
            db.collection("sellers").where("sellerStatus", "==", "APPROVED").count().get(),
            db.collection("products").count().get(),
            db.collection("orders").count().get(),
            db.collection("orders")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
                .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(todayEnd))
                .count()
                .get(),
            db.collection("orders").where("status", "in", ["Processing", "Shipped"]).count().get(),
            db.collection("reviews").count().get()
        ]);

        const nonBlockedPendingSellers = pendingSellersSnap.docs.filter(doc => {
            const data = doc.data();
            return data.isBlocked !== true;
        });

        console.log(`[GetStats] Total PENDING sellers: ${pendingSellersSnap.docs.length}, Non-blocked: ${nonBlockedPendingSellers.length}`);
        console.log(`[GetStats] Today's orders: ${todayOrdersCount.data().count}`);

        const stats = {
            totalSellers: totalSellersCount.data().count,
            approvedSellers: approvedSellersCount.data().count,
            totalProducts: totalProductsCount.data().count,
            totalOrders: totalOrdersCount.data().count,
            todayOrders: todayOrdersCount.data().count,
            pendingApprovals: nonBlockedPendingSellers.length,
            ordersToDeliver: ordersToDeliverCount.data().count,
            totalFeedback: totalReviewsCount.data().count
        };

        cache.set('adminStats', stats);
        return res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error("[AdminStats] ERROR:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
};

module.exports = { getStats };
