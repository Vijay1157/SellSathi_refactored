const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const axios = require('axios');

const invoicesDir = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'invoices')
    : path.join(__dirname, '..', 'invoices');

try {
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }
} catch (err) {
    console.error('Failed to create invoices directory:', err.message);
    // Fallback to /tmp if even the nested one fails
    if (invoicesDir !== '/tmp') {
        const fallbackDir = '/tmp';
        console.log(`Falling back to ${fallbackDir}`);
    }
}

// Company Details - Sellsathi Private Limited
const COMPANY_INFO = {
    name: 'Gudkart Private Limited',
    addressLine1: 'No. 123, MG Road, Koramangala',
    addressLine2: 'Bangalore, Karnataka',
    addressLine3: 'India',
    city: 'Bangalore',
    pincode: '560034',
    state: 'Karnataka',
    country: 'IN-KA, IN',
    gstin: '29AABCS1234M1ZX',
    pan: 'AABCS1234M'
};

// Helper function to download and convert logo to base64
async function getLogoBase64() {
    try {
        // Try to read from backend assets first (more reliable)
        const logoPathBackend = path.join(__dirname, '..', 'assets', 'gudkart-logo.png');
        if (fs.existsSync(logoPathBackend)) {
            const logoBuffer = fs.readFileSync(logoPathBackend);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }

        // Fallback to frontend public folder
        const logoPath = path.join(__dirname, '..', '..', '..', '..', 'frontend', 'public', 'gudkart-logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        return null;
    } catch (error) {
        console.error('Logo loading error:', error);
        return null;
    }
}

// Helper function to get Shiprocket QR code
async function getShiprocketQR(order) {
    try {
        // If order has Shiprocket label URL with QR code
        if (order.labelUrl) {
            // In production, you would fetch the QR from Shiprocket API
            // For now, return null to show "QR Code" text
            return null;
        }
        return null;
    } catch (error) {
        console.error('Shiprocket QR fetch error:', error);
        return null;
    }
}


exports.generateInvoice = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const invoiceName = `Invoice-${order.orderId}.pdf`;
            const invoicePath = path.join(invoicesDir, invoiceName);
            const stream = fs.createWriteStream(invoicePath);

            doc.pipe(stream);

            // Helper function to get name from address
            const getNameFromAddress = (addr) => {
                if (!addr) return 'N/A';
                return `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Customer';
            };

            // Get logo and QR code
            const logoDataUrl = await getLogoBase64();
            const shiprocketQR = await getShiprocketQR(order);

            // ============= PAGE 1 =============
            await generatePage1(doc, order, logoDataUrl, shiprocketQR, getNameFromAddress);

            // ============= PAGE 2 =============
            doc.addPage();
            await generatePage2(doc, order, logoDataUrl, shiprocketQR, getNameFromAddress);

            doc.end();

            stream.on('finish', () => resolve(invoicePath));
            stream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};


// PAGE 1: Original invoice with logo and dynamic QR
async function generatePage1(doc, order, logoDataUrl, shiprocketQR, getNameFromAddress) {
    let yPos = 40;

    // Add Logo at top left
    if (logoDataUrl) {
        try {
            const logoBuffer = Buffer.from(logoDataUrl.split(',')[1], 'base64');
            doc.image(logoBuffer, 50, yPos, { width: 120, height: 40 });
        } catch (err) {
            console.error('Logo rendering error:', err);
        }
    }

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('Bill of Supply', 50, yPos, { align: 'center' });

    // Add QR Code (Shiprocket or placeholder)
    if (shiprocketQR) {
        const qrBuffer = Buffer.from(shiprocketQR.split(',')[1], 'base64');
        doc.image(qrBuffer, 490, yPos, { width: 70, height: 70 });
    } else {
        // Show "QR Code" text placeholder
        doc.fontSize(8).font('Helvetica').fillColor('#999999')
            .text('QR Code', 490, yPos + 25, { width: 70, align: 'center' });
        doc.rect(490, yPos, 70, 70).stroke('#cccccc');
        doc.fillColor('#000000');
    }

    yPos = 120;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();

    // Order Number
    yPos += 15;
    doc.fontSize(12).font('Helvetica-Bold').text(`#${order.orderId}`, 50, yPos);

    // Bill of Supply Details
    yPos += 25;
    const leftCol = 30;
    const rightCol = 320;

    doc.fontSize(9).font('Helvetica-Bold').text('Bill of Supply Details', leftCol, yPos);
    yPos += 15;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Bill of Supply Number', leftCol, yPos);
    doc.font('Helvetica').text(`: ${order.orderId || 'N/A'}`, leftCol + 110, yPos);

    yPos += 12;
    doc.font('Helvetica-Bold').text('Bill of Supply Date', leftCol, yPos);
    doc.font('Helvetica').text(`: ${new Date().toLocaleDateString('en-GB')}`, leftCol + 110, yPos);

    yPos += 12;
    doc.font('Helvetica-Bold').text('Order Number', leftCol, yPos);
    doc.font('Helvetica').text(`: ${order.orderId || 'N/A'}`, leftCol + 110, yPos);

    // Right column
    yPos = 160;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Nature of transaction', rightCol, yPos);
    doc.font('Helvetica').text(': INTRA', rightCol + 110, yPos);

    yPos += 12;
    doc.font('Helvetica-Bold').text('Nature Of Supply', rightCol, yPos);
    doc.font('Helvetica').text(': Service', rightCol + 110, yPos);

    yPos = 210;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();


    // Billed From and Billed To
    yPos += 10;
    const col1 = 30;
    const col2 = 310;

    // Billed From
    doc.fontSize(9).font('Helvetica-Bold').text('Billed From', col1, yPos);
    yPos += 15;
    doc.fontSize(8).font('Helvetica-Bold').text(COMPANY_INFO.name, col1, yPos);
    yPos += 12;
    doc.fontSize(7).font('Helvetica')
        .text(COMPANY_INFO.addressLine1, col1, yPos, { width: 260 });
    yPos += 10;
    doc.text(COMPANY_INFO.addressLine2, col1, yPos, { width: 260 });
    yPos += 10;
    doc.text(COMPANY_INFO.addressLine3, col1, yPos, { width: 260 });
    yPos += 10;
    doc.text(`${COMPANY_INFO.city}, ${COMPANY_INFO.pincode}, ${COMPANY_INFO.state}, ${COMPANY_INFO.country}, IN- ${COMPANY_INFO.pincode}`, col1, yPos, { width: 260 });
    yPos += 12;
    doc.font('Helvetica-Bold').text(`GSTIN : ${COMPANY_INFO.gstin}`, col1, yPos);
    yPos += 10;
    doc.text(`PAN : ${COMPANY_INFO.pan}`, col1, yPos);

    // Billed To
    yPos = 230;
    const billingAddr = order.billingAddress || order.shippingAddress || {};
    const customerGST = order.customerInfo?.gstNumber || order.gstNumber || null;

    doc.fontSize(9).font('Helvetica-Bold').text('Billed To', col2, yPos);
    yPos += 15;
    doc.fontSize(8).font('Helvetica-Bold').text(getNameFromAddress(billingAddr), col2, yPos);
    yPos += 12;
    doc.fontSize(7).font('Helvetica')
        .text(billingAddr.addressLine || 'N/A', col2, yPos, { width: 240 });
    yPos += 10;
    doc.text(`${billingAddr.city || 'N/A'}, ${billingAddr.state || 'N/A'} - ${billingAddr.pincode || 'N/A'}`, col2, yPos, { width: 240 });
    yPos += 12;

    if (customerGST) {
        doc.font('Helvetica-Bold').text(`GSTIN : ${customerGST}`, col2, yPos);
        yPos += 10;
    }

    doc.font('Helvetica-Bold').text(`State : ${billingAddr.state || 'Karnataka'}`, col2, yPos);
    yPos += 10;
    doc.text(`State Code : IN-KA`, col2, yPos);
    yPos += 10;
    doc.text(`Place of Supply : ${(billingAddr.state || 'KARNATAKA').toUpperCase()}`, col2, yPos);

    // Shipped From and Shipped To
    yPos = 360;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#cccccc').lineWidth(0.5).stroke();
    yPos += 10;

    // Shipped From
    const sellerAddr = order.sellerAddress || {};
    doc.fontSize(9).font('Helvetica-Bold').text('Shipped From', col1, yPos);
    yPos += 15;
    doc.fontSize(7).font('Helvetica')
        .text(sellerAddr.addressLine || 'Survey No. 48, 486, 487, 488, 489, 490, 491, 492, 493, 494, 54,', col1, yPos, { width: 260 });
    yPos += 10;
    doc.text(sellerAddr.city ? `${sellerAddr.city}, ${sellerAddr.state || 'Karnataka'} - ${sellerAddr.pincode || '580011'}` : 'Kotur Dharwad Dist., Karnataka - 580011,', col1, yPos, { width: 260 });
    yPos += 10;
    doc.text(`${sellerAddr.state || 'KARNATAKA'}, IN-KA,`, col1, yPos);
    yPos += 10;
    doc.text(`India - ${sellerAddr.pincode || '580011'}`, col1, yPos);

    // Shipped To
    yPos = 375;
    const shippingAddr = order.shippingAddress || billingAddr;
    doc.fontSize(9).font('Helvetica-Bold').text('Shipped To', col2, yPos);
    yPos += 15;
    doc.fontSize(8).font('Helvetica-Bold').text(getNameFromAddress(shippingAddr), col2, yPos);
    yPos += 12;
    doc.fontSize(7).font('Helvetica')
        .text(shippingAddr.addressLine || 'N/A', col2, yPos, { width: 240 });
    yPos += 10;
    doc.text(`${shippingAddr.city || 'N/A'}, ${shippingAddr.state || 'Karnataka'}, IN-KA,`, col2, yPos, { width: 240 });
    yPos += 10;
    doc.text(`India - ${shippingAddr.pincode || 'N/A'}`, col2, yPos);


    // Items Table
    yPos = 465;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();
    yPos += 8;

    // Table Header
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Particulars', 35, yPos);
    doc.text('SAC', 180, yPos);
    doc.text('Qty', 230, yPos);
    doc.text('Gross', 270, yPos);
    doc.text('Taxable', 320, yPos);
    doc.text('SGST', 380, yPos);
    doc.text('CGST', 430, yPos);
    doc.text('Total', 490, yPos);
    yPos += 10;
    doc.text('Amount', 265, yPos);
    doc.text('Value', 320, yPos);

    yPos += 8;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(0.5).stroke();

    // Table Rows
    const items = order.items || [];
    let subtotal = 0;
    let totalSGST = 0;
    let totalCGST = 0;

    items.forEach((item, index) => {
        yPos += 10;
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;

        const gstPercent = item.gstPercent || 0;
        const sgst = (itemTotal * gstPercent) / 200;
        const cgst = (itemTotal * gstPercent) / 200;
        totalSGST += sgst;
        totalCGST += cgst;

        doc.fontSize(7).font('Helvetica');
        doc.text(item.name || item.title || 'Product', 35, yPos, { width: 140 });
        yPos += 10;
        doc.fontSize(6).text(`CGST ${(gstPercent / 2).toFixed(1)} %`, 35, yPos);
        yPos += 8;
        doc.text(`SGST ${(gstPercent / 2).toFixed(1)} %`, 35, yPos);

        yPos -= 18;
        doc.fontSize(7);
        doc.text('996511', 180, yPos);
        doc.text((item.quantity || 1).toFixed(1), 230, yPos);
        doc.text(`₹${itemTotal.toFixed(2)}`, 265, yPos);
        doc.text(`₹${itemTotal.toFixed(2)}`, 320, yPos);
        doc.text(`₹${sgst.toFixed(2)}`, 380, yPos);
        doc.text(`₹${cgst.toFixed(2)}`, 430, yPos);
        doc.text(`₹${(itemTotal + sgst + cgst).toFixed(2)}`, 485, yPos);

        yPos += 25;
        if (index < items.length - 1) {
            doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#eeeeee').lineWidth(0.5).stroke();
        }
    });

    // Total Row
    yPos += 5;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();
    yPos += 10;

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Total', 35, yPos);
    doc.text(items.reduce((sum, item) => sum + (item.quantity || 1), 0).toFixed(1), 230, yPos);
    doc.text(`₹${subtotal.toFixed(2)}`, 265, yPos);
    doc.text(`₹${subtotal.toFixed(2)}`, 320, yPos);
    doc.text(`₹${totalSGST.toFixed(2)}`, 380, yPos);
    doc.text(`₹${totalCGST.toFixed(2)}`, 430, yPos);
    doc.text(`₹${(subtotal + totalSGST + totalCGST).toFixed(2)}`, 485, yPos);

    yPos += 15;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();


    // Footer Section
    yPos += 20;

    // Payment Information Box
    const paymentBoxY = yPos;
    const paymentBoxHeight = 35;

    const paymentStatus = order.paymentStatus || (order.paymentMethod === 'COD' ? 'Pending' : 'Completed');
    const isPaymentComplete = paymentStatus === 'Completed' || paymentStatus === 'Collected';

    if (isPaymentComplete) {
        doc.save()
           .fillOpacity(0.1)
           .fill('#10b981')
           .strokeOpacity(0.3)
           .stroke('#059669')
           .rect(30, paymentBoxY, 535, paymentBoxHeight)
           .fillAndStroke()
           .restore();
    } else {
        doc.save()
           .fillOpacity(0.1)
           .fill('#f59e0b')
           .strokeOpacity(0.3)
           .stroke('#d97706')
           .rect(30, paymentBoxY, 535, paymentBoxHeight)
           .fillAndStroke()
           .restore();
    }

    doc.fillColor('#666666').fontSize(7).font('Helvetica-Bold')
        .text('PAYMENT METHOD', 40, paymentBoxY + 8, { width: 250 });
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
        .text((order.paymentMethod || 'N/A').toUpperCase(), 40, paymentBoxY + 18, { width: 250 });

    let statusText;
    if (paymentStatus === 'Completed') {
        statusText = 'PAID ONLINE';
    } else if (paymentStatus === 'Collected') {
        statusText = 'PAYMENT COLLECTED';
    } else if (order.paymentMethod === 'COD') {
        statusText = 'PAY ON DELIVERY';
    } else {
        statusText = 'PAID ONLINE';
    }

    const statusColor = isPaymentComplete ? '#059669' : '#d97706';

    doc.fillColor('#666666').fontSize(7).font('Helvetica-Bold')
        .text('PAYMENT STATUS', 320, paymentBoxY + 8, { width: 235, align: 'right' });
    doc.fillColor(statusColor).fontSize(9).font('Helvetica-Bold')
        .text(statusText, 320, paymentBoxY + 18, { width: 235, align: 'right' });

    yPos += paymentBoxHeight + 15;
    doc.fillColor('#000000');

    doc.fontSize(7).font('Helvetica-Oblique')
        .fillColor('#666666')
        .text('This is a computer generated invoice, no need for digital signature', 30, yPos, { align: 'center', width: 535 });

    yPos += 20;
    doc.fillColor('#000000');
    doc.fontSize(8).font('Helvetica-Bold').text('Thank you for Shopping!', 30, yPos);
    yPos += 15;
    doc.fontSize(7).font('Helvetica').text('Please contact support if you have any questions.', 30, yPos);

    yPos += 30;
    doc.fontSize(7).font('Helvetica-Bold').text(`${COMPANY_INFO.name} - Empowering Local Sellers`, 30, yPos, { align: 'center', width: 535 });
    yPos += 12;
    doc.fontSize(6).font('Helvetica').text(`${COMPANY_INFO.addressLine1}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} - ${COMPANY_INFO.pincode}`, 30, yPos, { align: 'center', width: 535 });
    yPos += 10;
    doc.text(`GSTIN: ${COMPANY_INFO.gstin} | PAN: ${COMPANY_INFO.pan}`, 30, yPos, { align: 'center', width: 535 });
}


// PAGE 2: Platform fee breakdown, no shipping addresses
async function generatePage2(doc, order, logoDataUrl, shiprocketQR, getNameFromAddress) {
    let yPos = 40;

    // Add Logo at top left
    if (logoDataUrl) {
        try {
            const logoBuffer = Buffer.from(logoDataUrl.split(',')[1], 'base64');
            doc.image(logoBuffer, 50, yPos, { width: 120, height: 40 });
        } catch (err) {
            console.error('Logo rendering error:', err);
        }
    }

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('Bill of Supply - Detailed', 50, yPos, { align: 'center' });

    // Add QR Code
    if (shiprocketQR) {
        const qrBuffer = Buffer.from(shiprocketQR.split(',')[1], 'base64');
        doc.image(qrBuffer, 490, yPos, { width: 70, height: 70 });
    } else {
        doc.fontSize(8).font('Helvetica').fillColor('#999999')
            .text('QR Code', 490, yPos + 25, { width: 70, align: 'center' });
        doc.rect(490, yPos, 70, 70).stroke('#cccccc');
        doc.fillColor('#000000');
    }

    yPos = 120;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();

    // Order Number
    yPos += 15;
    doc.fontSize(12).font('Helvetica-Bold').text(`#${order.orderId}`, 50, yPos);

    yPos += 25;
    const leftCol = 30;
    const rightCol = 310;

    // Billed From
    doc.fontSize(9).font('Helvetica-Bold').text('Billed From', leftCol, yPos);
    yPos += 15;
    doc.fontSize(8).font('Helvetica-Bold').text(COMPANY_INFO.name, leftCol, yPos);
    yPos += 12;
    doc.fontSize(7).font('Helvetica')
        .text(COMPANY_INFO.addressLine1, leftCol, yPos, { width: 260 });
    yPos += 10;
    doc.text(`${COMPANY_INFO.city}, ${COMPANY_INFO.pincode}, ${COMPANY_INFO.state}, ${COMPANY_INFO.country}`, leftCol, yPos);
    yPos += 12;
    doc.font('Helvetica-Bold').text(`GSTIN : ${COMPANY_INFO.gstin}`, leftCol, yPos);

    // Billed To
    yPos = 160;
    const billingAddr = order.billingAddress || order.shippingAddress || {};
    doc.fontSize(9).font('Helvetica-Bold').text('Billed To', rightCol, yPos);
    yPos += 15;
    doc.fontSize(8).font('Helvetica-Bold').text(getNameFromAddress(billingAddr), rightCol, yPos);
    yPos += 12;
    doc.fontSize(7).font('Helvetica')
        .text(billingAddr.addressLine || 'N/A', rightCol, yPos, { width: 240 });
    yPos += 10;
    doc.text(`${billingAddr.city || 'N/A'}, ${billingAddr.state || 'N/A'} - ${billingAddr.pincode || 'N/A'}`, rightCol, yPos);
    yPos += 12;
    doc.font('Helvetica-Bold').text(`State : ${billingAddr.state || 'Karnataka'}`, rightCol, yPos);

    // Calculate platform fee percentage
    const platformFeeBreakdown = order.platformFeeBreakdown || {
        digitalSecurityFee: 1.2,
        merchantVerification: 1.0,
        transitCare: 0.8,
        platformMaintenance: 0.5,
        qualityHandling: 0.0
    };
    const platformFeePercent = Object.values(platformFeeBreakdown).reduce((sum, val) =>
        sum + (typeof val === 'number' ? val : (val.percent || 0)), 0
    );
    const effectivePlatformFeePercent = platformFeePercent * 1.18; // Incl. 18% GST on platform fee

    // Items Table with Platform Fee
    yPos = 260;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();
    yPos += 8;

    // Table Header
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('Particulars', 35, yPos);
    doc.text('SAC', 150, yPos);
    doc.text('Qty', 190, yPos);
    doc.text('Platform', 225, yPos);
    doc.text('Gross', 280, yPos);
    doc.text('Taxable', 330, yPos);
    doc.text('SGST', 385, yPos);
    doc.text('CGST', 435, yPos);
    doc.text('Total', 495, yPos);
    yPos += 8;
    doc.text('Fee', 225, yPos);
    doc.text('Amount', 275, yPos);
    doc.text('Value', 330, yPos);

    yPos += 8;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(0.5).stroke();

    const items = order.items || [];
    let subtotal = 0;
    let totalSGST = 0;
    let totalCGST = 0;
    let totalPFee = 0;

    items.forEach((item, index) => {
        yPos += 10;
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;

        const gstPercent = item.gstPercent || 0;
        const sgst = (itemTotal * gstPercent) / 200;
        const cgst = (itemTotal * gstPercent) / 200;
        const pFee = (itemTotal * effectivePlatformFeePercent) / 100;
        totalSGST += sgst;
        totalCGST += cgst;
        totalPFee += pFee;

        doc.fontSize(6).font('Helvetica');
        doc.text(item.name || item.title || 'Product', 35, yPos, { width: 110 });

        doc.fontSize(6.5);
        doc.text('996511', 150, yPos);
        doc.text((item.quantity || 1).toFixed(1), 190, yPos);
        doc.text(`₹${pFee.toFixed(2)}`, 225, yPos);
        doc.text(`₹${itemTotal.toFixed(2)}`, 275, yPos);
        doc.text(`₹${itemTotal.toFixed(2)}`, 330, yPos);
        doc.text(`₹${sgst.toFixed(2)}`, 385, yPos);
        doc.text(`₹${cgst.toFixed(2)}`, 435, yPos);
        doc.text(`₹${(itemTotal + sgst + cgst + pFee).toFixed(2)}`, 495, yPos);

        yPos += 18;
        if (index < items.length - 1) {
            doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#eeeeee').lineWidth(0.5).stroke();
        }
    });

    // Total Row
    yPos += 5;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();
    yPos += 10;

    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('Total', 35, yPos);
    doc.text(items.reduce((sum, item) => sum + (item.quantity || 1), 0).toFixed(1), 190, yPos);
    doc.text(`₹${totalPFee.toFixed(2)}`, 225, yPos);
    doc.text(`₹${subtotal.toFixed(2)}`, 275, yPos);
    doc.text(`₹${subtotal.toFixed(2)}`, 330, yPos);
    doc.text(`₹${totalSGST.toFixed(2)}`, 385, yPos);
    doc.text(`₹${totalCGST.toFixed(2)}`, 435, yPos);
    doc.text(`₹${(subtotal + totalSGST + totalCGST + totalPFee).toFixed(2)}`, 495, yPos);

    yPos += 15;
    doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();

    // Footer items
    yPos += 20;
    const paymentStatus = order.paymentStatus || (order.paymentMethod === 'COD' ? 'Pending' : 'Completed');
    const isPaymentComplete = paymentStatus === 'Completed' || paymentStatus === 'Collected';
    const statusColor = isPaymentComplete ? '#059669' : '#d97706';

    doc.save()
       .fillOpacity(isPaymentComplete ? 0.1 : 0.1)
       .fill(isPaymentComplete ? '#10b981' : '#f59e0b')
       .strokeOpacity(0.3)
       .stroke(isPaymentComplete ? '#059669' : '#d97706')
       .rect(30, yPos, 535, 30)
       .fillAndStroke()
       .restore();
    doc.fillColor('#000000').fontSize(7).font('Helvetica-Bold').text('PAYMENT METHOD: ' + (order.paymentMethod || 'N/A').toUpperCase(), 40, yPos + 10);
    doc.fillColor(statusColor).text('STATUS: ' + paymentStatus.toUpperCase(), 350, yPos + 10, { width: 200, align: 'right' });

    yPos += 50;
    doc.fillColor('#666666').fontSize(7).font('Helvetica-Oblique').text('This is a computer generated invoice, no need for digital signature', 30, yPos, { align: 'center', width: 535 });

    yPos += 20;
    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text('Thank you for Shopping!', 30, yPos, { align: 'center', width: 535 });
    yPos += 15;
    doc.fontSize(7).font('Helvetica').text('GudKart Private Limited - Empowering Local Sellers', 30, yPos, { align: 'center', width: 535 });
}
