import { useState, useEffect } from 'react';
import { Settings, Save, Loader } from 'lucide-react';
import { authFetch } from '@/modules/shared/utils/api';

export default function PlatformSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    const [formData, setFormData] = useState({
        defaultPlatformFeePercent: 7,
        defaultGstPercent: 18,
        defaultShippingHandlingPercent: 0
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/admin/config/public');
            const data = await response.json();
            if (data.success && data.config) {
                setFormData({
                    defaultPlatformFeePercent: data.config.defaultPlatformFeePercent ?? 7,
                    defaultGstPercent: data.config.defaultGstPercent ?? 18,
                    defaultShippingHandlingPercent: data.config.defaultShippingHandlingPercent ?? 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        if (numValue < 0 || numValue > 100) return;
        setFormData(prev => ({ ...prev, [name]: numValue }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await authFetch('/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Failed to update settings');
            const data = await response.json();
            if (data.success) {
                alert('Platform settings updated successfully!');
                setHasChanges(false);
                await fetchConfig();
            } else {
                alert(data.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Error updating settings: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        fetchConfig();
        setHasChanges(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Settings size={24} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
                        <p className="text-sm text-gray-500">Configure default charges for the marketplace</p>
                    </div>
                </div>
                {hasChanges && (
                    <div className="flex gap-2">
                        <button onClick={handleReset} className="btn btn-secondary" disabled={saving}>
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary flex items-center gap-2" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader className="animate-spin" size={16} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
            <div className="glass-card p-6 max-w-3xl">
                <div className="space-y-6">
                    <div className="pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Default Platform Charges</h3>
                        <p className="text-sm text-gray-600">
                            These percentages will be applied to all products unless overridden at the product level.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Default Platform Fee (%)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                name="defaultPlatformFeePercent"
                                value={formData.defaultPlatformFeePercent}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                step="0.1"
                                className="input flex-1"
                                style={{ maxWidth: '200px' }}
                            />
                            <div className="flex-1">
                                <div className="text-sm text-gray-600">Commission charged on each sale</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Example: On ₹1,000 sale = ₹{(1000 * formData.defaultPlatformFeePercent / 100).toFixed(2)} fee
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Default GST (%)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                name="defaultGstPercent"
                                value={formData.defaultGstPercent}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                step="0.1"
                                className="input flex-1"
                                style={{ maxWidth: '200px' }}
                            />
                            <div className="flex-1">
                                <div className="text-sm text-gray-600">Goods and Services Tax</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Example: On ₹1,000 sale = ₹{(1000 * formData.defaultGstPercent / 100).toFixed(2)} GST
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Default Shipping Handling (%)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                name="defaultShippingHandlingPercent"
                                value={formData.defaultShippingHandlingPercent}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                step="0.1"
                                className="input flex-1"
                                style={{ maxWidth: '200px' }}
                            />
                            <div className="flex-1">
                                <div className="text-sm text-gray-600">Shipping and handling charges</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Currently: {formData.defaultShippingHandlingPercent === 0 ? 'FREE shipping' : `₹${(1000 * formData.defaultShippingHandlingPercent / 100).toFixed(2)} on ₹1,000`}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">Example Calculation</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Product Price:</span>
                                <span className="font-semibold">₹1,000</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Platform Fee ({formData.defaultPlatformFeePercent}%):</span>
                                <span className="font-semibold">₹{(1000 * formData.defaultPlatformFeePercent / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">GST ({formData.defaultGstPercent}%):</span>
                                <span className="font-semibold">₹{(1000 * formData.defaultGstPercent / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Shipping ({formData.defaultShippingHandlingPercent}%):</span>
                                <span className="font-semibold">
                                    {formData.defaultShippingHandlingPercent === 0 ? 'FREE' : `₹${(1000 * formData.defaultShippingHandlingPercent / 100).toFixed(2)}`}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-blue-300 flex justify-between">
                                <span className="text-blue-900 font-bold">Customer Pays:</span>
                                <span className="text-blue-900 font-bold text-lg">
                                    ₹{(1000 + (1000 * formData.defaultPlatformFeePercent / 100) + (1000 * formData.defaultGstPercent / 100) + (1000 * formData.defaultShippingHandlingPercent / 100)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="text-sm font-semibold text-amber-900 mb-2">Important Notes</h4>
                        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                            <li>These are default values applied to all products</li>
                            <li>Individual products can override these values</li>
                            <li>Changes apply immediately to new orders</li>
                            <li>Existing orders are not affected</li>
                            <li>All percentages must be between 0 and 100</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
