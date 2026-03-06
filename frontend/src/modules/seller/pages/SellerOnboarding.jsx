import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, CheckCircle2 } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';
import PersonalInfoStep from '../components/SellerOnboarding/PersonalInfoStep';
import BusinessInfoStep from '../components/SellerOnboarding/BusinessInfoStep';
import VerificationStep from '../components/SellerOnboarding/VerificationStep';

const SellerOnboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Enhanced seller data state
  const [sellerData, setSellerData] = useState({
    // Personal Details
    fullName: '',
    aadhaarNumber: '',
    phoneNumber: '',
    age: '',

    // Shop Details
    shopAddress: '',
    shopName: '',
    shopCategory: '',

    // GST Details
    hasGST: null, // 'yes' or 'no'
    gstNumber: '',

    // EID Details (for non-GST)
    panNumber: '',
    nameAsPerPAN: '',
    emailId: '',
    state: '',
    pincode: '',
    landmark: '',
    district: '',
    city: '',
    buildingNumber: '',
    streetLocality: '',

    // Pickup Address
    pickupAddress: '',
    pickupStreet: '',
    pickupLandmark: '',
    pickupCity: '',
    pickupState: '',
    pickupPincode: '',

    // Bank Details
    bankAccountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',

    // Supplier Details
    supplierName: '',
    businessType: '',
    productCategory: '',
    contactEmail: '',

    // Aadhaar Image
    aadhaarImageUrl: ''
  });

  // Handle Aadhaar extracted data
  useEffect(() => {
    const extractedData = location.state?.extractedData ||
      JSON.parse(localStorage.getItem('sellerAadhaarData') || '{}');

    if (extractedData.fullName || extractedData.aadhaarNumber) {
      setSellerData(prev => ({
        ...prev,
        fullName: extractedData.fullName || prev.fullName,
        aadhaarNumber: extractedData.aadhaarNumber || prev.aadhaarNumber,
        phoneNumber: extractedData.phoneNumber || prev.phoneNumber,
        age: extractedData.age || prev.age,
        shopAddress: extractedData.shopAddress || prev.shopAddress,
        pincode: extractedData.pincode || prev.pincode,
        aadhaarImageUrl: extractedData.aadhaarImageUrl || prev.aadhaarImageUrl
      }));
    }
  }, [location.state]);

  const updateSellerData = (field, value) => {
    setSellerData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1: // Personal Details & PAN
        return sellerData.fullName &&
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
      case 2: // Business (Shop, GST, Pickup)
        const isBaseValid = sellerData.shopName && sellerData.shopCategory && sellerData.hasGST;
        if (!isBaseValid) return false;
        if (sellerData.hasGST === 'yes' && sellerData.gstNumber?.length !== 15) return false;
        const isPickupValid = sellerData.pickupAddress && sellerData.pickupCity && sellerData.pickupState && sellerData.pickupPincode?.length === 6;
        if (!isPickupValid) return false;
        return true;
      case 3: // Bank & Supplier Details
        return sellerData.bankAccountName &&
          sellerData.accountNumber &&
          sellerData.ifscCode &&
          sellerData.supplierName &&
          sellerData.businessType &&
          sellerData.productCategory &&
          sellerData.contactEmail;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      setError('Please fill all required fields correctly');
      return;
    }
    setError('');
    if (step < 3) setStep(step + 1);
    else if (step === 3) handleSubmitApplication();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitApplication = async () => {
    if (!validateStep(3)) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build the full address from structured fields
      const fullAddress = [
        sellerData.buildingNumber,
        sellerData.streetLocality,
        sellerData.landmark,
        sellerData.city,
        sellerData.district,
        sellerData.state,
        sellerData.pincode
      ].filter(Boolean).join(', ');

      // Send seller data to backend using authenticated fetch
      const response = await authFetch('/auth/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerDetails: {
            ...sellerData,
            category: sellerData.shopCategory,
            address: fullAddress || sellerData.shopAddress || sellerData.buildingNumber
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Your seller application has been submitted successfully. Our team will review it shortly.');
        setTimeout(() => {
          navigate('/seller/dashboard');
        }, 3000);
      } else {
        setError(result.message || 'Failed to submit application');
      }
    } catch (err) {
      setError('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PersonalInfoStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} />;
      case 2:
        return <BusinessInfoStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <VerificationStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} prevStep={prevStep} loading={loading} />;
      default:
        return <PersonalInfoStep sellerData={sellerData} updateSellerData={updateSellerData} nextStep={nextStep} />;
    }
  };

  const steps = [
    { id: 1, name: 'Personal Details' },
    { id: 2, name: 'Business & Pickup' },
    { id: 3, name: 'Bank & Supplier' }
  ];

  return (
    <div className="min-h-screen relative bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* 1. Branding Side (Left 50%) */}
      <div
        className="lg:w-1/2 p-12 lg:p-20 text-white flex flex-col justify-center relative z-10 min-h-[40vh] lg:min-h-screen"
        style={{ background: 'linear-gradient(135deg, #7B4DDB, #5A32C8)' }}
      >
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-12 transition-colors">
            <ArrowLeft size={20} /> Back to SellSathi
          </Link>

          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Store size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Seller Center</h3>
              <p className="text-white/60 text-sm">SellSathi for Business</p>
            </div>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-8">
            Grow your business with SellSathi
          </h1>
          <p className="text-xl text-white/80 max-w-md mb-12">
            Reach millions of customers and scale your brand with powerful selling tools.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {['Sales Analytics', 'Inventory Mgmt', 'Growth Insights', 'Fast Payouts'].map(feat => (
              <div key={feat} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-sm font-semibold">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Content Side (Right 50%) */}
      <div className="lg:w-1/2 flex flex-col bg-gray-50 h-screen overflow-hidden">
        {/* Fixed Header with Progress */}
        <div className="z-20 pt-4 pb-4 px-6 bg-white border-b border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-start">
            <div className="flex items-center bg-gray-50 rounded-full p-1.5 border border-gray-100">
              {steps.map((stepItem, index) => (
                <React.Fragment key={stepItem.id}>
                  <div
                    className={`flex items-center px-4 py-2 rounded-full transition-all ${step === stepItem.id ? 'text-white font-semibold' :
                      step > stepItem.id ? 'text-white' : 'text-gray-400'
                      }`}
                    style={step >= stepItem.id ? { backgroundColor: '#7B4DDB' } : {}}
                  >
                    <span className="text-xs font-bold leading-none">
                      {step > stepItem.id ? '✓' : stepItem.id}
                    </span>
                    <span className="ml-2 text-[10px] hidden sm:block uppercase tracking-widest font-bold">
                      {stepItem.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 h-0.5 mx-1 ${step > stepItem.id ? 'bg-[#7B4DDB]' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full pb-12">
            <div className="bg-white p-6 border-b border-gray-100 min-h-screen">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {success ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-green-600" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                  <p className="text-gray-500">{success}</p>
                </div>
              ) : (
                renderStep()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
