import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';
import {
    ShoppingBag, Heart, Settings, LogOut, User, MapPin,
    LayoutDashboard, Star, ArrowLeft
} from 'lucide-react';
import { listenToWishlist, removeFromWishlist as removeFromWishlistAPI } from '@/modules/shared/utils/wishlistUtils';
import ReviewModal from '@/modules/shared/components/common/ReviewModal';
import { fetchWithCache } from '@/modules/shared/utils/firestoreCache';

import ConsumerOverviewTab from '@/modules/consumer/components/dashboard/ConsumerOverviewTab';
import ConsumerOrdersTab from '@/modules/consumer/components/dashboard/ConsumerOrdersTab';
import ConsumerWishlistTab from '@/modules/consumer/components/dashboard/ConsumerWishlistTab';
import ConsumerAddressTab from '@/modules/consumer/components/dashboard/ConsumerAddressTab';
import ConsumerReviewsTab from '@/modules/consumer/components/dashboard/ConsumerReviewsTab';
import ConsumerSettingsTab from '@/modules/consumer/components/dashboard/ConsumerSettingsTab';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

export default function ConsumerDashboard() {
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [orders, setOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [reviewableOrders, setReviewableOrders] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, totalSpent: 0 });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingAddress, setEditingAddress] = useState(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({ displayName: '', email: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let wishlistUnsubscribe = null;
        let mounted = true;

        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (!mounted) return;
            if (currentUser) {
                setUser(currentUser);
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                const name = localUser.fullName || localUser.name || currentUser.displayName || 'User';
                setUserName(name);
                setUserPhoto(localUser.photoURL || currentUser.photoURL || null);
                setProfileData({
                    displayName: name,
                    email: localUser.email || currentUser.email || '',
                    phone: localUser.phone || localUser.phoneNumber || ''
                });

                try {
                    await Promise.race([
                        Promise.all([
                            fetchOrders(currentUser.uid),
                            fetchAddresses(currentUser.uid),
                            fetchReviewableOrders(currentUser.uid)
                        ]),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                    ]);
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                }

                wishlistUnsubscribe = listenToWishlist((items) => { if (mounted) setWishlist(items); });
                if (mounted) setLoading(false);
            } else {
                navigate('/');
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
            if (wishlistUnsubscribe) wishlistUnsubscribe();
        };
    }, [navigate]);

    const fetchOrders = async (userId) => {
        try {
            const response = await authFetch(`/orders/user/${userId}`);
            if (!response.ok) throw new Error('Orders API failed');
            const data = await response.json();
            const ordersData = data.success ? (data.orders || []) : [];
            setOrders(ordersData);
            const total = ordersData.length;
            const pending = ordersData.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
            const delivered = ordersData.filter(o => o.status === 'Delivered').length;
            const totalSpent = ordersData.reduce((sum, o) => sum + (o.total || 0), 0);
            setStats({ total, pending, delivered, totalSpent });
            if (ordersData.length > 0) setSelectedOrder(ordersData[0]);
        } catch (error) { console.error('Error fetching orders:', error); }
    };

    const fetchReviewableOrders = async (userId) => {
        try {
            const response = await authFetch(`/orders/user/${userId}/reviewable-orders`);
            const data = await response.json();
            if (data.success) setReviewableOrders(data.orders || []);
        } catch (error) { console.error('Error fetching reviewable orders:', error); setReviewableOrders([]); }
    };

    const fetchAddresses = async (userId) => {
        try {
            const response = await authFetch(`/consumer/${userId}/addresses`);
            if (!response.ok) throw new Error('Addresses API failed');
            const data = await response.json();
            setAddresses(data.success ? (data.addresses || []) : []);
        } catch (error) { console.error('Error fetching addresses:', error); setAddresses([]); }
    };

    const removeFromWishlist = async (productId) => {
        const result = await removeFromWishlistAPI(productId);
        if (!result.success) alert(result.message || 'Failed to remove from wishlist');
    };

    const saveAddress = async () => {
        try {
            const addressToSave = editingAddress;
            const response = await authFetch(`/consumer/${user.uid}/address`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressToSave })
            });
            const data = await response.json();
            if (data.success) {
                await fetchAddresses(user.uid);
                setEditingAddress(null);
            }
        } catch (error) { console.error('Error saving address:', error); }
    };

    const setAsDefaultAddress = async (addressIndex) => {
        try {
            const addressToUpdate = { ...addresses[addressIndex], id: addressIndex, isDefault: true };
            const response = await authFetch(`/consumer/${user.uid}/address`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressToUpdate })
            });
            const data = await response.json();
            if (data.success) await fetchAddresses(user.uid);
        } catch (error) { console.error('Error setting default address:', error); }
    };

    const deleteAddress = async (addressId) => {
        try {
            const response = await authFetch(`/consumer/${user.uid}/address/${addressId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) await fetchAddresses(user.uid);
        } catch (error) { console.error('Error deleting address:', error); }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const response = await authFetch(`/api/invoice/${orderId}`);
            if (!response.ok) throw new Error('Failed to download invoice');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (error) { console.error('Error downloading invoice:', error); alert('Could not download invoice. Please try again later.'); }
    };

    useEffect(() => {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        setRecentlyViewed(viewed.slice(0, 5));
        if (orders.length > 0) fetchRecommendedProducts();
    }, [orders]);

    const fetchRecommendedProducts = async () => {
        try {
            const orderCategories = orders.flatMap(order => order.items || []).map(item => item.category).filter(Boolean);
            if (orderCategories.length === 0) return;
            const products = await fetchWithCache(
                `recommended_${user.uid}`,
                async () => {
                    const { collection, query, limit, getDocs } = await import('firebase/firestore');
                    const { db } = await import('@/modules/shared/config/firebase');
                    const productsRef = collection(db, 'products');
                    const q = query(productsRef, limit(20));
                    const snapshot = await getDocs(q);
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => orderCategories.includes(p.category)).slice(0, 5);
                },
                10 * 60 * 1000
            );
            setRecommendedProducts(products);
        } catch (error) { console.error('Error fetching recommended products:', error); }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await authFetch('/seller/upload-image', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success && data.url) {
                await authFetch(`/consumer/${user.uid}/profile`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileData: { photoURL: data.url } })
                });
                setUserPhoto(data.url);
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localUser.photoURL = data.url;
                localStorage.setItem('user', JSON.stringify(localUser));
                alert('Profile picture updated successfully!');
            } else { alert('Upload failed: ' + (data.message || 'Unknown error')); }
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            const reader = new FileReader();
            reader.onloadend = () => { setUserPhoto(reader.result); };
            reader.readAsDataURL(file);
        } finally { setUploadingImage(false); }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSavingProfile(true);
        try {
            const response = await authFetch(`/consumer/${user.uid}/profile`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileData: { name: profileData.displayName, fullName: profileData.displayName, phone: profileData.phone } })
            });
            const data = await response.json();
            if (data.success) {
                setUserName(profileData.displayName);
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                localUser.fullName = profileData.displayName;
                localUser.name = profileData.displayName;
                localUser.phone = profileData.phone;
                localStorage.setItem('user', JSON.stringify(localUser));
                localStorage.setItem('userName', profileData.displayName);
                setEditingProfile(false);
                alert('Profile updated successfully!');
            } else { alert('Failed to update profile: ' + (data.message || 'Unknown error')); }
        } catch (error) { console.error('Error updating profile:', error); alert('Failed to update profile. Please try again.'); }
        finally { setSavingProfile(false); }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone. All your data including orders, wishlist, and addresses will be permanently deleted.')) return;
        if (!window.confirm('This is your final warning. Are you absolutely sure you want to delete your account?')) return;
        try {
            const response = await authFetch(`/consumer/${user.uid}/account`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                await auth.signOut();
                localStorage.clear();
                alert('Your account has been deleted successfully.');
                navigate('/');
            } else { alert('Failed to delete account: ' + (data.message || 'Unknown error')); }
        } catch (error) { console.error('Error deleting account:', error); alert('Failed to delete account. Please contact support.'); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-full mx-auto px-3 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm font-medium">
                                <ArrowLeft size={16} /> Back
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <User size={16} className="text-gray-400" />
                            <span className="text-gray-700 font-medium">{userName || user.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-full mx-auto px-3 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                            {/* User Profile */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                <div className="flex flex-col items-center text-center">
                                    {userPhoto ? (
                                        <div className="w-16 h-16 rounded-full mb-2 overflow-hidden border-2 border-primary">
                                            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
                                            {(userName || user.email || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-600 mb-1">Hello,</p>
                                    <p className="font-semibold text-gray-900 text-sm">{localStorage.getItem('userName') || userName || 'User'}</p>
                                    {(() => {
                                        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                                        const firebaseUser = JSON.parse(localStorage.getItem('firebaseUser') || '{}');
                                        const dob = localUser.dateOfBirth || firebaseUser.dateOfBirth;
                                        const age = calculateAge(dob);
                                        return age ? <p className="text-xs text-gray-500 mt-1">Age: {age}</p> : null;
                                    })()}
                                    <div className="flex items-center gap-1 mt-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="p-2">
                                {[
                                    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, badge: null },
                                    { key: 'orders', label: 'My Orders', icon: <ShoppingBag size={18} />, badge: orders.length },
                                    { key: 'wishlist', label: 'Wishlist', icon: <Heart size={18} />, badge: wishlist.length },
                                    { key: 'address', label: 'Address Book', icon: <MapPin size={18} />, badge: null },
                                    { key: 'reviews', label: 'My Reviews', icon: <Star size={18} />, badge: reviewableOrders.length > 0 ? reviewableOrders.length : null, badgeColor: 'bg-orange-100 text-orange-700' },
                                    { key: 'settings', label: 'Account Settings', icon: <Settings size={18} />, badge: null },
                                ].map(item => (
                                    <button key={item.key} onClick={() => setActiveTab(item.key)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === item.key ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'
                                        }`}>
                                        <div className="flex items-center gap-3">{item.icon}<span>{item.label}</span></div>
                                        {item.badge != null && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-600'}`}>{item.badge}</span>
                                        )}
                                    </button>
                                ))}

                                <div className="border-t border-gray-200 my-2"></div>
                                <button onClick={() => auth.signOut()}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                    <LogOut size={18} /><span>Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-4">
                        {activeTab === 'dashboard' && (
                            <ConsumerOverviewTab
                                stats={stats} orders={orders}
                                selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
                                recentlyViewed={recentlyViewed} recommendedProducts={recommendedProducts}
                                onDownloadInvoice={handleDownloadInvoice} onSwitchTab={setActiveTab}
                            />
                        )}
                        {activeTab === 'orders' && (
                            <ConsumerOrdersTab
                                orders={orders}
                                onSelectOrder={(order) => { setSelectedOrder(order); setActiveTab('dashboard'); }}
                                onDownloadInvoice={handleDownloadInvoice}
                            />
                        )}
                        {activeTab === 'wishlist' && (
                            <ConsumerWishlistTab wishlist={wishlist} onRemoveFromWishlist={removeFromWishlist} />
                        )}
                        {activeTab === 'address' && (
                            <ConsumerAddressTab
                                addresses={addresses} editingAddress={editingAddress}
                                setEditingAddress={setEditingAddress} onSaveAddress={saveAddress}
                                onDeleteAddress={deleteAddress} onSetDefault={setAsDefaultAddress}
                            />
                        )}
                        {activeTab === 'reviews' && (
                            <ConsumerReviewsTab
                                reviewableOrders={reviewableOrders}
                                onWriteReview={(item) => {
                                    setSelectedReviewProduct({ productId: item.productId, productName: item.productName, orderId: item.orderId });
                                    setShowReviewModal(true);
                                }}
                            />
                        )}
                        {activeTab === 'settings' && (
                            <ConsumerSettingsTab
                                user={user} userName={userName}
                                profileData={profileData} setProfileData={setProfileData}
                                editingProfile={editingProfile} setEditingProfile={setEditingProfile}
                                savingProfile={savingProfile} onSaveProfile={handleSaveProfile}
                                uploadingImage={uploadingImage} onProfilePictureUpload={handleProfilePictureUpload}
                                onDeleteAccount={handleDeleteAccount}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedReviewProduct && (
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedReviewProduct(null);
                        if (user) fetchReviewableOrders(user.uid);
                    }}
                    productId={selectedReviewProduct.productId}
                    productName={selectedReviewProduct.productName}
                    orderId={selectedReviewProduct.orderId}
                />
            )}
        </div>
    );
}
