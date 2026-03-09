import { useState, useEffect } from 'react';
import { ShieldCheck, Users, Box, Truck, AlertOctagon, Loader, Home, Mail, DollarSign, FileText } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import SellerAnalyticsModal from '@/modules/admin/components/SellerAnalyticsModal';
import SellerInvoiceModal from '@/modules/admin/components/SellerInvoiceModal';
import OverviewTab from '@/modules/admin/components/OverviewTab';
import SellersTab from '@/modules/admin/components/SellersTab';
import ProductsTab from '@/modules/admin/components/ProductsTab';
import OrdersTab from '@/modules/admin/components/OrdersTab';
import ReviewsTab from '@/modules/admin/components/ReviewsTab';
import PayoutsTab from '@/modules/admin/components/PayoutsTab';
import InvoicesTab from '@/modules/admin/components/InvoicesTab';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data states
    const [stats, setStats] = useState({
        totalSellers: 0, totalProducts: 0, todayOrders: 0,
        pendingApprovals: 0, totalFeedback: 0, ordersToDeliver: 0, allSellers: 0
    });
    const [sellers, setSellers] = useState([]);
    const [allSellers, setAllSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [selectedAnalyticsSeller, setSelectedAnalyticsSeller] = useState(null);
    const [selectedInvoiceSeller, setSelectedInvoiceSeller] = useState(null);
    const [invoiceFilterDateFrom, setInvoiceFilterDateFrom] = useState('');
    const [invoiceFilterDateTo, setInvoiceFilterDateTo] = useState('');
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductDate, setSelectedProductDate] = useState('');

    // Track which tabs have already been loaded
    const [loadedTabs, setLoadedTabs] = useState(new Set());

    // Fetch only stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    // Lazy-load tab data when active tab changes
    useEffect(() => {
        if (activeTab === 'home') return;
        if (!loadedTabs.has(activeTab)) {
            fetchTabData(activeTab);
        }
    }, [activeTab]);

    const safeFetch = (path, opts = {}, timeoutMs = 15000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return authFetch(path, { ...opts, signal: controller.signal })
            .then(r => { clearTimeout(timer); return r; })
            .catch(e => { clearTimeout(timer); throw e; });
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await safeFetch('/admin/stats');
            if (res.ok) {
                const d = await res.json();
                if (d.success) {
                    setStats(prev => ({
                        ...prev, ...d.stats,
                        allSellers: d.stats.totalSellers,
                        ordersToDeliver: d.stats.ordersToDeliver || prev.ordersToDeliver
                    }));
                }
            } else {
                const d = await res.json().catch(() => ({}));
                console.warn('[fetchStats] non-ok response:', res.status, d.message);
                if (res.status === 401 || res.status === 403) {
                    setError(d.message || 'Access denied. Please login again as admin.');
                }
            }
        } catch (err) {
            console.warn('[fetchStats] failed:', err.message);
            setError('Failed to connect to server. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async (tab, force = false) => {
        if (!force && loadedTabs.has(tab)) return;
        setLoading(true);
        setError('');
        try {
            if (tab === 'sellers') {
                const [sellersRes, allSellersRes] = await Promise.allSettled([
                    safeFetch('/admin/sellers'),
                    safeFetch('/admin/all-sellers'),
                ]);
                if (sellersRes.status === 'fulfilled' && sellersRes.value.ok) {
                    const d = await sellersRes.value.json();
                    if (d.success) setSellers(d.sellers);
                }
                if (allSellersRes.status === 'fulfilled' && allSellersRes.value.ok) {
                    const d = await allSellersRes.value.json();
                    if (d.success) {
                        setAllSellers(d.sellers);
                        if (selectedInvoiceSeller) {
                            const updated = d.sellers.find(s => s.uid === selectedInvoiceSeller.uid);
                            if (updated) setSelectedInvoiceSeller(updated);
                        }
                    }
                }
            } else if (tab === 'products') {
                const res = await safeFetch('/admin/products');
                if (res.ok) { const d = await res.json(); if (d.success) setProducts(d.products); }
            } else if (tab === 'orders') {
                const res = await safeFetch('/admin/orders');
                if (res.ok) {
                    const d = await res.json();
                    if (d.success) {
                        setOrders(d.orders);
                        const toDeliver = d.orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
                        setStats(prev => ({ ...prev, ordersToDeliver: toDeliver }));
                    }
                }
            } else if (tab === 'feedback') {
                const res = await safeFetch('/admin/reviews');
                if (res.ok) {
                    const d = await res.json();
                    if (d.success) {
                        setReviews(d.reviews);
                        setStats(prev => ({ ...prev, totalFeedback: d.reviews.length }));
                    }
                }
            } else if (tab === 'payouts' || tab === 'payout' || tab === 'invoice' || tab === 'invoices') {
                const res = await safeFetch('/admin/seller-analytics');
                if (res.ok) {
                    const d = await res.json();
                    if (d.success && d.analytics) {
                        setAnalytics(d.analytics);
                        if (selectedAnalyticsSeller) {
                            const updated = d.analytics.find(s => s.uid === selectedAnalyticsSeller.uid);
                            if (updated) setSelectedAnalyticsSeller(updated);
                        }
                    }
                }
            }
            setLoadedTabs(prev => new Set([...prev, tab]));
        } catch (err) {
            console.error(`[fetchTabData:${tab}] error:`, err);
            setError('Failed to load data. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        await Promise.all([
            fetchStats(),
            activeTab !== 'home' ? fetchTabData(activeTab, true) : Promise.resolve()
        ]);
    };

    const handleDownloadPDF = async (url, filename) => {
        setIsDownloadingPDF(true);
        try {
            const response = await authFetch(url);
            if (!response.ok) { const text = await response.text(); throw new Error(text || 'Failed to download PDF'); }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl; link.download = filename;
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF: ' + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    if (error) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--error)', marginBottom: '1rem', background: 'rgba(var(--error-rgb), 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    <AlertOctagon size={48} style={{ margin: '0 auto 1rem' }} />
                    <p>{error}</p>
                </div>
                <button className="btn btn-primary" onClick={fetchAllData}>Retry Connection</button>
            </div>
        );
    }

    const tabs = [
        { key: 'home', label: 'Home', icon: <Home size={20} /> },
        { key: 'sellers', label: 'Seller Mgmt', icon: <Users size={20} /> },
        { key: 'products', label: 'Product Review', icon: <Box size={20} /> },
        { key: 'orders', label: 'Global Orders', icon: <Truck size={20} /> },
        { key: 'feedback', label: 'Customer Feedback', icon: <Mail size={20} /> },
        { key: 'payout', label: 'Payout', icon: <DollarSign size={20} /> },
        { key: 'invoice', label: 'Seller Invoice', icon: <FileText size={20} /> },
    ];

    return (
        <div className="flex" style={{ minHeight: 'calc(100vh - 80px)', width: '100%', gap: '2rem', padding: '2rem' }}>
            {selectedAnalyticsSeller ? (
                <SellerAnalyticsModal
                    seller={selectedAnalyticsSeller}
                    onClose={() => setSelectedAnalyticsSeller(null)}
                    onDownloadPDF={handleDownloadPDF}
                    isDownloading={isDownloadingPDF}
                    onRefresh={fetchAllData}
                />
            ) : selectedInvoiceSeller ? (
                <SellerInvoiceModal
                    seller={selectedInvoiceSeller}
                    onClose={() => setSelectedInvoiceSeller(null)}
                    onDownloadPDF={handleDownloadPDF}
                    isDownloading={isDownloadingPDF}
                    onRefresh={fetchAllData}
                    invoiceFilterDateFrom={invoiceFilterDateFrom}
                    setInvoiceFilterDateFrom={setInvoiceFilterDateFrom}
                    invoiceFilterDateTo={invoiceFilterDateTo}
                    setInvoiceFilterDateTo={setInvoiceFilterDateTo}
                />
            ) : (
                <>
                    {/* Sidebar */}
                    <aside className="glass-card flex flex-col justify-between" style={{ width: '280px', height: 'calc(100vh - 120px)', padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                        <div>
                            <div className="flex items-center gap-2" style={{ marginBottom: '2rem', color: 'var(--primary)', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <ShieldCheck size={28} />
                                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Admin Panel</h3>
                            </div>
                            <nav className="flex flex-col gap-2">
                                {tabs.map(t => (
                                    <button
                                        key={t.key}
                                        className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem', fontSize: '1rem' }}
                                        onClick={() => { setActiveTab(t.key); setSearchTerm(''); }}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                            <small className="text-muted">System Status</small>
                            <div className="flex items-center gap-2" style={{ marginTop: '0.5rem', color: 'var(--success)', fontSize: '0.9rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                Online
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col" style={{ height: '100%', gap: '2rem' }}>
                        {loading ? (
                            <div className="flex justify-center p-12 glass-card flex-1"><Loader className="animate-spin" /></div>
                        ) : (
                            <div className="glass-card flex-1" style={{ padding: activeTab === 'home' ? '2rem' : '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ padding: activeTab === 'home' ? '0' : '1.5rem', borderBottom: activeTab === 'home' ? 'none' : '1px solid var(--border)' }}>
                                    {activeTab === 'home' && <OverviewTab stats={stats} loading={loading} setActiveTab={setActiveTab} setSearchTerm={setSearchTerm} setSelectedProductDate={setSelectedProductDate} />}
                                    {activeTab === 'sellers' && <SellersTab sellers={sellers} allSellers={allSellers} orders={orders} loading={loading} fetchAllData={fetchAllData} />}
                                    {activeTab === 'products' && <ProductsTab products={products} fetchAllData={fetchAllData} />}
                                    {activeTab === 'orders' && <OrdersTab orders={orders} fetchAllData={fetchAllData} />}
                                    {activeTab === 'feedback' && <ReviewsTab reviews={reviews} fetchAllData={fetchAllData} />}
                                    {activeTab === 'payout' && <PayoutsTab analytics={analytics} setSelectedAnalyticsSeller={setSelectedAnalyticsSeller} fetchAllData={fetchAllData} />}
                                    {activeTab === 'invoice' && <InvoicesTab allSellers={allSellers} setSelectedInvoiceSeller={setSelectedInvoiceSeller} fetchAllData={fetchAllData} />}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
