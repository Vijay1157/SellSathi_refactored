import { Users, Box, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';

const StatCard = ({ label, value, icon, color, loading }) => (
    <div className="glass-card flex flex-col justify-center gap-4" style={{ minHeight: '180px' }}>
        <div className="flex justify-between items-start">
            <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${color}22`, color: color }}>
                {icon}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{loading ? '-' : value}</h3>
            <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>{label}</p>
        </div>
    </div>
);

const StatCardWithView = ({ label, value, icon, color, onView, loading }) => (
    <div className="glass-card flex flex-col justify-between gap-4" style={{ minHeight: '180px' }}>
        <div className="flex justify-between items-start">
            <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${color}22`, color: color }}>
                {icon}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{loading ? '-' : value}</h3>
            <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>{label}</p>
        </div>
        <button
            className="btn btn-secondary"
            onClick={onView}
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
        >
            View
        </button>
    </div>
);

export default function OverviewTab({ stats, loading, setActiveTab, setSearchTerm, setSelectedProductDate }) {
    return (
        <div className="animate-fade-in flex flex-col gap-6">
            {/* Welcome Header */}
            <div className="glass-card" style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'white',
                borderRadius: '16px'
            }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Welcome, Admin
                </h1>
                <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                    Manage your marketplace from this central dashboard
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <StatCardWithView
                    label="Total Sellers"
                    value={stats.allSellers}
                    icon={<Users size={32} />}
                    color="var(--primary)"
                    loading={loading}
                    onView={() => setActiveTab('sellers')}
                />
                <StatCardWithView
                    label="Active Products"
                    value={stats.totalProducts}
                    icon={<Box size={32} />}
                    color="var(--secondary)"
                    loading={loading}
                    onView={() => {
                        setSearchTerm('');
                        setSelectedProductDate('');
                        setActiveTab('products');
                    }}
                />
                <StatCardWithView
                    label="Daily Orders"
                    value={stats.todayOrders}
                    icon={<ShoppingCart size={32} />}
                    color="var(--accent)"
                    loading={loading}
                    onView={() => setActiveTab('orders')}
                />
                <StatCardWithView
                    label="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={<ShieldCheck size={32} />}
                    color="var(--warning)"
                    loading={loading}
                    onView={() => setActiveTab('sellers')}
                />
                <StatCardWithView
                    label="Total Reviews"
                    value={stats.totalFeedback}
                    icon={<Users size={32} />}
                    color="#10b981"
                    loading={loading}
                    onView={() => setActiveTab('feedback')}
                />
                <StatCardWithView
                    label="Orders to Deliver"
                    value={stats.ordersToDeliver}
                    icon={<Truck size={32} />}
                    color="#f59e0b"
                    loading={loading}
                    onView={() => setActiveTab('orders')}
                />
            </div>
        </div>
    );
}

export { StatCard, StatCardWithView };
