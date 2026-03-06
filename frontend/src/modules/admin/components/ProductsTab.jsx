import { useState } from 'react';

export default function ProductsTab({ products, fetchAllData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductDate, setSelectedProductDate] = useState('');

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
        <div className="animate-fade-in flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Product Review ({filteredProductsList.length})</h3>
                <div className="flex gap-2">
                    <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '200px' }} />
                    <input type="date" value={selectedProductDate} onChange={(e) => setSelectedProductDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} title="Filter by product date" />
                    <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedProductDate(''); }} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Clear</button>
                    <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Refresh</button>
                </div>
            </div>
            {filteredProductsList.length === 0 ? (
                <div className="glass-card text-center p-8 text-muted">{searchTerm || selectedProductDate ? 'No products found matching your search criteria.' : 'No products found.'}</div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: 'var(--surface)', textAlign: 'left' }}>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                {['Product', 'Seller', 'Category', 'Date', 'Price', 'Discounted Price', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProductsList.map(p => {
                                const productName = p.name || p.title || 'Unnamed Product';
                                const hasDiscount = p.discountedPrice && p.discountedPrice < p.price;
                                const isOutOfStock = p.stock === 0;
                                const displayStatus = isOutOfStock ? 'Inactive' : (p.status || 'Active');
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontWeight: 600, fontSize: '1rem' }}>{productName}</span></td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontSize: '0.9rem' }}>{p.seller || p.sellerId || 'Unknown'}</span></td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontSize: '0.9rem' }}>{p.category}</span></td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}><span className="text-muted" style={{ fontSize: '0.85rem' }}>{p.date}</span></td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontWeight: 700, fontSize: '1rem' }}>₹{p.price}</span></td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>{hasDiscount ? <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1rem' }}>₹{p.discountedPrice}</span> : <span className="text-muted">-</span>}</td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ background: displayStatus === 'Active' ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(128, 128, 128, 0.1)', color: displayStatus === 'Active' ? 'var(--success)' : '#666', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{displayStatus}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
