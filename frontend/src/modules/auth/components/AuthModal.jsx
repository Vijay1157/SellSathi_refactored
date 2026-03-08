import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ShieldCheck, User as UserIcon, Mail } from 'lucide-react';
import { auth } from '@/modules/shared/config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/modules/shared/utils/api';
import PhoneOtpForm from './PhoneOtpForm';
import EmailAuthForm from './EmailAuthForm';
import './AuthModal.css';

const TEST_CREDENTIALS = {
    '+917483743936': { otp: '123456', role: 'ADMIN' },
    '+919876543210': { otp: '123456', role: 'CONSUMER' },
    '+917676879059': { otp: '123456', role: 'CONSUMER' },
    '+919353469036': { otp: '741852', role: 'SELLER' },
};

/** Redirects user based on role/status after a successful auth response */
function redirectByRole(data, navigate) {
    if (data.role === 'ADMIN') navigate('/admin');
    else if (data.role === 'SELLER' && (data.status === 'APPROVED' || data.sellerStatus === 'APPROVED')) navigate('/seller/dashboard');
    else if (data.role === 'SELLER' && (data.status === 'PENDING' || data.sellerStatus === 'PENDING')) {
        alert(`⏳ Your seller application for "${data.shopName || 'your shop'}" is pending admin approval.`);
        navigate('/');
    } else navigate('/');
}

/** Stores user data to localStorage and dispatches userDataChanged event */
function persistUser(data, extras = {}) {
    const userData = { uid: data.uid, role: data.role, ...extras };
    localStorage.setItem('user', JSON.stringify(userData));
    if (extras.fullName) localStorage.setItem('userName', extras.fullName);
    if (extras.dob) localStorage.setItem('dob', extras.dob);
    window.dispatchEvent(new CustomEvent('userDataChanged', { detail: userData }));
}

