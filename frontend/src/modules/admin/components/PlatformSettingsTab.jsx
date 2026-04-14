import { useState, useEffect } from 'react';
import { Settings, Save, Loader, RefreshCw, Percent, Truck, Tag, DollarSign, TrendingUp } from 'lucide-react';
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

const DEFAULT_PRICE_RANGE_FEES = [
    { id: 'range1', label: '₹0 – ₹1,000',       min: 0,     max: 1000,  feePercent: 3.5 },
    { id: 'range2', label: '₹1,001 – ₹10,000',  min: 1001,  max: 10000, feePercent: 3.0 },
    { id: 'range3', label: '₹10,001 – ₹50,000', min: 10001, max: 50000, feePercent: 2.5 },
    { id: 'range4', label: '₹50,001 & above',   min: 50001, max: null,  feePercent: 2.0 },
];

const iStyle = { padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', background: 'var(--surface)', color: 'var(--text)', width: '90px', outline: 'none', textAlign: 'center' };
const lStyle = { fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' };

const SectionButtons = ({ editing, saving, onEdit, onSave, onCancel }) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
        {!editing ? (
            <button className="btn btn-secondary" onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                Edit
            </button>
        ) : (
            <>
                <button className="btn btn-secondary" onClick={onCancel} disabled={saving} style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={onSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                    {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </>
        )}
    </div>
);

export default function PlatformSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [catSearch, setCatSearch] = useState('');
    const [formData, setFormData] = useState({ defaultShippingHandlingPercent: 0 });
    const [categoryGstRates, setCategoryGstRates] = useState(DEFAULT_GST);
    const [customCategories, setCustomCategories] = useState([]);
    const [platformFeeBreakdown, setPlatformFeeBreakdown] = useState(PLATFORM_FEE_BREAKDOWN);
    const [platformFeeBreakdownSeller, setPlatformFeeBreakdownSeller] = useState(PLATFORM_FEE_BREAKDOWN);
    const [feeBreakdownMode, setFeeBreakdownMode] = useState('user'); // 'user' or 'seller'
    const [editingPF, setEditingPF] = useState(false);
    const [editingOC, setEditingOC] = useState(false);
    const [editingGST, setEditingGST] = useState(false);

    const [savingPF, setSavingPF] = useState(false);
    const [savingOC, setSavingOC] = useState(false);
    const [savingGST, setSavingGST] = useState(false);
    const [origPF, setOrigPF] = useState(PLATFORM_FEE_BREAKDOWN);
    const [origPFSeller, setOrigPFSeller] = useState(PLATFORM_FEE_BREAKDOWN);
    const [origOC, setOrigOC] = useState({ defaultShippingHandlingPercent: 0 });
    const [origGST, setOrigGST] = useState(DEFAULT_GST);

    // Price range fees
    const [priceRangeFees, setPriceRangeFees] = useState(DEFAULT_PRICE_RANGE_FEES);
    const [origPriceRangeFees, setOrigPriceRangeFees] = useState(DEFAULT_PRICE_RANGE_FEES);
    const [editingPRF, setEditingPRF] = useState(false);
    const [savingPRF, setSavingPRF] = useState(false);

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/admin/config/public');
            const data = await res.json();
            if (data.success && data.config) {
                const oc = { defaultShippingHandlingPercent: data.config.defaultShippingHandlingPercent ?? 0 };
                setFormData(oc); setOrigOC(oc);
                if (data.config.categoryGstRates) {
                    const gst = { ...DEFAULT_GST, ...data.config.categoryGstRates };
                    setCategoryGstRates(gst); setOrigGST(gst);
                    setCustomCategories(Object.keys(data.config.categoryGstRates).filter(k => !SELLER_CATEGORIES.includes(k)));
                }
                // User platform fee breakdown
                if (data.config.platformFeeBreakdown) {
                    const bd = {};
                    Object.entries(data.config.platformFeeBreakdown).forEach(([key, percent]) => {
                        const def = PLATFORM_FEE_BREAKDOWN[key];
                        bd[key] = { label: def?.label || key, description: def?.description || '', percent };
                    });
                    setPlatformFeeBreakdown(bd); setOrigPF(bd);
                } else {
                    setPlatformFeeBreakdown(PLATFORM_FEE_BREAKDOWN); setOrigPF(PLATFORM_FEE_BREAKDOWN);
                }
                // Seller platform fee breakdown
                if (data.config.platformFeeBreakdownSeller) {
                    const bdSeller = {};
                    Object.entries(data.config.platformFeeBreakdownSeller).forEach(([key, percent]) => {
                        const def = PLATFORM_FEE_BREAKDOWN[key];
                        bdSeller[key] = { label: def?.label || key, description: def?.description || '', percent };
                    });
                    setPlatformFeeBreakdownSeller(bdSeller); setOrigPFSeller(bdSeller);
                } else {
                    setPlatformFeeBreakdownSeller(PLATFORM_FEE_BREAKDOWN); setOrigPFSeller(PLATFORM_FEE_BREAKDOWN);
                }
                if (data.config.priceRangeFees) {
                    setPriceRangeFees(data.config.priceRangeFees);
                    setOrigPriceRangeFees(data.config.priceRangeFees);
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const saveToBackend = async (payload) => {
        const res = await authFetch('/admin/profile', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        return res.json();
    };

    const handleSavePF = async () => {
        const currentBreakdown = feeBreakdownMode === 'user' ? platformFeeBreakdown : platformFeeBreakdownSeller;
        const v = validatePlatformFeeBreakdown(currentBreakdown);
        if (!v.valid) { alert('Error: ' + v.error); return; }
        setSavingPF(true);
        try {
            const bd = {};
            Object.entries(currentBreakdown).forEach(([k, val]) => { bd[k] = val.percent; });
            const payload = feeBreakdownMode === 'user' 
                ? { platformFeeBreakdown: bd }
                : { platformFeeBreakdownSeller: bd };
            const data = await saveToBackend(payload);
            if (data.success) { 
                alert(`${feeBreakdownMode === 'user' ? 'User' : 'Seller'} Platform Fee saved!`); 
                if (feeBreakdownMode === 'user') {
                    setOrigPF(platformFeeBreakdown);
                } else {
                    setOrigPFSeller(platformFeeBreakdownSeller);
                }
                setEditingPF(false); 
                await fetchConfig(); 
            }
            else alert('Failed: ' + (data.message || 'Unknown error'));
        } catch (e) { alert('Error: ' + e.message); }
        finally { setSavingPF(false); }
    };

    const handleSaveOC = async () => {
        setSavingOC(true);
        try {
            const data = await saveToBackend(formData);
            if (data.success) { alert('Other Charges saved!'); setOrigOC(formData); setEditingOC(false); await fetchConfig(); }
            else alert('Failed: ' + (data.message || 'Unknown error'));
        } catch (e) { alert('Error: ' + e.message); }
        finally { setSavingOC(false); }
    };

    const handleSaveGST = async () => {
        setSavingGST(true);
        try {
            const data = await saveToBackend({ categoryGstRates });
            if (data.success) { alert('GST Rates saved!'); setOrigGST(categoryGstRates); setEditingGST(false); await fetchConfig(); }
            else alert('Failed: ' + (data.message || 'Unknown error'));
        } catch (e) { alert('Error: ' + e.message); }
        finally { setSavingGST(false); }
    };

    const handleSavePRF = async () => {
        for (const r of priceRangeFees) {
            if (r.feePercent < 0 || r.feePercent > 100) {
                alert('Fee % must be between 0 and 100'); return;
            }
        }
        setSavingPRF(true);
        try {
            const data = await saveToBackend({ priceRangeFees });
            if (data.success) { alert('Price Range Fees saved!'); setOrigPriceRangeFees(priceRangeFees); setEditingPRF(false); await fetchConfig(); }
            else alert('Failed: ' + (data.message || 'Unknown error'));
        } catch (e) { alert('Error: ' + e.message); }
        finally { setSavingPRF(false); }
    };

    const allCategories = [...SELLER_CATEGORIES, ...customCategories.filter(c => !SELLER_CATEGORIES.includes(c))];
    const displayCategories = allCategories.filter(c => !catSearch || c.toLowerCase().includes(catSearch.toLowerCase()));

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
            <Loader className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        </div>
    );


    return (
        <div className="animate-fade-in flex flex-col gap-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={24} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Platform Settings</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure platform charges and category GST rates</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={fetchConfig} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}>
                    <RefreshCw size={15} /> Refresh
                </button>
            </div>

            {/* Price Range Based Platform Fees */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Range Platform Fees</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>fee % applied based on product price</span>
                    </div>
                    <SectionButtons editing={editingPRF} saving={savingPRF}
                        onEdit={() => setEditingPRF(true)} onSave={handleSavePRF}
                        onCancel={() => { setPriceRangeFees(origPriceRangeFees); setEditingPRF(false); }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', opacity: editingPRF ? 1 : 0.75 }}>
                    {priceRangeFees.map((range, idx) => (
                        <div key={range.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{range.label}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Platform fee for this price range</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                                <input
                                    type="number"
                                    value={range.feePercent}
                                    disabled={!editingPRF}
                                    onChange={e => {
                                        const v = parseFloat(e.target.value);
                                        if (!isNaN(v) && v >= 0 && v <= 100) {
                                            setPriceRangeFees(prev => prev.map((r, i) => i === idx ? { ...r, feePercent: v } : r));
                                        }
                                    }}
                                    min="0" max="100" step="0.1"
                                    style={{ ...iStyle, width: '80px', cursor: editingPRF ? 'text' : 'not-allowed' }}
                                />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(59,124,241,0.05)', borderRadius: '8px', border: '1px solid rgba(59,124,241,0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#1D5FD4', lineHeight: 1.6 }}>
                        When a seller adds a product, the platform fee % is automatically assigned based on the product price range. Consumers are charged this fee at checkout.
                    </p>
                </div>
            </div>

            {/* Platform Fee Breakdown */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Fee Breakdown</span>
                    </div>
                    <SectionButtons editing={editingPF} saving={savingPF}
                        onEdit={() => setEditingPF(true)} onSave={handleSavePF}
                        onCancel={() => { 
                            if (feeBreakdownMode === 'user') {
                                setPlatformFeeBreakdown(origPF);
                            } else {
                                setPlatformFeeBreakdownSeller(origPFSeller);
                            }
                            setEditingPF(false); 
                        }} />
                </div>

                {/* User/Seller Toggle */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', padding: '0.5rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setFeeBreakdownMode('user')}
                        disabled={editingPF}
                        style={{
                            flex: 1,
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: feeBreakdownMode === 'user' ? 'var(--primary)' : 'transparent',
                            color: feeBreakdownMode === 'user' ? 'white' : 'var(--text)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: editingPF ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: editingPF ? 0.5 : 1
                        }}
                    >
                        User Fees
                    </button>
                    <button
                        onClick={() => setFeeBreakdownMode('seller')}
                        disabled={editingPF}
                        style={{
                            flex: 1,
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: feeBreakdownMode === 'seller' ? 'var(--primary)' : 'transparent',
                            color: feeBreakdownMode === 'seller' ? 'white' : 'var(--text)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: editingPF ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: editingPF ? 0.5 : 1
                        }}
                    >
                        Seller Fees
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            Total {feeBreakdownMode === 'user' ? 'User' : 'Seller'} Platform Fee
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {calculateTotalPlatformFeePercent(feeBreakdownMode === 'user' ? platformFeeBreakdown : platformFeeBreakdownSeller).toFixed(2)}%
                        </span>
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {feeBreakdownMode === 'user' 
                            ? 'Applied to consumers at checkout based on product price range'
                            : 'Applied to sellers based on their product price range'
                        }
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', opacity: editingPF ? 1 : 0.75 }}>
                    {Object.entries(feeBreakdownMode === 'user' ? platformFeeBreakdown : platformFeeBreakdownSeller).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <label style={{ ...lStyle, marginBottom: '0.25rem' }}>{value.label}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="number" value={value.percent} disabled={!editingPF}
                                    onChange={e => { 
                                        const v = parseFloat(e.target.value); 
                                        if (!isNaN(v) && v >= 0 && v <= 10) {
                                            if (feeBreakdownMode === 'user') {
                                                setPlatformFeeBreakdown(p => ({ ...p, [key]: { ...p[key], percent: v } }));
                                            } else {
                                                setPlatformFeeBreakdownSeller(p => ({ ...p, [key]: { ...p[key], percent: v } }));
                                            }
                                        }
                                    }}
                                    min="0" max="10" step="0.1" style={{ ...iStyle, flex: 1, cursor: editingPF ? 'text' : 'not-allowed' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{value.description}</p>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.6, fontWeight: 500 }}>
                        {feeBreakdownMode === 'user' 
                            ? 'User fees are charged to consumers at checkout and combined with the price range fees above. Each component max 10%, total max 20%.'
                            : 'Seller fees are deducted from seller payouts based on product price ranges. Each component max 10%, total max 20%.'
                        }
                    </p>
                </div>
            </div>

            {/* Other Charges */}
            <div className="glass-card" style={{ padding: '2rem' }}>                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Percent size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Other Charges</span>
                    </div>
                    <SectionButtons editing={editingOC} saving={savingOC}
                        onEdit={() => setEditingOC(true)} onSave={handleSaveOC}
                        onCancel={() => { setFormData(origOC); setEditingOC(false); }} />
                </div>
                <div style={{ opacity: editingOC ? 1 : 0.75 }}>
                    <label style={lStyle}>Shipping and Handling (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <input type="number" name="defaultShippingHandlingPercent" value={formData.defaultShippingHandlingPercent} disabled={!editingOC}
                            onChange={e => { const v = parseFloat(e.target.value) || 0; if (v >= 0 && v <= 100) setFormData(p => ({ ...p, defaultShippingHandlingPercent: v })); }}
                            min="0" max="100" step="0.1" style={{ ...iStyle, cursor: editingOC ? 'text' : 'not-allowed' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {formData.defaultShippingHandlingPercent === 0 ? '— FREE shipping' : '— ' + formData.defaultShippingHandlingPercent + '% applied at checkout'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category GST Rates */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={16} style={{ color: 'var(--secondary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category GST Rates</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>applied to all products per category</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Search category..." value={catSearch} onChange={e => setCatSearch(e.target.value)}
                            style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text)', width: '180px', outline: 'none' }} />
                        <button className="btn btn-secondary" onClick={() => setCatSearch('')} style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>Clear</button>
                        <SectionButtons editing={editingGST} saving={savingGST}
                            onEdit={() => setEditingGST(true)} onSave={handleSaveGST}
                            onCancel={() => { setCategoryGstRates(origGST); setEditingGST(false); }} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto', padding: '0.25rem', opacity: editingGST ? 1 : 0.75 }}>
                    {displayCategories.map(cat => {
                        const isCustom = !SELLER_CATEGORIES.includes(cat);
                        return (
                            <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid ' + (isCustom ? 'var(--primary)' : 'var(--border)') }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)', flex: 1, marginRight: '0.5rem' }}>
                                    {cat}
                                    {isCustom && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '6px', fontWeight: 700 }}>CUSTOM</span>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input type="number" value={categoryGstRates[cat] ?? 18} disabled={!editingGST}
                                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setCategoryGstRates(p => ({ ...p, [cat]: v })); }}
                                        min="0" max="100" step="0.5" style={{ ...iStyle, width: '70px', padding: '0.4rem 0.6rem', cursor: editingGST ? 'text' : 'not-allowed' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                                    {isCustom && editingGST && (
                                        <button onClick={() => { setCategoryGstRates(p => { const n = { ...p }; delete n[cat]; return n; }); setCustomCategories(p => p.filter(c => c !== cat)); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, padding: '0 4px' }}>x</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How It Works */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid rgba(245,158,11,0.25)' }}>
                    <Truck size={16} style={{ color: '#d97706' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400e' }}>How It Works</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {[
                        'Click Edit to modify a section, then Save to persist changes to the database',
                        'Platform fee and shipping changes apply immediately in consumer checkout order summary',
                        'GST rate changes apply to sellers without a GST number and in consumer checkout'
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
