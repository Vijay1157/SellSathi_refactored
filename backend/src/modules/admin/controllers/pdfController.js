'use strict';
const { admin, db } = require('../../../config/firebase');
const PDFDocument = require('pdfkit');
const { getAdminConfig } = require('../../../shared/services/adminConfigService');

/**
 * Generate Analytics PDF for a seller
 */
const generateAnalyticsPDF = async (req, res) => {
    try {
        const { uid } = req.params;
        const { fromDate, toDate } = req.query;
        
        // Get admin configuration
        const adminConfig = await getAdminConfig();
        
        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) return res.status(404).send("Seller not found");
        const sellerData = sellerSnap.data();

        // Get user data for contact and bank details
        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const sellerContact = userData.phone || userData.email || "N/A";
        
        // Extract bank details from seller data
        const bankDetails = {
            bankName: sellerData.bankName || 'Not provided',
            accountHolderName: sellerData.accountHolderName || 'Not provided',
            accountNumber: sellerData.accountNumber || 'Not provided',
            ifscCode: sellerData.ifscCode || 'Not provided',
            upiId: sellerData.upiId || 'Not provided'
        };

        // Get Products 
        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        let totalProducts = 0;
        let totalStockLeft = 0;
        let totalInventoryValue = 0;
        let productStats = {};

        productsSnap.forEach(p => {
            const prod = p.data();
            totalProducts++;
            const stock = prod.stock || 0;
            const price = prod.price || 0;
            const discountedPrice = prod.discountedPrice || price;
            totalStockLeft += stock;
            totalInventoryValue += (discountedPrice * stock);
            productStats[p.id] = {
                name: prod.title,
                price: price,
                discountedPrice: prod.discountedPrice || null,
                stock: stock,
                sold: 0,
                revenue: 0,
                worth: discountedPrice * stock
            };
        });

        // Get Orders with optional date filtering
        let unitsSold = 0;
        let grossRevenue = 0;
        const ordersSnap = await db.collection("orders").get();
        ordersSnap.forEach(o => {
            const order = o.data();
            const orderDate = order.createdAt?.toDate();

            // Apply date filtering if provided
            let inDateRange = true;
            if (fromDate || toDate) {
                if (orderDate) {
                    if (fromDate && new Date(fromDate) > orderDate) inDateRange = false;
                    if (toDate) {
                        const to = new Date(toDate);
                        to.setHours(23, 59, 59, 999);
                        if (to < orderDate) inDateRange = false;
                    }
                } else {
                    inDateRange = false;
                }
            }

            if (inDateRange && order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.sellerId === uid) {
                        unitsSold += (item.quantity || 1);
                        const rev = (item.price || 0) * (item.quantity || 1);
                        grossRevenue += rev;
                        if (item.productId && productStats[item.productId]) {
                            productStats[item.productId].sold += (item.quantity || 1);
                            productStats[item.productId].revenue += rev;
                        }
                    }
                });
            }
        });

        const avgRevenuePerProduct = totalProducts > 0 ? (grossRevenue / totalProducts) : 0;

        // Generate PDF filename with date range if provided
        let filename = `analytics_${sellerData.shopName?.replace(/\s+/g, '_') || 'seller'}`;
        if (fromDate && toDate) {
            filename += `_${fromDate}_to_${toDate}`;
        }
        filename += '.pdf';

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // Header - Logo + Website Name
        const logoPath = require('path').join(__dirname, '../../../assets/gudkart-logo.png');
        const fs = require('fs');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { height: 45 });
            doc.fontSize(22).fillColor('#3B7CF1').font('Helvetica-Bold').text(adminConfig.websiteName.toUpperCase(), 105, 50);
        } else {
            doc.fontSize(24).fillColor('#3B7CF1').font('Helvetica-Bold').text(adminConfig.websiteName.toUpperCase(), 50, 50);
        }
        doc.fontSize(9).fillColor('#666666').font('Helvetica')
            .text(adminConfig.websiteInfo, 50, 90);

        const reportDate = new Date().toLocaleDateString('en-GB');
        doc.fontSize(9).fillColor('#666666').text('Report Date:', 450, 50);
        doc.fontSize(10).fillColor('#000000').text(reportDate, 450, 62);

        doc.moveTo(50, 125).lineTo(545, 125).strokeColor('#3B7CF1').lineWidth(2).stroke();

        // Title
        doc.fontSize(18).fillColor('#000000').font('Helvetica-Bold')
            .text('SELLER ANALYTICS REPORT', 50, 145, { align: 'center' });

        // Date Range (if provided)
        if (fromDate && toDate) {
            doc.fontSize(10).fillColor('#666666').font('Helvetica')
                .text(`Date Range: ${new Date(fromDate).toLocaleDateString('en-GB')} to ${new Date(toDate).toLocaleDateString('en-GB')}`, 50, 170, { align: 'center' });
        }

        // Seller Info
        const sellerInfoY = fromDate && toDate ? 195 : 180;
        doc.rect(50, sellerInfoY, 495, 15).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('SELLER INFORMATION', 55, sellerInfoY + 5);

        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text('Shop Name:', 55, sellerInfoY + 30);
        doc.text(sellerData.shopName || 'N/A', 150, sellerInfoY + 30);
        doc.text('Category:', 320, sellerInfoY + 30);
        doc.text(sellerData.category || 'N/A', 390, sellerInfoY + 30);

        doc.text('GST Number:', 55, sellerInfoY + 50);
        doc.text(sellerData.gstNumber || 'N/A', 150, sellerInfoY + 50);
        doc.text('Contact:', 320, sellerInfoY + 50);
        doc.text(sellerContact || 'N/A', 390, sellerInfoY + 50);

        // Bank Details Section
        const bankDetailsY = sellerInfoY + 80;
        doc.rect(50, bankDetailsY, 495, 15).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('BANK DETAILS', 55, bankDetailsY + 5);

        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text('Bank Name:', 55, bankDetailsY + 30);
        doc.text(bankDetails.bankName, 150, bankDetailsY + 30);
        doc.text('Account Holder:', 320, bankDetailsY + 30);
        doc.text(bankDetails.accountHolderName, 420, bankDetailsY + 30);

        doc.text('Account Number:', 55, bankDetailsY + 50);
        doc.text(bankDetails.accountNumber, 150, bankDetailsY + 50);
        doc.text('IFSC Code:', 320, bankDetailsY + 50);
        doc.text(bankDetails.ifscCode, 420, bankDetailsY + 50);

        doc.text('UPI ID:', 55, bankDetailsY + 70);
        doc.text(bankDetails.upiId, 150, bankDetailsY + 70);

        // Performance Summary
        const perfSummaryY = bankDetailsY + 100;
        doc.rect(50, perfSummaryY, 495, 15).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('PERFORMANCE SUMMARY', 55, perfSummaryY + 5);

        const boxY = perfSummaryY + 35;
        const boxWidth = 115;
        const boxHeight = 60;
        const boxGap = 10;

        // Boxes
        doc.rect(50, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#BFCFFA');
        doc.fontSize(9).fillColor('#3B7CF1').font('Helvetica')
            .text('Total Products', 55, boxY + 10, { width: boxWidth - 10, align: 'center' });
        doc.fontSize(24).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(totalProducts.toString(), 55, boxY + 28, { width: boxWidth - 10, align: 'center' });

        doc.rect(50 + boxWidth + boxGap, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#BFCFFA');
        doc.fontSize(9).fillColor('#3B7CF1').font('Helvetica')
            .text('Units Sold', 50 + boxWidth + boxGap + 5, boxY + 10, { width: boxWidth - 10, align: 'center' });
        doc.fontSize(24).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(unitsSold.toString(), 50 + boxWidth + boxGap + 5, boxY + 28, { width: boxWidth - 10, align: 'center' });

        doc.rect(50 + (boxWidth + boxGap) * 2, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#BFCFFA');
        doc.fontSize(9).fillColor('#3B7CF1').font('Helvetica')
            .text('Stock Left', 50 + (boxWidth + boxGap) * 2 + 5, boxY + 10, { width: boxWidth - 10, align: 'center' });
        doc.fontSize(24).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(totalStockLeft.toString(), 50 + (boxWidth + boxGap) * 2 + 5, boxY + 28, { width: boxWidth - 10, align: 'center' });

        doc.rect(50 + (boxWidth + boxGap) * 3, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#BFCFFA');
        doc.fontSize(9).fillColor('#3B7CF1').font('Helvetica')
            .text('Total Revenue', 50 + (boxWidth + boxGap) * 3 + 5, boxY + 10, { width: boxWidth - 10, align: 'center' });
        doc.fontSize(20).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(`Rs.${grossRevenue}`, 50 + (boxWidth + boxGap) * 3 + 5, boxY + 28, { width: boxWidth - 10, align: 'center' });

        // Product Table
        doc.rect(50, boxY + boxHeight + 50, 495, 15).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold')
            .text('PRODUCT DETAILS', 55, boxY + boxHeight + 55);

        const tableTop = boxY + boxHeight + 85;
        doc.rect(50, tableTop, 495, 20).fillAndStroke('#3B7CF1', '#3B7CF1');
        doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Product', 55, tableTop + 6);
        doc.text('Price', 200, tableTop + 6);
        doc.text('Stock', 295, tableTop + 6);
        doc.text('Sold', 340, tableTop + 6);
        doc.text('Revenue', 385, tableTop + 6);

        let y = tableTop + 25;
        doc.font('Helvetica').fillColor('#000000');
        const sortedProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

        sortedProducts.forEach((p) => {
            if (y > 720) {
                doc.addPage();
                y = 50;
            }
            doc.fontSize(8).fillColor('#000000').font('Helvetica');
            doc.text(p.name.substring(0, 30), 55, y);
            doc.text(`Rs.${p.price}`, 200, y);
            doc.text(p.stock.toString(), 295, y);
            doc.text(p.sold.toString(), 340, y);
            doc.text(`Rs.${p.revenue}`, 385, y);
            y += 18;
        });

        // Footer
        doc.fontSize(8).fillColor('#999999').font('Helvetica')
            .text(`Generated by ${adminConfig.websiteName} | ${reportDate}`, 50, 770, { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("ANALYTICS PDF ERROR:", err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

/**
 * Generate Invoice PDF for a seller
 */
const generateInvoicePDF = async (req, res) => {
    try {
        const { uid } = req.params;
        const { fromDate, toDate } = req.query;

        // Get admin configuration
        const adminConfig = await getAdminConfig();

        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) return res.status(404).send("Seller not found");
        const sellerData = sellerSnap.data();

        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const sellerContact = userData.phone || userData.email || "N/A";
        
        // Extract bank details from seller data
        const bankDetails = {
            bankName: sellerData.bankName || 'Not provided',
            accountHolderName: sellerData.accountHolderName || 'Not provided',
            accountNumber: sellerData.accountNumber || 'Not provided',
            ifscCode: sellerData.ifscCode || 'Not provided',
            upiId: sellerData.upiId || 'Not provided'
        };

        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        const totalProducts = productsSnap.size;
        
        // Collect all products for the seller
        const sellerProducts = [];
        productsSnap.forEach(p => {
            const prod = p.data();
            sellerProducts.push({
                id: p.id,
                name: prod.title || 'N/A',
                price: prod.price || 0,
                discountedPrice: prod.discountedPrice || null,
                stock: prod.stock || 0,
                category: prod.category || 'N/A'
            });
        });

        const ordersSnap = await db.collection("orders").where("status", "==", "Delivered").get();

        let totalRevenue = 0;
        let deliveredCount = 0;
        const orderDetails = [];

        ordersSnap.forEach(o => {
            const order = o.data();
            const orderDate = order.createdAt?.toDate();

            let inDateRange = true;
            if (orderDate) {
                if (fromDate && new Date(fromDate) > orderDate) inDateRange = false;
                if (toDate) {
                    const to = new Date(toDate);
                    to.setHours(23, 59, 59, 999);
                    if (to < orderDate) inDateRange = false;
                }
            }

            if (inDateRange && order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.sellerId === uid) {
                        const rev = (item.price || 0) * (item.quantity || 1);
                        totalRevenue += rev;
                        deliveredCount++;
                        orderDetails.push({
                            orderId: o.id,
                            orderDate: orderDate ? orderDate.toLocaleDateString('en-GB') : 'N/A',
                            productName: item.name || 'N/A',
                            quantity: item.quantity || 1,
                            price: item.price || 0,
                            total: rev
                        });
                    }
                });
            }
        });

        const platformCharges = totalRevenue * 0.10;
        const amountToReceive = totalRevenue - platformCharges;

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${sellerData.shopName?.replace(/\s+/g, '_') || 'seller'}.pdf`);
        doc.pipe(res);

        // Header - Logo + Website Name
        const logoPath = require('path').join(__dirname, '../../../assets/gudkart-logo.png');
        const fs = require('fs');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { height: 50 });
            doc.fontSize(26).fillColor('#3B7CF1').font('Helvetica-Bold').text(adminConfig.websiteName.toUpperCase(), 110, 50);
        } else {
            doc.fontSize(28).fillColor('#3B7CF1').font('Helvetica-Bold').text(adminConfig.websiteName.toUpperCase(), 50, 50);
        }
        doc.fontSize(10).fillColor('#999999').font('Helvetica')
            .text(adminConfig.websiteInfo, 50, 95);

        const reportDate = new Date().toLocaleDateString('en-GB');
        doc.fontSize(10).fillColor('#666666').font('Helvetica').text('Report Date:', 450, 50);
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text(reportDate, 450, 65);

        doc.moveTo(50, 135).lineTo(545, 135).strokeColor('#3B7CF1').lineWidth(2).stroke();

        // Title
        doc.fontSize(20).fillColor('#000000').font('Helvetica-Bold')
            .text('SELLER INVOICE REPORT', 50, 155, { align: 'center' });

        // Date Range (if provided)
        let sellerInfoY = 210;
        if (fromDate && toDate) {
            doc.fontSize(11).fillColor('#3B7CF1').font('Helvetica-Bold')
                .text(`Invoice Period: ${new Date(fromDate).toLocaleDateString('en-GB')} to ${new Date(toDate).toLocaleDateString('en-GB')}`, 50, 185, { align: 'center' });
            sellerInfoY = 220;
        } else if (fromDate || toDate) {
            const dateText = fromDate ? `From: ${new Date(fromDate).toLocaleDateString('en-GB')}` : `Until: ${new Date(toDate).toLocaleDateString('en-GB')}`;
            doc.fontSize(11).fillColor('#3B7CF1').font('Helvetica-Bold')
                .text(dateText, 50, 185, { align: 'center' });
            sellerInfoY = 220;
        }

        // Seller Info
        doc.rect(50, sellerInfoY, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('SELLER INFORMATION', 55, sellerInfoY + 6);

        const detailsY = sellerInfoY + 35;
        doc.fontSize(11).font('Helvetica').fillColor('#000000');
        doc.text('Shop Name:', 55, detailsY);
        doc.text(sellerData.shopName || 'N/A', 180, detailsY);
        doc.text('Category:', 320, detailsY);
        doc.text(sellerData.category || 'N/A', 420, detailsY);

        doc.text('GST Number:', 55, detailsY + 20);
        doc.text(sellerData.gstNumber || 'N/A', 180, detailsY + 20);

        // Bank Details Section
        const bankY = detailsY + 50;
        doc.rect(50, bankY, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('BANK DETAILS', 55, bankY + 6);

        const bankDetailsY = bankY + 35;
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text('Bank Name:', 55, bankDetailsY);
        doc.text(bankDetails.bankName, 180, bankDetailsY);
        doc.text('Account Holder:', 320, bankDetailsY);
        doc.text(bankDetails.accountHolderName, 440, bankDetailsY);

        doc.text('Account Number:', 55, bankDetailsY + 20);
        doc.text(bankDetails.accountNumber, 180, bankDetailsY + 20);
        doc.text('IFSC Code:', 320, bankDetailsY + 20);
        doc.text(bankDetails.ifscCode, 440, bankDetailsY + 20);

        doc.text('UPI ID:', 55, bankDetailsY + 40);
        doc.text(bankDetails.upiId, 180, bankDetailsY + 40);

        // Summary
        const summaryY = bankDetailsY + 70;
        doc.rect(50, summaryY, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('INVOICE SUMMARY', 55, summaryY + 6);

        const boxY = summaryY + 40;
        const boxWidth = 115;
        const boxHeight = 70;
        const boxGap = 10;
        const numberFontSize = 18; // Consistent font size for all numbers

        // Box 1: Total Products
        const box1X = 50;
        doc.rect(box1X, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#3B7CF1');
        doc.fontSize(10).fillColor('#3B7CF1').font('Helvetica')
            .text('Total Products', box1X, boxY + 12, { width: boxWidth, align: 'center' });
        doc.fontSize(numberFontSize).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(totalProducts.toString(), box1X, boxY + 35, { width: boxWidth, align: 'center' });

        // Box 2: Total Revenue
        const box2X = box1X + boxWidth + boxGap;
        doc.rect(box2X, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#3B7CF1');
        doc.fontSize(10).fillColor('#3B7CF1').font('Helvetica')
            .text('Total Revenue', box2X, boxY + 12, { width: boxWidth, align: 'center' });
        doc.fontSize(numberFontSize).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(`Rs.${totalRevenue}`, box2X, boxY + 35, { width: boxWidth, align: 'center' });

        // Box 3: Platform Charges
        const box3X = box2X + boxWidth + boxGap;
        doc.rect(box3X, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#3B7CF1');
        doc.fontSize(10).fillColor('#3B7CF1').font('Helvetica')
            .text('Platform Charges', box3X, boxY + 12, { width: boxWidth, align: 'center' });
        doc.fontSize(numberFontSize).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(`Rs.${platformCharges.toFixed(2)}`, box3X, boxY + 35, { width: boxWidth, align: 'center' });

        // Box 4: Amount to Receive
        const box4X = box3X + boxWidth + boxGap;
        doc.rect(box4X, boxY, boxWidth, boxHeight).fillAndStroke('#EBF0FF', '#3B7CF1');
        doc.fontSize(10).fillColor('#3B7CF1').font('Helvetica')
            .text('Amount to Receive', box4X, boxY + 12, { width: boxWidth, align: 'center' });
        doc.fontSize(numberFontSize).fillColor('#1D5FD4').font('Helvetica-Bold')
            .text(`Rs.${amountToReceive.toFixed(2)}`, box4X, boxY + 35, { width: boxWidth, align: 'center' });

        // Products Listed by Seller
        const productsTableY = boxY + boxHeight + 30;
        doc.rect(50, productsTableY, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('PRODUCTS LISTED BY SELLER', 55, productsTableY + 6);

        const prodTableTop = productsTableY + 35;
        doc.rect(50, prodTableTop, 495, 22).fillAndStroke('#3B7CF1', '#3B7CF1');
        doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Product Name', 55, prodTableTop + 7);
        doc.text('Category', 280, prodTableTop + 7);
        doc.text('Price', 380, prodTableTop + 7);
        doc.text('Stock', 480, prodTableTop + 7);

        let prodY = prodTableTop + 27;
        doc.font('Helvetica').fillColor('#000000');

        if (sellerProducts.length === 0) {
            doc.fontSize(10).fillColor('#999999').text('No products listed by this seller.', 55, prodY, { align: 'center', width: 495 });
            prodY += 30;
        } else {
            sellerProducts.forEach((product, index) => {
                if (prodY > 700) {
                    doc.addPage();
                    prodY = 50;
                    // Redraw table header on new page
                    doc.rect(50, prodY, 495, 22).fillAndStroke('#3B7CF1', '#3B7CF1');
                    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
                    doc.text('Product Name', 55, prodY + 7);
                    doc.text('Category', 280, prodY + 7);
                    doc.text('Price', 380, prodY + 7);
                    doc.text('Stock', 480, prodY + 7);
                    prodY += 27;
                }

                // Alternate row background
                if (index % 2 === 0) {
                    doc.rect(50, prodY - 3, 495, 20).fillAndStroke('#f9fafb', '#f9fafb');
                }

                doc.fontSize(8).fillColor('#000000').font('Helvetica');
                doc.text(product.name.substring(0, 35), 55, prodY);
                doc.text(product.category, 280, prodY);
                const displayPrice = product.discountedPrice ? `Rs.${product.discountedPrice} (Rs.${product.price})` : `Rs.${product.price}`;
                doc.text(displayPrice, 380, prodY);
                doc.text(product.stock.toString(), 480, prodY);
                prodY += 20;
            });
        }

        // Order Details Table
        const orderTableY = prodY + 30;
        doc.rect(50, orderTableY, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('ORDER DETAILS', 55, orderTableY + 6);

        const tableTop = orderTableY + 35;
        doc.rect(50, tableTop, 495, 22).fillAndStroke('#3B7CF1', '#3B7CF1');
        doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Order ID', 55, tableTop + 7);
        doc.text('Date', 140, tableTop + 7);
        doc.text('Product', 210, tableTop + 7);
        doc.text('Qty', 380, tableTop + 7);
        doc.text('Price', 420, tableTop + 7);
        doc.text('Total', 480, tableTop + 7);

        let y = tableTop + 27;
        doc.font('Helvetica').fillColor('#000000');

        if (orderDetails.length === 0) {
            doc.fontSize(10).fillColor('#999999').text('No delivered orders found for this seller.', 55, y, { align: 'center', width: 495 });
            y += 30;
        } else {
            orderDetails.forEach((order, index) => {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                    // Redraw table header on new page
                    doc.rect(50, y, 495, 22).fillAndStroke('#3B7CF1', '#3B7CF1');
                    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
                    doc.text('Order ID', 55, y + 7);
                    doc.text('Date', 140, y + 7);
                    doc.text('Product', 210, y + 7);
                    doc.text('Qty', 380, y + 7);
                    doc.text('Price', 420, y + 7);
                    doc.text('Total', 480, y + 7);
                    y += 27;
                }

                // Alternate row background
                if (index % 2 === 0) {
                    doc.rect(50, y - 3, 495, 20).fillAndStroke('#f9fafb', '#f9fafb');
                }

                doc.fontSize(8).fillColor('#000000').font('Helvetica');
                doc.text(order.orderId.substring(0, 12) + '...', 55, y);
                doc.text(order.orderDate, 140, y);
                doc.text(order.productName.substring(0, 25), 210, y);
                doc.text(order.quantity.toString(), 380, y);
                doc.text(`Rs.${order.price}`, 420, y);
                doc.text(`Rs.${order.total}`, 480, y);
                y += 20;
            });
        }

        // Add some spacing before footer
        const footerY = y + 30 > 750 ? 750 : y + 30;

        // Footer
        if (footerY > 700) {
            doc.addPage();
            doc.fontSize(9).fillColor('#cccccc').font('Helvetica')
                .text(`Generated by ${adminConfig.websiteName} | ${reportDate}`, 50, 750, { align: 'center' });
        } else {
            doc.fontSize(9).fillColor('#cccccc').font('Helvetica')
                .text(`Generated by ${adminConfig.websiteName} | ${reportDate}`, 50, footerY, { align: 'center' });
        }

        doc.end();
    } catch (err) {
        console.error("INVOICE PDF ERROR:", err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

module.exports = { generateAnalyticsPDF, generateInvoicePDF };

