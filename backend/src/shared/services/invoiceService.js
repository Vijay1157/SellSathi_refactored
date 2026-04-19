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
}

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

async function getLogoBase64() {
    try {
        const logoPathBackend = path.join(__dirname, '..', 'assets', 'gudkart-logo.png');
        if (fs.existsSync(logoPathBackend)) {
            const logoBuffer = fs.readFileSync(logoPathBackend);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        return null;
    } catch (error) {
        console.error('Logo loading error:', error);
        return null;
    }
}

async function getShiprocketQR(order) {
    return null; // Placeholder
}

exports.generateInvoice = async (order) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const invoiceName = `Invoice-${order.orderId}.pdf`;
            const invoicePath = path.join(invoicesDir, invoiceName);
            
            doc.on('error', reject);
            const stream = fs.createWriteStream(invoicePath);
            stream.on('finish', () => resolve(invoicePath));
            stream.on('error', reject);
            doc.pipe(stream);

            const getName = (addr) => addr ? `${addr.firstName || ''} ${addr.lastName || ''}`.trim() : 'Customer';
            const logoDataUrl = await getLogoBase64();
            const shiprocketQR = null;

            // PAGE 1
            await generatePage1(doc, order, logoDataUrl, shiprocketQR, getName);
            
            // PAGE 2
            doc.addPage();
            await generatePage2(doc, order, logoDataUrl, shiprocketQR, getName);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

async function generatePage1(doc, order, logoDataUrl, shiprocketQR, getName) {
    renderHeader(doc, logoDataUrl, 'Bill of Supply', order.orderId);
    
    let y = 100;
    renderOrderDetails(doc, order, y);
    
    y = 210;
    renderAddresses(doc, order, y, getName, true);
    
    y = 460;
    renderItemsTable(doc, order, y, false);
    
    renderFooter(doc, order, 750);
}

async function generatePage2(doc, order, logoDataUrl, shiprocketQR, getName) {
    renderHeader(doc, logoDataUrl, 'Bill of Supply - Detailed', order.orderId);
    
    let y = 100;
    renderOrderDetails(doc, order, y);
    
    y = 210;
    renderAddresses(doc, order, y, getName, false);
    
    y = 350;
    renderItemsTable(doc, order, y, true); // show platform fees
    
    renderFooter(doc, order, 750);
}

function renderHeader(doc, logoDataUrl, title, orderId) {
    // Left side: title + order ID
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text(title, 30, 35);
    doc.fontSize(10).font('Helvetica').fillColor('#444444').text(`#${orderId}`, 30, 58);

    // Right side: logo + brand name + tagline
    if (logoDataUrl) {
        try {
            const logoBuffer = Buffer.from(logoDataUrl.split(',')[1], 'base64');
            doc.image(logoBuffer, 430, 22, { width: 30 });
        } catch (e) {}
    }
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1800AD').text('Gud', 480, 28, { continued: true });
    doc.fontSize(18).font('Helvetica').fillColor('#5BB8FF').text('kart');
    doc.fontSize(7).font('Helvetica').fillColor('#1800AD').text('Gud Deals. Gud Life', 480, 52, { width: 80, align: 'center' });

    doc.fillColor('#000000');
    doc.moveTo(30, 85).lineTo(565, 85).lineWidth(1).strokeColor('#cccccc').stroke();
}

function renderOrderDetails(doc, order, y) {
    doc.fontSize(9).font('Helvetica-Bold').text('Transaction Details', 50, y);
    doc.fontSize(8).font('Helvetica');
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 50, y + 15);
    doc.text(`Nature of Supply: Service`, 50, y + 27);
    doc.text(`Place of Supply: ${(order.billingAddress?.state || 'KARNATAKA').toUpperCase()}`, 350, y + 15);
}

function renderAddresses(doc, order, y, getName, showShipping) {
    // Billed From
    doc.fontSize(9).font('Helvetica-Bold').text('Billed From', 50, y);
    doc.fontSize(8).font('Helvetica').text(COMPANY_INFO.name, 50, y + 15);
    doc.fontSize(7).text(`${COMPANY_INFO.addressLine1}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state}`, 50, y + 27);
    doc.text(`GSTIN: ${COMPANY_INFO.gstin}`, 50, y + 37);

    // Billed To
    doc.fontSize(9).font('Helvetica-Bold').text('Billed To', 350, y);
    
    let currentY = y + 15;
    
    // Customer name first
    doc.fontSize(8).font('Helvetica').fillColor('#000000').text(getName(order.billingAddress || order.shippingAddress), 350, currentY);
    currentY += 12;
    
    const bAddr = order.billingAddress || order.shippingAddress || {};
    doc.fontSize(7).text(`${bAddr.addressLine || 'N/A'}, ${bAddr.city || ''}`, 350, currentY);
    currentY += 10;
    
    // GST Number
    const gstNumber = order.gstNumber || order.customerInfo?.gstNumber || bAddr.gstNumber || null;
    if (gstNumber) {
        doc.text(`GSTIN: ${gstNumber}`, 350, currentY);
        currentY += 10;
    }
    
    // Business/Company name BELOW GST number
    const businessName = order.businessName || 
                        order.customerInfo?.businessName || 
                        bAddr.businessName || 
                        order.shippingAddress?.businessName || 
                        null;
    if (businessName) {
        doc.fontSize(7).font('Helvetica').fillColor('#666666').text('Business: ', 350, currentY, { continued: true });
        doc.font('Helvetica-Bold').fillColor('#000000').text(businessName);
        currentY += 10;
    }

    if (showShipping) {
        y += 80;
        doc.fontSize(9).font('Helvetica-Bold').text('Shipped From', 50, y);
        doc.fontSize(7).font('Helvetica').text(`Seller Location, ${order.sellerAddress?.city || 'India'}`, 50, y + 15);

        doc.fontSize(9).font('Helvetica-Bold').text('Shipped To', 350, y);
        const sAddr = order.shippingAddress || bAddr;
        doc.fontSize(8).font('Helvetica').text(getName(sAddr), 350, y + 15);
        doc.fontSize(7).text(`${sAddr.addressLine || ''}, ${sAddr.city || ''}`, 350, y + 27);
    }
}

