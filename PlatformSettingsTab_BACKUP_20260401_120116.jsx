import { useState, useEffect } from 'react';
import { Settings, Save, Loader, RefreshCw, Percent, Truck, Tag, DollarSign } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import { SELLER_CATEGORIES } from '@/modules/shared/config/categories';
import { PLATFORM_FEE_BREAKDOWN, calculateTotalPlatformFeePercent, validatePlatformFeeBreakdown } from '@/modules/shared/utils/platformFeeUtils';

const DEFAULT_GST = {
    "Fashion (Men)": 5, "Fashion (Women)": 5, "Kids & Baby": 12,
    "Electronics": 18, "Home & Living": 18, "Handicrafts": 5,
    "Artworks": 12, "Beauty & Personal Care": 18, "Sports & Fitness": 18,
    "Books & Stationery": 12, "Food & Beverages": 5, "Gifts & Customization": 18,
    "Jewelry & Accessories": 5, "Fabrics & Tailoring Materials": 5,
    "Local Sellers / Homepreneurs": 5, "Services": 18, "Pet Supplies": 12,
    "Automotive & Accessories": 18, "Travel & Utility": 18,
    "Sustainability & Eco-Friendly": 12, "Others": 18
};
const iStyle = { padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', background: 'var(--surface)', color: 'var(--text)', width: '90px', outline: 'none', textAlign: 'center' };
const lStyle = { fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' };

export default function PlatformSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [catSearch, setCatSearch] = useState('');
    const [formData, setFormData] = useState({ defaultShippingHandlingPercent: 0 });
    const [categoryGstRates, setCategoryGstRates] = useState(DEFAULT_GST);
    const [customCategories, setCustomCategories] = useState([]);
    const [customCatName, setCustomCatName] = useState('');
    const [customCatGst, setCustomCatGst] = useState('');
    const [platformFeeBreakdown, setPlatformFeeBreakdown] = useState(PLATFORM_FEE_BREAKDOWN);

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/admin/config/public');
            const data = await res.json();
            if (data.success && data.config) {
                setFormData({ defaultShippingHandlingPercent: data.config.defaultShippingHandlingPercent ?? 0 });
                if (data.config.categoryGstRates) {
                    setCategoryGstRates({ ...DEFAULT_GST, ...data.config.categoryGstRates });
                    setCustomCategories(Object.keys(data.config.categoryGstRates).filter(k => !SELLER_CATEGORIES.includes(k)));
                }
                if (data.config.platformFeeBreakdown) {
                    // Convert from backend format to frontend format
                    const breakdown = {};
                    Object.entries(data.config.platformFeeBreakdown).forEach(([key, percent]) => {
                        const defaultItem = PLATFORM_FEE_BREAKDOWN[key];
                        breakdown[key] = {
                            label: defaultItem?.label || key,
                            description: defaultItem?.description || '',
                            percent: percent
                        };
                    });
                    setPlatformFeeBreakdown(breakdown);
                } else {
                    // Use default breakdown if not in config
                    setPlatformFeeBreakdown(PLATFORM_FEE_BREAKDOWN);
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => { const val = parseFloat(e.target.value) || 0; if (val < 0 || val > 100) return; setFormData(prev => ({ ...prev, [e.target.name]: val })); setHasChanges(true); };
    const handleGstChange = (cat, value) => { const val = parseFloat(value); if (isNaN(val) || val < 0 || val > 100) return; setCategoryGstRates(prev => ({ ...prev, [cat]: val })); setHasChanges(true); };
    const handleAddCustom = () => { const name = customCatName.trim(); const gst = parseFloat(customCatGst); if (!name) { alert('Enter a category name.'); return; } if (isNaN(gst) || gst < 0 || gst > 100) { alert('Enter a valid GST % (0-100).'); return; } if (categoryGstRates[name] !== undefined) { alert('Category already exists.'); return; } setCategoryGstRates(prev => ({ ...prev, [name]: gst })); setCustomCategories(prev => [...prev, name]); setCustomCatName(''); setCustomCatGst(''); setHasChanges(true); };
    const handleRemoveCustom = (name) => { setCategoryGstRates(prev => { const n = { ...prev }; delete n[name]; return n; }); setCustomCategories(prev => prev.filter(c => c !== name)); setHasChanges(true); };
    const handlePlatformFeeChange = (key, value) => { const val = parseFloat(value); if (isNaN(val) || val < 0 || val > 10) return; setPlatformFeeBreakdown(prev => ({ ...prev, [key]: { ...prev[key], percent: val } })); setHasChanges(true); };
    const handleSave = async () => { 
        // Validate platform fee breakdown
        const validation = validatePlatformFeeBreakdown(platformFeeBreakdown);
        if (!validation.valid) {
            alert('Platform Fee Error: ' + validation.error);
            return;
        }
        
        setSaving(true); 
        try { 
            // Convert platform fee breakdown to backend format
            const breakdownForBackend = {};
            Object.entries(platformFeeBreakdown).forEach(([key, value]) => {
                breakdownForBackend[key] = value.percent;
            });
            
            const payload = { 
                ...formData, 
                categoryGstRates,
                platformFeeBreakdown: breakdownForBackend
            };
            
            const res = await authFetch('/admin/profile', { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            }); 
            
            const data = await res.json(); 
            
            if (data.success) { 
                alert('Platform settings saved successfully!'); 
                setHasChanges(false); 
                await fetchConfig(); 
            } else { 
                alert('Failed to save: ' + (data.message || 'Unknown error')); 
            } 
        } catch (err) { 
            console.error('Save error:', err);
            alert('Error saving settings: ' + err.message); 
        } finally { 
            setSaving(false); 
        } 
    };

    const allCategories = [...SELLER_CATEGORIES, ...customCategories.filter(c => !SELLER_CATEGORIES.includes(c))];
    const displayCategories = allCategories.filter(c => !catSearch || c.toLowerCase().includes(catSearch.toLowerCase()));

    if (loading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}><Loader className="animate-spin" size={32} style={{ color: 'var(--primary)' }} /></div>);

    return (
        <div className="animate-fade-in flex flex-col gap-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={24} style={{ color: 'var(--primary)' }} /></div>
                    <div><h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Platform Settings</h3><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure platform charges and category GST rates</p></div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => { fetchConfig(); setHasChanges(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}><RefreshCw size={15} /> Reset</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || !hasChanges} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1.25rem', opacity: !hasChanges ? 0.5 : 1 }}>{saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </div>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}><DollarSign size={16} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Fee Breakdown</span></div>
                
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Total Platform Fee</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {calculateTotalPlatformFeePercent(platformFeeBreakdown).toFixed(2)}%
                        </span>
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sum of all components below (max 20%)
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                    {Object.entries(platformFeeBreakdown).map(([key, value]) => (
                        <div key={key} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.5rem',
                            padding: '1rem',
                            background: 'var(--surface)',
                            borderRadius: '10px',
                            border: '1px solid var(--border)'
                        }}>
                            <label style={{ ...lStyle, marginBottom: '0.25rem' }}>{value.label}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    value={value.percent} 
                                    onChange={e => handlePlatformFeeChange(key, e.target.value)} 
                                    min="0" 
                                    max="10" 
                                    step="0.1" 
                                    style={{ ...iStyle, flex: 1 }} 
                                />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {value.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span style={{ color: '#d97706', fontWeight: 700, fontSize: '1rem', lineHeight: 1, marginTop: '2px' }}>ℹ️</span>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.6, fontWeight: 500 }}>
                                Platform fee breakdown is shown to sellers when adding products and to consumers during checkout. Each component must be between 0-10%, and total cannot exceed 20%.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}><Percent size={16} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Other Charges</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', maxWidth: '600px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}><label style={lStyle}>Shipping and Handling (%)</label><input type="number" name="defaultShippingHandlingPercent" value={formData.defaultShippingHandlingPercent} onChange={handleChange} min="0" max="100" step="0.1" style={iStyle} /><p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formData.defaultShippingHandlingPercent === 0 ? 'FREE shipping' : formData.defaultShippingHandlingPercent + '% shipping charge'}</p></div>
                </div>
            </div>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={16} style={{ color: 'var(--secondary)' }} /><span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category GST Rates</span><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>applied to all products per category</span></div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" placeholder="Search category..." value={catSearch} onChange={e => setCatSearch(e.target.value)} style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text)', width: '180px', outline: 'none' }} />
                        <button className="btn btn-secondary" onClick={() => setCatSearch('')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Clear</button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {displayCategories.map(cat => { const isCustom = !SELLER_CATEGORIES.includes(cat); return (<div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid ' + (isCustom ? 'var(--primary)' : 'var(--border)') }}><span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)', flex: 1, marginRight: '0.5rem' }}>{cat}{isCustom && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '6px', fontWeight: 700 }}>CUSTOM</span>}</span><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="number" value={categoryGstRates[cat] ?? 18} onChange={e => handleGstChange(cat, e.target.value)} min="0" max="100" step="0.5" style={{ ...iStyle, width: '70px', padding: '0.4rem 0.6rem' }} /><span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>{isCustom && <button onClick={() => handleRemoveCustom(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, padding: '0 4px' }}>x</button>}</div></div>); })}
                </div>
            </div>

            {/* How GST Works */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid rgba(245,158,11,0.25)' }}>
                    <Truck size={16} style={{ color: '#d97706' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400e' }}>How GST Works</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {[
                        'Sellers with a GST number can manually set their product GST rate',
                        'Sellers without a GST number get the rate from this table automatically',
                        'Changes take effect immediately after saving'
                    ].map((note, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <span style={{ color: '#d97706', fontWeight: 700, fontSize: '1rem', lineHeight: 1, marginTop: '1px' }}>•</span>
                            <span style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6 }}>{note}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
