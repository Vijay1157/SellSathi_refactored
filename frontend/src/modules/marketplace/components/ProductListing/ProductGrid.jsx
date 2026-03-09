import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, ShoppingCart, Heart, Eye } from 'lucide-react';
import Rating from '@/modules/shared/components/common/Rating';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';

export default function ProductGrid({
    filteredProducts,
    loading,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    setPriceRange,
    productReviews,
    wishlist,
    toggleWishlist,
    handleAddToCart,
    setSelectedProduct,
    setIsReviewModalOpen,
    setSelectedQuickProduct,
    setIsQuickViewOpen,
    locationSearch
}) {
    const navigate = useNavigate();

    return (
        <main className="product-main">
            {/* Header with Breadcrumbs */}
            <div className="listing-header-inline">
                <div className="breadcrumb">
                    <Link to="/">Home</Link> / <span>Products</span>
                </div>
                <div className="listing-title-row">
                    <h1>{selectedCategory === 'All' ? 'All Products' : selectedCategory} <span className="count">({filteredProducts.length})</span></h1>
                </div>
            </div>

            <div className="product-main-header">
                <div className="view-toggle">
                    <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
                    <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={18} /></button>
                </div>
            </div>
            <AnimatePresence mode="popLayout">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Discovering best products for you...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-state glass-card"
                    >
                        <Search size={48} className="text-muted" />
                        <h2>No products found</h2>
                        <p>
                            {locationSearch.includes('subcategory')
                                ? 'No products found for this selection. Try browsing other categories or subcategories.'
                                : 'Try adjusting your filters or search query to find what you\'re looking for.'
                            }
                        </p>
                        <button onClick={() => { setSelectedCategory('All'); setPriceRange(100000); navigate('/products') }} className="btn btn-primary">Clear All Filters</button>
                    </motion.div>
                ) : (
                    <div className={`products-${viewMode}`}>
                        {filteredProducts.map((p, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={p.id}
                                className="product-card-premium glass-card"
                                onClick={() => {
                                    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                                    const filtered = recentlyViewed.filter(item => item.id !== p.id);
                                    const updated = [p, ...filtered].slice(0, 8);
                                    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
                                    navigate("/product/" + p.id);
                                }}
                                onDoubleClick={() => navigate("/product/" + p.id)}
                            >
                                <div className="card-media">
                                    {p.discount && <span className="discount-badge">{p.discount}</span>}
                                    <img src={p.imageUrl || p.image} alt={p.name} />
                                    <div className="overlay-tools">
                                        <button
                                            onClick={(e) => toggleWishlist(e, p)}
                                            className={`tool-btn ${wishlist.some(item => item.id === p.id) ? 'active' : ''}`}
                                            title="Save to Wishlist"
                                        >
                                            <Heart
                                                size={18}
                                                fill={wishlist.some(item => item.id === p.id) ? "#E11D48" : "none"}
                                                color={wishlist.some(item => item.id === p.id) ? "#E11D48" : "currentColor"}
                                            />
                                        </button>
                                        <button className="tool-btn" title="View Details" onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedQuickProduct(p);
                                            setIsQuickViewOpen(true);
                                        }}><Eye size={18} /></button>
                                    </div>
                                </div>
                                <div className="product-details">
                                    <p className="p-cat">{p.category}</p>
                                    <h3 className="p-name">{p.name}</h3>
                                    <div className="p-rating">
                                        <Rating
                                            averageRating={productReviews[p.id]?.stats?.averageRating || 0}
                                            totalReviews={productReviews[p.id]?.stats?.totalReviews || 0}
                                            size={14}
                                            showCount={true}
                                            className="product-card-rating"
                                        />
                                    </div>
                                    <div className="p-footer">
                                        <div className="p-price-group">
                                            <PriceDisplay product={p} size="sm" />
                                        </div>
                                        {(p.stock === 0 || p.status === 'Out of Stock') && (
                                            <span style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 900, marginRight: '0.5rem', textTransform: 'uppercase' }}>OUT OF STOCK</span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                                            className="add-to-cart-simple"
                                            disabled={p.stock === 0 || p.status === 'Out of Stock'}
                                            style={p.stock === 0 || p.status === 'Out of Stock' ? { background: '#94a3b8', cursor: 'not-allowed', opacity: 0.7 } : {}}
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
