'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Module Routes
const authRoutes = require('./modules/auth/routes/authRoutes');
const adminRoutes = require('./modules/admin/routes/adminRoutes');
const sellerRoutes = require('./modules/seller/routes/sellerRoutes');
const productRoutes = require('./modules/products/routes/productRoutes');
const orderRoutes = require('./modules/orders/routes/orderRoutes');
const consumerRoutes = require('./modules/consumer/routes/consumerRoutes');
const paymentRoutes = require('./modules/payment/routes/paymentRoutes');
const reviewRoutes = require('./modules/reviews/routes/reviewRoutes');
const shippingRoutes = require('./modules/shipping/routes/shippingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Global Logger (Diagnostic)
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} | UID: ${req.headers['x-test-uid'] || 'NONE'}`);
    next();
});

// Domain Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/consumer', consumerRoutes);
app.use('/payment', paymentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/webhook', shippingRoutes); // Unified webhook path

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() }));

// Error Handling
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${err.stack}`);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const { execSync } = require('child_process');

function killProcessOnPort(port) {
    try {
        const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' });
        const lines = result.trim().split('\n');
        const pids = new Set();
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') pids.add(pid);
        }
        for (const pid of pids) {
            console.log(`⚠️  Killing stale process (PID: ${pid}) on port ${port}...`);
            execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf-8' });
        }
        return pids.size > 0;
    } catch {
        return false;
    }
}

function startServer(retries = 1) {
    const server = app.listen(PORT, () => {
        console.log(`✅ SellSathi Backend (Modular) running on port ${PORT}`);
        console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && retries > 0) {
            console.error(`❌ Port ${PORT} is already in use.`);
            const killed = killProcessOnPort(PORT);
            if (killed) {
                console.log(`🔄 Retrying server start on port ${PORT}...`);
                setTimeout(() => startServer(retries - 1), 1000);
            } else {
                console.error(`❌ Could not free port ${PORT}. Please close the application using it and try again.`);
                process.exit(1);
            }
        } else {
            console.error(`❌ Server error: ${err.message}`);
            process.exit(1);
        }
    });
}

startServer();
