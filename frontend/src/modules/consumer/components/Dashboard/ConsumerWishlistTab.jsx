import { useNavigate } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';

export default function ConsumerWishlistTab({ wishlist, onRemoveFromWishlist }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Wishlist</h2>
                <span className="text-sm text-gray-500">{wishlist.length} items</span>
            </div>
            {wishlist.length === 0 ? (
                <div className="text-center py-12">
                    <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <button onClick={() => navigate('/products')}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-square bg-gray-100 relative">
                                    {item.imageUrl || item.image ? (
                                        <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package size={48} className="text-gray-300" />
                                        </div>
                                    )}
                                    <button onClick={() => onRemoveFromWishlist(item.id)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors">
                                        <Heart size={16} className="text-red-500 fill-red-500" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-primary">₹{item.price?.toLocaleString()}</span>
                                        <button onClick={() => navigate('/products')}
                                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
