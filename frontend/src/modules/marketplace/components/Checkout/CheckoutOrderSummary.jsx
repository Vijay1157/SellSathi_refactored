import React from 'react';
import { Shield, Package, TrendingUp } from 'lucide-react';

export default function CheckoutOrderSummary({ subtotal }) {
    return (
        <div className="xl:col-span-4 lg:sticky lg:top-10">
            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-400 font-bold text-sm">Cart Subtotal</span>
                            <span className="text-gray-900 font-black">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-400 font-bold text-sm">Shipping Fee</span>
                            <span className="text-green-500 font-black uppercase text-xs">Free</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-400 font-bold text-sm">Platform Tax</span>
                            <span className="text-gray-900 font-black">₹0.00</span>
                        </div>
                    </div>
                    <div className="h-px bg-gray-50 w-full" />
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-900 font-black text-lg">Total Amount</span>
                            <div className="text-right">
                                <span className="text-3xl font-black text-primary">₹{subtotal.toLocaleString()}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-green-600 font-bold text-right uppercase tracking-widest">
                            Save with Sellsathi Premium
                        </p>
                    </div>
                    <div className="pt-2">
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-3 items-center">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h5 className="text-xs font-black text-gray-900 leading-none mb-1">Guaranteed Safety</h5>
                                <p className="text-[10px] text-gray-400 font-bold">100% Secure Transaction System</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50/50 p-6 flex flex-col items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-[8px] flex items-center justify-center text-white font-black">+2k</div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold">Consumers recently purchased here</p>
                </div>
            </section>

            <div className="mt-6 flex items-center justify-center gap-6 grayscale opacity-30">
                <Shield size={24} />
                <Package size={24} />
                <TrendingUp size={24} />
            </div>
        </div>
    );
}
