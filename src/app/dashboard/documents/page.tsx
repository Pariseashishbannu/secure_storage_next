"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Calendar, CreditCard, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { storage } from '@/lib/api';
import { cn } from '@/lib/utils';
import DropZone from '@/components/ui/drop-zone';

export default function DocumentsPage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Upload Form State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('Govt ID');
    const [expiryDate, setExpiryDate] = useState('');
    const [docNumber, setDocNumber] = useState('');

    const fetchDocs = async () => {
        try {
            const response = await storage.getFiles('file', undefined, undefined, 'DOCUMENT');
            setDocs(response.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('category', 'DOCUMENT');

        const metadata = {
            doc_type: docType,
            expiry_date: expiryDate,
            id_number: docNumber
        };
        formData.append('metadata', JSON.stringify(metadata));

        try {
            await storage.uploadFile(formData);
            setShowModal(false);
            resetForm();
            fetchDocs();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setDocType('Govt ID');
        setExpiryDate('');
        setDocNumber('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Documents</h1>
                    <p className="text-neutral-400 text-sm">Organized legal and identity records.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Document
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                </div>
            ) : docs.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center h-64 text-neutral-500">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p>No documents found.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {docs.map((doc, i) => (
                        <GlassCard key={doc.id} className="relative group hover:border-blue-500/20 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-mono text-neutral-500 bg-white/5 px-2 py-1 rounded">
                                    {(doc.metadata?.doc_type || 'Unknown').toUpperCase()}
                                </span>
                            </div>

                            <h3 className="font-semibold text-white truncate mb-1">{doc.name}</h3>
                            <p className="text-xs text-neutral-400 mb-4 font-mono">
                                ID: {doc.metadata?.id_number || '---'}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Exp: {doc.metadata?.expiry_date || 'N/A'}</span>
                                </div>
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
                            <h2 className="text-xl font-bold text-white mb-6">Add Document</h2>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">Document File</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-neutral-500 mb-1">Type</label>
                                        <select
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Govt ID">Govt ID</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-neutral-500 mb-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase text-neutral-500 mb-1">ID Number / Ref</label>
                                    <input
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="e.g. A1234567"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Save Document'}
                                </button>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
