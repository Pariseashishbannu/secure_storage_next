"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File as FileIcon, Download, Search, LayoutGrid, List as ListIcon, Trash2, Clock, HardDrive } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import DropZone from '@/components/ui/drop-zone';
import { storage } from '@/lib/api';
import { cn } from '@/lib/utils';
import axios from 'axios';

export default function VaultPage() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFiles = async () => {
        try {
            const response = await storage.getFiles();
            setFiles(response.data);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);

        try {
            await storage.uploadFile(formData);
            await fetchFiles();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (file: any) => {
        try {
            const url = storage.getDownloadUrl(file.id);
            const token = localStorage.getItem('access_token');

            const response = await axios.get(url, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });

            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            alert("Download failed.");
        }
    };

    const filteredFiles = files.filter(f =>
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatBytes = (bytes: number) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
    };

    const getExtension = (filename: string) => {
        return filename ? filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) : '';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Vault</h1>
                    <p className="text-neutral-400 text-sm">Secure, encrypted file storage.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search artifacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all w-64"
                        />
                    </div>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 min-h-[500px]">
                    <GlassCard className="h-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin mb-4" />
                                <p className="text-neutral-500">Accessing secure protocols...</p>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
                                <HardDrive className="w-12 h-12 mb-4 opacity-20" />
                                <p>Vault is empty or no matches found.</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-neutral-400 uppercase text-xs">
                                        <tr>
                                            <th className="py-3 px-4 font-medium rounded-tl-lg rounded-bl-lg">Name</th>
                                            <th className="py-3 px-4 font-medium">Size</th>
                                            <th className="py-3 px-4 font-medium">Type</th>
                                            <th className="py-3 px-4 font-medium">Date</th>
                                            <th className="py-3 px-4 font-medium text-right rounded-tr-lg rounded-br-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence>
                                            {filteredFiles.map((file, i) => (
                                                <motion.tr
                                                    key={file.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="group hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                                <FileIcon className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-medium text-white group-hover:text-blue-400 transition-colors truncate max-w-[200px]">
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-neutral-400 text-sm">{formatBytes(file.size)}</td>
                                                    <td className="py-3 px-4 text-neutral-500 text-xs font-mono uppercase">{getExtension(file.name || '')}</td>
                                                    <td className="py-3 px-4 text-neutral-500 text-xs">
                                                        {new Date(file.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() => handleDownload(file)}
                                                            className="p-2 hover:bg-blue-500/20 hover:text-blue-400 text-neutral-400 rounded-lg transition-colors"
                                                            title="Download Decrypted"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                <AnimatePresence>
                                    {filteredFiles.map((file, i) => (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group relative bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300"
                                        >
                                            <div className="w-12 h-12 bg-black/50 rounded-xl mb-3 flex items-center justify-center text-neutral-400 group-hover:text-blue-400 transition-colors shadow-inner">
                                                <FileIcon className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-white text-sm truncate w-full mb-1">{file.name}</p>
                                            <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>

                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </GlassCard>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <DropZone onUpload={handleUpload} uploading={uploading} />

                        <div className="mt-6">
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-neutral-500">
                                <Clock className="w-4 h-4" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4 relative">
                                <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
                                {/* Placeholder for activity items */}
                                <div className="relative pl-8">
                                    <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-black" />
                                    <p className="text-sm text-neutral-300">Vault Accessed</p>
                                    <p className="text-xs text-neutral-600">Just now</p>
                                </div>
                                <div className="relative pl-8 opacity-50">
                                    <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-neutral-600 border-2 border-black" />
                                    <p className="text-sm text-neutral-300">System Ready</p>
                                    <p className="text-xs text-neutral-600">Checking protocols</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
