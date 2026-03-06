import { useState } from 'react';
import { X } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function ReviewsTab({ reviews, fetchAllData }) {
    const [feedbackSearch, setFeedbackSearch] = useState('');
    const [selectedFeedbackDate, setSelectedFeedbackDate] = useState('');

    const handleDeleteReview = async (reviewId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this review? This action cannot be undone.');
        if (!confirmDelete) return;
        try {
            const response = await authFetch(`/admin/review/${reviewId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorText = await response.text();
                alert(`Failed to delete review: ${response.status} ${response.statusText}`);
                return;
            }
            const data = await response.json();
            if (data.success) {
                alert('✅ Review deleted successfully! The product rating has been updated.');
                fetchAllData();
            } else {
                alert(`❌ Failed to delete review: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('[DeleteReview] Exception:', err);
            alert(`Error deleting review: ${err.message}.`);
        }
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = feedbackSearch === '' ||
            r.productName.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
            r.customerName.toLowerCase().includes(feedbackSearch.toLowerCase());
        const matchesDate = selectedFeedbackDate === '' || r.date === (() => {
            const date = new Date(selectedFeedbackDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        })();
        return matchesSearch && matchesDate;
    });

    const thStyle = { padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface)' };

    return (
        <div className="animate-fade-in flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Customer Reviews ({reviews.length})</h3>
                <div className="flex gap-2">
                    <input type="text" placeholder="Search by product or customer..." value={feedbackSearch} onChange={(e) => setFeedbackSearch(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', width: '250px' }} />
                    <input type="date" value={selectedFeedbackDate} onChange={(e) => setSelectedFeedbackDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} title="Filter by review date" />
                    <button className="btn btn-secondary" onClick={() => { setFeedbackSearch(''); setSelectedFeedbackDate(''); }} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Clear</button>
                    <button className="btn btn-secondary" onClick={fetchAllData} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Refresh</button>
                </div>
            </div>
            <div id="feedback-table-container" className="glass-card" style={{ padding: 0, overflowX: 'auto', overflowY: 'auto', maxHeight: '600px', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead style={{ background: 'var(--surface)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={thStyle}>Product Details</th>
                            <th style={thStyle}>Customer</th>
                            <th style={thStyle}>Rating</th>
                            <th style={thStyle}>Review</th>
                            <th style={thStyle}>Date</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReviews.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{feedbackSearch || selectedFeedbackDate ? 'No reviews found matching your search criteria.' : 'No customer reviews yet.'}</td></tr>
                        ) : (
                            filteredReviews.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div className="flex flex-col gap-1">
                                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{r.productName}</span>
                                            <div className="flex gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <span>Category: <strong>{r.productCategory}</strong></span>
                                                <span>Brand: <strong>{r.productBrand}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2" style={{ marginTop: '4px' }}>
                                                <div style={{ display: 'flex', gap: '1px' }}>
                                                    {[...Array(5)].map((_, i) => (<span key={i} style={{ color: i < Math.round(r.productAvgRating) ? '#fbbf24' : '#d1d5db', fontSize: '0.9rem' }}>★</span>))}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{r.productAvgRating.toFixed(1)} ({r.productReviewCount} reviews)</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span style={{ fontWeight: 600 }}>{r.customerName}</span>
                                                {r.verified && (<span title="Verified Purchase" style={{ color: '#10b981', background: '#10b98115', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>)}
                                            </div>
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {r.customerId?.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[...Array(5)].map((_, i) => (<span key={i} style={{ color: i < r.rating ? '#fbbf24' : '#d1d5db', fontSize: '1.2rem' }}>★</span>))}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: r.rating >= 4 ? 'var(--success)' : r.rating >= 3 ? 'var(--warning)' : 'var(--error)' }}>{r.rating}/5</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', maxWidth: '400px' }}>
                                        <div className="flex flex-col gap-1">
                                            {r.title && (<span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '4px' }}>"{r.title}"</span>)}
                                            <span className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{r.body ? (r.body.length > 150 ? r.body.substring(0, 150) + '...' : r.body) : 'No review text provided'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}><span className="text-muted" style={{ fontSize: '0.85rem' }}>{r.date}</span></td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                        <button className="btn btn-secondary" onClick={() => handleDeleteReview(r.id)} title="Delete Review" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={14} /> Remove</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
