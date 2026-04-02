'use strict';
const path = require('path');
const fs = require('fs');
const { admin, db } = require('../../../config/firebase');
const PDFDocument = require('pdfkit');
const { getAdminConfig } = require('../../../shared/services/adminConfigService');

// Brand constants
const BRAND = {
    name: 'GudKart',
    tagline: 'Your Trusted E-Commerce Platform',
    primary: '#3B7CF1',
    dark: '#1D5FD4',
    lightBg: '#EBF0FF',
    border: '#BFCFFA',
    logoPath: path.join(__dirname, '../../../assets/gudkart-logo.png')
};

// Shared PDF header renderer
function renderPDFHeader(doc, adminConfig, title, subtitle) {
    const siteInfo = adminConfig.websiteInfo || BRAND.tagline;

    // Centered logo + two-tone brand name header
    const logoH = 70;
    const logoW = 70;
    const logoX = 160;
    const logoY = 28;
    const textX = logoX + logoW + 14;
    const textY = 42;

    if (fs.existsSync(BRAND.logoPath)) {
        doc.image(BRAND.logoPath, logoX, logoY, { height: logoH });
    }

    // "Gud" in dark navy bold
    doc.fontSize(38).fillColor('#1a1a6e').font('Helvetica-Bold').text('Gud', textX, textY, { continued: true });
    // "kart" in GudKart blue
    doc.fontSize(38).fillColor('#3B7CF1').font('Helvetica').text('kart');

    // Tagline below brand name
    doc.fontSize(9).fillColor('#888888').font('Helvetica').text(siteInfo, textX, textY + 44);

    // Date top right
    const reportDate = new Date().toLocaleDateString('en-GB');
    doc.fontSize(9).fillColor('#666666').text('Report Date:', 430, 35);
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text(reportDate, 430, 48);

    // Divider
    doc.moveTo(50, 112).lineTo(545, 112).strokeColor(BRAND.primary).lineWidth(2).stroke();

    // Title
    doc.fontSize(16).fillColor('#000000').font('Helvetica-Bold').text(title, 50, 124, { align: 'center' });
    if (subtitle) {
        doc.fontSize(10).fillColor('#666666').font('Helvetica').text(subtitle, 50, 144, { align: 'center' });
    }

    return reportDate;
}

// Shared section header
function renderSectionHeader(doc, label, y) {
    doc.rect(50, y, 495, 18).fillAndStroke('#f3f4f6', '#e5e7eb');
    doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text(label, 55, y + 5);
    return y + 18;
}

// Shared table header
function renderTableHeader(doc, y, columns) {
    doc.rect(50, y, 495, 22).fillAndStroke(BRAND.primary, BRAND.primary);
    doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
    columns.forEach(col => doc.text(col.label, col.x, y + 7));
    return y + 27;
}

// Shared stat box
function renderStatBox(doc, x, y, w, h, label, value) {
    doc.rect(x, y, w, h).fillAndStroke(BRAND.lightBg, BRAND.primary);
    doc.fontSize(9).fillColor(BRAND.primary).font('Helvetica').text(label, x, y + 10, { width: w, align: 'center' });
    doc.fontSize(16).fillColor(BRAND.dark).font('Helvetica-Bold').text(value, x, y + 30, { width: w, align: 'center' });
}

// Shared seller info block
function renderSellerInfo(doc, sellerData, sellerContact, y) {
    y = renderSectionHeader(doc, 'SELLER INFORMATION', y) + 10;
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('Shop Name:', 55, y);       doc.font('Helvetica-Bold').text(sellerData.shopName || 'N/A', 160, y);
    doc.font('Helvetica').text('Category:', 320, y); doc.font('Helvetica-Bold').text(sellerData.category || 'N/A', 400, y);
    doc.font('Helvetica').text('GST Number:', 55, y + 20); doc.font('Helvetica-Bold').text(sellerData.gstNumber || 'N/A', 160, y + 20);
    doc.font('Helvetica').text('Contact:', 320, y + 20); doc.font('Helvetica-Bold').text(sellerContact || 'N/A', 400, y + 20);
    return y + 50;
}

