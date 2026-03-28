const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const invoicesDir = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
}

// Company Details - Sellsathi Private Limited
const COMPANY_INFO = {
    name: 'Sellsathi Private Limited',
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

            // Generate QR Code
            let qrCodeDataUrl = null;
            try {
                const qrData = `Order: ${order.orderId}\nTotal: ₹${order.total}`;
                qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
            } catch (qrError) {
                console.error('QR Code generation failed:', qrError);
            }

            // Title and QR Code
            doc.fontSize(16).font('Helvetica-Bold').text('Bill of Supply', 50, 40, { align: 'center' });
            
            // Add QR Code if generated
            if (qrCodeDataUrl) {
                const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
                doc.image(qrBuffer, 490, 35, { width: 70, height: 70 });
            }

            // Horizontal line
            doc.moveTo(30, 120).lineTo(565, 120).strokeColor('#000000').lineWidth(1).stroke();

            // Bill of Supply Details Section (Left and Right columns)
            let yPos = 135;
            const leftCol = 30;
            const rightCol = 320;

            doc.fontSize(9).font('Helvetica-Bold');
            
            // Left column
            doc.text('Bill of Supply Details', leftCol, yPos);
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
            yPos = 150;
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Nature of transaction', rightCol, yPos);
            doc.font('Helvetica').text(': INTRA', rightCol + 110, yPos);
            
            yPos += 12;
            doc.font('Helvetica-Bold').text('Nature Of Supply', rightCol, yPos);
            doc.font('Helvetica').text(': Service', rightCol + 110, yPos);

            // Horizontal line
            yPos = 195;
            doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#000000').lineWidth(1).stroke();

            // Billed From and Billed To Section
            yPos += 10;
            const col1 = 30;
            const col2 = 310;

            // Billed From (Company)
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

            // Billed To (Customer - Billing Address)
            yPos = 215;
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
            
            // Add GST Number if available
            if (customerGST) {
                doc.font('Helvetica-Bold').text(`GSTIN : ${customerGST}`, col2, yPos);
                yPos += 10;
            }
            
            doc.font('Helvetica-Bold').text(`State : ${billingAddr.state || 'Karnataka'}`, col2, yPos);
            yPos += 10;
            doc.text(`State Code : IN-KA`, col2, yPos);
            yPos += 10;
            doc.text(`Place of Supply : ${(billingAddr.state || 'KARNATAKA').toUpperCase()}`, col2, yPos);

            // Shipped From and Shipped To Section
            yPos = 345; // Increased from 330 to give more space
            doc.moveTo(30, yPos).lineTo(565, yPos).strokeColor('#cccccc').lineWidth(0.5).stroke();
            yPos += 10;

            // Shipped From (Seller Address)
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

            // Shipped To (Customer - Shipping Address)
            yPos = 360; // Adjusted to match Shipped From
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
            yPos = 450; // Increased from 430 to give more space after addresses
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
                
                // Calculate GST (if applicable)
                const gstPercent = item.gstPercent || 0;
                const sgst = (itemTotal * gstPercent) / 200; // Half of GST
                const cgst = (itemTotal * gstPercent) / 200; // Half of GST
                totalSGST += sgst;
                totalCGST += cgst;

                doc.fontSize(7).font('Helvetica');
                // Product name with GST breakdown
                doc.text(item.name || item.title || 'Product', 35, yPos, { width: 140 });
                yPos += 10;
                doc.fontSize(6).text(`CGST ${(gstPercent/2).toFixed(1)} %`, 35, yPos);
                yPos += 8;
                doc.text(`SGST ${(gstPercent/2).toFixed(1)} %`, 35, yPos);
                
                yPos -= 18; // Reset for other columns
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
            
            // Computer Generated Invoice Message
            doc.fontSize(7).font('Helvetica-Oblique')
                .fillColor('#666666')
                .text('This is a computer generated invoice, no need for digital signature', 30, yPos, { align: 'center', width: 535 });
            
            yPos += 20;
            doc.fillColor('#000000'); // Reset color
            doc.fontSize(8).font('Helvetica-Bold').text('Thank you for Shopping!', 30, yPos);
            yPos += 15;
            doc.fontSize(7).font('Helvetica').text('Please contact support if you have any questions.', 30, yPos);
            
            // Company footer
            yPos += 30;
            doc.fontSize(7).font('Helvetica-Bold').text(`${COMPANY_INFO.name} - Empowering Local Sellers`, 30, yPos, { align: 'center', width: 535 });
            yPos += 12;
            doc.fontSize(6).font('Helvetica').text(`${COMPANY_INFO.addressLine1}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} - ${COMPANY_INFO.pincode}`, 30, yPos, { align: 'center', width: 535 });
            yPos += 10;
            doc.text(`GSTIN: ${COMPANY_INFO.gstin} | PAN: ${COMPANY_INFO.pan}`, 30, yPos, { align: 'center', width: 535 });

            doc.end();

            stream.on('finish', () => resolve(invoicePath));
            stream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};
