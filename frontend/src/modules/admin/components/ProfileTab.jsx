import { useState, useEffect } from 'react';
import { User, Camera, Save, X } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function ProfileTab({ adminData, fetchAdminProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        dateOfBirth: '',
        address: '',
        websiteName: '',
        websiteInfo: '',
        adminEmail: ''
    });

    useEffect(() => {
        if (adminData) {
            setFormData({
                name: adminData.name || '',
                dateOfBirth: adminData.dateOfBirth || '',
                address: adminData.address || '',
                websiteName: adminData.websiteName || 'SellSathi',
                websiteInfo: adminData.websiteInfo || 'Your Trusted E-Commerce Platform',
                adminEmail: adminData.adminEmail || adminData.email || ''
            });
        }
    }, [adminData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await authFetch('/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            if (data.success) {
                alert('✅ Profile updated successfully!');
                setIsEditing(false);
                fetchAdminProfile();
            } else {
                alert(`❌ ${data.message || 'Failed to update profile'}`);
            }
        } catch (error) {
            console.error('[ProfileTab] Save error:', error);
            alert(`Error updating profile: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await authFetch('/admin/profile/image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            if (data.success) {
                alert('✅ Profile image updated successfully!');
                fetchAdminProfile();
            } else {
                alert(`❌ ${data.message || 'Failed to upload image'}`);
            }
        } catch (error) {
            console.error('[ProfileTab] Image upload error:', error);
            alert(`Error uploading image: ${error.message}`);
        } finally {
            setIsUploadingImage(false);
        }
    };

    if (!adminData) {
        return (
            <div className="animate-fade-in flex justify-center items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <p className="text-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Admin Profile</h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        name: adminData.name || '',
                                        dateOfBirth: adminData.dateOfBirth || '',
                                        address: adminData.address || '',
                                        websiteName: adminData.websiteName || 'SellSathi',
                                        websiteInfo: adminData.websiteInfo || 'Your Trusted E-Commerce Platform',
                                        adminEmail: adminData.adminEmail || adminData.email || ''
                                    });
                                }}
                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => setIsEditing(true)}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '3rem' }}>
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                            <div style={{ 
                                width: '200px', 
                                height: '200px', 
                                borderRadius: '50%', 
                                overflow: 'hidden', 
                                border: '4px solid var(--primary)',
                                background: 'var(--surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {adminData.profileImage ? (
                                    <img 
                                        src={adminData.profileImage} 
                                        alt="Admin Profile" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={80} style={{ color: 'var(--text-muted)' }} />
                                )}
                            </div>
                            <label 
                                htmlFor="profile-image-upload"
                                style={{ 
                                    position: 'absolute', 
                                    bottom: '10px', 
                                    right: '10px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '3px solid white',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {isUploadingImage ? (
                                    <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                ) : (
                                    <Camera size={24} />
                                )}
                            </label>
                            <input 
                                id="profile-image-upload"
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploadingImage}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                            Click the camera icon to change profile picture
                        </p>
                    </div>

                    {/* Profile Details Section */}
                    <div className="flex flex-col gap-4">
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Personal Information</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Admin Name */}
                            <div className="flex flex-col gap-2">
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Admin Name
                                </label>
                                {isEditing ? (
                                    <input 
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        style={{ 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '2px solid var(--border)',
                                            fontSize: '1rem'
                                        }}
                                        placeholder="Enter your name"
                                    />
                                ) : (
                                    <p style={{ fontSize: '1rem', padding: '0.75rem 0' }}>{adminData.name || 'Not provided'}</p>
                                )}
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col gap-2">
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Date of Birth
                                </label>
                                {isEditing ? (
                                    <input 
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleInputChange}
                                        style={{ 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '2px solid var(--border)',
                                            fontSize: '1rem'
                                        }}
                                    />
                                ) : (
                                    <p style={{ fontSize: '1rem', padding: '0.75rem 0' }}>
                                        {adminData.dateOfBirth ? new Date(adminData.dateOfBirth).toLocaleDateString('en-GB') : 'Not provided'}
                                    </p>
                                )}
                            </div>

                            {/* Contact Number (Read-only) */}
                            <div className="flex flex-col gap-2">
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Contact Number
                                </label>
                                <p style={{ fontSize: '1rem', padding: '0.75rem 0', color: 'var(--text-muted)' }}>
                                    {adminData.phone || 'Not provided'}
                                </p>
                            </div>

                            {/* Email ID (Editable) */}
                            <div className="flex flex-col gap-2">
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Admin E-mail ID
                                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)', marginLeft: '0.5rem' }}>
                                        (Used for sending notifications)
                                    </span>
                                </label>
                                {isEditing ? (
                                    <input 
                                        type="email"
                                        name="adminEmail"
                                        value={formData.adminEmail}
                                        onChange={handleInputChange}
                                        style={{ 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '2px solid var(--border)',
                                            fontSize: '1rem'
                                        }}
                                        placeholder="admin@example.com"
                                    />
                                ) : (
                                    <p style={{ fontSize: '1rem', padding: '0.75rem 0' }}>
                                        {adminData.adminEmail || adminData.email || 'Not provided'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex flex-col gap-2" style={{ marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                Address
                            </label>
                            {isEditing ? (
                                <textarea 
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        border: '2px solid var(--border)',
                                        fontSize: '1rem',
                                        resize: 'vertical'
                                    }}
                                    placeholder="Enter your address"
                                />
                            ) : (
                                <p style={{ fontSize: '1rem', padding: '0.75rem 0', lineHeight: 1.6 }}>
                                    {adminData.address || 'Not provided'}
                                </p>
                            )}
                        </div>

                        {/* Website Details */}
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Website Details</h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Website Name */}
                                <div className="flex flex-col gap-2">
                                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        Website Name
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            name="websiteName"
                                            value={formData.websiteName}
                                            onChange={handleInputChange}
                                            style={{ 
                                                padding: '0.75rem', 
                                                borderRadius: '8px', 
                                                border: '2px solid var(--border)',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Website name"
                                        />
                                    ) : (
                                        <p style={{ fontSize: '1rem', padding: '0.75rem 0' }}>{adminData.websiteName || 'SellSathi'}</p>
                                    )}
                                </div>

                                {/* Website Info */}
                                <div className="flex flex-col gap-2">
                                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        Website Information
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            name="websiteInfo"
                                            value={formData.websiteInfo}
                                            onChange={handleInputChange}
                                            style={{ 
                                                padding: '0.75rem', 
                                                borderRadius: '8px', 
                                                border: '2px solid var(--border)',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Website tagline"
                                        />
                                    ) : (
                                        <p style={{ fontSize: '1rem', padding: '0.75rem 0' }}>
                                            {adminData.websiteInfo || 'Your Trusted E-Commerce Platform'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
