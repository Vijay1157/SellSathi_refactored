import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Trash2, Upload, Loader, Plus } from 'lucide-react';
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
    const [uploadingLabel, setUploadingLabel] = useState(null);

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
                                            const response = await authFetch('/auth/upload-image', { method: 'POST', body: formData });
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
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>(Optional) Upload multiple images for specific colors or variants. One is mandatory if you choose to add images.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {allVariantLabels.map(label => {
                            const images = Array.isArray(variantImages[label]) ? variantImages[label] : (variantImages[label] ? [variantImages[label]] : []);
                            return (
                                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>{label}</span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: uploadingLabel === label ? 'not-allowed' : 'pointer', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, opacity: uploadingLabel === label ? 0.7 : 1 }}>
                                            {uploadingLabel === label ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                                            {uploadingLabel === label ? 'Uploading...' : 'Add Images'}
                                            <input type="file" accept="image/*" multiple hidden disabled={uploadingLabel === label}
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files);
                                                    if (files.length === 0) return;
                                                    setUploadingLabel(label);
                                                    try {
                                                        const newUrls = [];
                                                        for (let file of files) {
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            const response = await authFetch('/auth/upload-image', { method: 'POST', body: formData });
                                                            const data = await response.json();
                                                            if (data.success) { newUrls.push(data.url); }
                                                        }
                                                        if (newUrls.length > 0) {
                                                            setVariantImages(prev => {
                                                                const existing = Array.isArray(prev[label]) ? prev[label] : (prev[label] ? [prev[label]] : []);
                                                                return { ...prev, [label]: [...existing, ...newUrls] };
                                                            });
                                                        }
                                                    } catch (err) { console.error(err); alert('Upload error'); }
                                                    finally { setUploadingLabel(null); }
                                                }} />
                                        </label>
                                    </div>
                                    {images.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {images.map((imgSrc, idx) => (
                                                <div key={idx} style={{ position: 'relative' }}>
                                                    <img src={imgSrc} alt={`${label}-${idx}`} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                                    {idx === 0 && <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px' }}>Main</span>}
                                                    <button type="button" onClick={() => {
                                                        setVariantImages(prev => {
                                                            const currentArr = Array.isArray(prev[label]) ? [...prev[label]] : [...[prev[label]]];
                                                            currentArr.splice(idx, 1);
                                                            const newState = { ...prev };
                                                            if (currentArr.length === 0) delete newState[label];
                                                            else newState[label] = currentArr;
                                                            return newState;
                                                        });
                                                    }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '0.2rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
