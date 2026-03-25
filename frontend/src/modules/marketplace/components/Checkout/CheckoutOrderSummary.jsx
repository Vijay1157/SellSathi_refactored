import React from 'react';
import { Shield, Package, TrendingUp } from 'lucide-react';

export default function CheckoutOrderSummary({ 
    subtotal, 
    couponDiscount, 
    finalTotal,
    selectedItems = [],
    adminConfig = { defaultPlatformFeePercent: 7, defaultGstPercent: 18, defaultShippingHandlingPercent: 0 }
}) {
    // Calculate dynamic fees based on selected products
    const calculateFees = () => {
        let totalPlatformFee = 0;
        let totalGST = 0;
        let shippingFee = 0; // Will be dynamic from Shiprocket later
        
        selectedItems.forEach(item => {
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
    // Use the finalTotal passed from parent instead of recalculating
    // const grandTotal = subtotal + fees.platformFee + fees.gst + fees.shipping - couponDiscount;
    
    return (
        <div className="xl:col-span-4 lg:sticky lg:top-10">
            <section className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-semibold text-sm">Cart Subtotal</span>
                            <span className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-semibold text-sm">Platform Fee</span>
                            <span className="text-gray-900 font-bold">₹{fees.platformFee.toFixed(2)}</span>
                        </div>
                        
                        {fees.gst > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-semibold text-sm">GST</span>
                                <span className="text-gray-900 font-bold">₹{fees.gst.toFixed(2)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-semibold text-sm">Shipping Fee</span>
                            <span className="text-green-500 font-bold uppercase text-xs">
                                {fees.shipping > 0 ? `₹${fees.shipping.toFixed(2)}` : 'FREE'}
                            </span>
                        </div>
                        
                        {couponDiscount > 0 && (
                            <div className="flex justify-between items-center bg-green-50 -mx-2 px-2 py-2 rounded-xl">
                                <span className="text-green-600 font-semibold text-sm">Coupon Discount</span>
                                <span className="text-green-600 font-bold">-₹{couponDiscount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full" />
                    
                    <div className="space-y-1">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-900 font-bold text-base">Total Amount</span>
                            <div className="text-right">
                                <span className="text-2xl font-black text-primary">₹{finalTotal.toLocaleString()}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-green-600 font-bold text-right uppercase tracking-wide">
                            Save with Sellsathi Premium
                        </p>
                    </div>
                    
                    <div className="pt-2">
                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 flex gap-3 items-center">
                            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                <Shield size={18} />
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-gray-900 leading-none mb-0.5">Guaranteed Safety</h5>
                                <p className="text-[10px] text-gray-500 font-medium">100% Secure Transaction</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
