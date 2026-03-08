import { Eye, EyeOff, Mail, Lock, User as UserIcon, Calendar } from 'lucide-react';

/**
 * EmailAuthForm — handles both email login and email signup flows.
 * All state and handlers live in AuthModal (the parent); this component
 * just renders the form UI and calls the provided callbacks.
 */
export default function EmailAuthForm({
    hideRegister,
    isEmailLogin,
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    dobFocused,
    setDobFocused,
    loading,
    onEmailLogin,
    onEmailSignup,
    onSwitchToLogin,
    onSwitchToSignup,
    onBackToPhone,
    step = 'details', // 'details' | 'otp'
    otp,
    setOtp,
    onVerifyOtp
}) {
    const dateMax = new Date().toISOString().split('T')[0];

    const emailField = (
        <div className="auth-input-group">
            <Mail size={18} className="auth-field-icon" />
            <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
            />
        </div>
    );

    const passwordField = (
        <div className="auth-input-group">
            <Lock size={18} className="auth-field-icon" />
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
            />
            <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );

    const registrationOnlyFields = (
        <>
            <div className="auth-input-group">
                <UserIcon size={18} className="auth-field-icon" />
                <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    required
                />
            </div>

            <div className="auth-input-group date-input-wrapper">
                <Calendar size={18} className="auth-field-icon" />
                {!formData.dob && !dobFocused && <span className="date-placeholder">DOB</span>}
                <input
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    onFocus={() => setDobFocused(true)}
                    onBlur={() => setDobFocused(false)}
                    max={dateMax}
                    required
                />
            </div>
        </>
    );

    if (isEmailLogin) {
        return (
            <form onSubmit={onEmailLogin} className="auth-form">
                <div className="auth-fields-grid">
                    {emailField}
                    {passwordField}
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login with Email'}
                    </button>
                    <div className="auth-form-footer">
                        {!hideRegister && <p>Don't have an account? <button type="button" onClick={onSwitchToSignup}>Register</button></p>}
                        <button type="button" className="auth-back-link" onClick={onBackToPhone}>Back to Phone Login</button>
                    </div>
                </div>
            </form>
        );
    }

    // Email Signup form
    return (
        <form onSubmit={step === 'otp' ? onVerifyOtp : onEmailSignup} className="auth-form">
            <div className="auth-fields-grid">
                {step === 'details' ? (
                    <>
                        {registrationOnlyFields}
                        {emailField}
                        {passwordField}
                        <div className="auth-input-group">
                            <Lock size={18} className="auth-field-icon" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="auth-input-group otp-group">
                        <input
                            type="text"
                            placeholder="Enter 6-digit Email OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            required
                        />
                    </div>
                )}
                
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : step === 'otp' ? 'Verify & Register' : 'Continue'}
                </button>
                
                <div className="auth-form-footer">
                    {step === 'details' ? (
                        <>
                            <p>Already have an account? <button type="button" onClick={onSwitchToLogin}>Login</button></p>
                            <button type="button" className="auth-back-link" onClick={onBackToPhone}>Back to Phone Login</button>
                        </>
                    ) : (
                        <button type="button" className="auth-back-link" onClick={() => onSwitchToSignup()}>Back to Details</button>
                    )}
                </div>
            </div>
        </form>
    );
}
