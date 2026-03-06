import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return 'Invalid Date';
    } catch { return 'Invalid Date'; }
};

export default function ConsumerOrdersTab({ orders, onSelectOrder, onDownloadInvoice }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
                <span className="text-sm text-gray-500">{orders.length} total orders</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Order ID', 'Date', 'Items', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => onSelectOrder(order)}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                            {order.items?.[0]?.imageUrl || order.items?.[0]?.image ? (
                                                <img src={order.items[0].imageUrl || order.items[0].image} alt="Product" className="w-full h-full object-cover" />
                                            ) : (<Package size={16} className="text-gray-400" />)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">#{order.orderId || order.id.substring(0, 8)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                                    {order.items?.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">{order.items[0].name}{order.items.length > 1 && ` +${order.items.length - 1} more`}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.total?.toLocaleString('en-IN')}</td>
                                <td className="px-6 py-4"><span className="text-xs font-medium text-gray-700 uppercase">{order.paymentMethod || 'N/A'}</span></td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>● {order.status || 'Processing'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/track?orderId=${order.orderId || order.id}`); }}
                                            className="text-sm text-primary hover:underline font-medium">Track</button>
                                        <span className="text-gray-300">|</span>
                                        <button onClick={(e) => { e.stopPropagation(); onDownloadInvoice(order.orderId || order.id); }}
                                            className="text-sm text-gray-600 hover:underline font-medium">Invoice</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-12 text-center">
                        <Package size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No orders yet</p>
                        <button onClick={() => navigate('/products')} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">Start Shopping</button>
                    </div>
                )}
            </div>
        </div>
    );
}