export default function AuthModal({ isOpen, onClose, onSuccess, hideRegister }) {
    const [step, setStep] = useState('phone');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isEmailSignup, setIsEmailSignup] = useState(false);
    const [isEmailLogin, setIsEmailLogin] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailOtpStep, setEmailOtpStep] = useState('details'); // 'details' | 'otp'
    const [emailOtp, setEmailOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isTestNumber, setIsTestNumber] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', dob: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [dobFocused, setDobFocused] = useState(false);
    const navigate = useNavigate();

    const cleanupRecaptcha = () => {
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (_) {}
            window.recaptchaVerifier = null;
        }
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
    };

    const handleClose = () => {
        setStep('phone'); setPhone(''); setOtp(''); setError('');
        setConfirmationResult(null); setIsTestNumber(false); setIsRegistering(false);
        setIsEmailSignup(false); setIsEmailLogin(false);
        setEmailOtpStep('details'); setEmailOtp('');
        setFormData({ fullName: '', dob: '', email: '', password: '', confirmPassword: '' });
        cleanupRecaptcha();
        onClose();
    };

    useEffect(() => { return () => cleanupRecaptcha(); }, []);
    useEffect(() => { 
        if (!isOpen) handleClose(); 
        
        // Lock body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Optional: add padding to prevent layout shift if needed
            // document.body.style.paddingRight = 'var(--scrollbar-width, 15px)';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    const setupRecaptcha = () => {
        cleanupRecaptcha();
        setTimeout(() => {
            try {
                if (!document.getElementById('recaptcha-container')) return;
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {},
                    'expired-callback': () => cleanupRecaptcha(),
                });
            } catch (e) { console.error('Recaptcha error:', e); cleanupRecaptcha(); }
        }, 100);
    };

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        if (phone.length < 10) { setError('Please enter a valid 10-digit phone number'); return; }
        const phoneNumber = `+91${phone}`;
        setError('');
        if (TEST_CREDENTIALS[phoneNumber]) {
            setIsTestNumber(true); setStep('otp'); setConfirmationResult({ isTestMode: true }); return;
        }
        setIsTestNumber(false); setLoading(true);
        try {
            await new Promise(r => { setupRecaptcha(); setTimeout(r, 200); });
            if (!window.recaptchaVerifier) throw new Error('reCAPTCHA initialization failed');
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation); setStep('otp');
        } catch (err) {
            setError(err.code === 'auth/too-many-requests' ? 'Too many attempts. Please try later.' : 'Failed to send OTP. Check your connection.');
            cleanupRecaptcha();
        } finally { setLoading(false); }
    };

    const handleVerifyOrRegister = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
        setLoading(true); setError('');
        try {
            const phoneNumber = `+91${phone}`;
            let idToken = null;
            if (!isTestNumber || !confirmationResult?.isTestMode) {
                const result = await confirmationResult.confirm(otp);
                idToken = await result.user.getIdToken();
            }
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering
                ? { idToken, phone: phoneNumber, email: formData.email, password: formData.password, isTest: isTestNumber, otp: isTestNumber ? otp : undefined }
                : (isTestNumber ? { phone: phoneNumber, otp, isTest: true } : { idToken });
            const response = await authFetch(endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, fullName: formData.fullName, dob: formData.dob }),
            });
            const data = await response.json();
            if (data.success) {
                persistUser(data, { phone: phoneNumber, status: data.status, sellerStatus: data.sellerStatus, shopName: data.shopName, fullName: formData.fullName || data.fullName, dob: formData.dob });
                if (isRegistering) navigate('/'); else redirectByRole(data, navigate);
                if (onSuccess) onSuccess(data);
                handleClose();
            } else setError(data.message || 'Verification failed');
        } catch (err) { setError(err.message || 'Verification failed. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true); setError('');
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            const idToken = await result.user.getIdToken();
            const response = await authFetch('/auth/google-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
            const data = await response.json();
            if (data.success) {
                if (data.requiresRegistration) {
                    // Google authenticated successfully, but user doesn't exist
                    setFormData({ ...formData, email: data.email, fullName: data.fullName || '' });
                    setIsEmailSignup(true);
                    setIsRegistering(true);
                    setError('Please complete your profile to finish registration.');
                    return;
                }
                persistUser(data, { email: data.email, fullName: data.fullName, status: data.status, sellerStatus: data.sellerStatus, shopName: data.shopName });
                localStorage.setItem('userName', data.fullName || '');
                redirectByRole(data, navigate);
                if (onSuccess) onSuccess(data);
                handleClose();
            } else setError(data.message || 'Google authentication failed');
        } catch (err) {
            const msgs = { 'auth/popup-closed-by-user': 'Authentication cancelled.', 'auth/popup-blocked': 'Popup blocked. Allow popups for this site.', 'auth/network-request-failed': 'Network error. Check your connection.' };
            setError(msgs[err.code] || 'Google authentication failed. Please try again.');
        } finally { setLoading(false); }
    };

    const handleEmailLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        
        // Only require email/password for login; registration fields are handled in handleRegisterDirectly
        if (!formData.email.trim() || !formData.password.trim()) { 
            setError('Please enter both email and password'); 
            return; 
        }
        setLoading(true);
        try {
            let idToken = null, isTestMode = false;
            try {
                const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                idToken = await cred.user.getIdToken();
            } catch (loginErr) {
                if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
                    try { const { createUserWithEmailAndPassword } = await import('firebase/auth'); const reg = await createUserWithEmailAndPassword(auth, formData.email, formData.password); idToken = await reg.user.getIdToken(); }
                    catch (regErr) { if (regErr.code === 'auth/operation-not-allowed') isTestMode = true; else throw regErr; }
                } else if (loginErr.code === 'auth/operation-not-allowed') isTestMode = true;
                else throw loginErr;
            }
            const response = await authFetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, isTest: isTestMode, email: formData.email, password: formData.password }) });
            const data = await response.json();
            if (data.success) {
                persistUser(data, { email: formData.email, fullName: data.fullName || formData.fullName, dob: formData.dob });
                redirectByRole(data, navigate);
                if (onSuccess) onSuccess(data);
                handleClose();
            } else setError(data.message || 'Login failed');
        } catch (err) {
            const msgs = { 'auth/wrong-password': 'Incorrect password.', 'auth/operation-not-allowed': 'Email/Password auth not enabled in Firebase.', 'auth/weak-password': 'Password too weak (min 6 chars).', 'auth/email-already-in-use': 'Email already in use.' };
            setError(msgs[err.code] || err.message || 'Authentication failed.');
        } finally { setLoading(false); }
    };

    const handleRegisterDirectly = async (e) => {
        if (e) e.preventDefault();
        setError('');
        if (!formData.fullName.trim() || !formData.dob || !formData.email.trim() || !formData.password.trim()) { setError('Please fill in all details'); return; }
        if (new Date(formData.dob) > new Date()) { setError('Date of Birth cannot be in the future'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Please enter a valid email address'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        
        // If we haven't sent the OTP yet, do that first
        if (emailOtpStep === 'details') {
            setLoading(true);
            try {
                const response = await authFetch('/auth/send-email-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                });
                const data = await response.json();
                if (data.success) {
                    setEmailOtpStep('otp');
                    setError(''); // clear any previous errors
                } else {
                    setError(data.message || 'Failed to send OTP');
                }
            } catch (err) {
                setError('Network error. Failed to send OTP.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // If we are at the OTP step but this was called (shouldn't happen natively, but just in case)
        if (emailOtpStep === 'otp' && emailOtp.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            let idToken = null, isTestMode = false;
            try {
                const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
                const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                await updateProfile(cred.user, { displayName: formData.email.split('@')[0] });
                idToken = await cred.user.getIdToken();
            } catch (fbErr) { 
                if (fbErr.code === 'auth/operation-not-allowed') isTestMode = true; 
                else if (fbErr.code === 'auth/email-already-in-use') {
                    // Try to sign in instead to get the idToken for backend linking
                    const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                    idToken = await cred.user.getIdToken();
                }
                else throw fbErr; 
            }
            const response = await authFetch('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, isTest: isTestMode, email: formData.email, phone: isEmailSignup ? null : `+91${phone}`, password: formData.password, fullName: formData.fullName, dob: formData.dob, otp: emailOtp }) });
            const data = await response.json();
            if (data.success) {
                persistUser(data, { phone: `+91${phone}`, email: formData.email, isDevMode: isTestMode, fullName: formData.fullName, dob: formData.dob });
                navigate('/');
                if (onSuccess) onSuccess(data);
                handleClose();
            } else setError(data.message || 'Registration failed');
        } catch (err) { setError(err.message || 'Registration failed.'); }
        finally { setLoading(false); }
    };

    const headerTitle = isEmailLogin ? 'Login with' : isEmailSignup ? 'Register with' : step === 'phone' ? (isRegistering ? 'Create' : 'Welcome to') : 'Verify';
    const headerBrand = isEmailSignup || isEmailLogin ? 'Email' : 'SELLSATHI';
    const headerSub = isEmailLogin ? 'Enter your credentials to login' : isEmailSignup ? 'Create an account using your email' : step === 'phone' ? (isRegistering ? 'Fill in your details to get started' : 'Login to your account') : `OTP sent to +91 ${phone}`;
    const HeaderIcon = isEmailSignup || isEmailLogin ? Mail : step === 'phone' ? UserIcon : ShieldCheck;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="auth-modal-overlay" onClick={handleClose} key="auth-modal-overlay">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="auth-modal-content"
                        style={{ width: '100%', maxWidth: isRegistering && step === 'phone' ? '500px' : '400px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button className="auth-close-btn" onClick={handleClose}><X size={20} /></button>

                        <div className="auth-header">
                            <div className="auth-icon-container"><HeaderIcon color="white" size={24} /></div>
                            <h2>{headerTitle} <span className="gradient-text">{headerBrand}</span></h2>
                            <p>{headerSub}</p>
                        </div>

                        {error && <div className="auth-error-msg">{error}</div>}

                        {(isEmailLogin || isEmailSignup) ? (
                            <EmailAuthForm
                                hideRegister={hideRegister}
                                isEmailLogin={isEmailLogin}
                                formData={formData} setFormData={setFormData}
                                showPassword={showPassword} setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                                dobFocused={dobFocused} setDobFocused={setDobFocused}
                                loading={loading}
                                onEmailLogin={handleEmailLogin}
                                onEmailSignup={handleRegisterDirectly}
                                step={emailOtpStep}
                                otp={emailOtp}
                                setOtp={setEmailOtp}
                                onVerifyOtp={handleRegisterDirectly} // The function handles both based on state
                                onSwitchToLogin={() => { setIsEmailSignup(false); setIsEmailLogin(true); setEmailOtpStep('details'); }}
                                onSwitchToSignup={() => { setIsEmailLogin(false); setIsRegistering(true); setEmailOtpStep('details'); }}
                                onBackToPhone={() => { setIsEmailLogin(false); setIsEmailSignup(false); setEmailOtpStep('details'); }}
                            />
                        ) : (
                            <PhoneOtpForm
                                step={step} isRegistering={isRegistering}
                                phone={phone} setPhone={setPhone}
                                otp={otp} setOtp={setOtp}
                                formData={formData} setFormData={setFormData}
                                showPassword={showPassword} setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                                dobFocused={dobFocused} setDobFocused={setDobFocused}
                                loading={loading}
                                onSendOTP={handleSendOTP}
                                onVerify={handleVerifyOrRegister}
                                onRegisterDirect={handleRegisterDirectly}
                                onGoogleSignIn={handleGoogleSignIn}
                                onChangePhone={() => setStep('phone')}
                                onSwitchToEmailLogin={() => setIsEmailLogin(true)}
                            />
                        )}

                        {step === 'phone' && !isEmailSignup && !isEmailLogin && !hideRegister && (
                            <div className="auth-toggle">
                                {isRegistering
                                    ? <p>Already have an account? <button onClick={() => setIsRegistering(false)}>Login</button></p>
                                    : <p>New User? <button onClick={() => setIsRegistering(true)}>Register</button></p>
                                }
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
