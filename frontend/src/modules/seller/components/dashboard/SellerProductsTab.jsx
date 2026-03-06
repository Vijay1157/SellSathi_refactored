import { Package, Eye, Trash2 } from 'lucide-react';
import { getProductPricing, formatPrice } from '@/modules/shared/utils/priceUtils';

export default function SellerProductsTab({ products, onViewProduct, onDeleteProduct }) {
    return (
        <div className="animate-fade-in flex flex-col gap-4" style={{ height: '100%' }}>
            <div className="glass-card flex-1" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <Package size={64} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                        <h3 style={{ color: '#1e293b' }}>No Products Yet</h3>
                        <p style={{ color: '#64748b' }}>Start selling by adding your first product using the button above.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#1e293b', color: 'white', textAlign: 'left' }}>
                                <tr>
                                    {['Product Details', 'Category', 'MRP', 'Selling Price', 'Stock', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => {
                                    const pricing = getProductPricing(p);
                                    return (
                                        <tr key={p.id}
                                            style={{ borderBottom: '1px solid #f1f5f9', background: 'white', transition: 'background 0.15s ease' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                        >
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {p.image ? (
                                                        <img src={p.image} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                                                    ) : (
                                                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Package size={22} style={{ color: '#94a3b8' }} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: '0.95rem', letterSpacing: '-0.2px' }}>{p.title}</p>
                                                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '6px', flexWrap: 'wrap' }}>
                                                            <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>ID: {p.id?.substring(0, 8)}</span>
                                                            {p.sizes && p.sizes.length > 0 && <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.1rem 0.55rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600 }}>{p.sizes.length} SIZES</span>}
                                                            {p.colors && p.colors.length > 0 && <span style={{ background: '#fce7f3', color: '#db2777', padding: '0.1rem 0.55rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600 }}>{p.colors.length} COLORS</span>}
                                                            {p.pricingType === 'varied' && <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.1rem 0.55rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>VARIED PRICE</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #e2e8f0' }}>{p.category}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: pricing.showDiscount ? '#94a3b8' : '#1e293b', fontSize: '0.95rem', textDecoration: pricing.showDiscount ? 'line-through' : 'none' }}>
                                                {formatPrice(pricing.strikethroughPrice)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{formatPrice(pricing.finalPrice)}</div>
                                                {pricing.showDiscount && pricing.discountTag && (
                                                    <span style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700 }}>{pricing.discountTag}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.stock > 0 ? '#22c55e' : '#ef4444' }}></div>
                                                        <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>{p.stock || 0}</span>
                                                    </div>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>REMAINING</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500 }} onClick={() => onViewProduct(p)} title="View / Edit Product">
                                                        <Eye size={14} /> View
                                                    </button>
                                                    <button style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500 }} onClick={() => onDeleteProduct(p.id)} title="Delete Product">
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
