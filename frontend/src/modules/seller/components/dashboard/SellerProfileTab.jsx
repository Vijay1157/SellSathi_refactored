import { useState } from 'react';
import { User, Store, MapPin, CreditCard, Package, CheckCircle, AlertCircle, ImageIcon } from 'lucide-react';

export default function SellerProfileTab({ profile }) {
    const [personalTab, setPersonalTab] = useState('personal');

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>Personal & Business Details</h2>
                    <p style={{ color: '#64748b' }}>Manage your verified account information</p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
                {[
                    { id: 'personal', label: 'Personal', icon: <User size={16} /> },
                    { id: 'business', label: 'Business', icon: <Store size={16} /> },
                    { id: 'pickup', label: 'Pickup Address', icon: <MapPin size={16} /> },
                    { id: 'bank', label: 'Bank Details', icon: <CreditCard size={16} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setPersonalTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600,
                            transition: 'all 0.2s',
                            background: personalTab === t.id ? 'var(--primary)10' : 'transparent',
                            color: personalTab === t.id ? 'var(--primary)' : '#64748b',
                            border: 'none', cursor: 'pointer'
                        }}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl p-10 border border-gray-100 min-h-[400px]">
                {personalTab === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Identity Details</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {[
                                { label: 'Full Name', value: profile.fullName || profile.name || 'N/A' },
                                    { label: 'Aadhaar Number', value: profile.aadhaarNumber ? `XXXX XXXX ${profile.aadhaarNumber.slice(-4)}` : 'N/A' },
                                    { label: 'Phone Number', value: profile.phoneNumber || 'N/A' },
                                    { label: 'Age', value: profile.age || 'N/A' },
                                    { label: 'Email', value: profile.emailId || 'N/A' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-lg font-semibold text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {profile.aadhaarImageUrl && (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Document Proof</h3>
                                <div className="rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 bg-gray-50 p-2">
                                    <img src={profile.aadhaarImageUrl} alt="Aadhaar" className="w-full h-auto rounded-xl shadow-sm" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                                </div>
                                <p className="text-xs text-gray-400 italic flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Verified via Gemini Vision AI</p>
                            </div>
                        )}
                    </div>
                )}

                {personalTab === 'business' && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[
                                { label: 'Supplier/Shop Name', value: profile.supplierName || profile.shopName, icon: <Store className="text-purple-500" /> },
                                { label: 'Business Type', value: profile.businessType || 'N/A', icon: <User className="text-blue-500" /> },
                                { label: 'Product Category', value: profile.productCategory || profile.shopCategory || 'N/A', icon: <Package className="text-orange-500" /> },
                                { label: 'Contact Email', value: profile.contactEmail || profile.emailId || 'N/A', icon: <ImageIcon className="text-pink-500" /> },
                                { label: 'GST Number', value: profile.gstNumber || 'Exempted (EID)', icon: <CheckCircle className="text-green-500" /> },
                                { label: 'PAN Number', value: profile.panNumber || 'N/A', icon: <CreditCard className="text-indigo-500" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:shadow-md">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-gray-100">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-lg font-bold text-gray-800 break-words">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {personalTab === 'pickup' && (
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                                <MapPin size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Shipment Pickup Address</h3>
                                <p className="text-gray-500 text-sm">This address will be used for courier pickups</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-[2rem] p-10 border border-gray-100 space-y-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest underline decoration-orange-200 decoration-2 underline-offset-4">Primary Pickup Location</span>
                                <p className="text-xl font-medium text-gray-800 leading-relaxed italic">
                                    "{profile.pickupAddress || profile.shopAddress || 'Address not provided'}"
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-6 border-t border-gray-200">
                                {[
                                    { label: 'City', value: profile.pickupCity || profile.city || 'N/A' },
                                    { label: 'State', value: profile.pickupState || profile.state || 'N/A' },
                                    { label: 'Pincode', value: profile.pickupPincode || profile.pincode || 'N/A' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                                        <span className="text-lg font-bold text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {personalTab === 'bank' && (
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-inner">
                                <CreditCard size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Financial Settlements</h3>
                                <p className="text-gray-500 text-sm">Bank account for payouts and tax compliance</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Account Holder Name', value: profile.bankAccountName || 'N/A' },
                                { label: 'Account Number', value: profile.accountNumber ? `XXXXXXXX${profile.accountNumber.slice(-4)}` : 'N/A' },
                                { label: 'IFSC Code', value: profile.ifscCode || 'N/A' },
                                { label: 'UPI ID', value: profile.upiId || 'N/A' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm flex flex-col gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-xl font-bold text-indigo-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <p className="text-sm text-indigo-900 font-medium">To change your primary bank account, please contact the SellSathi verification desk with valid proof of ownership.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
