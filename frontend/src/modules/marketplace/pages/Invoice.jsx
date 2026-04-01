import { ArrowLeft, Download, Mail, Phone } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/modules/shared/config/firebase';
import html2pdf from 'html2pdf.js';

export default function Invoice() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                // First, try to find by document ID
                let orderDoc = await getDoc(doc(db, 'orders', orderId));

                if (orderDoc.exists()) {
                    setOrder({ id: orderDoc.id, ...orderDoc.data() });
                } else {
                    // If not found by document ID, search by orderId field
                    const ordersRef = collection(db, 'orders');
                    const q = query(ordersRef, where('orderId', '==', orderId));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        setOrder({ id: doc.id, ...doc.data() });
                    } else {
                        setOrder(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('download') === 'true' && order) {
            // Give a small delay for contents to settle
            setTimeout(handleDownload, 1000);
        }
    }, [location, order]);



    const handleDownload = () => {
        if (!order) return;
        
        const element = document.getElementById('invoice-card');
        const opt = {
            margin: 0,
            filename: `GudKart_Invoice_${order.orderId || order.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // Use imported html2pdf instead of window.html2pdf
        html2pdf().from(element).set(opt).save();
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <h2>Invoice not found</h2>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        try {
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (error) {
            return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Action Bar - Non-printable */}
            <div className="no-print flex justify-between items-center" style={{ width: '100%', maxWidth: '850px', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(`/track?orderId=${order.orderId || order.id}`)}
                    className="btn btn-secondary flex items-center gap-2"
                    style={{ padding: '0.6rem 1.2rem' }}
                >
                    <ArrowLeft size={18} />
                    Back to Tracking
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="btn btn-primary flex items-center gap-2"
                        style={{ padding: '0.6rem 1.2rem', background: 'var(--success)', border: 'none' }}
                    >
                        <Download size={18} />
                        Download PDF
                    </button>

                </div>
            </div>

            {/* Professional Invoice Card */}
            <div id="invoice-card" className="invoice-container" style={{
                background: 'white',
                width: '100%',
                maxWidth: '850px',
                padding: '2rem',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                color: '#000',
                position: 'relative',
                fontFamily: "'Arial', 'Helvetica', sans-serif",
                fontSize: '12px',
                lineHeight: '1.5'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #000' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, letterSpacing: '0', color: '#000', textTransform: 'uppercase' }}>Bill of Supply</h1>
                        <p style={{ color: '#000', fontSize: '1rem', marginTop: '0.25rem', fontWeight: '600' }}>#{order.orderId || order.id}</p>
                    </div>
                    {/* QR Code Placeholder */}
                    <div style={{
                        width: '70px',
                        height: '70px',
                        background: '#f9fafb',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #000',
                        fontSize: '10px',
                        color: '#000',
                        textAlign: 'center',
                        fontWeight: '700'
                    }}>
                        QR<br/>CODE
                    </div>
                </div>

                {/* Bill of Supply Details and Info Grid */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #000' }}>
                    {/* Bill of Supply Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem', fontSize: '11px' }}>
                        <div>
                            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#000', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Bill of Supply Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div><span style={{ fontWeight: '700', color: '#000' }}>Bill of Supply Number:</span> <span style={{ color: '#000' }}>{order.orderId || order.id}</span></div>
                                <div><span style={{ fontWeight: '700', color: '#000' }}>Bill of Supply Date:</span> <span style={{ color: '#000' }}>{formatDate(order.createdAt)}</span></div>
                                <div><span style={{ fontWeight: '700', color: '#000' }}>Order Number:</span> <span style={{ color: '#000' }}>{order.orderId || order.id}</span></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1.5rem' }}>
                                <div><span style={{ fontWeight: '700', color: '#000' }}>Nature of transaction:</span> <span style={{ color: '#000' }}>INTRA</span></div>
                                <div><span style={{ fontWeight: '700', color: '#000' }}>Nature Of Supply:</span> <span style={{ color: '#000' }}>Service</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Billed From and Billed To */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem', fontSize: '11px' }}>
                        <div>
                            <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Billed From</label>
                            <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '0.2rem', color: '#000' }}>GudKart Private Limited</p>
                            <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                                No. 123, MG Road, Koramangala<br />
                                Bangalore, Karnataka, India<br />
                                Bangalore, 560034, Karnataka, IN-KA, IN- 560034<br />
                                <span style={{ fontWeight: '700', color: '#000' }}>GSTIN:</span> 29AABCS1234M1ZX<br />
                                <span style={{ fontWeight: '700', color: '#000' }}>PAN:</span> AABCS1234M
                            </p>
                        </div>
                        <div>
                            <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Billed To</label>
                            <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '0.2rem', color: '#000' }}>
                                {order.billingAddress ? `${order.billingAddress.firstName || ''} ${order.billingAddress.lastName || ''}`.trim() : order.customerName || 'Customer'}
                            </p>
                            <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                                {order.billingAddress?.addressLine || order.shippingAddress?.addressLine || order.address?.addressLine || 'N/A'}<br />
                                {order.billingAddress?.city || order.shippingAddress?.city || order.address?.city || 'N/A'}, {order.billingAddress?.state || order.shippingAddress?.state || order.address?.state || 'Karnataka'} - {order.billingAddress?.pincode || order.shippingAddress?.pincode || order.address?.pincode || 'N/A'}<br />
                                {(order.customerInfo?.gstNumber || order.gstNumber) && (
                                    <><span style={{ fontWeight: '700', color: '#000' }}>GSTIN:</span> {order.customerInfo?.gstNumber || order.gstNumber}<br /></>
                                )}
                                <span style={{ fontWeight: '700', color: '#000' }}>State:</span> {order.billingAddress?.state || order.shippingAddress?.state || order.address?.state || 'Karnataka'}<br />
                                <span style={{ fontWeight: '700', color: '#000' }}>State Code:</span> IN-KA<br />
                                <span style={{ fontWeight: '700', color: '#000' }}>Place of Supply:</span> {(order.billingAddress?.state || order.shippingAddress?.state || order.address?.state || 'KARNATAKA').toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* Shipped From and Shipped To */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #000', fontSize: '11px' }}>
                        <div>
                            <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Shipped From</label>
                            <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                                {order.sellerAddress?.addressLine || 'Survey No. 48, 486, 487, 488, 489, 490, 491, 492, 493, 494, 54,'}<br />
                                {order.sellerAddress?.city ? `${order.sellerAddress.city}, ${order.sellerAddress.state || 'Karnataka'} - ${order.sellerAddress.pincode || '580011'}` : 'Kotur Dharwad Dist., Karnataka - 580011,'}<br />
                                {order.sellerAddress?.state || 'KARNATAKA'}, IN-KA,<br />
                                India - {order.sellerAddress?.pincode || '580011'}
                            </p>
                        </div>
                        <div>
                            <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Shipped To</label>
                            <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '0.2rem', color: '#000' }}>
                                {order.shippingAddress ? `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() : order.customerName || 'Customer'}
                            </p>
                            <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                                {order.shippingAddress?.addressLine || order.address?.addressLine || 'N/A'}<br />
                                {order.shippingAddress?.city || order.address?.city || 'N/A'}, {order.shippingAddress?.state || order.address?.state || 'Karnataka'}, IN-KA,<br />
                                India - {order.shippingAddress?.pincode || order.address?.pincode || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table - GST Breakdown */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '10px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000', background: '#f9fafb' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Particulars</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>SAC</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Gross<br/>Amount</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Taxable<br/>Value</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>SGST</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>CGST</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items && order.items.map((item, index) => {
                            const itemTotal = (item.price || 0) * (item.quantity || 1);
                            const gstPercent = item.gstPercent || 0;
                            const sgst = (itemTotal * gstPercent) / 200;
                            const cgst = (itemTotal * gstPercent) / 200;
                            const totalWithGst = itemTotal + sgst + cgst;
                            
                            return (
                                <tr key={index} style={{ borderBottom: '1px solid #000' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: '500', color: '#000', border: '1px solid #000' }}>
                                        {item.name || item.title || 'Product'}
                                        <div style={{ fontSize: '9px', color: '#000', marginTop: '0.15rem' }}>
                                            CGST {(gstPercent/2).toFixed(1)}%<br/>
                                            SGST {(gstPercent/2).toFixed(1)}%
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>996511</td>
                                    <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>{(item.quantity || 1).toFixed(1)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{itemTotal.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{itemTotal.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{sgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{cgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '600', color: '#000', border: '1px solid #000' }}>₹{totalWithGst.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                        <tr style={{ borderTop: '2px solid #000', background: '#f9fafb' }}>
                            <td style={{ padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>Total</td>
                            <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>-</td>
                            <td style={{ textAlign: 'center', padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>
                                {order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0).toFixed(1)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>
                                ₹{order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>
                                ₹{order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>
                                ₹{order.items?.reduce((sum, item) => {
                                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                                    const gstPercent = item.gstPercent || 0;
                                    return sum + ((itemTotal * gstPercent) / 200);
                                }, 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>
                                ₹{order.items?.reduce((sum, item) => {
                                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                                    const gstPercent = item.gstPercent || 0;
                                    return sum + ((itemTotal * gstPercent) / 200);
                                }, 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '700', color: '#000', border: '1px solid #000' }}>
                                ₹{order.items?.reduce((sum, item) => {
                                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                                    const gstPercent = item.gstPercent || 0;
                                    const sgst = (itemTotal * gstPercent) / 200;
                                    const cgst = (itemTotal * gstPercent) / 200;
                                    return sum + itemTotal + sgst + cgst;
                                }, 0).toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer */}
                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #000', fontSize: '11px' }}>
                    {/* Payment Information */}
                    <div style={{ 
                        padding: '1rem', 
                        background: order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected' 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(245, 158, 11, 0.1)',
                        border: `1px solid ${
                            order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected'
                                ? 'rgba(16, 185, 129, 0.3)' 
                                : 'rgba(245, 158, 11, 0.3)'
                        }`,
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '10px', color: '#666', fontWeight: '600' }}>PAYMENT METHOD</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', fontWeight: '700', color: '#000', textTransform: 'uppercase' }}>
                                {order.paymentMethod || 'N/A'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '10px', color: '#666', fontWeight: '600' }}>PAYMENT STATUS</p>
                            <p style={{ 
                                margin: '0.25rem 0 0 0', 
                                fontSize: '12px', 
                                fontWeight: '700',
                                color: order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected' 
                                    ? '#059669' 
                                    : '#d97706'
                            }}>
                                {order.paymentStatus === 'Completed' 
                                    ? 'PAID ONLINE' 
                                    : order.paymentStatus === 'Collected'
                                    ? 'PAYMENT COLLECTED'
                                    : order.paymentMethod === 'COD' 
                                    ? 'PAY ON DELIVERY' 
                                    : 'PAID ONLINE'}
                            </p>
                        </div>
                    </div>
                    
                    <p style={{ fontStyle: 'italic', color: '#666666', fontSize: '10px', textAlign: 'center', marginBottom: '1rem' }}>
                        This is a computer generated invoice, no need for digital signature
                    </p>
                    
                    <p style={{ fontWeight: '700', marginBottom: '0.3rem', color: '#000' }}>Thank you for Shopping!</p>
                    <p style={{ color: '#000', fontSize: '10px', marginBottom: '1rem' }}>Please contact support if you have any questions.</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontWeight: '700', color: '#000', fontSize: '11px', margin: 0 }}>GudKart Private Limited - Empowering Local Sellers</p>
                        <div style={{ display: 'flex', gap: '1rem', color: '#000', fontSize: '10px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} /> +91 98765 43210</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} /> support@GudKart.com</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; padding: 0 !important; }
                        .container { padding: 0 !important; max-width: 100% !important; }
                        #invoice-card { 
                            box-shadow: none !important; 
                            padding: 2rem !important; 
                            width: 100% !important;
                            max-width: 100% !important;
                            border: 1px solid #eee;
                        }
                    }
                `}
            </style>
        </div>
    );
}

