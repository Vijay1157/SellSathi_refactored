import { CreditCard, ArrowLeft, Store } from 'lucide-react';

const Field = ({ label, value, mono = false, span = false }) => (
    <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.85rem 1.1rem',
        gridColumn: span ? 'span 2' : undefined,
    }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: mono ? 'monospace' : undefined, color: 'var(--text)' }}>{value || '—'}</div>
    </div>
);

export default function BankDetailsModal({ seller, onClose }) {
    const hasBank = seller?.bankName || seller?.accountHolderName || seller?.accountNumber || seller?.ifscCode || seller?.upiId;

    return (
        <div className="animate-fade-in" style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Bank Details</h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{seller?.shopName || seller?.name || 'Seller'}</span>
                </div>
            </div>

            {/* Seller Info */}
            <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '700px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
                    <Store size={16} style={{ color: 'var(--secondary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller Information</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Field label="Shop Name" value={seller?.shopName} span />
                    <Field label="Category" value={seller?.category} />
                    <Field label="GST Number" value={seller?.gstNumber} mono />
                    {seller?.email && <Field label="Contact Email" value={seller.email} />}
                </div>
            </div>

            {/* Bank Details */}
            {!hasBank ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '700px' }}>
                    <CreditCard size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No Bank Details Found</p>
                    <p style={{ fontSize: '0.85rem' }}>This seller has not submitted bank details yet.</p>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '700px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
                        <CreditCard size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Information</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <Field label="Bank Name" value={seller.bankName} />
                        <Field label="Account Holder Name" value={seller.accountHolderName} />
                        <Field label="Account Number" value={seller.accountNumber} mono />
                        <Field label="IFSC Code" value={seller.ifscCode} mono />
                        <Field label="UPI ID" value={seller.upiId} mono />
                    </div>
                </div>
            )}
        </div>
    );
}
