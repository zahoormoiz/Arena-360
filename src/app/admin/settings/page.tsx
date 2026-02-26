'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/admin/AdminToast';

interface SettingsData {
    adminName: string;
    notificationEmail: string;
    maintenanceMode: boolean;
    allowWeekendPricing: boolean;
    smsNotifications: boolean;
}

export default function AdminSettingsPage() {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<SettingsData>({
        adminName: '',
        notificationEmail: '',
        maintenanceMode: false,
        allowWeekendPricing: true,
        smsNotifications: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();

            if (data.success) {
                showToast('Settings saved successfully', 'success');
            } else {
                showToast(data.error || 'Failed to save settings', 'error');
            }
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'warning');
            return;
        }

        setChangingPassword(true);
        try {
            const res = await fetch('/api/admin/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Password changed successfully', 'success');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                showToast(data.error || 'Failed to change password', 'error');
            }
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-primary" />
                        Platform Settings
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Configure your Arena360 platform</p>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">General</h2>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Admin Name</label>
                    <input
                        type="text"
                        value={settings.adminName}
                        onChange={(e) => setSettings(s => ({ ...s, adminName: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Notification Email</label>
                    <input
                        type="email"
                        value={settings.notificationEmail}
                        onChange={(e) => setSettings(s => ({ ...s, notificationEmail: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm"
                    />
                </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">Features</h2>

                <ToggleRow
                    label="Maintenance Mode"
                    description="Temporarily disable bookings for all users"
                    checked={settings.maintenanceMode}
                    onChange={(v) => setSettings(s => ({ ...s, maintenanceMode: v }))}
                    danger
                />

                <ToggleRow
                    label="Weekend Pricing"
                    description="Apply weekend pricing multipliers automatically"
                    checked={settings.allowWeekendPricing}
                    onChange={(v) => setSettings(s => ({ ...s, allowWeekendPricing: v }))}
                />

                <ToggleRow
                    label="SMS Notifications"
                    description="Send booking confirmations via SMS"
                    checked={settings.smsNotifications}
                    onChange={(v) => setSettings(s => ({ ...s, smsNotifications: v }))}
                />
            </div>

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saving ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Settings
                    </>
                )}
            </button>

            {/* Password Change Section */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Change Password
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPw ? 'text' : 'password'}
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm pr-10"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPw ? 'text' : 'password'}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm pr-10"
                                placeholder="Minimum 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm ${confirmPassword && newPassword !== confirmPassword
                                    ? 'border-red-500/50 focus:border-red-500'
                                    : 'border-white/10 focus:border-primary/50'
                                }`}
                            placeholder="Re-enter new password"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        className="w-full py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/15 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {changingPassword ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Changing...
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Change Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Toggle component
function ToggleRow({ label, description, checked, onChange, danger }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    danger?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked
                    ? danger ? 'bg-red-500' : 'bg-primary'
                    : 'bg-white/10'
                    }`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`} />
            </button>
        </div>
    );
}
