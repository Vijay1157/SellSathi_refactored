import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ShoppingBag,
    Trash2,
    ShoppingCart,
    Shield,
    Package,
    TrendingUp,
    Plus,
    Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { listenToCart, removeFromCart, updateCartItemQuantity } from '@/modules/shared/utils/cartUtils';
import { getProductPricing } from '@/modules/shared/utils/priceUtils';
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from '@/modules/shared/utils/api';
import PriceDisplay from '@/modules/shared/components/common/PriceDisplay';
import ConfirmationAnimation from '@/modules/shared/components/common/ConfirmationAnimation';
import AddressStep from '../components/Checkout/AddressStep';
import PaymentStep from '../components/Checkout/PaymentStep';
import CheckoutOrderSummary from '../components/Checkout/CheckoutOrderSummary';
import CheckoutSuccess from '../components/Checkout/CheckoutSuccess';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [cartItems, setCartItems] = useState([]);
    const [checkoutItems, setCheckoutItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set()); // Add item selection state
    const [showAllItems, setShowAllItems] = useState(false); // Add show more state
    const [loading, setLoading] = useState(true);
    const [shippingAddress, setShippingAddress] = useState({
        firstName: '',
        lastName: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: ''
    });
    const [upiId, setUpiId] = useState('');
    const [isUpiVerified, setIsUpiVerified] = useState(false);
    const [errors, setErrors] = useState({});
    const [isOrdered, setIsOrdered] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [user, setUser] = useState(null);
    const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
    const [setAsDefault, setSetAsDefault] = useState(false);
    const [fetchingSavedAddress, setFetchingSavedAddress] = useState(false);
    const [razorpayLoading, setRazorpayLoading] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    // Address selection states
    const [addressMode, setAddressMode] = useState('saved');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            setUser(u);
            if (u) {
                setFetchingSavedAddress(true);
                try {
                    const res = await authFetch(`/consumer/${u.uid}/addresses`);
                    const data = await res.json();
                    const addresses = data.success ? (data.addresses || []) : [];
                    setSavedAddresses(addresses);

                    const defaultAddr = addresses.find(addr => addr.isDefault === true);
                    if (defaultAddr) {
                        const defaultIndex = addresses.indexOf(defaultAddr);
                        setSelectedAddressIndex(defaultIndex);
                        setShippingAddress(defaultAddr);
                        setAddressMode('saved');
                    } else if (addresses.length > 0) {
                        setSelectedAddressIndex(0);
                        setShippingAddress(addresses[0]);
                        setAddressMode('saved');
                    } else {
                        setAddressMode('new');
                    }
                } catch (error) {
                    console.error("Error fetching addresses:", error);
                    setAddressMode('new');
                } finally {
                    setFetchingSavedAddress(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const { buyNowProduct, selectedItemIds } = location.state || {};
        
        // If Buy Now product is provided, use it directly without cart
        if (buyNowProduct) {
            const { finalPrice, strikethroughPrice } = getProductPricing(buyNowProduct, buyNowProduct.selections || {});
            
            const buyNowCartItem = {
                id: `buynow_${buyNowProduct.id}_${Date.now()}`,
                productId: buyNowProduct.id,
                sellerId: buyNowProduct.sellerId || null,
                name: buyNowProduct.name || buyNowProduct.title,
                price: finalPrice,
                originalPrice: strikethroughPrice,
                imageUrl: buyNowProduct.imageUrl || buyNowProduct.image,
                quantity: buyNowProduct.quantity || 1,
                category: buyNowProduct.category,
                selections: buyNowProduct.selections,
                selectedColor: buyNowProduct.selections?.color,
                selectedSize: buyNowProduct.selections?.size,
                selectedStorage: buyNowProduct.selections?.storage?.label || buyNowProduct.selections?.storage,
                selectedMemory: buyNowProduct.selections?.memory?.label || buyNowProduct.selections?.memory,
                isBuyNow: true
            };
            
            setCheckoutItems([buyNowCartItem]);
            setSelectedItems(new Set([buyNowCartItem.id]));
            setCartItems([]);
            setLoading(false);
            return;
        }
        
        // Otherwise, listen to cart for normal checkout
        const unsubscribe = listenToCart((items) => {
            setCartItems(items);
            const { buyNowProduct, selectedItemIds } = location.state || {};
            
            if (buyNowProduct) {
                // Buy Now flow: Create temporary cart item for Buy Now product
                const { finalPrice, strikethroughPrice } = getProductPricing(buyNowProduct, buyNowProduct.selections || {});
                
                const buyNowCartItem = {
                    id: `buynow_${buyNowProduct.id}_${Date.now()}`,
                    productId: buyNowProduct.id,
                    sellerId: buyNowProduct.sellerId || null,
                    name: buyNowProduct.name || buyNowProduct.title,
                    price: finalPrice,
                    originalPrice: strikethroughPrice,
                    imageUrl: buyNowProduct.imageUrl || buyNowProduct.image,
                    quantity: buyNowProduct.quantity || 1,
                    category: buyNowProduct.category,
                    selections: buyNowProduct.selections,
                    selectedColor: buyNowProduct.selections?.color,
                    selectedSize: buyNowProduct.selections?.size,
                    selectedStorage: buyNowProduct.selections?.storage?.label || buyNowProduct.selections?.storage,
                    selectedMemory: buyNowProduct.selections?.memory?.label || buyNowProduct.selections?.memory,
                    isBuyNow: true // Flag to identify Buy Now item
                };
                
                // Combine Buy Now product with cart items (Buy Now first)
                const allItems = [buyNowCartItem, ...items];
                setCheckoutItems(allItems);
                
                // Pre-select ONLY the Buy Now product
                setSelectedItems(new Set([buyNowCartItem.id]));
                
            } else if (selectedItemIds && selectedItemIds.length > 0) {
                // Regular cart checkout: Show only selected items
                const itemsToCheckout = items.filter(item => 
                    selectedItemIds.includes(item.id || item.productId)
                );
                setCheckoutItems(itemsToCheckout);
                // All items selected by default
                setSelectedItems(new Set(itemsToCheckout.map(item => item.id || item.productId)));
            } else {
                // Fallback: show all cart items, all selected
                setCheckoutItems(items);
                setSelectedItems(new Set(items.map(item => item.id || item.productId)));
            }
            
            let itemsToCheckout = items;
            
            if (selectedItemIds && selectedItemIds.length > 0) {
                itemsToCheckout = items.filter(item => selectedItemIds.includes(item.id || item.productId));
            }
            
            setCheckoutItems(itemsToCheckout);
            setLoading(false);
        });
        return () => unsubscribe && unsubscribe();
    }, [location.state]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
            setShippingAddress(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setShippingAddress(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRazorpayPayment = async () => {
        setRazorpayLoading(true);
        try {
            const selectedCartItems = selectedCheckoutItems;
            const customerInfo = {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                email: user?.email || '',
                phone: user?.phoneNumber || user?.phone || '',
                address: shippingAddress
            };

            const createOrderResponse = await authFetch('/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: subtotal,
                    cartItems: selectedCartItems,
                    customerInfo: customerInfo
                })
            });

            const orderResult = await createOrderResponse.json();

            if (!orderResult.success) {
                alert('Failed to create payment order');
                setRazorpayLoading(false);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);

            script.onload = () => {
                const options = {
                    key: orderResult.key_id,
                    amount: orderResult.order.amount,
                    currency: orderResult.order.currency,
                    order_id: orderResult.order.id,
                    name: 'Sellsathi',
                    description: 'Order Payment',
                    image: '/logo.png',
                    handler: async function (response) {
                        try {
                            const selectedCartItems = selectedCheckoutItems;
                            const verifyResponse = await authFetch('/payment/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    cartItems: selectedCartItems,
                                    customerInfo: customerInfo,
                                    amount: subtotal,
                                    uid: auth.currentUser?.uid || 'guest'
                                })
                            });

                            const verifyResult = await verifyResponse.json();

                            if (verifyResult.success) {
                                // Only remove items from cart if they're not Buy Now items
                                const isBuyNow = location.state?.buyNowProduct;
                                if (!isBuyNow) {
                                    selectedCartItems.forEach(item => removeFromCart(item.id || item.productId));
                                }
                                
                                if (addressMode === 'new' && saveAddressForFuture && user) {
                                    try {
                                        const newAddress = { ...shippingAddress, isDefault: setAsDefault };
                                        await authFetch(`/consumer/${user.uid}/addresses`, {
                                            method: 'POST',
                                            body: JSON.stringify({ address: newAddress })
                                        });
                                    } catch (error) {
                                        console.error("Error saving address:", error);
                                    }
                                }
                                setOrderId(verifyResult.orderId);
                                setShowAnimation(true);
                            } else {
                                alert('Payment verification failed: ' + verifyResult.message);
                            }
                        } catch (error) {
                            console.error('Verification Error:', error);
                            alert('Payment verification failed. Please contact support.');
                        } finally {
                            setRazorpayLoading(false);
                        }
                    },
                    prefill: {
                        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                        email: user?.email || '',
                        contact: user?.phoneNumber || user?.phone || ''
                    },
                    theme: { color: '#6366f1' },
                    modal: {
                        ondismiss: function () { setRazorpayLoading(false); }
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
                setRazorpayLoading(false);
            };

            script.onerror = () => {
                alert('Failed to load Razorpay. Please try again.');
                setRazorpayLoading(false);
            };
        } catch (error) {
            console.error('Razorpay Error:', error);
            alert('Payment initialization failed');
            setRazorpayLoading(false);
        }
    };

    const processOrder = async (paymentType, paymentId = null) => {
        setLoading(true);
        try {
            const selectedCartItems = selectedCheckoutItems;
            const customerInfo = {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                email: user?.email || '',
                phone: user?.phoneNumber || user?.phone || '',
                address: shippingAddress
            };

            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("Please login to place an order");
                setLoading(false);
                return;
            }

            const response = await authFetch('/payment/cod-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: currentUser.uid,
                    cartItems: selectedCartItems,
                    customerInfo: customerInfo,
                    amount: subtotal
                })
            });

            const result = await response.json();

            if (result.success) {
                if (addressMode === 'new' && saveAddressForFuture && user) {
                    try {
                        const newAddress = { ...shippingAddress, isDefault: setAsDefault };
                        await authFetch(`/consumer/${user.uid}/addresses`, {
                            method: 'POST',
                            body: JSON.stringify({ address: newAddress })
                        });
                    } catch (error) {
                        console.error("Error saving address:", error);
                    }
                }
                
                // Only remove items from cart if they're not Buy Now items
                const isBuyNow = location.state?.buyNowProduct;
                if (!isBuyNow) {
                    selectedCartItems.forEach(item => removeFromCart(item.id || item.productId));
                }
                
                setOrderId(result.orderId);
                setShowAnimation(true);
            } else {
                alert("Failed to place order: " + result.message);
            }
        } catch (error) {
            console.error("Order Error:", error);
            alert("An error occurred while placing your order.");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!shippingAddress.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!shippingAddress.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!shippingAddress.addressLine.trim() || shippingAddress.addressLine.length < 5) newErrors.addressLine = 'Full address is required';
        if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
        if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
        if (!/^\d{6}$/.test(shippingAddress.pincode)) newErrors.pincode = 'Pincode must be exactly 6 digits';
        if (step === 2 && !paymentMethod) newErrors.payment = 'Please select a payment method';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRemove = async (productId) => {
        await removeFromCart(productId);
    };

    const handleContinue = async () => {
        if (!auth.currentUser) {
            window.dispatchEvent(new Event('openLoginModal'));
            return;
        }
        if (step === 1) {
            if (validateForm()) { setStep(2); }
            else { alert('Please fill in all required address fields correctly.'); }
        } else {
            const isValid = validateForm();
            if (isValid) {
                if (paymentMethod === 'razorpay') { handleRazorpayPayment(); }
                else { processOrder(paymentMethod); }
            } else {
                alert('Please fix the validation errors before continuing.');
            }
        }
    };

    // Toggle item selection in checkout
    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Filter selected items for payment
    const selectedCheckoutItems = checkoutItems.filter(item => 
        selectedItems.has(item.id || item.productId)
    );

    const subtotal = selectedCheckoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleQuantityChange = async (item, newQuantity) => {
        if (newQuantity < 1) return;
        if (newQuantity > (item.stock || 99)) {
            alert(`Only ${item.stock || 99} items available in stock`);
            return;
        }
        await updateCartItemQuantity(item.id || item.productId, newQuantity);
    };

    const handleAnimationComplete = () => {
        navigate(`/track?orderId=${orderId}`);
    };

    if (isOrdered) {
        return (
            <CheckoutSuccess 
                orderId={orderId} 
                shippingAddress={shippingAddress} 
                paymentMethod={paymentMethod} 
                subtotal={subtotal} 
                user={user} 
            />
        );
    }

    return (
        <div className="bg-gray-50/20 min-h-screen">
            <div className="container px-6 py-12 max-w-7xl mx-auto">
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            Checkout <span className="text-gray-400 font-light">Process</span>
                        </h1>
                        <p className="text-gray-500 font-medium mt-2">Securely complete your purchase at Sellsathi</p>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 hover:border-primary/20 hover:text-primary transition-all shadow-sm self-start"
                    >
                        <ArrowLeft size={18} />
                        Back to Shopping
                    </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    <div className="xl:col-span-8 space-y-8">
                        {/* Cart Items List */}
                        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-50">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                    <ShoppingBag size={22} className="text-primary" />
                                    Your Items ({selectedItems.size} of {checkoutItems.length} selected)
                                </h3>
                            </div>
                            <div className="p-8 space-y-4">
                                {(() => {
                                    // Separate selected and unselected items
                                    const selectedItemsList = checkoutItems.filter(item => 
                                        selectedItems.has(item.id || item.productId)
                                    );
                                    const unselectedItemsList = checkoutItems.filter(item => 
                                        !selectedItems.has(item.id || item.productId)
                                    );
                                    
                                    // Show all selected items + limited unselected items
                                    const unselectedToShow = showAllItems ? unselectedItemsList : unselectedItemsList.slice(0, 3);
                                    const itemsToDisplay = [...selectedItemsList, ...unselectedToShow];
                                    
                                    return itemsToDisplay.map((item) => {
                                        const itemId = item.id || item.productId;
                                        const isSelected = selectedItems.has(itemId);
                                        const isBuyNowItem = item.isBuyNow;
                                        
                                        return (
                                            <div key={itemId} className={`flex gap-4 items-center p-4 rounded-2xl border bg-white shadow-sm group hover:shadow-md transition-all ${isSelected ? 'border-primary border-2' : 'border-gray-200'}`}>
                                            {/* Checkbox */}
                                            <div className="flex items-center pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleItemSelection(itemId)}
                                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </div>
                                            
                                            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                                <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                                                    {isBuyNowItem && (
                                                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                                            Buy Now
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Variant Info */}
                                                {(item.selectedColor || item.selectedSize || item.selectedStorage) && (
                                                    <div className="flex gap-1 mt-1 text-xs text-gray-600 flex-wrap">
                                                        {item.selectedColor && (
                                                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                                {item.selectedColor}
                                                            </span>
                                                        )}
                                                        {item.selectedSize && (
                                                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                                {item.selectedSize}
                                                            </span>
                                                        )}
                                                        {item.selectedStorage && (
                                                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                                {item.selectedStorage}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-semibold text-gray-500">Qty:</span>
                                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1}
                                                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                                                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} disabled={item.quantity >= (item.stock || 99)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                                <PriceDisplay product={{ ...item, price: item.originalPrice || item.price, discountPrice: item.price }} size="sm" showBadge={false} />
                                                {!isBuyNowItem && (
                                                    <button onClick={() => handleRemove(itemId)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remove">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                                })()}
                                
                                {/* Show More / Show Less Button - Only for unselected items */}
                                {(() => {
                                    const unselectedCount = checkoutItems.filter(item => 
                                        !selectedItems.has(item.id || item.productId)
                                    ).length;
                                    
                                    if (unselectedCount <= 3) return null;
                                    
                                    const hiddenCount = unselectedCount - 3;
                                    
                                    return (
                                        <div className="pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => setShowAllItems(!showAllItems)}
                                                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                {showAllItems ? (
                                                    <>
                                                        <Minus size={18} />
                                                        Show Less
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={18} />
                                                        Show {hiddenCount} More {hiddenCount === 1 ? 'Item' : 'Items'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>

                        {/* Step 1: Address */}
                        <AddressStep
                            step={step}
                            setStep={setStep}
                            shippingAddress={shippingAddress}
                            handleAddressChange={handleAddressChange}
                            errors={errors}
                            savedAddresses={savedAddresses}
                            selectedAddressIndex={selectedAddressIndex}
                            setSelectedAddressIndex={setSelectedAddressIndex}
                            setShippingAddress={setShippingAddress}
                            addressMode={addressMode}
                            setAddressMode={setAddressMode}
                            saveAddressForFuture={saveAddressForFuture}
                            setSaveAddressForFuture={setSaveAddressForFuture}
                            setAsDefault={setAsDefault}
                            setSetAsDefault={setSetAsDefault}
                            fetchingSavedAddress={fetchingSavedAddress}
                            handleContinue={handleContinue}
                        />

                        {/* Step 2: Payment */}
                        <PaymentStep
                            step={step}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            subtotal={subtotal}
                            razorpayLoading={razorpayLoading}
                            loading={loading}
                            handleContinue={handleContinue}
                        />
                    </div>

                    {/* Order Summary Sidebar */}
                    <CheckoutOrderSummary subtotal={subtotal} />
                </div>
            </div>

            {/* Confirmation Animation */}
            <AnimatePresence>
                {showAnimation && (
                    <ConfirmationAnimation onComplete={handleAnimationComplete} />
                )}
            </AnimatePresence>
        </div>
    );
}
