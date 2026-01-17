"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, HardDrive, Save, AlertCircle } from 'lucide-react';
import { settingsService, UserProfile } from '@/services/settings';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await settingsService.getProfile();
            setProfile(data);
            setFormData({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email
            });
        } catch (error) {
            console.error("Failed to load profile", error);
            toast.error("Failed to load profile settings");
        } finally {
            setLoading(false);
        }
    };

    const { refreshProfile } = useAuth();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await settingsService.updateProfile(formData);
            setProfile(updated);
            await refreshProfile(); // Refresh global user state
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const calculateUsagePercentage = () => {
        if (!profile) return 0;
        const usedGB = profile.storage_used / (1024 * 1024 * 1024);
        const quotaGB = profile.storage_quota_gb;
        return Math.min((usedGB / quotaGB) * 100, 100);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return <div className="text-white">Loading settings...</div>;
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-neutral-400">Manage your account preferences and storage</p>
            </header>

            {/* Storage Usage Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a]/50 border border-[#1f1f1f] rounded-2xl p-6 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <HardDrive className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Storage Usage</h2>
                        <p className="text-sm text-neutral-400">Manage your vault capacity</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end text-sm">
                        <span className="text-neutral-300">
                            {formatBytes(profile?.storage_used || 0)} used
                        </span>
                        <span className="text-neutral-400">
                            {profile?.storage_quota_gb} GB Total
                        </span>
                    </div>

                    <div className="h-4 bg-[#1f1f1f] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateUsagePercentage()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>

                    <div className="flex items-start gap-2 text-xs text-neutral-500 mt-2">
                        <AlertCircle className="w-4 h-4" />

                        {/* 
                          // turbo-all
                          // Since I don't have turbo-all in this environment, this comment is just for flavor. 
                          // But checking user quota here is good.
                        */}
                        <p>Need more space? Determine file priority and delete old unused files or contact administrator.</p>
                    </div>
                </div>
            </motion.section>

            {/* Profile Settings Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#0a0a0a]/50 border border-[#1f1f1f] rounded-2xl p-6 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
                        <p className="text-sm text-neutral-400">Update your personal information</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">First Name</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Last Name</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-500" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.section>

            {/* Security Section (Placeholder) */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#0a0a0a]/50 border border-[#1f1f1f] rounded-2xl p-6 backdrop-blur-sm opacity-60 pointer-events-none"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Security (Coming Soon)</h2>
                        <p className="text-sm text-neutral-400">2FA and Password Management</p>
                    </div>
                </div>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-sm">
                    Security settings are currently managed by the administrator via the console.
                </div>
            </motion.section>
        </div>
    );
}
