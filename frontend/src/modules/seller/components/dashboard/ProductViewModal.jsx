import { useState } from 'react';
import { Edit2, Eye, X, Upload, Loader, Ruler, Palette, Cpu, Settings, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/modules/shared/utils/api';

export default function ProductViewModal({
    show, selectedProduct, onClose,
    onUpdateProduct, products, setProducts, setSelectedProduct
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Initialize editData when product changes
    if (selectedProduct && (!editData || editData.id !== selectedProduct.id)) {
        setEditData({
            ...selectedProduct,
            discountPrice: selectedProduct.discountPrice || '',
            sizes: selectedProduct.sizes || [],
            pricingType: selectedProduct.pricingType || 'same',
            sizePrices: selectedProduct.sizePrices || {},
            colors: selectedProduct.colors || [],
            storage: selectedProduct.storage || [],
            memory: selectedProduct.memory || [],
            weight: selectedProduct.weight || [],
            specifications: selectedProduct.specifications || {},
            variantImages: selectedProduct.variantImages || {}
        });
        setIsEditing(false);
    }

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editData.image) {
            alert('Main Product Image is compulsory. Please upload or provide a URL.');
            return;
        }
        const payloadData = { ...editData, price: parseFloat(editData.price) };
        setUpdateLoading(true);
        try {
            await onUpdateProduct(payloadData);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating product:", error);
        } finally {
            setUpdateLoading(false);
        }
    };

    if (!show || !selectedProduct || !editData) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(5, 5, 15, 0.75)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    style={{
                        width: '100%', maxWidth: '900px', maxHeight: '95vh', overflowY: 'auto',
                        borderRadius: '28px', border: '1px solid rgba(255,255,255,0.2)',
                        background: 'white', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.25)',
                        color: 'var(--text)', position: 'relative'
                    }}
                >
                    {/* Header Section */}
                    <div style={{
                        padding: '2rem 2.5rem', borderBottom: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'linear-gradient(to right, #f8fafc, white)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--primary)15', color: 'var(--primary)', borderRadius: '12px' }}>
                                {isEditing ? <Edit2 size={24} /> : <Eye size={24} />}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                                    {isEditing ? 'Editing' : 'Product'} <span className="gradient-text">Details</span>
                                </h2>
                                <p className="text-muted" style={{ margin: 0 }}>ID: {selectedProduct.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
                                    <Edit2 size={18} /> Modify Listing
                                </button>
                            )}
                            <button onClick={() => { onClose(); setEditData(null); setIsEditing(false); }} style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--surface)', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProduct} style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
                            {/* Left Side: Media & Quick Actions */}
                            <div className="flex flex-col gap-6">
                                <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                                    <img
                                        src={isEditing ? editData.image : selectedProduct.image}
                                        alt={selectedProduct.title}
                                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=Product+Media'; }}
                                    />
                                    {selectedProduct.stock <= 5 && !isEditing && (
                                        <div style={{
                                            position: 'absolute', top: '1rem', left: '1rem',
                                            background: 'var(--error)', color: 'white',
                                            padding: '0.4rem 0.8rem', borderRadius: '8px',
                                            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                                        }}>Low Stock</div>
                                    )}
                                </div>

                                {isEditing && (
                                    <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: '16px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <Upload size={14} /> Update Product Image
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '10px', cursor: isUploading ? 'not-allowed' : 'pointer', background: 'white', transition: 'all 0.2s', textAlign: 'center' }}>
                                                {isUploading ? <Loader className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} /> : <Upload style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                                                    {isUploading ? "Uploading..." : "Click to Upload New Image"}
                                                </span>
                                                <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Or input an image URL below</span>
                                                <input type="file" hidden accept="image/*" disabled={isUploading}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setIsUploading(true);
                                                        const formData = new FormData();
                                                        formData.append('image', file);
                                                        try {
                                                            const response = await authFetch('/auth/upload-image', { method: 'POST', body: formData });
                                                            const data = await response.json();
                                                            if (data.success) setEditData({ ...editData, image: data.url });
                                                            else alert('Upload failed: ' + data.message);
                                                        } catch (err) { console.error(err); alert('Upload error'); }
                                                        finally { setIsUploading(false); }
                                                    }}
                                                />
                                            </label>
                                            <input type="text" value={editData.image} onChange={e => setEditData({ ...editData, image: e.target.value })}
                                                style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--border)' }}
                                                placeholder="Or enter new image URL..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {!isEditing && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Status:</p>
                                            <p style={{ fontWeight: 600, color: 'var(--success)' }}>Active</p>
                                        </div>
                                        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Views:</p>
                                            <p style={{ fontWeight: 600 }}>{selectedProduct.views || 0}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Information Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Title Field */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Title</label>
                                    {isEditing ? (
                                        <input type="text" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px', border: '1px solid #e2e8f0' }} required />
                                    ) : (
                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1e293b', lineHeight: 1.2 }}>{selectedProduct.title}</h3>
                                    )}
                                </div>

                                {/* Price Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retail Price</label>
                                        {isEditing ? (
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--primary)' }}>₹</span>
                                                <input type="number" value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })}
                                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 1.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }} required />
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>₹{Number(selectedProduct.price).toLocaleString('en-IN')}</p>
                                        )}
                                    </div>
                                    <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem', border: '1px solid #bbf7d0' }}>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Discount Price <span style={{ color: '#22c55e' }}>(Seasonal)</span>
                                        </label>
                                        {isEditing ? (
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#22c55e' }}>₹</span>
                                                <input type="number" value={editData.discountPrice} onChange={e => setEditData({ ...editData, discountPrice: e.target.value })}
                                                    placeholder="Optional" style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 1.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', fontWeight: 600 }} />
                                            </div>
                                        ) : selectedProduct.discountPrice ? (
                                            <div>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', margin: 0 }}>₹{Number(selectedProduct.discountPrice).toLocaleString('en-IN')}</p>
                                                <small style={{ color: '#64748b' }}>Seasonal Offer</small>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#94a3b8', margin: 0, paddingTop: '0.25rem' }}>No active discount</p>
                                        )}
                                    </div>
                                </div>

                                {/* Stock */}
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Level</label>
                                    {isEditing ? (
                                        <input type="number" value={editData.stock} onChange={e => setEditData({ ...editData, stock: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }} required />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedProduct.stock > 0 ? '#22c55e' : '#ef4444', flexShrink: 0 }}></div>
                                            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{selectedProduct.stock}</p>
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>units in stock</span>
                                        </div>
                                    )}
                                </div>

                                {/* Category */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Category</label>
                                    {isEditing ? (
                                        <select value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}
                                            style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 500 }} required>
                                            {['Electronics', 'Fashion', 'Home & Kitchen', 'Handicrafts', 'Food & Beverages', 'Beauty & Personal Care', 'Sports & Fitness', 'Books & Stationery', 'Others'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ display: 'inline-flex', padding: '0.5rem 1.25rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem' }}>{selectedProduct.category}</div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Description</label>
                                    {isEditing ? (
                                        <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            style={{ width: '100%', padding: '1rem', height: '160px', borderRadius: '12px', border: '1px solid #e2e8f0', lineHeight: 1.6, fontSize: '1rem', resize: 'vertical' }}
                                            placeholder="Describe your product..." required />
                                    ) : (
                                        <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line' }}>{selectedProduct.description}</p>
                                    )}
                                </div>

                                {/* SIZES */}
                                {(selectedProduct.sizes?.length > 0 || (isEditing && editData.category && ['Fashion', 'Beauty & Personal Care', 'Sports & Fitness', 'Others'].includes(editData.category))) && (
                                    <div style={{ background: '#faf5ff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e9d5ff' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, color: '#7c3aed', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Ruler size={14} /> Available Sizes
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                                    {(editData.sizes || []).map(size => (
                                                        <span key={size} style={{ padding: '0.4rem 0.85rem', borderRadius: '50px', background: '#7c3aed', color: 'white', fontSize: '0.82rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                                                            onClick={() => setEditData({ ...editData, sizes: editData.sizes.filter(s => s !== size) })}>
                                                            {size} <X size={12} />
                                                        </span>
                                                    ))}
                                                    <input type="text" placeholder="+ Add size" style={{ padding: '0.4rem 0.75rem', borderRadius: '50px', border: '1.5px dashed #c4b5fd', background: 'transparent', fontSize: '0.82rem', width: '100px', outline: 'none' }}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const val = e.target.value.trim(); if (val && !editData.sizes.includes(val)) { setEditData({ ...editData, sizes: [...editData.sizes, val] }); e.target.value = ''; } } }}
                                                    />
                                                </div>
                                                {editData.sizes?.length > 0 && (
                                                    <div style={{ marginTop: '0.75rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                            <button type="button" onClick={() => setEditData({ ...editData, pricingType: 'same' })}
                                                                style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: editData.pricingType === 'same' ? '2px solid #7c3aed' : '1px solid #e2e8f0', background: editData.pricingType === 'same' ? '#f3e8ff' : 'white', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', color: editData.pricingType === 'same' ? '#7c3aed' : '#64748b' }}>
                                                                Same price all sizes
                                                            </button>
                                                            <button type="button" onClick={() => setEditData({ ...editData, pricingType: 'varied' })}
                                                                style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: editData.pricingType === 'varied' ? '2px solid #7c3aed' : '1px solid #e2e8f0', background: editData.pricingType === 'varied' ? '#f3e8ff' : 'white', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', color: editData.pricingType === 'varied' ? '#7c3aed' : '#64748b' }}>
                                                                Different prices
                                                            </button>
                                                        </div>
                                                        {editData.pricingType === 'varied' && editData.sizes.map(size => (
                                                            <div key={size} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{size}</span>
                                                                <div style={{ position: 'relative' }}>
                                                                    <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.8rem' }}>₹</span>
                                                                    <input type="number" placeholder={editData.price || '0'}
                                                                        value={(editData.sizePrices || {})[size] || ''}
                                                                        onChange={e => setEditData({ ...editData, sizePrices: { ...editData.sizePrices, [size]: e.target.value } })}
                                                                        style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 1.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: selectedProduct.pricingType === 'varied' ? '0.75rem' : 0 }}>
                                                    {(selectedProduct.sizes || []).map(size => (
                                                        <span key={size} style={{ padding: '0.4rem 0.85rem', borderRadius: '50px', background: '#ede9fe', color: '#6d28d9', fontSize: '0.85rem', fontWeight: 500 }}>
                                                            {size}
                                                            {selectedProduct.pricingType === 'varied' && selectedProduct.sizePrices?.[size] && (
                                                                <span style={{ marginLeft: '0.3rem', fontWeight: 700 }}>— ₹{Number(selectedProduct.sizePrices[size]).toLocaleString('en-IN')}</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                                {selectedProduct.pricingType === 'same' && <p style={{ fontSize: '0.8rem', color: '#8b5cf6', margin: 0, fontStyle: 'italic' }}>Same price for all sizes</p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* COLORS */}
                                {(selectedProduct.colors?.length > 0 || (isEditing && editData.colors?.length > 0)) && (
                                    <div style={{ background: '#fdf2f8', borderRadius: '12px', padding: '1.25rem', border: '1px solid #fbcfe8' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, color: '#db2777', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Palette size={14} /> Available Colors
                                        </label>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                {(editData.colors || []).map(color => {
                                                    const vImg = (editData.variantImages || {})[color];
                                                    return (
                                                        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'white', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                                                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', border: '1.5px solid #f9a8d4', overflow: 'hidden', flexShrink: 0, background: '#fce7f3', position: 'relative' }}>
                                                                {vImg
                                                                    ? <img src={vImg} alt={color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} style={{ color: '#f9a8d4' }} /></div>
                                                                }
                                                            </div>
                                                            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem', color: '#be185d' }}>{color}</span>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: '0.3rem 0.65rem', background: vImg ? '#f0fdf4' : 'var(--primary)', color: vImg ? '#16a34a' : 'white', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, border: vImg ? '1px solid #bbf7d0' : 'none', whiteSpace: 'nowrap' }}>
                                                                <Upload size={11} />{vImg ? 'Change' : 'Upload'}
                                                                <input type="file" accept="image/*" hidden onChange={async (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    const fd = new FormData();
                                                                    fd.append('image', file);
                                                                    try {
                                                                        const res = await authFetch('/auth/upload-image', { method: 'POST', body: fd });
                                                                        const rd = await res.json();
                                                                        if (rd.success) setEditData(prev => ({ ...prev, variantImages: { ...(prev.variantImages || {}), [color]: rd.url } }));
                                                                        else alert('Upload failed: ' + rd.message);
                                                                    } catch (err) { console.error(err); alert('Upload error'); }
                                                                }} />
                                                            </label>
                                                            <button type="button" onClick={() => {
                                                                const updatedColors = editData.colors.filter(c => c !== color);
                                                                const updatedImgs = { ...(editData.variantImages || {}) };
                                                                delete updatedImgs[color];
                                                                setEditData({ ...editData, colors: updatedColors, variantImages: updatedImgs });
                                                            }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.3rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
                                                        </div>
                                                    );
                                                })}
                                                <input type="text" placeholder="+ Add color (press Enter)" style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1.5px dashed #f9a8d4', background: 'transparent', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const val = e.target.value.trim(); if (val && !(editData.colors || []).includes(val)) { setEditData({ ...editData, colors: [...(editData.colors || []), val] }); e.target.value = ''; } } }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {(selectedProduct.colors || []).map(color => {
                                                    const vImg = (selectedProduct.variantImages || {})[color];
                                                    return (
                                                        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.75rem', background: 'white', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1.5px solid #f9a8d4', overflow: 'hidden', flexShrink: 0, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {vImg
                                                                    ? <img src={vImg} alt={color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                                                    : <ImageIcon size={16} style={{ color: '#f9a8d4' }} />
                                                                }
                                                            </div>
                                                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#be185d' }}>{color}</span>
                                                            {!vImg && <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>No image</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STORAGE / MEMORY / WEIGHT VARIANTS */}
                                {['storage', 'memory', 'weight'].map(vKey => {
                                    const items = isEditing ? (editData[vKey] || []) : (selectedProduct[vKey] || []);
                                    if (items.length === 0 && !(isEditing && editData.category === 'Electronics' && (vKey === 'storage' || vKey === 'memory'))) return null;
                                    const labels = { storage: 'Storage Options', memory: 'Memory / RAM', weight: 'Pack Size / Weight' };
                                    return (
                                        <div key={vKey} style={{ background: '#fffbeb', borderRadius: '12px', padding: '1.25rem', border: '1px solid #fde68a' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, color: '#d97706', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <Cpu size={14} /> {labels[vKey] || vKey}
                                            </label>
                                            {isEditing ? (
                                                <div>
                                                    {(editData[vKey] || []).map((v, vi) => (
                                                        <div key={v.label || vi} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', background: 'white', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.label}</span>
                                                            <div style={{ position: 'relative' }}>
                                                                <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.75rem' }}>+₹</span>
                                                                <input type="number" value={v.priceOffset || ''} placeholder="0"
                                                                    onChange={e => {
                                                                        const updated = [...editData[vKey]];
                                                                        updated[vi] = { ...updated[vi], priceOffset: Number(e.target.value) || 0 };
                                                                        setEditData({ ...editData, [vKey]: updated });
                                                                    }}
                                                                    style={{ width: '100%', padding: '0.4rem 0.4rem 0.4rem 1.8rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                                                                />
                                                            </div>
                                                            <button type="button" onClick={() => setEditData({ ...editData, [vKey]: editData[vKey].filter((_, i) => i !== vi) })}
                                                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                    <input type="text" placeholder={`+ Add ${vKey}`} style={{ padding: '0.4rem 0.75rem', borderRadius: '50px', border: '1.5px dashed #fbbf24', background: 'transparent', fontSize: '0.82rem', width: '140px', outline: 'none', marginTop: '0.3rem' }}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const val = e.target.value.trim(); if (val && !(editData[vKey] || []).find(v => v.label === val)) { setEditData({ ...editData, [vKey]: [...(editData[vKey] || []), { label: val, priceOffset: 0 }] }); e.target.value = ''; } } }}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                    {items.map((v, i) => (
                                                        <span key={v.label || i} style={{ padding: '0.4rem 0.85rem', borderRadius: '50px', background: '#fef3c7', color: '#92400e', fontSize: '0.85rem', fontWeight: 500 }}>
                                                            {v.label || v} {v.priceOffset ? <span style={{ fontWeight: 700 }}>{v.priceOffset > 0 ? `+₹${v.priceOffset.toLocaleString()}` : `-₹${Math.abs(v.priceOffset).toLocaleString()}`}</span> : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* SPECIFICATIONS */}
                                {(Object.keys(selectedProduct.specifications || {}).length > 0 || (isEditing && Object.keys(editData.specifications || {}).length > 0)) && (
                                    <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #bae6fd' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, color: '#0284c7', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Settings size={14} /> Specifications
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                {Object.entries(editData.specifications || {}).map(([key, val]) => (
                                                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                        <input type="text" value={key} readOnly style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600, fontSize: '0.82rem' }} />
                                                        <input type="text" value={val} placeholder="Value..."
                                                            onChange={e => { const specs = { ...editData.specifications }; specs[key] = e.target.value; setEditData({ ...editData, specifications: specs }); }}
                                                            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                                                        />
                                                        <button type="button" onClick={() => { const specs = { ...editData.specifications }; delete specs[key]; setEditData({ ...editData, specifications: specs }); }}
                                                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}><X size={14} /></button>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <input id="newSpecKey" type="text" placeholder="Spec name" style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '50px', border: '1.5px dashed #93c5fd', background: 'transparent', fontSize: '0.82rem', outline: 'none' }} />
                                                    <input id="newSpecVal" type="text" placeholder="Value" style={{ flex: 1.5, padding: '0.45rem 0.75rem', borderRadius: '50px', border: '1.5px dashed #93c5fd', background: 'transparent', fontSize: '0.82rem', outline: 'none' }}
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const kEl = document.getElementById('newSpecKey'); const vEl = document.getElementById('newSpecVal'); if (kEl.value.trim()) { setEditData({ ...editData, specifications: { ...editData.specifications, [kEl.value.trim()]: vEl.value.trim() } }); kEl.value = ''; vEl.value = ''; } } }}
                                                    />
                                                    <button type="button" onClick={() => { const kEl = document.getElementById('newSpecKey'); const vEl = document.getElementById('newSpecVal'); if (kEl.value.trim()) { setEditData({ ...editData, specifications: { ...editData.specifications, [kEl.value.trim()]: vEl.value.trim() } }); kEl.value = ''; vEl.value = ''; } }}
                                                        style={{ padding: '0.4rem 0.75rem', borderRadius: '50px', background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Add</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                {Object.entries(selectedProduct.specifications || {}).map(([key, val]) => (
                                                    <div key={key} style={{ padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{key}</span>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'none' }}>{/* spacer */}</div>

                                {isEditing && (
                                    <div className="flex gap-4" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                                        <button type="submit" disabled={updateLoading} className="btn btn-primary shadow-glow"
                                            style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontSize: '1.1rem' }}>
                                            {updateLoading ? 'Synchronizing...' : 'Apply Changes'}
                                        </button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary"
                                            style={{ flex: 1, padding: '1rem', borderRadius: '14px' }}>Discard</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
