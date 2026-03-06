import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Trash2, Upload, Loader } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

const sty = {
    card: { background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' },
    sectionIcon: (color) => ({ padding: '0.5rem', background: `${color}15`, color, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
};

export default function ImageUploader({ 
    product, 
    setProduct, 
    selectedColors, 
    variants, 
    variantImages, 
    setVariantImages 
}) {
    const [uploadingMain, setUploadingMain] = useState(false);

    const allVariantLabels = [
        ...selectedColors,
        ...Object.values(variants).flat().map(v => v.label)
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Main Product Image Upload */}
            <div style={sty.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={sty.sectionIcon('#a855f7')}><ImageIcon size={20} /></div>
                    <h3 style={{ margin: 0 }}>Product Media</h3>
                </div>
                <div style={{
                    border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '2rem', textAlign: 'center',
                    background: '#fafbfc', minHeight: '200px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                }}>
                    {product.image ? (
                        <div style={{ position: 'relative', width: '100%' }}>
                            <img src={product.image} alt="Preview" style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain' }} />
                            <button type="button" onClick={() => setProduct({ ...product, image: '' })}
                                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center gap-3" style={{ cursor: 'pointer', width: '100%' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                {uploadingMain ? <Loader className="animate-spin" style={{ color: 'var(--primary)' }} /> : <Upload style={{ color: '#94a3b8' }} />}
                            </div>
                            <div style={{ width: '100%', textAlign: 'center' }}>
                                <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                    {uploadingMain ? "Uploading..." : "Click to Upload Image"}
                                </p>
                                <p className="text-muted" style={{ fontSize: '0.8rem' }}>High-quality images work best!</p>
                                <input type="file" accept="image/*" hidden disabled={uploadingMain}
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setUploadingMain(true);
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        try {
                                            const response = await authFetch('/seller/upload-image', { method: 'POST', body: formData });
                                            const data = await response.json();
                                            if (data.success) { setProduct(p => ({ ...p, image: data.url })); }
                                            else { alert('Upload failed: ' + data.message); }
                                        } catch (err) { console.error(err); alert('Upload error'); }
                                        finally { setUploadingMain(false); }
                                    }} />
                            </div>
                        </label>
                    )}
                </div>
            </div>

            {/* Variant Images Upload */}
            {allVariantLabels.length > 0 && (
                <div style={sty.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={sty.sectionIcon('#3b82f6')}><ImageIcon size={20} /></div>
                        <div>
                            <h3 style={{ margin: 0 }}>Variant Images</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>(Optional) Upload images for specific colors or variants.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {allVariantLabels.map(label => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{label}</span>
                                <div>
                                    {variantImages[label] ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <img src={variantImages[label]} alt={label} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                            <button type="button" onClick={() => {
                                                const updated = { ...variantImages };
                                                delete updated[label];
                                                setVariantImages(updated);
                                            }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </div>
                                    ) : (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            <Upload size={14} />
                                            Upload
                                            <input type="file" accept="image/*" hidden
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    try {
                                                        const response = await authFetch('/seller/upload-image', { method: 'POST', body: formData });
                                                        const data = await response.json();
                                                        if (data.success) { setVariantImages(prev => ({ ...prev, [label]: data.url })); }
                                                        else { alert('Upload failed: ' + data.message); }
                                                    } catch (err) { console.error(err); alert('Upload error'); }
                                                }} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
