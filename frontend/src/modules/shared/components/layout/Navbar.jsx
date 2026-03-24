import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, ChevronDown, Heart, ShoppingBag } from 'lucide-react';
import AuthModal from '@/modules/auth/components/AuthModal';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, auth } from '@/modules/shared/config/firebase';
import { listenToCart } from '@/modules/shared/utils/cartUtils';
import { listenToWishlist } from '@/modules/shared/utils/wishlistUtils';
import { MAIN_CATEGORIES, SPECIAL_CATEGORIES, SUBCATEGORIES, ALL_CATEGORIES } from '@/modules/shared/config/categories';
import { fetchWithCache } from '@/modules/shared/utils/firestoreCache';
import NavbarMegaMenu from './NavbarMegaMenu';
import { authFetch } from '@/modules/shared/utils/api';
import './Navbar.css';

export default function Navbar() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeMegaMenu, setActiveMegaMenu] = useState(null);
    const [activeSubCategory, setActiveSubCategory] = useState(0);
    const [showAllSubcategories, setShowAllSubcategories] = useState(false);
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [dynamicMegaData, setDynamicMegaData] = useState({});

    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef(null);
    const profileRef = useRef(null);

    const calculateAge = (dob) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        const fetchMegaData = async () => {
            try {
                // Use cache with 15 minute TTL to reduce Firestore reads
                const products = await fetchWithCache(
                    'navbar_products',
                    async () => {
                        // Limit to 50 products instead of 100 for faster loading
                        const q = query(collection(db, "products"), limit(50));
                        const snap = await getDocs(q);
                        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    },
                    15 * 60 * 1000 // 15 minutes cache (increased from 10)
                );

                // Only proceed if we have products from database
                if (products.length === 0) {
                    setDynamicMegaData({});
                    return;
                }

                const mega = {};
                [...MAIN_CATEGORIES, ...SPECIAL_CATEGORIES].forEach(cat => {
                    let catProducts;
                    if (cat === "Today's Deals") {
                        catProducts = products.filter(p => p.discount || p.oldPrice);
                    } else if (cat === "New Arrivals") {
                        catProducts = [...products].reverse().slice(0, 8);
                    } else if (cat === "Trending") {
                        catProducts = products.filter(p => (p.rating || 0) >= 4.5);
                    } else if (cat === "Fashion (Men)") {
                        catProducts = products.filter(p =>
                            p.category === "Fashion (Men)" ||
                            p.category === "Men's Fashion" ||
                            p.category === "Fashion" ||
                            p.category === "Mens Fashion" ||
                            p.category === "Men Fashion" ||
                            p.subCategory?.toLowerCase().includes('men') ||
                            p.name?.toLowerCase().includes('men')
                        );
                    } else if (cat === "Fashion (Women)") {
                        catProducts = products.filter(p =>
                            p.category === "Fashion (Women)" ||
                            p.category === "Women's Fashion" ||
                            p.category === "Fashion" ||
                            p.category === "Womens Fashion" ||
                            p.category === "Women Fashion" ||
                            p.subCategory?.toLowerCase().includes('women') ||
                            p.name?.toLowerCase().includes('women')
                        );
                    } else if (cat === "Books & Stationery") {
                        catProducts = products.filter(p =>
                            p.category === "Books & Stationery" ||
                            p.category === "Books" ||
                            p.category === "Stationery" ||
                            p.subCategory?.toLowerCase().includes('book') ||
                            p.subCategory?.toLowerCase().includes('stationery')
                        );
                    } else if (cat === "Food & Beverages") {
                        catProducts = products.filter(p =>
                            p.category === "Food & Beverages" ||
                            p.category === "Food" ||
                            p.category === "Beverages" ||
                            p.subCategory?.toLowerCase().includes('food') ||
                            p.subCategory?.toLowerCase().includes('beverage')
                        );
                    } else if (cat === "Handicrafts") {
                        catProducts = products.filter(p =>
                            p.category === "Handicrafts" ||
                            p.category === "Handicraft" ||
                            p.subCategory?.toLowerCase().includes('handicraft') ||
                            p.subCategory?.toLowerCase().includes('handmade')
                        );
                    } else {
                        // For other categories, try exact match first, then fuzzy match
                        catProducts = products.filter(p =>
                            p.category === cat ||
                            p.category?.toLowerCase().includes(cat.toLowerCase()) ||
                            p.subCategory?.toLowerCase().includes(cat.toLowerCase())
                        );
                    }

                    const subGroups = {};
                    catProducts.forEach(p => {
                        const sub = p.subCategory || 'Featured';
                        if (!subGroups[sub]) subGroups[sub] = [];
                        subGroups[sub].push(p);
                    });

                    // Create mega menu data only if products exist for this category
                    if (catProducts.length > 0) {
                        mega[cat] = {
                            categories: Object.keys(subGroups).map(sub => ({
                                id: sub.toLowerCase().replace(/\s+/g, '-'),
                                name: sub,
                                items: subGroups[sub].slice(0, 4) // Limit to 4 items per subcategory
                            })),
                            popular: Array.from(new Set(catProducts.flatMap(p => p.tags || []))).slice(0, 4)
                        };
                    }
                    // If no products, don't create mega menu data - category will still be clickable but won't show dropdown
                });
                setDynamicMegaData(mega);
            } catch (err) {
                console.error("Error fetching mega menu data:", err);
            }
        };
        fetchMegaData();
    }, []);

    useEffect(() => {
        const unsubscribeCart = listenToCart((items) => {
            const count = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
            setCartCount(count);
        });

        const unsubscribeWishlist = listenToWishlist((items) => {
            setWishlistCount(items.length);
        });

        return () => {
            unsubscribeCart();
            unsubscribeWishlist();
        };
    }, []);

    useEffect(() => {
        const checkUser = () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        checkUser();
        const handleUserChange = () => checkUser();
        window.addEventListener('userDataChanged', handleUserChange);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMegaMenu(null);
            }
            // Close profile dropdown when clicking outside
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        const handleOpenLogin = () => setIsLoginModalOpen(true);
        window.addEventListener('openLoginModal', handleOpenLogin);

        return () => {
            window.removeEventListener('userDataChanged', handleUserChange);
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('openLoginModal', handleOpenLogin);
        };
    }, []);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out from Firebase:', error);
        }
        localStorage.removeItem('user');
        localStorage.removeItem('userName');
        localStorage.removeItem('dob');
        setUser(null);
        setIsProfileOpen(false);
        window.dispatchEvent(new CustomEvent('userDataChanged'));
        navigate('/');
    };

    const handleLoginSuccess = () => {
        setIsLoginModalOpen(false);
        setIsProfileOpen(false);
    };

    const handleMegaMenuToggle = (cat) => {
        if (activeMegaMenu === cat) {
            setActiveMegaMenu(null);
        } else {
            setActiveMegaMenu(cat);
            setActiveSubCategory(0);
        }
    };

    const handleSubCategoryClick = (category, subcategory) => {
        setActiveMegaMenu(null);
        navigate(`/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`);
    };

    const handleItemClick = (category, subCategory, item) => {
        setActiveMegaMenu(null);
        navigate(`/products?category=${category}&sub=${subCategory}&item=${item}`);
    };

    const handleBecomeSellerClick = () => {
        if (!user) {
            alert('Please register first to become a seller.');
            return;
        }
        // ALWAYS open seller page in new tab on Home Page Navbar,
        // even if user is a SELLER in the database.
        // They must login from /#/seller to access the Seller Dashboard.
        console.log("[Navbar] Opening /seller in new tab...");
        window.open(`${window.location.origin}${window.location.pathname}#/seller`, '_blank');
    };

    return (
        <>
            <nav className="navbar-container" ref={menuRef}>
                <div className="main-nav-wrapper">
                    <div className="container main-nav">
                        {location.pathname === '/' ? (
                            <div className="brand-logo gradient-text" style={{ cursor: 'default' }}>
                                SELLSATHI
                            </div>
                        ) : (
                            <Link to="/" className="brand-logo gradient-text">
                                SELLSATHI
                            </Link>
                        )}

                        {!location.pathname.startsWith('/checkout') && (
                            <>
                                <div className="nav-search">
                                    <Search size={18} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search products, brands and more..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                const params = new URLSearchParams();
                                                params.set('search', e.target.value.trim());
                                                navigate(`/products?${params.toString()}`);
                                                e.target.blur();
                                            }
                                        }}
                                    />
                                </div>

                                {user && user.role !== 'ADMIN' ? (
                                    <button
                                        onClick={handleBecomeSellerClick}
                                        className="btn btn-seller"
                                    >
                                        Seller
                                    </button>
                                ) : !user ? (
                                    <button
                                        onClick={handleBecomeSellerClick}
                                        className="btn btn-seller"
                                    >
                                        Seller
                                    </button>
                                ) : null}
                            </>
                        )}

                        <div className="nav-actions">
                            <Link
                                to={user ? "/wishlist" : "#"}
                                onClick={(e) => {
                                    if (!user) {
                                        e.preventDefault();
                                        setIsLoginModalOpen(true);
                                    }
                                }}
                                className="btn btn-secondary icon-btn wishlist-btn-nav"
                            >
                                <Heart size={20} />
                                {user && wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
                            </Link>

                            <Link
                                to={user ? "/cart" : "#"}
                                onClick={(e) => {
                                    if (!user) {
                                        e.preventDefault();
                                        setIsLoginModalOpen(true);
                                    }
                                }}
                                className="btn btn-secondary icon-btn cart-btn-nav"
                            >
                                <ShoppingCart size={20} />
                                {user && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>

                            {user ? (
                                <div className="profile-dropdown-container" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="btn btn-secondary icon-btn"
                                    >
                                        <User size={20} />
                                    </button>
                                    {isProfileOpen && (
                                        <div className="profile-menu">
                                            <div className="menu-header">
                                                <div className="avatar">{(user.fullName || 'U').charAt(0).toUpperCase()}</div>
                                                <div className="info">
                                                    <p className="name">{localStorage.getItem('userName') || user.fullName || 'User'}</p>
                                                    <p className="email">{user.phone ? (user.phone.startsWith('+') ? user.phone : '+91' + user.phone) : ''}</p>
                                                </div>
                                            </div>
                                            <div className="menu-items">
                                                <button onClick={() => {
                                                    navigate('/dashboard');
                                                    setIsProfileOpen(false);
                                                }}>
                                                    <ShoppingBag size={16} /> My Dashboard
                                                </button>
                                                <button onClick={() => { setIsLoginModalOpen(true); setIsProfileOpen(false); }}>
                                                    <User size={16} /> Switch Account
                                                </button>
                                                <button onClick={handleSignOut} className="signout-btn">
                                                    <LogOut size={16} /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-secondary icon-btn">
                                    <User size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories section - Only visible on Home page */}
                {location.pathname === '/' && (
                    <div
                        className="sub-nav-wrapper"
                        style={{ display: 'block' }}
                    >
                        <div className="container">
                            {/* Single Row - All Categories (Horizontally Scrollable) */}
                            <div className="sub-nav sub-nav-unified">
                                {ALL_CATEGORIES.map(cat => {
                                    let path = `/products?category=${cat}`;
                                    if (cat === "Today's Deals") path = "/deals";
                                    if (cat === "New Arrivals") path = "/new-arrivals";
                                    if (cat === "Trending") path = "/trending";

                                    // Show mega menu if category has subcategories defined
                                    const isMega = !!SUBCATEGORIES[cat];
                                    const isSpecial = SPECIAL_CATEGORIES.includes(cat);

                                    return (
                                        <div key={cat} className="sub-nav-item">
                                            <Link
                                                to={path}
                                                className={`sub-nav-link ${isSpecial ? 'special-category' : ''} ${location.pathname.includes(cat) ? 'active' : ''}`}
                                                onMouseEnter={() => {
                                                    if (isMega) {
                                                        setActiveMegaMenu(cat);
                                                        setShowAllSubcategories(false);
                                                        setActiveSubCategory(0);
                                                    }
                                                }}
                                                onClick={() => {
                                                    setActiveMegaMenu(null);
                                                }}
                                            >
                                                {cat}
                                                {isMega && <ChevronDown size={12} />}
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mega Menu Dropdown */}
                        <NavbarMegaMenu
                            activeMegaMenu={activeMegaMenu}
                            activeSubCategory={activeSubCategory}
                            setActiveSubCategory={setActiveSubCategory}
                            setActiveMegaMenu={setActiveMegaMenu}
                            showAllSubcategories={showAllSubcategories}
                            setShowAllSubcategories={setShowAllSubcategories}
                            dynamicMegaData={dynamicMegaData}
                        />
                    </div>
                )}
            </nav >

            <AuthModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={handleLoginSuccess}
            />
        </>
    );
}
