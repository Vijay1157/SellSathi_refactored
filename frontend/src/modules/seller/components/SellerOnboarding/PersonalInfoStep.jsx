import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INDIAN_STATES, CITY_DATA } from './onboardingConfig';

export default function PersonalInfoStep({ sellerData, updateSellerData, nextStep }) {
  const availableCities = CITY_DATA[sellerData.state] || [];

  const isFormValid = sellerData.fullName &&
    sellerData.aadhaarNumber?.length === 12 &&
    sellerData.phoneNumber?.length === 10 &&
    sellerData.age &&
    sellerData.panNumber?.length === 10 &&
    sellerData.nameAsPerPAN &&
    sellerData.emailId &&
    sellerData.state &&
    sellerData.pincode?.length === 6 &&
    sellerData.district &&
    sellerData.city &&
    sellerData.buildingNumber &&
    sellerData.streetLocality;

  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B4DDB] focus:border-[#7B4DDB] text-sm";

  return (
    <div className="bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Personal Details</h2>
        <p className="text-gray-500 text-sm">Provide your legal information carefully</p>
      </div>

      <div className="space-y-5">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
            <input type="text" value={sellerData.fullName}
              onChange={(e) => updateSellerData('fullName', e.target.value)}
              className={inp} placeholder="Enter your full name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Number (Locked) *</label>
            <input type="text" readOnly value={sellerData.aadhaarNumber}
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed text-sm"
              placeholder="12-digit Aadhaar number" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label>
            <input type="tel" maxLength={10} value={sellerData.phoneNumber}
              onChange={(e) => updateSellerData('phoneNumber', e.target.value.replace(/\D/g, ''))}
              className={inp} placeholder="10-digit phone number" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Age (Locked) *</label>
            <input type="text" readOnly value={sellerData.age}
              className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed text-sm"
              placeholder="Age" />
          </div>
        </div>

        {/* PAN Section */}
        <div className="border-t pt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">PAN & Identity Details</h3>
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 mb-4 flex gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-blue-600 mt-0.5" />
            <p>Identity data (EID) allows tax-exempt selling without a GST certificate.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">PAN Number *</label>
              <input type="text" maxLength={10} value={sellerData.panNumber}
                onChange={(e) => updateSellerData('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className={inp} placeholder="e.g. ABCDE1234F" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name as per PAN *</label>
              <input type="text" value={sellerData.nameAsPerPAN}
                onChange={(e) => updateSellerData('nameAsPerPAN', e.target.value)}
                className={inp} placeholder="Legal name on PAN card" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Email ID *</label>
          <input type="email" value={sellerData.emailId}
            onChange={(e) => updateSellerData('emailId', e.target.value)}
            className={inp} placeholder="your@business.com" />
        </div>

        {/* Address Section */}
        <div className="border-t pt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Shop / Business Address</h3>
          <div className="space-y-4">
            {/* Plot / Building */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plot / Building / House No. *</label>
                <input type="text" value={sellerData.buildingNumber}
                  onChange={(e) => updateSellerData('buildingNumber', e.target.value)}
                  className={inp} placeholder="e.g. Plot 12, Flat 3A" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Street / Road Name *</label>
                <input type="text" value={sellerData.streetLocality}
                  onChange={(e) => updateSellerData('streetLocality', e.target.value)}
                  className={inp} placeholder="e.g. MG Road, Sector 21" />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Landmark</label>
              <input type="text" value={sellerData.landmark}
                onChange={(e) => updateSellerData('landmark', e.target.value)}
                className={inp} placeholder="e.g. Near City Mall, Opp. Bus Stand" />
            </div>

            {/* State & City Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                <select value={sellerData.state}
                  onChange={(e) => { updateSellerData('state', e.target.value); updateSellerData('city', ''); }}
                  className={inp + " bg-white"}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City *</label>
                {availableCities.length > 0 ? (
                  <select value={sellerData.city}
                    onChange={(e) => updateSellerData('city', e.target.value)}
                    className={inp + " bg-white"}>
                    <option value="">Select City</option>
                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input type="text" value={sellerData.city}
                    onChange={(e) => updateSellerData('city', e.target.value)}
                    className={inp} placeholder="Enter city name" />
                )}
              </div>
            </div>

            {/* District & Pincode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">District *</label>
                <input type="text" value={sellerData.district}
                  onChange={(e) => updateSellerData('district', e.target.value)}
                  className={inp} placeholder="e.g. Central Delhi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pincode *</label>
                <input type="text" maxLength={6} value={sellerData.pincode}
                  onChange={(e) => updateSellerData('pincode', e.target.value.replace(/\D/g, ''))}
                  className={inp} placeholder="6-digit pincode" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button onClick={nextStep} disabled={!isFormValid}
            style={{ backgroundColor: '#7B4DDB' }}
            className="px-8 py-3 text-white font-bold rounded-xl shadow-md hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}