// Shared bank details block
function renderBankDetails(doc, bankDetails, y) {
    y = renderSectionHeader(doc, 'BANK DETAILS', y) + 10;
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('Bank Name:', 55, y);       doc.font('Helvetica-Bold').text(bankDetails.bankName, 160, y);
    doc.text('Account Holder:', 320, y); doc.font('Helvetica-Bold').text(bankDetails.accountHolderName, 430, y);
    doc.font('Helvetica').text('Account Number:', 55, y + 20); doc.font('Helvetica-Bold').text(bankDetails.accountNumber, 160, y + 20);
    doc.text('IFSC Code:', 320, y + 20); doc.font('Helvetica-Bold').text(bankDetails.ifscCode, 430, y + 20);
    doc.font('Helvetica').text('UPI ID:', 55, y + 40); doc.font('Helvetica-Bold').text(bankDetails.upiId, 160, y + 40);
    return y + 65;
}

/**
 * Generate Analytics PDF for a seller (Payout)
 */
const generateAnalyticsPDF = async (req, res) => {
    try {
        const { uid } = req.params;
        const { fromDate, toDate } = req.query;
        const adminConfig = await getAdminConfig();

        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) return res.status(404).send("Seller not found");
        const sellerData = sellerSnap.data();

        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const sellerContact = userData.phone || userData.email || "N/A";

        const bankDetails = {
            bankName: sellerData.bankName || 'Not provided',
            accountHolderName: sellerData.accountHolderName || 'Not provided',
            accountNumber: sellerData.accountNumber || 'Not provided',
            ifscCode: sellerData.ifscCode || 'Not provided',
            upiId: sellerData.upiId || 'Not provided'
        };

        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        let totalProducts = 0, totalStockLeft = 0, totalInventoryValue = 0;
        const productStats = {};

        productsSnap.forEach(p => {
            const prod = p.data();
            totalProducts++;
            const stock = prod.stock || 0;
            const price = prod.price || 0;
            const discountedPrice = prod.discountedPrice || price;
            totalStockLeft += stock;
            totalInventoryValue += (discountedPrice * stock);
            productStats[p.id] = {
                name: prod.title || 'N/A',
                price, discountedPrice: prod.discountedPrice || null,
                stock, sold: 0, revenue: 0
            };
        });

        let unitsSold = 0, grossRevenue = 0;
        const ordersSnap = await db.collection("orders").get();
        ordersSnap.forEach(o => {
            const order = o.data();
            const orderDate = order.createdAt?.toDate();
            let inRange = true;
            if (fromDate || toDate) {
                if (orderDate) {
                    if (fromDate && new Date(fromDate) > orderDate) inRange = false;
                    if (toDate) { const to = new Date(toDate); to.setHours(23,59,59,999); if (to < orderDate) inRange = false; }
                } else { inRange = false; }
            }
            if (inRange && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.sellerId === uid) {
                        unitsSold += (item.quantity || 1);
                        const rev = (item.price || 0) * (item.quantity || 1);
                        grossRevenue += rev;
                        if (productStats[item.productId]) {
                            productStats[item.productId].sold += (item.quantity || 1);
                            productStats[item.productId].revenue += rev;
                        }
                    }
                });
            }
        });

        let filename = `analytics_${sellerData.shopName?.replace(/\s+/g, '_') || 'seller'}`;
        if (fromDate && toDate) filename += `_${fromDate}_to_${toDate}`;

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
        doc.pipe(res);

        const subtitle = (fromDate && toDate)
            ? `Date Range: ${new Date(fromDate).toLocaleDateString('en-GB')} to ${new Date(toDate).toLocaleDateString('en-GB')}`
            : null;
        const reportDate = renderPDFHeader(doc, adminConfig, 'SELLER ANALYTICS REPORT', subtitle);

        let y = subtitle ? 175 : 162;

        // Seller Info
        y = renderSellerInfo(doc, sellerData, sellerContact, y);
        y += 10;

        // Bank Details
        y = renderBankDetails(doc, bankDetails, y);
        y += 15;

        // Performance Summary
        y = renderSectionHeader(doc, 'PERFORMANCE SUMMARY', y) + 15;
        const bw = 115, bh = 65, bg = 10;
        renderStatBox(doc, 50, y, bw, bh, 'Total Products', totalProducts.toString());
        renderStatBox(doc, 50 + bw + bg, y, bw, bh, 'Units Sold', unitsSold.toString());
        renderStatBox(doc, 50 + (bw+bg)*2, y, bw, bh, 'Stock Left', totalStockLeft.toString());
        renderStatBox(doc, 50 + (bw+bg)*3, y, bw, bh, 'Gross Revenue', `Rs.${grossRevenue.toLocaleString()}`);
        y += bh + 20;

        // Product Table
        y = renderSectionHeader(doc, 'PRODUCT DETAILS', y) + 5;
        const prodCols = [
            { label: 'Product', x: 55 }, { label: 'Price', x: 220 },
            { label: 'Disc. Price', x: 290 }, { label: 'Stock', x: 365 },
            { label: 'Sold', x: 415 }, { label: 'Revenue', x: 460 }
        ];
        y = renderTableHeader(doc, y, prodCols);

        const sortedProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
        sortedProducts.forEach((p, i) => {
            if (y > 720) { doc.addPage(); y = 50; y = renderTableHeader(doc, y, prodCols); }
            if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillAndStroke('#f9fafb', '#f9fafb');
            doc.fontSize(8).fillColor('#000000').font('Helvetica');
            doc.text((p.name || '').substring(0, 28), 55, y);
            doc.text(`Rs.${p.price}`, 220, y);
            doc.text(p.discountedPrice ? `Rs.${p.discountedPrice}` : '-', 290, y);
            doc.text(p.stock.toString(), 365, y);
            doc.text(p.sold.toString(), 415, y);
            doc.text(`Rs.${p.revenue}`, 460, y);
            y += 18;
        });

        // Footer
        doc.fontSize(8).fillColor('#999999').font('Helvetica')
            .text(`Generated by ${(adminConfig.websiteName !== 'SellSathi' ? adminConfig.websiteName : BRAND.name)} | ${reportDate}`, 50, 770, { align: 'center' });

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
        const adminConfig = await getAdminConfig();

        const sellerSnap = await db.collection("sellers").doc(uid).get();
        if (!sellerSnap.exists) return res.status(404).send("Seller not found");
        const sellerData = sellerSnap.data();

        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const sellerContact = userData.phone || userData.email || "N/A";

        const bankDetails = {
            bankName: sellerData.bankName || 'Not provided',
            accountHolderName: sellerData.accountHolderName || 'Not provided',
            accountNumber: sellerData.accountNumber || 'Not provided',
            ifscCode: sellerData.ifscCode || 'Not provided',
            upiId: sellerData.upiId || 'Not provided'
        };

        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        const totalProducts = productsSnap.size;
        const sellerProducts = [];
        productsSnap.forEach(p => {
            const prod = p.data();
            sellerProducts.push({
                name: prod.title || 'N/A', price: prod.price || 0,
                discountedPrice: prod.discountedPrice || null,
                stock: prod.stock || 0, category: prod.category || 'N/A'
            });
        });

        const ordersSnap = await db.collection("orders").where("status", "==", "Delivered").get();
        let totalRevenue = 0, deliveredCount = 0;
        const orderDetails = [];

        ordersSnap.forEach(o => {
            const order = o.data();
            const orderDate = order.createdAt?.toDate();
            let inRange = true;
            if (orderDate) {
                if (fromDate && new Date(fromDate) > orderDate) inRange = false;
                if (toDate) { const to = new Date(toDate); to.setHours(23,59,59,999); if (to < orderDate) inRange = false; }
            }
            if (inRange && Array.isArray(order.items)) {
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

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${sellerData.shopName?.replace(/\s+/g, '_') || 'seller'}.pdf`);
        doc.pipe(res);

        const subtitle = (fromDate && toDate)
            ? `Invoice Period: ${new Date(fromDate).toLocaleDateString('en-GB')} to ${new Date(toDate).toLocaleDateString('en-GB')}`
            : (fromDate ? `From: ${new Date(fromDate).toLocaleDateString('en-GB')}` : null);
        const reportDate = renderPDFHeader(doc, adminConfig, 'SELLER INVOICE REPORT', subtitle);

        let y = subtitle ? 175 : 162;

        // Seller Info
        y = renderSellerInfo(doc, sellerData, sellerContact, y);
        y += 10;

        // Bank Details
        y = renderBankDetails(doc, bankDetails, y);
        y += 15;

        // Invoice Summary
        y = renderSectionHeader(doc, 'INVOICE SUMMARY', y) + 15;
        const bw = 115, bh = 65, bg = 10;
        renderStatBox(doc, 50, y, bw, bh, 'Total Products', totalProducts.toString());
        renderStatBox(doc, 50 + bw + bg, y, bw, bh, 'Total Revenue', `Rs.${totalRevenue.toLocaleString()}`);
        renderStatBox(doc, 50 + (bw+bg)*2, y, bw, bh, 'Platform Charges', `Rs.${platformCharges.toFixed(0)}`);
        renderStatBox(doc, 50 + (bw+bg)*3, y, bw, bh, 'Amount to Receive', `Rs.${amountToReceive.toFixed(0)}`);
        y += bh + 20;

        // Products Table
        y = renderSectionHeader(doc, 'PRODUCTS LISTED BY SELLER', y) + 5;
        const prodCols = [
            { label: 'Product Name', x: 55 }, { label: 'Category', x: 280 },
            { label: 'Price', x: 380 }, { label: 'Stock', x: 480 }
        ];
        y = renderTableHeader(doc, y, prodCols);

        if (sellerProducts.length === 0) {
            doc.fontSize(10).fillColor('#999999').text('No products listed.', 55, y, { align: 'center', width: 495 });
            y += 25;
        } else {
            sellerProducts.forEach((p, i) => {
                if (y > 700) { doc.addPage(); y = 50; y = renderTableHeader(doc, y, prodCols); }
                if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillAndStroke('#f9fafb', '#f9fafb');
                doc.fontSize(8).fillColor('#000000').font('Helvetica');
                doc.text(p.name.substring(0, 35), 55, y);
                doc.text(p.category, 280, y);
                const displayPrice = p.discountedPrice ? `Rs.${p.discountedPrice} (Rs.${p.price})` : `Rs.${p.price}`;
                doc.text(displayPrice, 380, y);
                doc.text(p.stock.toString(), 480, y);
                y += 18;
            });
        }

        y += 15;

        // Orders Table
        y = renderSectionHeader(doc, 'DELIVERED ORDER DETAILS', y) + 5;
        const orderCols = [
            { label: 'Order ID', x: 55 }, { label: 'Date', x: 145 },
            { label: 'Product', x: 215 }, { label: 'Qty', x: 385 },
            { label: 'Price', x: 420 }, { label: 'Total', x: 475 }
        ];
        y = renderTableHeader(doc, y, orderCols);

        if (orderDetails.length === 0) {
            doc.fontSize(10).fillColor('#999999').text('No delivered orders found.', 55, y, { align: 'center', width: 495 });
            y += 25;
        } else {
            orderDetails.forEach((o, i) => {
                if (y > 700) {
                    doc.addPage(); y = 50;
                    y = renderTableHeader(doc, y, orderCols);
                }
                if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillAndStroke('#f9fafb', '#f9fafb');
                doc.fontSize(8).fillColor('#000000').font('Helvetica');
                doc.text(o.orderId.substring(0, 12) + '...', 55, y);
                doc.text(o.orderDate, 145, y);
                doc.text(o.productName.substring(0, 25), 215, y);
                doc.text(o.quantity.toString(), 385, y);
                doc.text(`Rs.${o.price}`, 420, y);
                doc.text(`Rs.${o.total}`, 475, y);
                y += 18;
            });
        }

        // Footer
        const footerY = Math.min(y + 20, 770);
        doc.fontSize(8).fillColor('#999999').font('Helvetica')
            .text(`Generated by ${(adminConfig.websiteName !== 'SellSathi' ? adminConfig.websiteName : BRAND.name)} | ${reportDate}`, 50, footerY, { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("INVOICE PDF ERROR:", err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

module.exports = { generateAnalyticsPDF, generateInvoicePDF };
