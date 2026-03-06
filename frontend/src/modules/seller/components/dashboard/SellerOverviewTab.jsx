import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SellerOverviewTab({ statCards, orders, performanceYear, setPerformanceYear }) {
    // Calculate monthly sales data dynamically from orders
    const monthlySalesData = (() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const targetYear = performanceYear === 'This Year' ? currentYear : currentYear - 1;
        const monthlyData = months.map(m => ({ name: m, sales: 0, orders: 0 }));

        orders.forEach(order => {
            let orderDate;
            if (order.date) orderDate = new Date(order.date);
            else if (order.createdAt) orderDate = new Date(order.createdAt);
            if (!orderDate || isNaN(orderDate.getTime())) orderDate = new Date();

            const orderYear = orderDate.getFullYear();
            const finalYear = isNaN(orderYear) ? currentYear : orderYear;

            if (finalYear === targetYear) {
                const monthIndex = orderDate.getMonth();
                const finalMonth = (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) ? 0 : monthIndex;
                monthlyData[finalMonth].sales += Number(order.total) || 0;
                monthlyData[finalMonth].orders += 1;
            }
        });
        return monthlyData;
    })();

    return (
        <div className="animate-fade-in flex flex-col" style={{ gap: '2.5rem' }}>
            {/* Panoramic Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {statCards.map((s, i) => (
                    <div key={i} style={{
                        background: 'white', padding: '1.5rem', borderRadius: '20px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', height: '160px', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: s.color + '15', color: s.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {s.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: '0.25rem' }}>{s.value}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Analytics */}
            <div style={{
                background: 'white', borderRadius: '24px', padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                border: '1px solid #f1f5f9'
            }}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Performance Analytics</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Annual Sales Growth</p>
                    </div>
                    <select
                        value={performanceYear}
                        onChange={(e) => setPerformanceYear(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}
                    >
                        <option value="This Year">This Year</option>
                        <option value="Last Year">Last Year</option>
                    </select>
                </div>

                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={monthlySalesData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`₹${value}`, 'Sales']}
                            />
                            <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
