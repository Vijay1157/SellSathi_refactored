import React from 'react';
import { CreditCard, Banknote, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentStep({
    step,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    razorpayLoading,
    loading,
    handleContinue
}) {
    return (
        <section className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all ${step < 2 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div className="p-8 border-b border-gray-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20">2</div>
                    Secure Payment Method
                </h3>
            </div>

            <div className="p-8 space-y-6">
                {/* Pay Online Option */}
                <div
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'}`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'razorpay' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'razorpay' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400 group-hover:text-primary'}`}>
                            <CreditCard size={22} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">Pay Online</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Cards, UPI, Netbanking, Wallets via Razorpay</p>
                        </div>
                        {paymentMethod === 'razorpay' && (
                            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-green-100">
                                <Shield size={14} className="inline mr-1" />
                                Secure
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {paymentMethod === 'razorpay' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
                            >
                                <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-5 rounded-2xl mb-5 border border-blue-100/50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 mb-1">Secure Payment via Razorpay</p>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                You'll be redirected to Razorpay to complete your payment. All major cards, UPI, netbanking & wallets are accepted.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleContinue();
                                    }}
                                    disabled={razorpayLoading}
                                >
                                    {razorpayLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Shield size={20} />
                                            Pay ₹{subtotal.toLocaleString()} Securely
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Cash on Delivery Option */}
                <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'}`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'cod' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400 group-hover:text-primary'}`}>
                            <Banknote size={22} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">Cash on Delivery</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Pay when you receive the order</p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {paymentMethod === 'cod' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
                            >
                                <div className="bg-amber-50/50 p-5 rounded-2xl mb-5 border border-amber-100/50">
                                    <p className="text-sm text-gray-700 leading-relaxed text-center font-medium">
                                        Pay online for a safer and contactless delivery experience
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleContinue();
                                    }}
                                    disabled={loading || razorpayLoading}
                                >
                                    {loading ? 'Processing...' : 'Place Order'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
