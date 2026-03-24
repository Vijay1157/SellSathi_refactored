
import { auth } from '@/modules/shared/config/firebase';
import { authFetch } from './api';
import { getProductPricing } from './priceUtils';

// Helper to get current user UID (consistent with wishlist)
// Helper to get current user UID (syncs with Navbar state and prevents ghost sessions)
const getUID = () => {
    const localUserStr = localStorage.getItem('user');
    if (!localUserStr) {
        // Local storage says logged out. Clean up any orphaned Firebase session.
        if (auth.currentUser) {
            auth.signOut().catch(console.error);
        }
        return null;
    }

    try {
        const localUser = JSON.parse(localUserStr);
        return auth.currentUser?.uid || localUser.uid;
    } catch (e) {
        return null;
    }
};

export const addToCart = async (product, selections = {}) => {
    try {
        const uid = getUID();
        
        let localUser = null;
        try { localUser = JSON.parse(localStorage.getItem('user')); } catch(e){}

        if (localUser && (localUser.role === 'SELLER' || localUser.role === 'ADMIN')) {
            alert("Sellers and Admins cannot purchase products. Please create a user account to buy.");
            return { success: false, message: "Sellers cannot purchase products. Please create a user account to buy.", triggerLogin: true };
        }

        const { finalPrice, strikethroughPrice } = getProductPricing(product, selections);

        const variantKey = Object.values(selections).filter(Boolean).join('_');
        const cartItemId = variantKey ? `${product.id}_${variantKey.replace(/\s+/g, '')}` : product.id;

        const cartItemData = {
            productId: product.id,
            id: cartItemId,
            sellerId: product.sellerId || null,
            name: product.name || product.title,
            price: finalPrice,
            originalPrice: strikethroughPrice,
            imageUrl: product.imageUrl || product.image,
            quantity: 1,
            category: product.category,
            selections: {
                color: selections.color || null,
                size: selections.size || null,
                storage: selections.storage?.label || selections.storage || null,
                memory: selections.memory?.label || selections.memory || null
            }
        };

        if (!uid) {
            window.dispatchEvent(new Event('openLoginModal'));
            return { success: false, message: "Please login to add items to cart", triggerLogin: true };
        } else {
            // Logged in: Backend API — POST /consumer/:uid/cart with action:'add'
            const response = await authFetch(`/consumer/${uid}/cart`, {
                method: 'POST',
                body: JSON.stringify({ action: 'add', item: cartItemData })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to add to backend');

            window.dispatchEvent(new Event('cartUpdate'));
            return { success: true, message: "Added to cart successfully" };
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, message: error.message || "Failed to add to cart" };
    }
};

export const listenToCart = (callback) => {
    const handleUpdate = async () => {
        try {
            const uid = getUID();
            if (!uid) {
                callback([]);
            } else {
                // GET /consumer/:uid/cart
                const response = await authFetch(`/consumer/${uid}/cart`);
                const data = await response.json();
                if (data.success) {
                    callback(data.cart || []);
                } else {
                    callback([]);
                }
            }
        } catch (error) {
            console.error("Error fetching cart for listener:", error);
            callback([]);
        }
    };

    // Initial load
    handleUpdate();

    window.addEventListener('cartUpdate', handleUpdate);
    window.addEventListener('userDataChanged', handleUpdate);

    return () => {
        window.removeEventListener('cartUpdate', handleUpdate);
        window.removeEventListener('userDataChanged', handleUpdate);
    };
};

export const removeFromCart = async (cartItemId) => {
    try {
        const uid = getUID();
        if (!uid) {
            return { success: false, message: "Authentication required" };
        } else {
            // POST /consumer/:uid/cart with action:'remove'
            const response = await authFetch(`/consumer/${uid}/cart`, {
                method: 'POST',
                body: JSON.stringify({ action: 'remove', itemId: cartItemId })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to remove');

            window.dispatchEvent(new Event('cartUpdate'));
            return { success: true };
        }
    } catch (error) {
        console.error("Error removing from cart:", error);
        return { success: false, message: error.message };
    }
};

export const clearCart = async () => {
    try {
        const uid = getUID();
        if (!uid) {
            return { success: false };
        } else {
            // POST /consumer/:uid/cart with action:'clear'
            const response = await authFetch(`/consumer/${uid}/cart`, {
                method: 'POST',
                body: JSON.stringify({ action: 'clear' })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to clear');

            window.dispatchEvent(new Event('cartUpdate'));
            return { success: true };
        }
    } catch (error) {
        console.error("Error clearing cart:", error);
        return { success: false, message: error.message };
    }
};

export const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    try {
        const uid = getUID();
        if (!uid) {
            return { success: false, message: 'Authentication required' };
        } else {
            // Fetch current cart, update quantity, overwrite
            const getRes = await authFetch(`/consumer/${uid}/cart`);
            const getData = await getRes.json();
            if (!getData.success) throw new Error('Failed to fetch cart for update');
            const currentCart = getData.cart || [];
            const idx = currentCart.findIndex(i => i.id === cartItemId);
            if (idx > -1) currentCart[idx].quantity = newQuantity;

            // Overwrite entire cart with updated quantity
            const response = await authFetch(`/consumer/${uid}/cart`, {
                method: 'POST',
                body: JSON.stringify({ cart: currentCart })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to update quantity');

            window.dispatchEvent(new Event('cartUpdate'));
            return { success: true };
        }
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        return { success: false, message: error.message };
    }
};
