"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Image, Check, ChevronRight, Lock, Loader2, RefreshCw } from 'lucide-react';
import { integrationsService } from '@/services/integrations';
import { toast } from 'sonner';

export default function ImportPage() {
    const [icloudModalOpen, setIcloudModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'scanner'>('cards');

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Import Media</h1>
                    <p className="text-neutral-400">Connect external cloud services to import your photos and videos.</p>
                </div>
                {viewMode === 'scanner' && (
                    <button onClick={() => setViewMode('cards')} className="text-sm text-neutral-400 hover:text-white">
                        Back to Integrations
                    </button>
                )}
            </header>

            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Google Photos Card */}
                    <GooglePhotosCard />

                    {/* iCloud Card */}
                    <ICloudCard
                        openModal={() => setIcloudModalOpen(true)}
                        onScan={() => setViewMode('scanner')}
                    />
                </div>
            ) : (
                <PhotoScanner />
            )}

            {/* iCloud Login Modal */}
            <AnimatePresence>
                {icloudModalOpen && (
                    <ICloudLoginModal onClose={() => setIcloudModalOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}

function PhotoScanner() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);

    React.useEffect(() => {
        scanLibrary();
    }, []);

    const scanLibrary = async () => {
        setLoading(true);
        try {
            const data = await integrationsService.getICloudPhotos();
            setPhotos(data.photos || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to scan iCloud library");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(s => s !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleImport = async () => {
        setImporting(true);
        try {
            const res = await integrationsService.importICloudPhotos(selected);
            toast.success(`Imported ${res.imported_count} photos successfully`);
            setSelected([]);
        } catch (error) {
            console.error(error);
            toast.error("Import failed");
        } finally {
            setImporting(false);
        }
    };

    if (loading) return <div className="text-white text-center py-20">Scanning iCloud Library...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-xl sticky top-0 z-20">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-blue-400" />
                        iCloud Photo Library
                    </h2>
                    <p className="text-sm text-neutral-400">{photos.length} photos found</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setSelected(photos.map(p => p.id))}
                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                    >
                        Select All
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={selected.length === 0 || importing}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        Import Selected ({selected.length})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map(photo => (
                    <div
                        key={photo.id}
                        onClick={() => toggleSelect(photo.id)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selected.includes(photo.id) ? 'border-blue-500 opacity-100' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    >
                        {/* Use img for external urls if next/image config doesn't allow specific domains */}
                        <img
                            src={photo.url}
                            alt={photo.filename}
                            className="w-full h-full object-cover"
                        />
                        {selected.includes(photo.id) && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-xs truncate">
                            {photo.filename}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GooglePhotosCard() {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const { url } = await integrationsService.getGoogleAuthUrl();
            // Redirect to Google
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error("Failed to initiate Google connection");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden bg-[#0a0a0a]/50 border border-[#1f1f1f] rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-colors"
        >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <Image className="w-6 h-6 text-blue-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Google Photos</h3>
                <p className="text-neutral-400 text-sm mb-6">
                    Import your entire library from Google Photos. Supports albums and metadata preservation.
                </p>

                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Connect Google Photos
                </button>
            </div>
        </motion.div>
    );
}

function ICloudCard({ openModal, onScan }: { openModal: () => void, onScan: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden bg-[#0a0a0a]/50 border border-[#1f1f1f] rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-colors"
        >
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                    <Cloud className="w-6 h-6 text-purple-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">iCloud Photos</h3>
                <p className="text-neutral-400 text-sm mb-6">
                    Securely sign in with your Apple ID to transfer photos. Requires 2FA verification.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={openModal}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center justify-center gap-2 transition-colors border border-white/5"
                    >
                        <Lock className="w-4 h-4" />
                        Connect
                    </button>
                    <button
                        onClick={onScan}
                        className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Image className="w-4 h-4" />
                        Scan Library
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function ICloudLoginModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<'login' | '2fa' | 'success'>('login');
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({ apple_id: '', password: '' });
    const [code, setCode] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await integrationsService.icloudLogin(credentials);
            if (res.status === '2fa_required') {
                setStep('2fa');
                toast.info("2FA Code Sent", { description: res.message });
            } else {
                setStep('success');
                toast.success("Connected to iCloud");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Login Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await integrationsService.icloudVerify2FA({ code });
            setStep('success');
            toast.success("Verified & Connected");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-[#1f1f1f] flex justify-between items-center">
                    <h3 className="text-lg font-bold">Connect iCloud</h3>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">Close</button>
                </div>

                <div className="p-6">
                    {step === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">Apple ID</label>
                                <input
                                    type="email"
                                    required
                                    value={credentials.apple_id}
                                    onChange={e => setCredentials({ ...credentials, apple_id: e.target.value })}
                                    className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                    placeholder="name@icloud.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={credentials.password}
                                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                    className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                    placeholder="Apple ID Password"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Sign In
                            </button>
                        </form>
                    )}

                    {step === '2fa' && (
                        <form onSubmit={handleVerify2FA} className="space-y-4">
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                                A verification code has been sent to your Apple devices.
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">Verification Code</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-center text-2xl tracking-widest font-mono"
                                    placeholder="000000"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Verify Code
                            </button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                <Check className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-bold mb-2">Connected Successfully!</h4>
                            <p className="text-neutral-400 text-sm mb-6">Your iCloud photos will now start syncing in the background.</p>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
