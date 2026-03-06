'use strict';
const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.post('/shiprocket', shippingController.handleShiprocketWebhook);

module.exports = router;
