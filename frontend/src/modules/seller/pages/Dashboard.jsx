import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, DollarSign, Plus, Truck, Loader, Home, AlertCircle, X, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';

import SellerOverviewTab from '@/modules/seller/components/dashboard/SellerOverviewTab';
import SellerProductsTab from '@/modules/seller/components/dashboard/SellerProductsTab';
import SellerOrdersTab from '@/modules/seller/components/dashboard/SellerOrdersTab';
import SellerProfileTab from '@/modules/seller/components/dashboard/SellerProfileTab';
import ProductViewModal from '@/modules/seller/components/dashboard/ProductViewModal';
import TrackOrderModal from '@/modules/seller/components/dashboard/TrackOrderModal';

// Helper to get current user UID (works for both Firebase and test login)
const getUserUid = () => {
    if (auth.currentUser) return auth.currentUser.uid;
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        return userData?.uid || null;
    } catch { return null; }
};

export default function SellerDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [sellerUid, setSellerUid] = useState(null);

    // Data States
    const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0, newOrders: 0, pendingOrders: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ name: '...', shopName: '' });

    // Modal States
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState(null);

    // Performance Analytics State
    const [performanceYear, setPerformanceYear] = useState('This Year');

    // Quota
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    useEffect(() => {
        const loadDashboard = async () => {
            const uid = getUserUid();
            setSellerUid(uid);
            if (!uid) { setLoading(false); return; }

            try {
                setLoading(true);
                const response = await authFetch(`/seller/${uid}/dashboard-data`);
                const data = await response.json();
                if (data.success) {
                    setProfile(data.profile);
                    setStats(data.stats);
                    setProducts(data.products);
                    setOrders(data.orders);
                    if (data.quotaExceeded) setQuotaExceeded(true);
                }
            } catch (error) {
                console.error("Error fetching seller data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setShowViewModal(true);
    };

    const handleUpdateProduct = async (payloadData) => {
        const uid = sellerUid || getUserUid();
        if (!uid) return;

        const response = await authFetch(`/products/${selectedProduct.id}`, {
            method: 'PUT',
            body: JSON.stringify({ sellerId: uid, productData: payloadData })
        });
        const data = await response.json();
        if (data.success) {
            alert("Product updated successfully!");
            setSelectedProduct({ ...payloadData });
            setProducts(products.map(p => p.id === selectedProduct.id ? { ...payloadData, id: p.id } : p));
        } else {
            alert("Failed to update: " + data.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const response = await authFetch(`/seller/product/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) setProducts(products.filter(p => p.id !== id));
            else alert("Failed to delete product");
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const handleDownloadLabel = async (orderId, awbNumber, existingLabelUrl) => {
        if (!awbNumber) { alert("AWB is not generated yet for this order."); return; }
        if (existingLabelUrl) { window.open(existingLabelUrl, '_blank'); return; }
        try {
            setLoading(true);
            const response = await authFetch(`/orders/${orderId}/label`);
            const data = await response.json();
            if (data.success && data.labelUrl) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, labelUrl: data.labelUrl } : o));
                window.open(data.labelUrl, '_blank');
            } else { alert(data.message || "Failed to fetch shipping label"); }
        } catch (error) {
            console.error("Error downloading label:", error);
            alert("Error trying to download shipping label.");
        } finally { setLoading(false); }
    };

    const statCards = [
        { label: 'Total Sales', value: `₹${stats?.totalSales?.toLocaleString() || 0}`, icon: <DollarSign />, color: 'var(--success)' },
        { label: 'Active Products', value: stats?.totalProducts || 0, icon: <Package />, color: 'var(--primary)' },
        { label: 'New Orders', value: stats?.newOrders || 0, icon: <ShoppingBag />, color: 'var(--secondary)' },
        { label: 'Pending', value: stats?.pendingOrders || 0, icon: <Truck />, color: 'var(--warning)' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4" style={{ background: 'var(--background)' }}>
                <Loader className="animate-spin" size={40} color="var(--primary)" />
                <p style={{ fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>Initializing your dashboard...</p>
            </div>
        );
    }

    if (profile?.status === 'PENDING') {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-6 p-8 text-center" style={{ background: 'var(--background)' }}>
                <div style={{ padding: '2rem', background: 'var(--warning)15', borderRadius: '50%', color: 'var(--warning)' }}><Truck size={64} /></div>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Application Pending</h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>
                        Thanks for applying to be a seller! Your application is currently under review by our admin team.<br />You will be notified once it is approved.
                    </p>
                </div>
                <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Check Status</button>
            </div>
        );
    }

    if (profile?.status === 'REJECTED') {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-6 p-8 text-center" style={{ background: 'var(--background)' }}>
                <div style={{ padding: '2rem', background: 'var(--error)15', borderRadius: '50%', color: 'var(--error)' }}><X size={64} /></div>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#1e293b' }}>Application Rejected</h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>We're sorry, but your seller application was not approved at this time.</p>
                </div>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return to Home</Link>
            </div>
        );
    }

    return (
        <div className="flex" style={{ minHeight: '100vh', width: '100%' }}>
            {/* Sidebar — Dark Obsidian */}
            <aside style={{
                width: '280px', minHeight: '100vh',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0, flexShrink: 0
            }}>
                <div>
                    <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <LayoutDashboard size={22} />
                        </div>
                        <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
                            SELLER CENTER
                        </h3>
                    </div>

                    <nav className="flex flex-col gap-3">
                        <Link to="/" className="btn" style={{
                            width: '100%', justifyContent: 'flex-start', padding: '1rem', fontSize: '0.95rem',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)',
                            border: 'none', borderRadius: '12px'
                        }}>
                            <Home size={18} /> Storefront
                        </Link>
                        {['overview', 'products', 'orders', 'personal'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '1rem', fontSize: '0.95rem', borderRadius: '12px', textTransform: 'capitalize',
                                transition: 'all 0.2s ease',
                                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.7)',
                                fontWeight: activeTab === tab ? 600 : 400, border: 'none', cursor: 'pointer'
                            }}>
                                {tab === 'overview' && <LayoutDashboard size={18} />}
                                {tab === 'products' && <Package size={18} />}
                                {tab === 'orders' && <ShoppingBag size={18} />}
                                {tab === 'personal' && <User size={18} />}
                                {tab === 'personal' ? 'Personal Details' : tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col" style={{ padding: '2.5rem 3rem', background: '#f8fafc', gap: '2rem', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>

                {quotaExceeded && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: '#fff3cd', color: '#856404', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #ffeeba', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                        <AlertCircle size={20} />
                        <div><strong>Cloud Database Quota Exceeded.</strong> You are currently seeing limited/cached demo data. Real-time updates may be restricted until the quota resets.</div>
                    </motion.div>
                )}

                <div className="flex justify-between items-center">
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>Dashboard</h2>
                        <p style={{ color: '#64748b' }}>Welcome back, <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{profile.name}</span></p>
                    </div>
                    <button className="btn btn-primary shadow-lg hover:shadow-xl transition-all" onClick={() => navigate('/seller/add-product')} style={{ padding: '0.75rem 1.5rem', borderRadius: '50px' }}>
                        <Plus size={20} /> New Product
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <SellerOverviewTab statCards={statCards} orders={orders} performanceYear={performanceYear} setPerformanceYear={setPerformanceYear} />
                )}
                {activeTab === 'products' && (
                    <SellerProductsTab products={products} onViewProduct={handleViewProduct} onDeleteProduct={handleDeleteProduct} />
                )}
                {activeTab === 'orders' && (
                    <SellerOrdersTab orders={orders} onTrackOrder={(o) => { setTrackingOrder(o); setShowTrackModal(true); }} />
                )}
                {activeTab === 'personal' && (
                    <SellerProfileTab profile={profile} />
                )}
            </div>

            {/* Product View/Edit Modal */}
            <ProductViewModal
                show={showViewModal}
                selectedProduct={selectedProduct}
                onClose={() => { setShowViewModal(false); setSelectedProduct(null); }}
                onUpdateProduct={handleUpdateProduct}
                products={products}
                setProducts={setProducts}
                setSelectedProduct={setSelectedProduct}
            />

            {/* Track Order Modal */}
            <TrackOrderModal
                show={showTrackModal}
                trackingOrder={trackingOrder}
                onClose={() => setShowTrackModal(false)}
                onDownloadLabel={handleDownloadLabel}
            />
        </div>
    );
}
