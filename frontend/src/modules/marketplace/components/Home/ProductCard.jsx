import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';

export default function ProductCard({ 
    product, 
    index, 
    wishlist, 
    productReviews, 
    handleAddToCart, 
    toggleWishlist, 
    openQuickView 
}) {
    const navigate = useNavigate();
    
    if (!product || !product.id) return null;
    const isWishlisted = wishlist.some(item => item.id === product.id);

    return (
        <motion.div
            className="product-card-premium"
            whileHover={{ y: -8 }}
            onClick={() => {
                const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const filtered = recentlyViewed.filter(item => item.id !== product.id);
                const updated = [product, ...filtered].slice(0, 8);
                localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                navigate("/product/" + product.id);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div className="card-media">
                {product.discount && <span className="discount-badge">{product.discount}</span>}
                <img src={product.image || product.imageUrl} alt={product.name} />
                <div className="overlay-tools">
                    <button
                        onClick={(e) => toggleWishlist(e, product)}
                        className={`tool-btn ${isWishlisted ? 'active' : ''}`}
                        title="Add to Wishlist"
                    >
                        <Heart
                            size={18}
                            fill={isWishlisted ? "#ef4444" : "none"}
                            color={isWishlisted ? "#ef4444" : "currentColor"}
                        />
                    </button>
                    <button
                        onClick={(e) => openQuickView(e, product)}
                        className="tool-btn"
                        title="Quick View"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            </div>
            <div className="card-info">
                <div className="category-row">
                    <span className="category">{product.category || 'Product'}</span>
                </div>
                <h3 className="title">{product.name}</h3>

                <div className="rating-row">
                    <Rating
                        averageRating={productReviews[product.id]?.stats?.averageRating || 0}
                        totalReviews={productReviews[product.id]?.stats?.totalReviews || 0}
                        size={12}
                        showCount={true}
                        className="home-product-rating"
                    />
                </div>

                <div className="info-bottom">
                    <PriceDisplay product={product} size="sm" showGSTIndicator={false} />
                    <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="add-to-cart-simple"
                        title="Add to Cart"
                        disabled={product.stock === 0 || product.status === 'Out of Stock'}
                        style={product.stock === 0 || product.status === 'Out of Stock' ? { opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' } : {}}
                    >
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

