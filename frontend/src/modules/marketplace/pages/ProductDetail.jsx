import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import { db, auth } from '@/modules/shared/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { addToCart } from '@/modules/shared/utils/cartUtils';
import { authFetch, API_BASE } from '@/modules/shared/utils/api';
import { addToWishlist, removeFromWishlist, listenToWishlist } from '@/modules/shared/utils/wishlistUtils';
import { ArrowRight, Share2, MessageCircle, Facebook, Twitter, Mail, Rss } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductGallery from '../components/ProductDetail/ProductGallery';
import ProductInfo from '../components/ProductDetail/ProductInfo';
import ProductReviews from '../components/ProductDetail/ProductReviews';
import RelatedProducts from '../components/ProductDetail/RelatedProducts';
import { getProductPricing } from '@/modules/shared/utils/priceUtils';
import { fetchProductReviews, calculateRatingStats } from '@/modules/shared/utils/reviewUtils';
import { getFrequentlyBoughtTogether, getSimilarProducts } from '@/modules/shared/utils/recommendationUtils';



export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedStorage, setSelectedStorage] = useState(null);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState({});
    const [purchaseOption, setPurchaseOption] = useState('standard');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [fbtSelections, setFbtSelections] = useState({ 0: true, 1: false, 2: false });
    const [fbtProducts, setFbtProducts] = useState([]);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [isSaved, setIsSaved] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const [seller, setSeller] = useState(null);
    const [isEligibleForReview, setIsEligibleForReview] = useState(false);
    const [eligibleOrder, setEligibleOrder] = useState(null);

    // Consolidated Price Calculation
    const productPriceInfo = useMemo(() => {
        return getProductPricing(product, {
            size: selectedSize,
            storage: selectedStorage,
            memory: selectedMemory,
            purchaseOption: purchaseOption
        });
    }, [product, selectedSize, selectedStorage, selectedMemory, purchaseOption]);

    // Build comprehensive images array including main image, additional images, and variant images
    const images = useMemo(() => {
        if (!product) return [];
        
        const imageSet = new Set();
        
        if (product.image) imageSet.add(product.image);
        if (product.imageUrl) imageSet.add(product.imageUrl);
        
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(img => {
                if (img && typeof img === 'string') imageSet.add(img);
            });
        }
        
        if (product.variantImages && typeof product.variantImages === 'object') {
            Object.values(product.variantImages).forEach(img => {
                if (img && typeof img === 'string') imageSet.add(img);
            });
        }
        
        const imagesArray = Array.from(imageSet).filter(Boolean);
        return imagesArray.length > 0 ? imagesArray : ['/placeholder-image.jpg'];
    }, [product]);


    const setupSellerListener = async (sellerId) => {
        if (!sellerId || sellerId === "system_generated" || sellerId === "official") {
            setSeller(null);
            return;
        }

        // Primary: Fetch seller via public backend API (no auth needed, avoids Firestore quota)
        try {
            const response = await fetch(`${API_BASE}/seller/${sellerId}/public-profile`);
            const data = await response.json();

            if (data.success && data.seller) {
                const s = data.seller;
                setSeller({
                    name: s.name || "Verified Seller",
                    shopName: s.shopName || "SellSathi Partner",
                    companyName: s.shopName || "Registered Hub",
                    city: s.city || "India",
                    category: s.category || "General",
                    joinedAt: s.joinedAt ? new Date(s.joinedAt) : null
                });
                return;
            }
        } catch (apiErr) {
            console.log("API seller fetch failed, trying Firestore:", apiErr.message);
        }

        // Fallback: Firestore direct — use one-time getDoc (NOT onSnapshot).
        // Seller info is static; a real-time listener wastes quota on reconnects
        // and fires a read on every doc mutation in the background.
        try {
            const sSnap = await getDoc(doc(db, "sellers", sellerId));
            if (sSnap.exists()) {
                const sData = sSnap.data();
                if (sData.sellerStatus !== 'APPROVED') { setSeller(null); return; }

                const uSnap = await getDoc(doc(db, "users", sellerId));
                const uData = uSnap.exists() ? uSnap.data() : {};
                let city = "India";
                if (sData.address) {
                    const parts = sData.address.split(',').map(p => p.trim());
                    const vtcPart = parts.find(p => p.startsWith('VTC:'));
                    if (vtcPart) city = vtcPart.replace('VTC:', '').trim();
                    else if (parts.length >= 2) city = parts[1];
                    else city = parts[0];
                }
                setSeller({
                    name: uData.fullName || sData.extractedName || "Verified Seller",
                    shopName: sData.shopName || "SellSathi Partner",
                    companyName: sData.shopName || "Registered Hub",
                    city, category: sData.category || "General",
                    joinedAt: sData.approvedAt ?
                        (sData.approvedAt.toDate ? sData.approvedAt.toDate() : new Date(sData.approvedAt._seconds * 1000)) :
                        (sData.appliedAt ? (sData.appliedAt.toDate ? sData.appliedAt.toDate() : new Date(sData.appliedAt._seconds * 1000)) : null)
                });
            } else { setSeller(null); }
        } catch (err) {
            console.error("All seller fetch methods failed:", err);
            setSeller(null);
        }
    };

    const fetchProduct = async () => {
        try {
            const docRef = doc(db, "products", id);
            const docSnap = await getDoc(docRef);
            let data = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

            const mock = deals[id] || (id.includes('fashion') ? deals["fashion-1"] : (id.includes('deal') ? deals["deal-1"] : deals["generic"]));
            if (mock) {
                data = {
                    ...mock,
                    ...data,
                    colors: (data?.colors && data.colors.length > 0) ? data.colors : mock.colors,
                    materials: (data?.materials && data.materials.length > 0) ? data.materials : mock.materials,
                    types: (data?.types && data.types.length > 0) ? data.types : mock.types,
                    specifications: (data?.specifications && Object.keys(data.specifications).length > 0) ? data.specifications : mock.specifications,
                    description: data?.description || mock.description || ("Premium " + (data?.name || mock.name || "Product") + " with cutting-edge features.")
                };
            }

            if (data) {
                data.id = data.id || id;
                // Normalise: seller products store `title` not `name`
                if (!data.name && data.title) data.name = data.title;
                setProduct(data);
                if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
                if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[1] || data.sizes[0]);
                if (data.storage && data.storage.length > 0) setSelectedStorage(data.storage[0]);
                if (data.memory && data.memory.length > 0) setSelectedMemory(data.memory[0]);
                updateRecentlyViewed(data);
                setupSellerListener(data.sellerId);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const setupReviewsListener = () => {
        const loadReviews = async () => {
            try {
                const { reviews, stats } = await fetchProductReviews(id);
                setReviews(reviews);
                setReviewStats({
                    average: stats.averageRating,
                    total: stats.totalReviews,
                    distribution: stats.distribution
                });
            } catch (err) {
                console.error("Failed to load reviews:", err);
            }
        };

        const checkEligibility = async (retryCount = 0) => {
            let currentUid = auth.currentUser?.uid;

            if (!currentUid) {
                try {
                    const localUser = JSON.parse(localStorage.getItem('user'));
                    currentUid = localUser?.uid;
                } catch (e) { }
            }

            if (!currentUid) {
                // If no user yet, retry in 1s (Firebase auth might still be initializing)
                if (retryCount < 3) {
                    setTimeout(() => checkEligibility(retryCount + 1), 1000);
                }
                return;
            }

            try {
                const res = await authFetch(`/orders/${currentUid}/reviewable-orders`);
                if (!res.ok) throw new Error('Failed to fetch eligibility');

                const data = await res.json();
                if (data.success && data.orders) {
                    // Match by ID or ProductID, trimmed and case-insensitive
                    const order = data.orders.find(o =>
                        String(o.productId).trim().toLowerCase() === String(id).trim().toLowerCase()
                    );

                    if (order) {
                        setIsEligibleForReview(true);
                        setEligibleOrder(order);
                        return; // Success
                    }
                }
                setIsEligibleForReview(false);
                setEligibleOrder(null);
            } catch (err) {
                console.error("Eligibility check error:", err);
                // Silently ignore, but maybe retry once
                if (retryCount < 1) {
                    setTimeout(() => checkEligibility(retryCount + 1), 2000);
                }
            }
        };

        loadReviews();
        checkEligibility();

        const handleUserChange = () => checkEligibility();
        window.addEventListener('userDataChanged', handleUserChange);
        window.addEventListener('reviewsUpdate', loadReviews);

        return () => {
            window.removeEventListener('reviewsUpdate', loadReviews);
            window.removeEventListener('userDataChanged', handleUserChange);
        };
    };

    useEffect(() => {
        const setupSellerListener = async (sellerId) => {
            if (!sellerId || sellerId === "system_generated" || sellerId === "official") {
                setSeller(null);
                return;
            }

            // Primary: Fetch seller via public backend API (no auth needed, avoids Firestore quota)
            try {
                const response = await fetch(`${API_BASE}/api/seller/${sellerId}/public-profile`);
                const data = await response.json();

                if (data.success && data.seller) {
                    const s = data.seller;
                    setSeller({
                        name: s.name || "Verified Seller",
                        shopName: s.shopName || "SellSathi Partner",
                        companyName: s.shopName || "Registered Hub",
                        city: s.city || "India",
                        category: s.category || "General",
                        joinedAt: s.joinedAt ? new Date(s.joinedAt) : null
                    });
                    return;
                }
            } catch (apiErr) {
                // Fallback to Firestore if API fails
            }

            // Fallback: Firestore direct - Use one-time read instead of onSnapshot to reduce quota
            try {
                const sellerSnap = await getDoc(doc(db, "sellers", sellerId));
                if (sellerSnap.exists()) {
                    const sData = sellerSnap.data();
                    if (sData.sellerStatus !== 'APPROVED') { 
                        setSeller(null); 
                        return; 
                    }

                    const userSnap = await getDoc(doc(db, "users", sellerId));
                    const uData = userSnap.exists() ? userSnap.data() : {};
                    let city = "India";
                    if (sData.address) {
                        const parts = sData.address.split(',').map(p => p.trim());
                        const vtcPart = parts.find(p => p.startsWith('VTC:'));
                        if (vtcPart) city = vtcPart.replace('VTC:', '').trim();
                        else if (parts.length >= 2) city = parts[1];
                        else city = parts[0];
                    }
                    setSeller({
                        name: uData.fullName || sData.extractedName || "Verified Seller",
                        shopName: sData.shopName || "SellSathi Partner",
                        companyName: sData.shopName || "Registered Hub",
                        city, category: sData.category || "General",
                        joinedAt: sData.approvedAt ?
                            (sData.approvedAt.toDate ? sData.approvedAt.toDate() : new Date(sData.approvedAt._seconds * 1000)) :
                            (sData.appliedAt ? (sData.appliedAt.toDate ? sData.appliedAt.toDate() : new Date(sData.appliedAt._seconds * 1000)) : null)
                    });
                } else { 
                    setSeller(null); 
                }
            } catch (err) {
                console.error("All seller fetch methods failed:", err);
                setSeller(null);
            }
        };

        const fetchProduct = async () => {
            try {
                let data = null;

                // Primary: fetch via backend API (avoids direct Firestore client SDK read)
                try {
                    const apiRes = await fetch(`${API_BASE}/products/${id}`);
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        if (apiData.success && apiData.product) {
                            data = { ...apiData.product, id: apiData.product.id || id };
                        }
                    }
                } catch (apiErr) {
                    console.warn('[ProductDetail] Backend API failed, falling back to Firestore:', apiErr.message);
                }

                // Fallback: direct Firestore read if API fails
                if (!data) {
                    const docSnap = await getDoc(doc(db, 'products', id));
                    if (!docSnap.exists()) {
                        setProduct(null);
                        setLoading(false);
                        return;
                    }
                    data = { id: docSnap.id, ...docSnap.data() };
                }

                // Normalize: seller products store `title` not `name`
                if (!data.name && data.title) data.name = data.title;
                if (!data.description) data.description = `Premium ${data.name || 'Product'} with cutting-edge features.`;

                setProduct(data);
                if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
                if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[1] || data.sizes[0]);
                if (data.storage && data.storage.length > 0) setSelectedStorage(data.storage[0]);
                if (data.memory && data.memory.length > 0) setSelectedMemory(data.memory[0]);

                updateRecentlyViewed(data);
                setupSellerListener(data.sellerId);
                loadDynamicRecommendations(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching product:', err);
                setProduct(null);
                setLoading(false);
            }
        };

        const loadDynamicRecommendations = async (productData) => {
            try {
                // Load frequently bought together
                const fbt = await getFrequentlyBoughtTogether(productData.id);
                if (fbt.length > 0) {
                    setFbtProducts(fbt);
                    // Initialize selections with first product selected
                    const selections = { 0: true };
                    fbt.forEach((_, idx) => {
                        if (idx > 0) selections[idx] = false;
                    });
                    setFbtSelections(selections);
                }
                
                // Load similar products
                const similar = await getSimilarProducts(productData);
                setSimilarProducts(similar);
            } catch (err) {
                console.error('Error loading recommendations:', err);
            }
        };

        const setupReviewsListener = () => {
            const loadReviews = async () => {
                try {
                    const { reviews, stats } = await fetchProductReviews(id);
                    setReviews(reviews);
                    setReviewStats({
                        average: stats.averageRating,
                        total: stats.totalReviews,
                        distribution: stats.distribution
                    });
                } catch (err) {
                    console.error("Failed to load reviews:", err);
                }
            };

            const checkEligibility = async (retryCount = 0) => {
                let currentUid = auth.currentUser?.uid;

                if (!currentUid) {
                    try {
                        const localUser = JSON.parse(localStorage.getItem('user'));
                        currentUid = localUser?.uid;
                    } catch (e) { }
                }

                if (!currentUid) {
                    // If no user yet, retry in 1s (Firebase auth might still be initializing)
                    if (retryCount < 3) {
                        setTimeout(() => checkEligibility(retryCount + 1), 1000);
                    }
                    return;
                }

                try {
                    const res = await authFetch(`/orders/user/${currentUid}/reviewable-orders`);
                    if (!res.ok) throw new Error('Failed to fetch eligibility');

                    const data = await res.json();
                    if (data.success && data.orders) {
                        // Match by ID or ProductID, trimmed and case-insensitive
                        const order = data.orders.find(o =>
                            String(o.productId).trim().toLowerCase() === String(id).trim().toLowerCase()
                        );

                        if (order) {
                            setIsEligibleForReview(true);
                            setEligibleOrder(order);
                            return; // Success
                        }
                    }
                    setIsEligibleForReview(false);
                    setEligibleOrder(null);
                } catch (err) {
                    console.error("Eligibility check error:", err);
                    // Silently ignore, but maybe retry once
                    if (retryCount < 1) {
                        setTimeout(() => checkEligibility(retryCount + 1), 2000);
                    }
                }
            };

            loadReviews();
            checkEligibility();

            const handleUserChange = () => checkEligibility();
            window.addEventListener('userDataChanged', handleUserChange);
            window.addEventListener('reviewsUpdate', loadReviews);

            return () => {
                window.removeEventListener('reviewsUpdate', loadReviews);
                window.removeEventListener('userDataChanged', handleUserChange);
            };
        };

        fetchProduct();
        loadRecentlyViewed();
        // Sync wishlist status
        const unsubscribeWishlist = listenToWishlist((items) => {
            const saved = items.some(item => String(item.id).trim().toLowerCase() === String(id).trim().toLowerCase());
            setIsSaved(saved);
        });
        const cleanupReviews = setupReviewsListener();
        window.scrollTo(0, 0);
        return () => {
            if (cleanupReviews) cleanupReviews();
            if (unsubscribeWishlist) unsubscribeWishlist();
        };
    }, [id]);


    const calculateStats = (revs) => {
        const stats = calculateRatingStats(revs);
        setReviewStats({
            average: stats.averageRating,
            total: stats.totalReviews,
            distribution: stats.distribution
        });
    };


    const toggleWishlist = async () => {
        if (!auth.currentUser) {
            window.dispatchEvent(new Event('openLoginModal'));
            return;
        }
        if (!product) return;
        try {
            if (isSaved) {
                const res = await removeFromWishlist(id);
                if (res.success) {
                    setIsSaved(false);
                } else {
                    alert('Wishlist error: ' + (res.message || 'Failed to remove'));
                }
            } else {
                const res = await addToWishlist(product);
                if (res.success) {
                    setIsSaved(true);
                } else {
                    alert('Wishlist error: ' + (res.message || 'Failed to add'));
                }
            }
        } catch (err) {
            alert('Wishlist connection error. Please ensure the backend is running.');
        }
    };



    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: product.description,
                    url: window.location.href,
                });
            } catch (err) {
                setIsShareModalOpen(true);
            }
        } else {
            setIsShareModalOpen(true);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Link'), 2000);
    };

    const updateRecentlyViewed = (p) => {
        if (!p) return;
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const filtered = viewed.filter(item => item.id !== p.id);
        const updated = [p, ...filtered].slice(0, 8);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
        setRecentlyViewed(updated);
    };

    const loadRecentlyViewed = () => {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        setRecentlyViewed(viewed);
    };

    const handleAddToCart = async () => {
        if (!auth.currentUser) {
            window.dispatchEvent(new Event('openLoginModal'));
            return;
        }
        if (!product) return;
        const inStock = product.stock !== 0 && product.status !== 'Out of Stock';
        if (!inStock) return;

        const selections = {
            color: selectedColor,
            size: selectedSize,
            storage: selectedStorage,
            memory: selectedMemory,
            purchaseOption: purchaseOption
        };
        const productWithNumPrice = { ...product, price: Number(product.price) };
        const res = await addToCart(productWithNumPrice, selections);
        if (res.success) {
            alert('✅ Product added to cart successfully!');
            window.dispatchEvent(new Event('cartUpdate'));
        } else {
            alert('❌ Failed to add product to cart: ' + (res.message || 'Please try again.'));
        }
    };

    const handleBuyNow = async () => {
        if (!auth.currentUser) {
            window.dispatchEvent(new Event('openLoginModal'));
            return;
        }
        if (!product) return;
        const inStock = product.stock !== 0 && product.status !== 'Out of Stock';
        if (!inStock) return;

        const selections = {
            color: selectedColor,
            size: selectedSize,
            storage: selectedStorage,
            memory: selectedMemory,
            purchaseOption: purchaseOption
        };
        
        // Calculate correct prices based on selections (same as addToCart)
        const { finalPrice, strikethroughPrice } = getProductPricing(product, selections);
        
        // Create a temporary cart item for Buy Now (don't add to actual cart)
        const buyNowItem = {
            ...product,
            id: product.id,
            productId: product.id,
            sellerId: product.sellerId || null,
            name: product.name || product.title,
            price: finalPrice,
            originalPrice: strikethroughPrice,
            quantity: 1,
            imageUrl: product.image || product.imageUrl,
            selections: selections
        };
        
        // Navigate directly to checkout with Buy Now product data
        navigate('/checkout', { state: { buyNowProduct: buyNowItem } });
    };

    const toggleFbt = (index) => {
        setFbtSelections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const fbtTotalPrice = fbtProducts.reduce((sum, p, i) => fbtSelections[i] ? sum + p.price : sum, 0);
    const fbtTotalCount = Object.values(fbtSelections).filter(Boolean).length;

    if (loading) return <div className="loading-fullscreen"><div className="spinner"></div></div>;
    if (!product) return <div className="error-fullscreen"><h2>Oops! Product not found.</h2><button onClick={() => navigate('/')}>Go Home</button></div>;

    return (
        <div className="pd-wrapper bg-white">
            <div className="container">
                {/* Breadcrumb */}
                <div className="pd-breadcrumb">
                    <button onClick={() => navigate('/')}>Home</button> /
                    <button onClick={() => navigate(`/products?category=${product.category}`)}>{product.category || 'Electronics'}</button>
                    {product.subCategory && (
                        <> / <button onClick={() => navigate(`/products?category=${product.category}&sub=${product.subCategory}`)}>{product.subCategory}</button></>
                    )} /
                    <span className="current">{product.name}</span>
                </div>

                <div className="pd-main-grid">
                    {/* Left: Interactive Media */}
                    <ProductGallery 
                        product={product} 
                        images={images}
                        activeImageIndex={activeImageIndex}
                        setActiveImageIndex={setActiveImageIndex}
                    />

                    {/* Right: Info & Config */}
                    <ProductInfo
                        product={product}
                        reviewStats={reviewStats}
                        isSaved={isSaved}
                        toggleWishlist={toggleWishlist}
                        handleShare={handleShare}
                        handleAddToCart={handleAddToCart}
                        handleBuyNow={handleBuyNow}
                        selectedColor={selectedColor}
                        setSelectedColor={setSelectedColor}
                        selectedSize={selectedSize}
                        setSelectedSize={setSelectedSize}
                        selectedStorage={selectedStorage}
                        setSelectedStorage={setSelectedStorage}
                        selectedMemory={selectedMemory}
                        setSelectedMemory={setSelectedMemory}
                        purchaseOption={purchaseOption}
                        images={images}
                        setActiveImageIndex={setActiveImageIndex}
                        isSizeChartOpen={isSizeChartOpen}
                        setIsSizeChartOpen={setIsSizeChartOpen}
                    />
                </div>

                {/* Details Section */}
                <div className="pd-details-scroller">
                    <ProductReviews
                        productId={id}
                        product={product}
                        reviews={reviews}
                        reviewStats={reviewStats}
                        isEligibleForReview={isEligibleForReview}
                        setIsEligibleForReview={setIsEligibleForReview}
                        eligibleOrder={eligibleOrder}
                        setEligibleOrder={setEligibleOrder}
                    />
                </div>

                <RelatedProducts
                    product={product}
                    productId={id}
                    seller={seller}
                    fbtProducts={fbtProducts}
                    fbtSelections={fbtSelections}
                    toggleFbt={toggleFbt}
                    fbtTotalPrice={fbtTotalPrice}
                    fbtTotalCount={fbtTotalCount}
                    similarProducts={similarProducts}
                    recentlyViewed={recentlyViewed}
                />
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <div className="share-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
                        <motion.div
                            className="share-modal glass-card"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="share-header">
                                <h3>Share</h3>
                                <button className="close-btn" onClick={() => setIsShareModalOpen(false)}><ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} /></button>
                            </div>

                            <div className="share-link-section">
                                <div className="link-box">
                                    <div className="link-info">
                                        <span className="domain">Sellsathi.com</span>
                                        <span className="full-url">{window.location.href}</span>
                                    </div>
                                    <button className="copy-btn" onClick={copyToClipboard}>
                                        <Share2 size={18} />
                                        <span>{copyStatus}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="share-grid">
                                <div className="share-option">
                                    <div className="icon-box whatsapp"><MessageCircle size={20} /></div>
                                    <span>WhatsApp</span>
                                </div>
                                <div className="share-option">
                                    <div className="icon-box facebook"><Facebook size={20} /></div>
                                    <span>Facebook</span>
                                </div>
                                <div className="share-option">
                                    <div className="icon-box twitter"><Twitter size={20} /></div>
                                    <span>X (Twitter)</span>
                                </div>
                                <div className="share-option">
                                    <div className="icon-box email"><Mail size={20} /></div>
                                    <span>Email</span>
                                </div>
                            </div>

                            <div className="share-footer">
                                <button className="nearby-btn">
                                    <div className="icon-box"><Rss size={20} /></div>
                                    <span>Nearby Share</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}

