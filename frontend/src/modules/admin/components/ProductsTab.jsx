import { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, Bell, RotateCcw } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

const thStyle = {
    padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.85rem',
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.05em', background: 'var(--surface)'
};

const tdStyle = { padding: '1.25rem 1.5rem' };

const tableWrap = {
    padding: 0, overflowX: 'auto', overflowY: 'scroll',
    maxHeight: '400px', border: '1px solid var(--border)'
};

const divider = { height: '1px', background: 'var(--border)' };

export default function ProductsTab({ products, fetchAllData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductDate, setSelectedProductDate] = useState('');

    const [inactiveProducts, setInactiveProducts] = useState([]);
    const [inactiveLoading, setInactiveLoading] = useState(false);

    const [outOfStockProducts, setOutOfStockProducts] = useState([]);
    const [outOfStockLoading, setOutOfStockLoading] = useState(false);
    const [notifyingId, setNotifyingId] = useState(null);
    const [notifyingAll, setNotifyingAll] = useState(false);

    const [removedProducts, setRemovedProducts] = useState([]);
    const [removedLoading, setRemovedLoading] = useState(false);
    const [removedSearch, setRemovedSearch] = useState('');
    const [removedDate, setRemovedDate] = useState('');
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        fetchInactiveProducts();
        fetchOutOfStockProducts();
        fetchRemovedProducts();
    }, []);

    const fetchInactiveProducts = async () => {
        setInactiveLoading(true);
        try {
            const res = await authFetch('/admin/products/inactive');
            const data = await res.json();
            if (data.success) setInactiveProducts(data.products || []);
        } catch (err) { console.error('[InactiveProducts]', err); }
        finally { setInactiveLoading(false); }
    };

    const fetchOutOfStockProducts = async () => {
        setOutOfStockLoading(true);
        try {
            const res = await authFetch('/admin/products/out-of-stock');
            const data = await res.json();
            if (data.success) setOutOfStockProducts(data.products || []);
        } catch (err) { console.error('[OutOfStock]', err); }
        finally { setOutOfStockLoading(false); }
    };

    const fetchRemovedProducts = async () => {
        setRemovedLoading(true);
        try {
            const res = await authFetch('/admin/products/admin-removed');
            const data = await res.json();
            if (data.success) setRemovedProducts(data.products || []);
        } catch (err) { console.error('[RemovedProducts]', err); }
        finally { setRemovedLoading(false); }
    };

    // ── Product Review: Remove product ──
    const handleAdminRemove = async (id, name) => {
        if (!confirm(`Remove "${name}" from the website? It will move to Removed Products.`)) return;
        setRemovingId(id);
        try {
            const res = await authFetch(`/admin/product/${id}/admin-remove`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                fetchAllData();
                fetchRemovedProducts();
            } else { alert('❌ Failed: ' + data.message); }
        } catch (err) { alert('❌ Error: ' + err.message); }
        finally { setRemovingId(null); }
    };

    // ── Inactive Products ──
    const handleDeleteInactive = async (id, name) => {
        if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        try {
            const res = await authFetch(`/admin/product/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { setInactiveProducts(prev => prev.filter(p => p.id !== id)); fetchAllData(); }
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
    };

    const handleClearAllInactive = async () => {
        if (inactiveProducts.length === 0) { alert('No inactive products to clear.'); return; }
        if (!confirm(`⚠️ Permanently delete ALL ${inactiveProducts.length} inactive products? Cannot be undone.`)) return;
        try {
            const res = await authFetch('/admin/products/inactive/all', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { alert(`✅ Deleted ${data.deleted} inactive products.`); setInactiveProducts([]); fetchAllData(); }
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
    };

    // ── Out of Stock ──
    const handleNotifySeller = async (id, name) => {
        setNotifyingId(id);
        try {
            const res = await authFetch(`/admin/product/${id}/notify-out-of-stock`, { method: 'POST' });
            const data = await res.json();
            if (data.success) { setOutOfStockProducts(prev => prev.filter(p => p.id !== id)); alert(`✅ Seller notified for "${name}"`); }
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
        finally { setNotifyingId(null); }
    };

    const handleNotifyAll = async () => {
        if (outOfStockProducts.length === 0) { alert('No out-of-stock products to notify.'); return; }
        if (!confirm(`Notify all sellers for ${outOfStockProducts.length} out-of-stock product(s)?`)) return;
        setNotifyingAll(true);
        try {
            const res = await authFetch('/admin/products/notify-all-out-of-stock', { method: 'POST' });
            const data = await res.json();
            if (data.success) { alert(`✅ ${data.message}`); setOutOfStockProducts([]); }
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
        finally { setNotifyingAll(false); }
    };

    // ── Removed Products ──
    const handleRestoreProduct = async (id, name) => {
        if (!confirm(`Restore "${name}"? It will reappear on the website and in Product Review.`)) return;
        try {
            const res = await authFetch(`/admin/product/${id}/restore`, { method: 'POST' });
            const data = await res.json();
            if (data.success) { setRemovedProducts(prev => prev.filter(p => p.id !== id)); fetchAllData(); }
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
    };

    const handleDeleteRemoved = async (id, name) => {
        if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        try {
            const res = await authFetch(`/admin/product/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setRemovedProducts(prev => prev.filter(p => p.id !== id));
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
    };

    const handleDeleteAllRemoved = async () => {
        if (removedProducts.length === 0) { alert('No removed products to delete.'); return; }
        if (!confirm(`⚠️ Permanently delete ALL ${removedProducts.length} removed products? Cannot be undone.`)) return;
        try {
            const res = await authFetch('/admin/products/admin-removed/all', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { alert(`✅ Deleted ${data.deleted} removed products.`); setRemovedProducts([]); }
            else alert('❌ Failed: ' + data.message);
        } catch (err) { alert('❌ Error: ' + err.message); }
    };

    // ── Helpers ──
    const toDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const filteredProductsList = products.filter(p => {
        const name = (p.name || p.title || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || cat.includes(searchTerm.toLowerCase());
        const matchDate = !selectedProductDate || p.date === toDisplayDate(selectedProductDate);
        return matchSearch && matchDate;
    });

    const filteredRemoved = removedProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const matchSearch = !removedSearch || name.includes(removedSearch.toLowerCase()) || cat.includes(removedSearch.toLowerCase());
        const matchDate = !removedDate || p.removedOn === toDisplayDate(removedDate);
        return matchSearch && matchDate;
    });

    return (
        <div className="animate-fade-in flex flex-col gap-8">

            {/* ── Product Review Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Total Products ({filteredProductsList.length})</h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search products..." value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '200px' }} />
                        <input type="date" value={selectedProductDate}
                            onChange={e => setSelectedProductDate(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedProductDate(''); }}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Clear</button>
                        <button className="btn btn-secondary" onClick={fetchAllData}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Refresh</button>
                    </div>
                </div>
                <div className="glass-card" style={{ ...tableWrap, maxHeight: '600px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller', 'Category', 'Date', 'Price', 'Discounted Price', 'Status', 'Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProductsList.length === 0 ? (
                                <tr><td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {searchTerm || selectedProductDate ? 'No products match your search.' : 'No products found.'}
                                </td></tr>
                            ) : filteredProductsList.map(p => {
                                const productName = p.name || p.title || 'Unnamed Product';
                                const hasDiscount = p.discountedPrice && p.discountedPrice < p.price;
                                const stockVal = p.stock ?? p.quantity ?? null;
                                const isInactive = p.status && p.status.toLowerCase() !== 'active';
                                const isOutOfStock = !isInactive && stockVal !== null && Number(stockVal) <= 0;
                                let displayStatus, statusBg, statusColor;
                                if (isInactive) { displayStatus = 'Inactive'; statusBg = '#fef2f2'; statusColor = '#dc2626'; }
                                else if (isOutOfStock) { displayStatus = 'Out of Stock'; statusBg = '#fffbeb'; statusColor = '#d97706'; }
                                else { displayStatus = 'Active'; statusBg = '#f0fdf4'; statusColor = '#16a34a'; }
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>{productName}</span></td>
                                        <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.sellerName || 'Unknown Seller'}</span></td>
                                        <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.category}</span></td>
                                        <td style={tdStyle}><span className="text-muted" style={{ fontSize: '0.85rem' }}>{p.date}</span></td>
                                        <td style={tdStyle}><span style={{ fontWeight: 700 }}>₹{p.price}</span></td>
                                        <td style={tdStyle}>
                                            {hasDiscount ? <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{p.discountedPrice}</span> : <span className="text-muted">-</span>}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ background: statusBg, color: statusColor, padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{displayStatus}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button className="btn btn-secondary"
                                                onClick={() => handleAdminRemove(p.id, productName)}
                                                disabled={removingId === p.id}
                                                style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', borderColor: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                <X size={13} /> {removingId === p.id ? 'Removing...' : 'Remove'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={divider} />

            {/* ── Inactive Products Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Inactive Products ({inactiveProducts.length})</h3>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={fetchInactiveProducts} disabled={inactiveLoading}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} className={inactiveLoading ? 'animate-spin' : ''} />
                            {inactiveLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        <button className="btn btn-secondary" onClick={handleClearAllInactive} disabled={inactiveProducts.length === 0}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: '#dc2626' }}>
                            <Trash2 size={14} /> Clear All
                        </button>
                    </div>
                </div>
                <div className="glass-card" style={tableWrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller', 'Category', 'Price', 'Removed On', 'Status', 'Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {inactiveLoading ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inactive products...</td></tr>
                            ) : inactiveProducts.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No inactive products found.</td></tr>
                            ) : inactiveProducts.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.sellerName || 'Unknown Seller'}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.category}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: 700 }}>₹{p.price}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.removalDate}</span></td>
                                    <td style={tdStyle}><span style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>Inactive</span></td>
                                    <td style={tdStyle}>
                                        <button className="btn btn-secondary" onClick={() => handleDeleteInactive(p.id, p.name)}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', borderColor: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <X size={13} /> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={divider} />

            {/* ── Out of Stock Products Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Out of Stock Products ({outOfStockProducts.length})</h3>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={fetchOutOfStockProducts} disabled={outOfStockLoading}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} className={outOfStockLoading ? 'animate-spin' : ''} />
                            {outOfStockLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        <button className="btn btn-secondary" onClick={handleNotifyAll} disabled={notifyingAll || outOfStockProducts.length === 0}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', borderColor: '#d97706' }}>
                            <Bell size={14} /> {notifyingAll ? 'Notifying...' : 'Notify All'}
                        </button>
                    </div>
                </div>
                <div className="glass-card" style={tableWrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller', 'Category', 'Price', 'Stock', 'Status', 'Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {outOfStockLoading ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading out-of-stock products...</td></tr>
                            ) : outOfStockProducts.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No out-of-stock products.</td></tr>
                            ) : outOfStockProducts.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.sellerName || 'Unknown Seller'}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.category}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: 700 }}>₹{p.price}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: 700, color: '#dc2626' }}>0</span></td>
                                    <td style={tdStyle}><span style={{ background: '#fffbeb', color: '#d97706', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Out of Stock</span></td>
                                    <td style={tdStyle}>
                                        <button className="btn btn-secondary" onClick={() => handleNotifySeller(p.id, p.name)} disabled={notifyingId === p.id}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#d97706', borderColor: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Bell size={13} /> {notifyingId === p.id ? 'Sending...' : 'Notify Seller'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={divider} />

            {/* ── Removed Products Section ── */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Removed Products ({filteredRemoved.length})</h3>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search removed..." value={removedSearch}
                            onChange={e => setRemovedSearch(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '180px' }} />
                        <input type="date" value={removedDate}
                            onChange={e => setRemovedDate(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        <button className="btn btn-secondary" onClick={() => { setRemovedSearch(''); setRemovedDate(''); }}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Clear</button>
                        <button className="btn btn-secondary" onClick={fetchRemovedProducts} disabled={removedLoading}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} className={removedLoading ? 'animate-spin' : ''} />
                            {removedLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        <button className="btn btn-secondary" onClick={handleDeleteAllRemoved} disabled={removedProducts.length === 0}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: '#dc2626' }}>
                            <Trash2 size={14} /> Delete All
                        </button>
                    </div>
                </div>
                <div className="glass-card" style={tableWrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller', 'Category', 'Price', 'Removed On', 'Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {removedLoading ? (
                                <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading removed products...</td></tr>
                            ) : filteredRemoved.length === 0 ? (
                                <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {removedSearch || removedDate ? 'No removed products match your search.' : 'No removed products. Products removed by admin will appear here.'}
                                </td></tr>
                            ) : filteredRemoved.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.sellerName || 'Unknown Seller'}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.9rem' }}>{p.category}</span></td>
                                    <td style={tdStyle}><span style={{ fontWeight: 700 }}>₹{p.price}</span></td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.removedOn}</span></td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-secondary" onClick={() => handleRestoreProduct(p.id, p.name)}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <RotateCcw size={13} /> Accept
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => handleDeleteRemoved(p.id, p.name)}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', borderColor: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
