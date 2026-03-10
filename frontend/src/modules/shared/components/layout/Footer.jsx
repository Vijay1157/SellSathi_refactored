import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AdminLoginModal from '@/modules/auth/components/AdminLoginModal';
import { ShieldCheck } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function Footer() {
    const navigate = useNavigate();
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

    const handleBecomeSellerClick = async () => {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) {
            alert('Please login as a customer first before becoming a seller.');
            return;
        }

        const userData = JSON.parse(rawUser);

        // Admin accounts cannot apply as sellers
        if (userData.role === 'ADMIN') {
            alert('Admin accounts cannot become sellers.');
            return;
        }

        // Check if user has already applied as a seller
        try {
            const response = await authFetch('/auth/check-seller-status');
            const data = await response.json();
            if (data.success && data.hasApplied) {
                if (data.sellerStatus === 'APPROVED') {
                    alert('You are already an approved seller! Redirecting to your dashboard.');
                    window.open('/seller/dashboard', '_blank');
                    return;
                } else if (data.sellerStatus === 'PENDING') {
                    alert('You have already applied to become a seller. Your application is currently under review. Please wait for admin approval.');
                    return;
                }
                // REJECTED status — allow re-application
            }
        } catch (err) {
            console.error('Error checking seller status:', err);
        }

        window.open('/seller', '_blank');
    };

    return (
        <>
            <footer style={{
                marginTop: '4rem',
                padding: '4rem 0',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)'
            }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
                        <div>
                            <h3 className="gradient-text" style={{ marginBottom: '1rem', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-1px' }}>SELLSATHI</h3>
                            <p className="text-muted" style={{ lineHeight: 1.6 }}>The future of global marketplace. Fast, secure, and seller-friendly.</p>
                        </div>

                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Marketplace</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li><Link to="/products" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>All Products</Link></li>
                                <li><Link to="/categories" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Categories</Link></li>
                                <li><Link to="/track" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Track Order</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Support</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li><Link to="/faq" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>FAQ</Link></li>
                                <li><Link to="/contact" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Contact Us</Link></li>
                                <li><Link to="/terms" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Terms of Service</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Management</h4>
                            <ul style={{ listStyle: 'none' }} className="flex flex-col gap-3">
                                <li>
                                    <button
                                        onClick={() => setIsAdminModalOpen(true)}
                                        className="text-muted"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <ShieldCheck size={16} /> Management Login
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => {
                                            const rawUser = localStorage.getItem('user');
                                            if (!rawUser) {
                                                alert('Please login as a customer first to access the Seller Portal.');
                                                return;
                                            }
                                            window.open('/seller', '_blank');
                                        }}
                                        className="text-muted"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            display: 'inline'
                                        }}
                                    >
                                        Seller Portal
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            {(() => {
                                const rawUser = localStorage.getItem('user');
                                const role = rawUser ? JSON.parse(rawUser).role : null;
                                if (role === 'SELLER') return null;

                                return (
                                    <>
                                        <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Earn with Us</h4>
                                        <div style={{ marginTop: '0' }}>
                                            <button
                                                onClick={handleBecomeSellerClick}
                                                className="btn btn-primary"
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '0.75rem 1.5rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    borderRadius: '99px',
                                                    background: '#2563eb',
                                                    border: 'none',
                                                    color: 'white'
                                                }}
                                            >
                                                Become a Seller
                                            </button>
                                            <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>Open your shop in minutes.</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>&copy; 2026 SELLSATHI Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <AdminLoginModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
        </>
    );
}
