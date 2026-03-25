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
    handleContinue,
    sameAsBilling,
    setSameAsBilling,
    validationError,
    billingAddress,
    handleBillingAddressChange,
    billingAddressMode,
    setBillingAddressMode,
    savedBillingAddresses,
    selectedBillingAddressIndex,
    setSelectedBillingAddressIndex,
    setBillingAddress,
    saveBillingForFuture,
    setSaveBillingForFuture,
    setBillingAsDefault,
    setSetBillingAsDefault
}) {
    return (
        <section className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all ${step > 1 ? 'opacity-80' : ''}`}>
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">1</div>
                    Shipping Information
                </h3>
                {step === 2 && (
                    <button
                        onClick={() => setStep(1)}
                        className="px-3 py-1.5 text-sm text-primary font-semibold hover:bg-primary/5 rounded-lg transition-all"
                    >
                        Edit
                    </button>
                )}
            </div>

            <div className="p-4">
                {/* Address Summary - Shows on Step 2 (Payment) */}
                {step === 2 && (
                    <div className="space-y-3">
                        {/* Shipping Address Display */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-blue-900 mb-1">Delivery Address</h4>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {shippingAddress.firstName} {shippingAddress.lastName}
                                    </p>
                                    <p className="text-xs text-gray-700 mt-1">
                                        {shippingAddress.addressLine}
                                    </p>
                                    <p className="text-xs text-gray-700">
                                        {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                                    </p>
                                    {shippingAddress.phone && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            Phone: {shippingAddress.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Billing Address Display */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">Billing Address</h4>
                                    {sameAsBilling ? (
                                        <p className="text-xs text-gray-600 italic">Same as delivery address</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {billingAddress.firstName} {billingAddress.lastName}
                                            </p>
                                            <p className="text-xs text-gray-700 mt-1">
                                                {billingAddress.addressLine}
                                            </p>
                                            <p className="text-xs text-gray-700">
                                                {billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}
                                            </p>
                                            {billingAddress.phone && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Phone: {billingAddress.phone}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Descriptive text for shipping address */}
                {step === 1 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Where should we deliver your order?
                        </p>
                    </div>
                )}
                
                {step === 1 && savedAddresses.length > 0 && (
                    <div className="mb-4">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => {
                                    setAddressMode('saved');
                                    if (selectedAddressIndex !== null) {
                                        setShippingAddress(savedAddresses[selectedAddressIndex]);
                                    }
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${addressMode === 'saved'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Saved Address
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
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${addressMode === 'new'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                New Address
                            </button>
                        </div>
                    </div>
                )}

                {addressMode === 'saved' && savedAddresses.length > 0 && step === 1 ? (
                    <div className="space-y-3">
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
                                        phone: '',
                                        type: 'shipping'
                                    });
                                } else {
                                    const index = parseInt(value);
                                    setSelectedAddressIndex(index);
                                    setShippingAddress(savedAddresses[index]);
                                }
                            }}
                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                        >
                            {savedAddresses
                                .filter(addr => !addr.type || addr.type === 'shipping')
                                .map((addr, index) => {
                                    const originalIndex = savedAddresses.indexOf(addr);
                                    return (
                                        <option key={originalIndex} value={originalIndex}>
                                            {addr.firstName} {addr.lastName}, {addr.city}
                                            {addr.isDefault ? ' (Default)' : ''}
                                        </option>
                                    );
                                })}
                        </select>

                        {selectedAddressIndex !== null && savedAddresses[selectedAddressIndex] && (
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 text-sm">
                                        <p className="font-semibold text-gray-900">
                                            {savedAddresses[selectedAddressIndex].firstName} {savedAddresses[selectedAddressIndex].lastName}
                                        </p>
                                        <p className="text-gray-600 text-xs mt-0.5">
                                            {savedAddresses[selectedAddressIndex].addressLine}, {savedAddresses[selectedAddressIndex].city}, {savedAddresses[selectedAddressIndex].state} {savedAddresses[selectedAddressIndex].pincode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : step === 1 ? (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input type="text" name="firstName" value={shippingAddress.firstName} onChange={handleAddressChange} placeholder="First Name"
                                    className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.firstName ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                            </div>
                            <div>
                                <input type="text" name="lastName" value={shippingAddress.lastName} onChange={handleAddressChange} placeholder="Last Name"
                                    className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.lastName ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                            </div>
                            <div className="col-span-2">
                                <input type="text" name="addressLine" value={shippingAddress.addressLine} onChange={handleAddressChange} placeholder="Street, Building, Flat"
                                    className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.addressLine ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                            </div>
                            <div>
                                <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange} placeholder="City"
                                    className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.city ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                            </div>
                            <div>
                                <input type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange} placeholder="State"
                                    className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.state ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                            </div>
                            <div className="col-span-2">
                                <input type="text" name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange} placeholder="Pincode (6 digits)" maxLength={6}
                                    className={`w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none ${errors.pincode ? 'ring-2 ring-red-500/20' : ''}`}
                                    readOnly={step === 2} />
                            </div>
                        </div>
                    </div>
                ) : null}

                {step === 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {/* Validation Error Message */}
                        {validationError && (
                            <div id="validation-error" className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{validationError}</p>
                            </div>
                        )}
                        
                        {/* Billing Address Checkbox */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} 
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5" />
                            <div className="flex-1">
                                <span className="text-xs font-medium text-gray-600">Use this address for billing too</span>
                                <p className="text-[10px] text-gray-500 mt-0.5">(Uncheck to add a different billing address)</p>
                            </div>
                        </label>
                        
                        {/* Billing Address Form - Shows when checkbox is unchecked */}
                        {!sameAsBilling && (
                            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h4 className="text-sm font-bold text-gray-900">Billing Address</h4>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Enter the address for invoice and billing purposes</p>
                                
                                {/* Saved/New Address Toggle for Billing */}
                                {savedBillingAddresses.length > 0 && (
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={() => setBillingAddressMode('saved')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${billingAddressMode === 'saved'
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Saved Address
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBillingAddressMode('new');
                                                setBillingAddress({
                                                    firstName: '',
                                                    lastName: '',
                                                    addressLine: '',
                                                    city: '',
                                                    state: '',
                                                    pincode: '',
                                                    phone: '',
                                                    type: 'billing'
                                                });
                                            }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${billingAddressMode === 'new'
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            New Address
                                        </button>
                                    </div>
                                )}
                                
                                {/* Saved Billing Address Selector */}
                                {billingAddressMode === 'saved' && savedBillingAddresses.length > 0 ? (
                                    <div className="space-y-2">
                                        <select
                                            value={selectedBillingAddressIndex !== null ? selectedBillingAddressIndex : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '') {
                                                    setSelectedBillingAddressIndex(null);
                                                    setBillingAddress({
                                                        firstName: '',
                                                        lastName: '',
                                                        addressLine: '',
                                                        city: '',
                                                        state: '',
                                                        pincode: '',
                                                        phone: '',
                                                        type: 'billing'
                                                    });
                                                } else {
                                                    const index = parseInt(value);
                                                    setSelectedBillingAddressIndex(index);
                                                    setBillingAddress(savedBillingAddresses[index]);
                                                }
                                            }}
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                        >
                                            <option value="">Select a billing address</option>
                                            {savedBillingAddresses.map((addr, index) => {
                                                const originalIndex = savedAddresses.indexOf(addr);
                                                return (
                                                    <option key={originalIndex} value={originalIndex}>
                                                        {addr.firstName} {addr.lastName}, {addr.city}
                                                        {addr.isDefault ? ' (Default)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        
                                        {selectedBillingAddressIndex !== null && savedAddresses[selectedBillingAddressIndex] && (
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <div className="flex-1 text-xs">
                                                        <p className="font-semibold text-gray-900">
                                                            {savedAddresses[selectedBillingAddressIndex].firstName} {savedAddresses[selectedBillingAddressIndex].lastName}
                                                        </p>
                                                        <p className="text-gray-600 mt-0.5">
                                                            {savedAddresses[selectedBillingAddressIndex].addressLine}, {savedAddresses[selectedBillingAddressIndex].city}, {savedAddresses[selectedBillingAddressIndex].state} {savedAddresses[selectedBillingAddressIndex].pincode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <input 
                                                type="text" 
                                                name="firstName" 
                                                value={billingAddress.firstName}
                                                onChange={handleBillingAddressChange}
                                                placeholder="First Name"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                name="lastName" 
                                                value={billingAddress.lastName}
                                                onChange={handleBillingAddressChange}
                                                placeholder="Last Name"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="text" 
                                                name="addressLine" 
                                                value={billingAddress.addressLine}
                                                onChange={handleBillingAddressChange}
                                                placeholder="Street, Building, Flat"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                name="city" 
                                                value={billingAddress.city}
                                                onChange={handleBillingAddressChange}
                                                placeholder="City"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                name="state" 
                                                value={billingAddress.state}
                                                onChange={handleBillingAddressChange}
                                                placeholder="State"
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="text" 
                                                name="pincode" 
                                                value={billingAddress.pincode}
                                                onChange={handleBillingAddressChange}
                                                placeholder="Pincode (6 digits)" 
                                                maxLength={6}
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {/* Save billing address for future */}
                                {billingAddressMode === 'new' && (
                                    <div className="space-y-2 pt-2 border-t border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={saveBillingForFuture} 
                                                onChange={(e) => setSaveBillingForFuture(e.target.checked)} 
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                                            />
                                            <span className="text-xs font-medium text-gray-600">Save this billing address for future orders</span>
                                        </label>
                                        {saveBillingForFuture && (
                                            <label className="flex items-center gap-2 cursor-pointer ml-6">
                                                <input 
                                                    type="checkbox" 
                                                    checked={setBillingAsDefault} 
                                                    onChange={(e) => setSetBillingAsDefault(e.target.checked)} 
                                                    className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500" 
                                                />
                                                <span className="text-xs font-medium text-gray-600">Set as default billing address</span>
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {addressMode === 'new' && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={saveAddressForFuture} onChange={(e) => setSaveAddressForFuture(e.target.checked)} 
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-xs font-medium text-gray-600">Save this shipping address for future orders</span>
                                </label>
                                {saveAddressForFuture && (
                                    <label className="flex items-center gap-2 cursor-pointer ml-6">
                                        <input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} 
                                            className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500" />
                                        <span className="text-xs font-medium text-gray-600">Set as default shipping address</span>
                                    </label>
                                )}
                            </div>
                        )}
                        <button
                            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all text-sm mt-2"
                            onClick={handleContinue}
                            disabled={fetchingSavedAddress}
                        >
                            {fetchingSavedAddress ? 'Loading...' : 'Continue to Payment'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
