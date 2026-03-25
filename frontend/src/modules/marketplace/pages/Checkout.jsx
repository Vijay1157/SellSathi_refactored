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
    Minus,
    Tag,
    X
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
        pincode: '',
        phone: '',
        type: 'shipping'
    });
    const [billingAddress, setBillingAddress] = useState({
        firstName: '',
        lastName: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        type: 'billing'
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
    const [sameAsBilling, setSameAsBilling] = useState(true); // Billing address checkbox
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [validationError, setValidationError] = useState(''); // Add inline validation error
    const [adminConfig, setAdminConfig] = useState({
        defaultPlatformFeePercent: 7,
        defaultGstPercent: 18,
        defaultShippingHandlingPercent: 0
    });

    // Address selection states
    const [addressMode, setAddressMode] = useState('saved');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
    
    // Billing address states
    const [billingAddressMode, setBillingAddressMode] = useState('saved');
    const [selectedBillingAddressIndex, setSelectedBillingAddressIndex] = useState(null);
    const [saveBillingForFuture, setSaveBillingForFuture] = useState(false);
    const [setBillingAsDefault, setSetBillingAsDefault] = useState(false);
    
    // Computed: Filter saved addresses by type
    const savedBillingAddresses = savedAddresses.filter(addr => addr.type === 'billing');

    // Fetch admin config for default charges
    useEffect(() => {
        const fetchAdminConfig = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/admin/config/public`);
                const data = await response.json();
                if (data.success && data.config) {
                    setAdminConfig({
                        defaultPlatformFeePercent: data.config.defaultPlatformFeePercent ?? 7,
                        defaultGstPercent: data.config.defaultGstPercent ?? 18,
                        defaultShippingHandlingPercent: data.config.defaultShippingHandlingPercent ?? 0
                    });
                }
            } catch (error) {
                console.error('Failed to fetch admin config:', error);
                // Keep default values
            }
        };
        fetchAdminConfig();
    }, []);

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

                    // Find default shipping address
                    const defaultShipping = addresses.find(addr => addr.type === 'shipping' && addr.isDefault === true);
                    // Find default billing address
                    const defaultBilling = addresses.find(addr => addr.type === 'billing' && addr.isDefault === true);
                    
                    // Set shipping address
                    if (defaultShipping) {
                        const shippingIndex = addresses.indexOf(defaultShipping);
                        setSelectedAddressIndex(shippingIndex);
                        setShippingAddress(defaultShipping);
                        setAddressMode('saved');
                    } else {
                        // Fallback to first shipping address
                        const firstShipping = addresses.find(addr => addr.type === 'shipping');
                        if (firstShipping) {
                            const shippingIndex = addresses.indexOf(firstShipping);
                            setSelectedAddressIndex(shippingIndex);
                            setShippingAddress(firstShipping);
                            setAddressMode('saved');
                        } else {
                            setAddressMode('new');
                        }
                    }
                    
                    // Set billing address
                    if (defaultBilling) {
                        setBillingAddress(defaultBilling);
                    } else if (sameAsBilling && defaultShipping) {
                        // If same as billing is checked, copy shipping to billing
                        setBillingAddress({ ...defaultShipping, type: 'billing' });
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

    const handleBillingAddressChange = (e) => {
        const { name, value } = e.target;
        if (name === 'pincode') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
            setBillingAddress(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setBillingAddress(prev => ({ ...prev, [name]: value }));
        }
        if (errors[`billing_${name}`]) {
            setErrors(prev => ({ ...prev, [`billing_${name}`]: '' }));
        }
    };

    const handleRazorpayPayment = async () => {
        setRazorpayLoading(true);
        try {
            const selectedCartItems = selectedCheckoutItems;
            
            // Prepare billing address (same as shipping if checkbox is checked)
            const finalBillingAddress = sameAsBilling ? { ...shippingAddress, type: 'billing' } : billingAddress;
            
            const customerInfo = {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                email: user?.email || '',
                phone: user?.phoneNumber || user?.phone || shippingAddress.phone || '',
                shippingAddress: shippingAddress,
                billingAddress: finalBillingAddress
            };

            const createOrderResponse = await authFetch('/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: finalTotal,
                    cartItems: selectedCartItems,
                    customerInfo: customerInfo,
                    couponCode: appliedCoupon?.code || null,
                    couponDiscount: couponDiscount
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
                            
                            // Prepare billing address
                            const finalBillingAddress = sameAsBilling ? { ...shippingAddress, type: 'billing' } : billingAddress;
                            
                            const customerInfo = {
                                firstName: shippingAddress.firstName,
                                lastName: shippingAddress.lastName,
                                email: user?.email || '',
                                phone: user?.phoneNumber || user?.phone || shippingAddress.phone || '',
                                shippingAddress: shippingAddress,
                                billingAddress: finalBillingAddress
                            };
                            
                            const verifyResponse = await authFetch('/payment/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    cartItems: selectedCartItems,
                                    customerInfo: customerInfo,
                                    amount: finalTotal,
                                    uid: auth.currentUser?.uid || 'guest',
                                    couponCode: appliedCoupon?.code || null,
                                    couponDiscount: couponDiscount
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
            
            // Prepare billing address
            const finalBillingAddress = sameAsBilling ? { ...shippingAddress, type: 'billing' } : billingAddress;
            
            const customerInfo = {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                email: user?.email || '',
                phone: user?.phoneNumber || user?.phone || shippingAddress.phone || '',
                shippingAddress: shippingAddress,
                billingAddress: finalBillingAddress
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
                    amount: finalTotal,
                    couponCode: appliedCoupon?.code || null,
                    couponDiscount: couponDiscount
                })
            });

            const result = await response.json();

            if (result.success) {
                if (addressMode === 'new' && saveAddressForFuture && user) {
                    try {
                        const newAddress = { 
                            ...shippingAddress, 
                            isDefault: setAsDefault,
                            type: 'shipping',
                            id: Date.now().toString()
                        };
                        await authFetch(`/consumer/${user.uid}/addresses`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
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
        
        // Validate shipping address
        if (!shippingAddress.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!shippingAddress.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!shippingAddress.addressLine.trim() || shippingAddress.addressLine.length < 5) newErrors.addressLine = 'Full address is required';
        if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
        if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
        if (!/^\d{6}$/.test(shippingAddress.pincode)) newErrors.pincode = 'Pincode must be exactly 6 digits';
        
        // Validate billing address if different from shipping
        if (!sameAsBilling) {
            if (!billingAddress.firstName.trim()) newErrors.billing_firstName = 'Billing first name is required';
            if (!billingAddress.lastName.trim()) newErrors.billing_lastName = 'Billing last name is required';
            if (!billingAddress.addressLine.trim() || billingAddress.addressLine.length < 5) newErrors.billing_addressLine = 'Billing address is required';
            if (!billingAddress.city.trim()) newErrors.billing_city = 'Billing city is required';
            if (!billingAddress.state.trim()) newErrors.billing_state = 'Billing state is required';
            if (!/^\d{6}$/.test(billingAddress.pincode)) newErrors.billing_pincode = 'Billing pincode must be exactly 6 digits';
        }
        
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
            if (validateForm()) { 
                setValidationError('');
                setStep(2); 
            }
            else { 
                // Check if billing address is the issue
                const hasBillingErrors = Object.keys(errors).some(key => key.startsWith('billing_'));
                if (hasBillingErrors && !sameAsBilling) {
                    setValidationError('Please fill in all required billing address fields correctly.');
                } else {
                    setValidationError('Please fill in all required address fields correctly.');
                }
                // Scroll to error message
                setTimeout(() => {
                    const errorElement = document.getElementById('validation-error');
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        } else {
            const isValid = validateForm();
            if (isValid) {
                setValidationError('');
                if (paymentMethod === 'razorpay') { handleRazorpayPayment(); }
                else { processOrder(paymentMethod); }
            } else {
                setValidationError('Please fix the validation errors before continuing.');
                // Scroll to error message
                setTimeout(() => {
                    const errorElement = document.getElementById('validation-error');
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
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
    
    // Calculate dynamic fees
    const calculateFees = () => {
        let totalPlatformFee = 0;
        let totalGST = 0;
        let shippingFee = 0; // Will be dynamic from Shiprocket later
        
        selectedCheckoutItems.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            
            // Platform Fee (use product-specific or admin default)
            const platformFeePercent = item.platformFeePercent ?? adminConfig.defaultPlatformFeePercent;
            totalPlatformFee += (itemTotal * platformFeePercent) / 100;
            
            // GST (use product-specific or admin default)
            const gstPercent = item.gstPercent ?? adminConfig.defaultGstPercent;
            totalGST += (itemTotal * gstPercent) / 100;
        });
        
        return {
            platformFee: totalPlatformFee,
            gst: totalGST,
            shipping: shippingFee
        };
    };
    
    const fees = calculateFees();
    
    // Calculate discount from coupon
    const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent / 100) : 0;
    const finalTotal = subtotal + fees.platformFee + fees.gst + fees.shipping - couponDiscount;

    // Apply coupon function
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }
        
        setApplyingCoupon(true);
        setCouponError('');
        
        try {
            // Simulate API call - replace with actual API endpoint
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock coupon validation - replace with actual API call
            const mockCoupons = {
                'SAVE10': { code: 'SAVE10', discountPercent: 10, description: '10% off' },
                'SAVE20': { code: 'SAVE20', discountPercent: 20, description: '20% off' },
                'FIRST50': { code: 'FIRST50', discountPercent: 50, description: '50% off for first order' }
            };
            
            const coupon = mockCoupons[couponCode.toUpperCase()];
            
            if (coupon) {
                setAppliedCoupon(coupon);
                setCouponError('');
            } else {
                setCouponError('Invalid coupon code');
                setAppliedCoupon(null);
            }
        } catch (error) {
            setCouponError('Failed to apply coupon');
            setAppliedCoupon(null);
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleQuantityChange = async (item, newQuantity) => {
        if (newQuantity < 1) return;
        if (newQuantity > (item.stock || 99)) {
            alert(`Only ${item.stock || 99} items available in stock`);
            return;
        }
        
        // For Buy Now items, update the state directly
        if (item.isBuyNow) {
            setCheckoutItems(prevItems => 
                prevItems.map(i => 
                    i.id === item.id ? { ...i, quantity: newQuantity } : i
                )
            );
        } else {
            // For cart items, update in cart
            await updateCartItemQuantity(item.id || item.productId, newQuantity);
        }
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
            <div className="container px-4 py-6 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Checkout <span className="text-gray-400 font-light">Process</span>
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Securely complete your purchase at Sellsathi</p>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:border-primary/20 hover:text-primary transition-all shadow-sm md:self-start"
                    >
                        <ArrowLeft size={18} />
                        Back to Shopping
                    </Link>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-8 space-y-4">
                        {/* Cart Items List */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                                    <ShoppingBag size={20} className="text-primary" />
                                    Your Items ({selectedItems.size} of {checkoutItems.length} selected)
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
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
                                            <div key={itemId} className={`flex gap-3 items-center p-3 rounded-xl border bg-white hover:shadow-sm transition-all ${isSelected ? 'border-primary border-2' : 'border-gray-200'}`}>
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleItemSelection(itemId)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                                            />
                                            
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-semibold text-gray-900 truncate text-sm">{item.name}</h4>
                                                    {isBuyNowItem && (
                                                        <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                                                            Buy Now
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Variant Info */}
                                                {(item.selectedColor || item.selectedSize || item.selectedStorage) && (
                                                    <div className="flex gap-1 text-xs text-gray-600 flex-wrap">
                                                        {item.selectedColor && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedColor}
                                                            </span>
                                                        )}
                                                        {item.selectedSize && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedSize}
                                                            </span>
                                                        )}
                                                        {item.selectedStorage && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                                                {item.selectedStorage}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-medium text-gray-500">Qty:</span>
                                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1}
                                                            className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs">
                                                            <Minus size={10} />
                                                        </button>
                                                        <span className="w-6 text-center font-semibold text-gray-900 text-xs">{item.quantity}</span>
                                                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} disabled={item.quantity >= (item.stock || 99)}
                                                            className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs">
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <PriceDisplay product={{ ...item, price: item.originalPrice || item.price, discountPrice: item.price }} size="sm" showBadge={false} />
                                                {!isBuyNowItem && (
                                                    <button onClick={() => handleRemove(itemId)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Remove">
                                                        <Trash2 size={14} />
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
                            sameAsBilling={sameAsBilling}
                            setSameAsBilling={setSameAsBilling}
                            validationError={validationError}
                            billingAddress={billingAddress}
                            handleBillingAddressChange={handleBillingAddressChange}
                            billingAddressMode={billingAddressMode}
                            setBillingAddressMode={setBillingAddressMode}
                            savedBillingAddresses={savedBillingAddresses}
                            selectedBillingAddressIndex={selectedBillingAddressIndex}
                            setSelectedBillingAddressIndex={setSelectedBillingAddressIndex}
                            setBillingAddress={setBillingAddress}
                            saveBillingForFuture={saveBillingForFuture}
                            setSaveBillingForFuture={setSaveBillingForFuture}
                            setBillingAsDefault={setBillingAsDefault}
                            setSetBillingAsDefault={setSetBillingAsDefault}
                        />

                        {/* Coupon Section - Between Items and Shipping */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50">
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Tag size={18} className="text-primary" />
                                    Apply Coupon Code
                                </h3>
                            </div>
                            <div className="p-4">
                                {!appliedCoupon ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter coupon code"
                                                className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                                disabled={applyingCoupon}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={applyingCoupon || !couponCode.trim()}
                                                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 text-sm"
                                            >
                                                {applyingCoupon ? 'Applying...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-500 font-medium px-1">{couponError}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <Tag size={16} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-green-900">{appliedCoupon.code}</p>
                                                    <p className="text-xs text-green-700">{appliedCoupon.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="p-1.5 hover:bg-green-100 rounded-lg transition-all"
                                                title="Remove coupon"
                                            >
                                                <X size={16} className="text-green-700" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Step 2: Payment */}
                        <PaymentStep
                            step={step}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            finalTotal={finalTotal}
                            razorpayLoading={razorpayLoading}
                            loading={loading}
                            handleContinue={handleContinue}
                        />
                    </div>

                    {/* Order Summary Sidebar */}
                    <CheckoutOrderSummary 
                        subtotal={subtotal} 
                        couponDiscount={couponDiscount}
                        finalTotal={finalTotal}
                        selectedItems={selectedCheckoutItems}
                        adminConfig={adminConfig}
                    />
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
