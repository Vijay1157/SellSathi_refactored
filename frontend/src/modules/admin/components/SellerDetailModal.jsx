import { useState } from 'react';
import { X, Check, CreditCard, User, Store, MapPin } from 'lucide-react';
import BankDetailsModal from '@/modules/admin/components/BankDetailsModal';

/**
 * SellerDetailModal — shows full seller info, Aadhaar image, and approve/reject/block actions.
 * Extracted from SellersTab to keep each file under 500 lines.
 */
export default function SellerDetailModal({ seller, onClose, onApprove, onReject, onBlock }) {
    const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [blockDuration, setBlockDuration] = useState('1');

    if (!seller) return null;

    const handleBlockConfirm = () => {
        onBlock(seller.uid, blockDuration === 'permanent' ? 'permanent' : parseInt(blockDuration));
        setBlockModalOpen(false);
    };

    return (
        <>
            {/* Seller Detail Overlay */}
            <div
                className="modal-overlay flex items-center justify-center"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, padding: '2rem' }}
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <div className="glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid var(--border)', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

                    {/* Header */}
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Review Seller Application</h2>
                            <p className="text-muted" style={{ margin: 0 }}>UID: {seller.uid}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowBankDetailsModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CreditCard size={16} /> View Bank Details
                            </button>
                            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                            {/* Document image */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 mb-2"><CreditCard size={18} className="text-primary" /><h4 style={{ margin: 0 }}>Document Proof</h4></div>
                                <div style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                                    <img src={seller.aadhaarImageUrl} alt="Identity Document" style={{ width: '100%', display: 'block' }} />
                                </div>
                                <p className="text-xs text-center text-muted italic">Registered Aadhaar/Identity Card Preview</p>
                            </div>

                            {/* Info fields */}
                            <div className="flex flex-col gap-6">
                                {/* Personal identity */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}><User size={16} className="text-primary" /><span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Personal Identity</span></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px' }}><small className="text-muted mb-1 d-block">Full Name</small><p style={{ fontWeight: 700, margin: 0 }}>{seller.extractedName || seller.name}</p></div>
                                        <div style={{ background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px' }}><small className="text-muted mb-1 d-block">UIDAI Number</small><p style={{ fontWeight: 700, margin: 0, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{seller.aadhaarNumber || 'Not Extracted'}</p></div>
                                        <div style={{ background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px' }}><small className="text-muted mb-1 d-block">D.O.B</small><p style={{ fontWeight: 700, margin: 0 }}>{seller.dateOfBirth || 'N/A'}</p></div>
                                        <div style={{ background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px', gridColumn: 'span 2' }}><small className="text-muted mb-1 d-block">Age / Gender</small><p style={{ fontWeight: 700, margin: 0 }}>{seller.age || 'N/A'} | {seller.gender || 'N/A'}</p></div>
                                    </div>
                                </div>

                                {/* Store profile */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}><Store size={16} className="text-secondary" /><span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Store Profile</span></div>
                                    <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '10px' }}>
                                        <small className="text-muted mb-1 d-block">Store Name</small>
                                        <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>{seller.shopName}</p>
                                        <div className="flex flex-wrap gap-12" style={{ marginTop: '0.5rem' }}>
                                            <div><small className="text-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Shop Category</small><span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1rem' }}>{seller.category}</span></div>
                                            <div><small className="text-muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Contact Number</small><span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1rem' }}>{seller.email}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}><MapPin size={16} className="text-warning" /><span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Verification Address</span></div>
                                    <div style={{ background: 'hsla(40, 90%, 60%, 0.05)', border: '1px dashed var(--warning)', padding: '1rem', borderRadius: '10px' }}>
                                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>{seller.address || 'Address information not extracted correctly.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ padding: '1.5rem 2rem', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', width: '100%' }}>
                        {seller.status === 'PENDING' ? (
                            <>
                                <button className="btn btn-primary" style={{ flex: '1 1 50%', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => { onApprove(seller.uid); onClose(); }}>
                                    <Check size={20} /> Approve Seller
                                </button>
                                <button className="btn btn-secondary" style={{ flex: '1 1 50%', fontSize: '1rem', fontWeight: 700, color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'white' }} onClick={() => { onReject(seller.uid); onClose(); }}>
                                    <X size={20} /> Reject Application
                                </button>
                            </>
                        ) : seller.status === 'APPROVED' ? (
                            <button className="btn btn-secondary" style={{ flex: '1 1 100%', fontSize: '1rem', fontWeight: 700, color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'white' }} onClick={() => setBlockModalOpen(true)}>
                                <X size={20} /> Block Seller
                            </button>
                        ) : (
                            <button className="btn btn-secondary" style={{ flex: '1 1 100%', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={onClose}>Close</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Block Duration Modal */}
            {blockModalOpen && (
                <div className="modal-overlay flex items-center justify-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 10000, padding: '2rem' }} onClick={e => e.target === e.currentTarget && setBlockModalOpen(false)}>
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem', background: 'white', border: '1px solid var(--border)', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>Block Seller</h2>
                        <p className="text-muted">Block {seller.shopName} for a specified duration</p>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Block Duration</label>
                            <select value={blockDuration} onChange={e => setBlockDuration(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}>
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="5">5 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                                <option value="custom">Custom Days</option>
                                <option value="permanent">Permanent Block</option>
                            </select>
                        </div>
                        {blockDuration === 'custom' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Number of Days</label>
                                <input type="number" min="1" placeholder="Enter number of days" onChange={e => setBlockDuration(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setBlockModalOpen(false)} style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleBlockConfirm} style={{ flex: 1, padding: '0.75rem', background: 'var(--error)', borderColor: 'var(--error)' }}>Block Seller</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Details Modal */}
            {showBankDetailsModal && (
                <BankDetailsModal seller={seller} onClose={() => setShowBankDetailsModal(false)} />
            )}
        </>
    );
}
