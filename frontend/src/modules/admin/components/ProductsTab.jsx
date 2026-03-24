import { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, Bell } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

const thStyle = {
    padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.85rem',
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.05em', background: 'var(--surface)'
};

export default function ProductsTab({ products, fetchAllData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductDate, setSelectedProductDate] = useState('');
    const [inactiveProducts, setInactiveProducts] = useState([]);
    const [inactiveLoading, setInactiveLoading] = useState(false);
    const [outOfStockProducts, setOutOfStockProducts] = useState([]);
    const [outOfStockLoading, setOutOfStockLoading] = useState(false);
    const [notifyingId, setNotifyingId] = useState(null);
    const [notifyingAll, setNotifyingAll] = useState(false);

    useEffect(() => {
        fetchInactiveProducts();
        fetchOutOfStockProducts();
    }, []);

    const fetchInactiveProducts = async () => {
        setInactiveLoading(true);
        try {
            const res = await authFetch('/admin/products/inactive');
            const data = await res.json();
            if (data.success) setInactiveProducts(data.products || []);
        } catch (err) {
            console.error('[InactiveProducts] fetch error:', err);
        } finally {
            setInactiveLoading(false);
        }
    };

    const fetchOutOfStockProducts = async () => {
        setOutOfStockLoading(true);
        try {
            const res = await authFetch('/admin/products/out-of-stock');
            const data = await res.json();
            if (data.success) setOutOfStockProducts(data.products || []);
        } catch (err) {
            console.error('[OutOfStockProducts] fetch error:', err);
        } finally {
            setOutOfStockLoading(false);
        }
    };

    const handleNotifySeller = async (id, name) => {
        setNotifyingId(id);
        try {
            const res = await authFetch(`/admin/product/${id}/notify-out-of-stock`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setOutOfStockProducts(prev => prev.filter(p => p.id !== id));
                alert(`✅ Seller notified for "${name}"`);
            } else {
                alert('❌ Failed: ' + data.message);
            }
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            setNotifyingId(null);
        }
    };

    const handleNotifyAll = async () => {
        if (outOfStockProducts.length === 0) { alert('No out-of-stock products to notify.'); return; }
        if (!confirm(`Notify all sellers for ${outOfStockProducts.length} out-of-stock product(s)?`)) return;
        setNotifyingAll(true);
        try {
            const res = await authFetch('/admin/products/notify-all-out-of-stock', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message}`);
                setOutOfStockProducts([]);
            } else {
                alert('❌ Failed: ' + data.message);
            }
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            setNotifyingAll(false);
        }
    };

    const handleDeleteProduct = async (id, name) => {
        if (!confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return;
        try {
            const res = await authFetch(`/admin/product/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setInactiveProducts(prev => prev.filter(p => p.id !== id));
                fetchAllData();
            } else {
                alert('❌ Failed to delete: ' + data.message);
            }
        } catch (err) {
            alert('❌ Error deleting product: ' + err.message);
        }
    };

    const handleClearAll = async () => {
        if (inactiveProducts.length === 0) { alert('No inactive products to clear.'); return; }
        if (!confirm(`⚠️ This will permanently delete ALL ${inactiveProducts.length} inactive products from the database. This cannot be undone.\n\nContinue?`)) return;
        try {
            const res = await authFetch('/admin/products/inactive/all', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Deleted ${data.deleted} inactive products.`);
                setInactiveProducts([]);
                fetchAllData();
            } else {
                alert('❌ Failed: ' + data.message);
            }
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    const filteredProductsList = products.filter(p => {
        const productName = p.name || p.title || '';
        const productCategory = p.category || '';
        const matchesSearch = searchTerm === '' ||
            productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productCategory.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = selectedProductDate === '' || (p.date === (() => {
            const date = new Date(selectedProductDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        })());
        return matchesSearch && matchesDate;
    });

    return (
        <div className="animate-fade-in flex flex-col gap-8">

            {/* ── Product Review Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Product Review ({filteredProductsList.length})</h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search products..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '200px' }} />
                        <input type="date" value={selectedProductDate}
                            onChange={(e) => setSelectedProductDate(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedProductDate(''); }}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Clear</button>
                        <button className="btn btn-secondary" onClick={fetchAllData}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Refresh</button>
                    </div>
                </div>
                {filteredProductsList.length === 0 ? (
                    <div className="glass-card text-center p-8 text-muted">
                        {searchTerm || selectedProductDate ? 'No products found matching your search criteria.' : 'No products found.'}
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: 0, overflowX: 'auto', overflowY: 'scroll', maxHeight: '600px', border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    {['Product', 'Seller', 'Category', 'Date', 'Price', 'Discounted Price', 'Status'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProductsList.map(p => {
                                    const productName = p.name || p.title || 'Unnamed Product';
                                    const hasDiscount = p.discountedPrice && p.discountedPrice < p.price;
                                    const stockVal = p.stock ?? p.quantity ?? null;
                                    const isInactive = p.status && p.status.toLowerCase() !== 'active';
                                    const isOutOfStock = !isInactive && stockVal !== null && Number(stockVal) <= 0;
                                    let displayStatus, statusBg, statusColor;
                                    if (isInactive) {
                                        displayStatus = 'Inactive'; statusBg = '#fef2f2'; statusColor = '#dc2626';
                                    } else if (isOutOfStock) {
                                        displayStatus = 'Out of Stock'; statusBg = '#fffbeb'; statusColor = '#d97706';
                                    } else {
                                        displayStatus = 'Active'; statusBg = '#f0fdf4'; statusColor = '#16a34a';
                                    }
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontWeight: 600, fontSize: '1rem' }}>{productName}</span></td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontSize: '0.9rem' }}>{p.seller || p.sellerId || 'Unknown'}</span></td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontSize: '0.9rem' }}>{p.category}</span></td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}><span className="text-muted" style={{ fontSize: '0.85rem' }}>{p.date}</span></td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontWeight: 700, fontSize: '1rem' }}>₹{p.price}</span></td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                {hasDiscount ? <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1rem' }}>₹{p.discountedPrice}</span> : <span className="text-muted">-</span>}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ background: statusBg, color: statusColor, padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{displayStatus}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            {/* ── Inactive Products Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        Inactive Products ({inactiveProducts.length})
                    </h3>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={fetchInactiveProducts}
                            disabled={inactiveLoading}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} className={inactiveLoading ? 'animate-spin' : ''} />
                            {inactiveLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleClearAll}
                            disabled={inactiveProducts.length === 0}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: '#dc2626' }}>
                            <Trash2 size={14} /> Clear All
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 0, overflowX: 'auto', overflowY: 'scroll', maxHeight: '400px', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller ID', 'Category', 'Price', 'Removed On', 'Status', 'Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {inactiveLoading ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inactive products...</td></tr>
                            ) : inactiveProducts.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inactive products found. Products removed by sellers will appear here.</td></tr>
                            ) : (
                                inactiveProducts.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.sellerId?.substring(0, 12)}...</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{p.category}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontWeight: 700 }}>₹{p.price}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.removalDate}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>Inactive</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <button className="btn btn-secondary"
                                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', borderColor: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <X size={13} /> Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style={{ height: '1px', background: 'var(--border)' }} />

            {/* ── Out of Stock Products Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        Out of Stock Products ({outOfStockProducts.length})
                    </h3>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={fetchOutOfStockProducts}
                            disabled={outOfStockLoading}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} className={outOfStockLoading ? 'animate-spin' : ''} />
                            {outOfStockLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleNotifyAll}
                            disabled={notifyingAll || outOfStockProducts.length === 0}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', borderColor: '#d97706' }}>
                            <Bell size={14} /> {notifyingAll ? 'Notifying...' : 'Notify All'}
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 0, overflowX: 'auto', overflowY: 'scroll', maxHeight: '400px', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller ID', 'Category', 'Price', 'Stock', 'Status', 'Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {outOfStockLoading ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading out-of-stock products...</td></tr>
                            ) : outOfStockProducts.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No out-of-stock products. All active products are in stock.</td></tr>
                            ) : (
                                outOfStockProducts.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.sellerId?.substring(0, 12)}...</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{p.category}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontWeight: 700 }}>₹{p.price}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontWeight: 700, color: '#dc2626' }}>0</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ background: '#fffbeb', color: '#d97706', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Out of Stock</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <button className="btn btn-secondary"
                                                onClick={() => handleNotifySeller(p.id, p.name)}
                                                disabled={notifyingId === p.id}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#d97706', borderColor: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Bell size={13} /> {notifyingId === p.id ? 'Sending...' : 'Notify Seller'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
