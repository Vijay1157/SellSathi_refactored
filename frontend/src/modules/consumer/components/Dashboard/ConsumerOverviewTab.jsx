import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Clock, CheckCircle2, Package, TrendingUp,
    Download, RotateCcw, Bookmark
} from 'lucide-react';

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

export default function ConsumerOverviewTab({
    stats, orders, selectedOrder, setSelectedOrder,
    recentlyViewed, recommendedProducts,
    onDownloadInvoice, onSwitchTab, onCancelOrder
}) {
    const navigate = useNavigate();

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Orders', value: stats.total, icon: <ShoppingBag size={20} className="text-blue-600" />, bg: 'bg-blue-100' },
                    { label: 'Pending Orders', value: stats.pending, icon: <Clock size={20} className="text-orange-600" />, bg: 'bg-orange-100' },
                    { label: 'Delivered', value: stats.delivered, icon: <CheckCircle2 size={20} className="text-green-600" />, bg: 'bg-green-100' },
                    { label: 'Total Spent', value: `₹${stats.totalSpent}`, icon: <TrendingUp size={20} className="text-purple-600" />, bg: 'bg-purple-100' }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>{s.icon}</div>
                            <div>
                                <p className="text-xs text-gray-500">{s.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">My Orders</h2>
                            <button onClick={() => onSwitchTab('orders')} className="text-sm text-primary hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        {['Order ID', 'Date', 'Items', 'Amount', 'Status', 'Action'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {orders.slice(0, 5).map((order) => (
                                        <tr key={order.id} onClick={() => setSelectedOrder(order)}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                        {order.items?.[0]?.imageUrl || order.items?.[0]?.image ? (
                                                            <img src={order.items[0].imageUrl || order.items[0].image} alt="Product" className="w-full h-full object-cover" />
                                                        ) : (<Package size={16} className="text-gray-400" />)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">#{order.orderId || order.id.substring(0, 6)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || 0} items</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{order.total?.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {order.status === 'Delivered' && '●'}{order.status === 'Pending' && '●'}{order.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/track?orderId=${order.orderId || order.id}`); }}
                                                    className="text-sm text-primary hover:underline font-medium">Track</button>
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

                    {/* Recently Viewed */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">Recently Viewed</h2>
                            <button onClick={() => navigate('/products')} className="text-sm text-primary hover:underline">View All</button>
                        </div>
                        <div className="p-4">
                            {recentlyViewed.length > 0 ? (
                                <div className="grid grid-cols-5 gap-4">
                                    {recentlyViewed.map((product) => (
                                        <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                                <img src={product.imageUrl || product.image || '/placeholder.png'} alt={product.name}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-xs text-gray-700 font-medium truncate">{product.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm font-bold text-gray-900">₹{product.price?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package size={48} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No recently viewed products</p>
                                    <button onClick={() => navigate('/products')} className="mt-3 text-primary text-sm font-medium hover:underline">Start Shopping</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommended Products */}
                    {recommendedProducts.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-gray-900">Recommended for You</h2>
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">HOT</span>
                                </div>
                                <button onClick={() => navigate('/products')} className="text-sm text-primary hover:underline">View All</button>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-5 gap-4">
                                    {recommendedProducts.map((product) => (
                                        <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                                <img src={product.imageUrl || product.image || '/placeholder.png'} alt={product.name}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-xs text-gray-700 font-medium truncate">{product.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm font-bold text-gray-900">₹{product.price?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {selectedOrder && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-gray-900">Order Details</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    ● {selectedOrder.status || 'Pending'}
                                </span>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-3 mb-6">
                                {[
                                    { label: 'Order Placed', icon: <CheckCircle2 size={14} />, active: !!selectedOrder.status, color: 'green', date: formatDate(selectedOrder.createdAt) },
                                    { label: 'Processing', icon: <Clock size={14} />, active: ['Processing','Shipped','Delivered'].includes(selectedOrder.status), color: 'orange' },
                                    { label: 'Shipped', icon: <Package size={14} />, active: ['Shipped','Delivered'].includes(selectedOrder.status), color: 'blue' },
                                    { label: 'Out for Delivery', icon: <TrendingUp size={14} />, active: ['Out for Delivery','Delivered'].includes(selectedOrder.status), color: 'purple' },
                                    { label: 'Delivered', icon: <CheckCircle2 size={14} />, active: selectedOrder.status === 'Delivered', color: 'green' }
                                ].map((step, idx, arr) => (
                                    <div key={step.label}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.active ? `bg-${step.color}-500 text-white` : 'bg-gray-200 text-gray-400'}`}>
                                                {step.icon}
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <p className="font-medium text-sm text-gray-900">{step.label}</p>
                                                {step.date && <p className="text-xs text-gray-500">{step.date}</p>}
                                            </div>
                                        </div>
                                        {idx < arr.length - 1 && <div className="ml-4 w-0.5 h-4 bg-gray-200"></div>}
                                    </div>
                                ))}
                            </div>

                            {/* Order Items */}
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                                {item.imageUrl && (
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                                                </div>
                                                <p className="text-xs font-black text-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Shipping Address */}
                            {selectedOrder.shippingAddress && (
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Address</h4>
                                    <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
                                        <p className="font-bold text-gray-900">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                                        <p className="mt-1">{selectedOrder.shippingAddress.addressLine}</p>
                                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.pincode}</p>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            {selectedOrder.paymentMethod && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Method</h4>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-bold text-gray-900 uppercase">{selectedOrder.paymentMethod}</p>
                                        {selectedOrder.paymentId && <p className="text-xs text-gray-500 mt-1">Payment ID: {selectedOrder.paymentId}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                <button onClick={() => navigate(`/track?orderId=${selectedOrder.orderId || selectedOrder.id}`)}
                                    className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Track Order</button>
                                <button onClick={() => onDownloadInvoice(selectedOrder.orderId || selectedOrder.id)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Download size={16} /> Download Invoice
                                </button>
                                {['Placed', 'Pending', 'Processing'].includes(selectedOrder.status) && (
                                    <button onClick={() => onCancelOrder(selectedOrder.id)}
                                        className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => navigate('/products')} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left border border-transparent hover:border-blue-200"
                            >
                                <ShoppingBag size={18} className="text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Buy Again</span>
                            </button>
                            <button 
                                onClick={() => {
                                    if (!selectedOrder) {
                                        alert('Please select an order first to initiate a return.');
                                        return;
                                    }
                                    if (selectedOrder.status === 'Delivered') {
                                        // Navigate to a return page or show return modal
                                        alert('Return request initiated for Order #' + (selectedOrder.orderId || selectedOrder.id) + '. Our team will contact you within 24 hours.');
                                    } else if (selectedOrder.status === 'Cancelled') {
                                        alert('This order has already been cancelled.');
                                    } else {
                                        alert('Only delivered orders can be returned. This order is currently: ' + selectedOrder.status);
                                    }
                                }} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors text-left border border-transparent hover:border-orange-200"
                                disabled={!selectedOrder}
                                style={{ opacity: !selectedOrder ? 0.5 : 1, cursor: !selectedOrder ? 'not-allowed' : 'pointer' }}
                            >
                                <RotateCcw size={18} className="text-orange-600" />
                                <span className="text-sm font-medium text-gray-700">Return Order</span>
                            </button>
                            <button 
                                onClick={() => onSwitchTab('wishlist')} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left border border-transparent hover:border-red-200"
                            >
                                <Bookmark size={18} className="text-red-600" />
                                <span className="text-sm font-medium text-gray-700">Saved Items</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
