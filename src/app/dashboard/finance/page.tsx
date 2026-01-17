"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Calendar, DollarSign, Building } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { storage } from '@/lib/api';

export default function FinancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Upload Form State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [recordType, setRecordType] = useState('Statement');
    const [institution, setInstitution] = useState(''); // Bank Name
    const [amount, setAmount] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());

    const fetchRecords = async () => {
        try {
            const response = await storage.getFiles('file', undefined, undefined, 'FINANCE');
            setRecords(response.data);
        } catch (error) {
            console.error("Failed to fetch finance records", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('category', 'FINANCE');

        const metadata = {
            record_type: recordType,
            institution: institution,
            amount: amount,
            year: year
        };
        formData.append('metadata', JSON.stringify(metadata));

        try {
            await storage.uploadFile(formData);
            setShowModal(false);
            resetForm();
            fetchRecords();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload finance record");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setRecordType('Statement');
        setInstitution('');
        setAmount('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Finance Vault</h1>
                    <p className="text-neutral-400 text-sm">Bank records, tax files, and asset documents.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Record
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
                </div>
            ) : records.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center h-64 text-neutral-500">
                    <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                    <p>No finance records found.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {records.map((rec, i) => (
                        <GlassCard key={rec.id} className="relative group hover:border-green-500/20 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-mono text-neutral-500 bg-white/5 px-2 py-1 rounded">
                                    {(rec.metadata?.record_type || 'Record').toUpperCase()}
                                </span>
                            </div>

                            <h3 className="font-semibold text-white truncate mb-1">{rec.name}</h3>
                            <p className="text-xs text-neutral-400 mb-4 flex items-center gap-2">
                                <Building className="w-3 h-3" /> {rec.metadata?.institution || 'Unknown Institution'}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-1 font-mono">
                                    <span>{rec.metadata?.year || '---'}</span>
                                </div>
                                {rec.metadata?.amount && (
                                    <span className="truncate max-w-[100px] bg-green-900/20 px-2 py-0.5 rounded text-green-300 font-mono">
                                        ${rec.metadata.amount}
                                    </span>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <GlassCard className="w-full max-w-md p-6 relative">
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">×</button>
                            <h2 className="text-xl font-bold text-white mb-6">Add Finance Record</h2>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">Record File</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">Type</label>
                                    <select
                                        value={recordType}
                                        onChange={(e) => setRecordType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-green-500"
                                    >
                                        <option value="Statement">Statement</option>
                                        <option value="Tax Return">Tax Return</option>
                                        <option value="Invoice">Invoice</option>
                                        <option value="Insurance Policy">Insurance Policy</option>
                                        <option value="Loan Agreement">Loan Agreement</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-neutral-500 mb-1">Institution / Bank</label>
                                        <input
                                            type="text"
                                            value={institution}
                                            onChange={(e) => setInstitution(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-green-500"
                                            placeholder="Chase Bank"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-neutral-500 mb-1">Amount (Optional)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-green-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">Year</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-green-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Save Record'}
                                </button>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
