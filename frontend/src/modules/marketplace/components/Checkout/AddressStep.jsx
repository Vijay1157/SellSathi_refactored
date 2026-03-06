import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default function AddressStep({
    step,
    setStep,
    shippingAddress,
    handleAddressChange,
    errors,
    savedAddresses,
    selectedAddressIndex,
    setSelectedAddressIndex,
    setShippingAddress,
    addressMode,
    setAddressMode,
    saveAddressForFuture,
    setSaveAddressForFuture,
    setAsDefault,
    setSetAsDefault,
    fetchingSavedAddress,
    handleContinue
}) {
    return (
        <section className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all ${step > 1 ? 'opacity-80' : ''}`}>
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20">1</div>
                    Shipping Information
                </h3>
                {step === 2 && (
                    <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all"
                    >
                        Edit Address
                    </button>
                )}
            </div>

            <div className="p-8">
                {step === 1 && savedAddresses.length > 0 && (
                    <div className="mb-6">
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => {
                                    setAddressMode('saved');
                                    if (selectedAddressIndex !== null) {
                                        setShippingAddress(savedAddresses[selectedAddressIndex]);
                                    }
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${addressMode === 'saved'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Select Saved Address
                            </button>
                            <button
                                onClick={() => {
                                    setAddressMode('new');
                                    setShippingAddress({
                                        firstName: '',
                                        lastName: '',
                                        addressLine: '',
                                        city: '',
                                        state: '',
                                        pincode: ''
                                    });
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${addressMode === 'new'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Enter New Address
                            </button>
                        </div>
                    </div>
                )}

                {addressMode === 'saved' && savedAddresses.length > 0 && step === 1 ? (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Delivery Address</label>
                            <select
                                value={selectedAddressIndex !== null ? selectedAddressIndex : ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                        setSelectedAddressIndex(null);
                                        setShippingAddress({
                                            firstName: '',
                                            lastName: '',
                                            addressLine: '',
                                            city: '',
                                            state: '',
                                            pincode: '',
                                            phone: ''
                                        });
                                    } else {
                                        const index = parseInt(value);
                                        setSelectedAddressIndex(index);
                                        setShippingAddress(savedAddresses[index]);
                                    }
                                }}
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none"
                            >
                                <option value="">Choose an address</option>
                                {savedAddresses.map((addr, index) => (
                                    <option key={index} value={index}>
                                        {addr.label} - {addr.firstName} {addr.lastName}, {addr.addressLine}, {addr.city}
                                        {addr.isDefault ? ' (Default)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedAddressIndex !== null && savedAddresses[selectedAddressIndex] && (
                            <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-6 rounded-2xl border border-blue-100/50">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin size={20} className="text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-bold text-gray-900">{savedAddresses[selectedAddressIndex].label}</h4>
                                            {savedAddresses[selectedAddressIndex].isDefault && (
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium">
                                            {savedAddresses[selectedAddressIndex].firstName} {savedAddresses[selectedAddressIndex].lastName}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {savedAddresses[selectedAddressIndex].addressLine}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {savedAddresses[selectedAddressIndex].city}, {savedAddresses[selectedAddressIndex].state} {savedAddresses[selectedAddressIndex].pincode}
                                        </p>
                                        {savedAddresses[selectedAddressIndex].phone && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Phone: {savedAddresses[selectedAddressIndex].phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">First Name</label>
                            <input type="text" name="firstName" value={shippingAddress.firstName} onChange={handleAddressChange} placeholder="John"
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none ${errors.firstName ? 'ring-2 ring-red-500/20' : ''}`}
                                readOnly={step === 2} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Last Name</label>
                            <input type="text" name="lastName" value={shippingAddress.lastName} onChange={handleAddressChange} placeholder="Doe"
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none ${errors.lastName ? 'ring-2 ring-red-500/20' : ''}`}
                                readOnly={step === 2} />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Delivery Address</label>
                            <div className="relative">
                                <input type="text" name="addressLine" value={shippingAddress.addressLine} onChange={handleAddressChange} placeholder="Street, Building, Flat"
                                    className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none ${errors.addressLine ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">City</label>
                            <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange} placeholder="Bangalore"
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none ${errors.city ? 'ring-2 ring-red-500/20' : ''}`}
                                readOnly={step === 2} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">State</label>
                            <input type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange} placeholder="Karnataka"
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none ${errors.state ? 'ring-2 ring-red-500/20' : ''}`}
                                readOnly={step === 2} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pincode</label>
                            <input type="text" name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange} placeholder="560XXX" maxLength={6}
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-4 ring-primary/10 transition-all outline-none ${errors.pincode ? 'ring-2 ring-red-500/20' : ''}`}
                                readOnly={step === 2} />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-6">
                        {addressMode === 'new' && (
                            <div className="w-full space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${saveAddressForFuture ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-110' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                        <input type="checkbox" checked={saveAddressForFuture} onChange={(e) => setSaveAddressForFuture(e.target.checked)} className="hidden" />
                                        {saveAddressForFuture && <CheckCircle2 size={16} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">Save this address for future use</span>
                                </label>
                                {saveAddressForFuture && (
                                    <label className="flex items-center gap-3 cursor-pointer group ml-9">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${setAsDefault ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/20 scale-110' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                            <input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} className="hidden" />
                                            {setAsDefault && <CheckCircle2 size={16} className="text-white" />}
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">Set as default address</span>
                                    </label>
                                )}
                            </div>
                        )}
                        <button
                            className="w-full sm:w-auto px-12 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-lg"
                            onClick={handleContinue}
                            disabled={fetchingSavedAddress}
                        >
                            {fetchingSavedAddress ? 'Syncing...' : 'Continue to Payment Selection'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