function renderItemsTable(doc, order, y, showPlatformFee) {
    const startY = y;
    doc.fontSize(8).font('Helvetica-Bold');
    
    // Headers
    doc.text('Particulars', 35, y);
    doc.text('Qty', 180, y);
    const colPFee = 210;
    if (showPlatformFee) {
        doc.text('Platform Fee', colPFee, y);
    }
    doc.text('Gross', 260, y);
    doc.text('Taxable', 320, y);
    doc.text('GST', 390, y);
    doc.text('Total', 480, y);
    
    y += 15;
    doc.moveTo(35, y - 3).lineTo(560, y - 3).lineWidth(0.5).stroke();

    const platformFeeBreakdown = order.platformFeeBreakdown || {
        digitalSecurityFee: 1.2, merchantVerification: 1.0, transitCare: 0.8, platformMaintenance: 0.5, qualityHandling: 0.0
    };
    const pfPercent = Object.values(platformFeeBreakdown).reduce((s, v) => s + (typeof v === 'number' ? v : (v.percent || 0)), 0);
    const effectivePFPercent = pfPercent * 1.18;
    
    // Use effective platform fee if cap was applied
    const effectivePlatformFee = order.effectivePlatformFee || null;

    let tQty = 0, tGross = 0, tTaxable = 0, tGST = 0, tPFee = 0;

    (order.items || []).forEach(item => {
        const qty = item.quantity || 1;
        const inclusivePrice = item.priceWithGST || item.price || 0;
        const gstP = item.gstPercent || 18;
        
        const taxableUnitPrice = inclusivePrice / (1 + (gstP / 100));
        const taxableAmount = taxableUnitPrice * qty;
        const grossAmount = inclusivePrice * qty;
        const gstAmount = grossAmount - taxableAmount;
        
        const pFeeAmount = showPlatformFee ? (taxableAmount * effectivePFPercent / 100) : 0;
        const lineTotal = grossAmount + pFeeAmount;

        tQty += qty; tGross += grossAmount; tTaxable += taxableAmount; tGST += gstAmount; tPFee += pFeeAmount;

        doc.fontSize(7).font('Helvetica');
        doc.text(item.name || 'Product', 35, y, { width: 140 });
        doc.text(qty.toFixed(1), 180, y);
        if (showPlatformFee) doc.text(pFeeAmount.toFixed(2), colPFee, y);
        doc.text(grossAmount.toFixed(2), 260, y);
        doc.text(taxableAmount.toFixed(2), 320, y);
        doc.text(gstAmount.toFixed(2), 390, y);
        doc.text(lineTotal.toFixed(2), 480, y);
        y += 20;
    });

    doc.moveTo(35, y - 5).lineTo(560, y - 5).lineWidth(1).stroke();
    
    // Summary
    doc.font('Helvetica-Bold');
    doc.text('TOTAL', 35, y);
    doc.text(tQty.toFixed(1), 180, y);
    if (showPlatformFee) doc.text(tPFee.toFixed(2), colPFee, y);
    doc.text(tGross.toFixed(2), 260, y);
    doc.text(tTaxable.toFixed(2), 320, y);
    doc.text(tGST.toFixed(2), 390, y);
    doc.text((tGross + tPFee).toFixed(2), 480, y);
    
    y += 20;
    doc.fontSize(8);
    doc.text('Shipping Charges', 320, y);
    doc.text(`+ ₹${(order.estimatedShippingCharge || 0).toFixed(2)}`, 480, y);
    
    const disc = order.couponDiscount || order.discountValue || 0;
    if (disc > 0) {
        y += 12;
        doc.fillColor('#059669').font('Helvetica-Bold').text('DISCOUNT VALUE (COUPON)', 320, y);
        doc.text(`- ₹${disc.toFixed(2)}`, 480, y);
        doc.fillColor('#000000').font('Helvetica');
    }
    
    y += 15;
    doc.fontSize(10).font('Helvetica-Bold').text('GRAND TOTAL', 320, y);
    const grandTotal = order.total || (tGross + tPFee + (order.estimatedShippingCharge || 0) - disc);
    doc.text(`₹${grandTotal.toFixed(2)}`, 480, y);
}

function renderFooter(doc, order, y) {
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666').text('This is a computer generated invoice, no need for digital signature', 0, y, { align: 'center', width: 595 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Thank you for Shopping!', 0, y + 20, { align: 'center', width: 595 });
}
