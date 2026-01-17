"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import exifr from 'exifr/dist/full.esm.mjs';
import { File as FileIcon, Download, Search, LayoutGrid, List as ListIcon, Trash2, Clock, HardDrive } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import DropZone from '@/components/ui/drop-zone';
import { storage } from '@/lib/api';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface FileVersion {
    id: string;
    version_number: number;
    size: number;
    created_at: string;
}

interface VaultFile {
    id: string;
    name: string;
    size: number;
    file_type: string;
    mime_type: string;
    is_folder: boolean;
    created_at: string;
    updated_at: string;
    versions?: FileVersion[];
    thumbnail?: string | null;
}

interface StorageStats {
    disk: {
        total_gb: number;
        used_gb: number;
        free_gb: number;
        used_percent: number;
    };
    quota: {
        total_gb: number;
        used_bytes: number;
        remaining_bytes: number;
        used_percent: number;
    };
}

export default function VaultPage() {
    const [files, setFiles] = useState<VaultFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Folder State
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<{ id: string, name: string }[]>([]); // For breadcrumbs
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const [renamingFile, setRenamingFile] = useState<VaultFile | null>(null);
    const [selectedFileForHistory, setSelectedFileForHistory] = useState<VaultFile | null>(null);
    const [newName, setNewName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

    const fetchFiles = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await storage.getFiles('file', currentFolder || undefined);
            setFiles(response.data);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoading(false);
        }
    }, [currentFolder]);

    const fetchStorageStats = async () => {
        try {
            const response = await storage.getStorageStats();
            setStorageStats(response.data);
        } catch (error) {
            console.error("Failed to fetch storage stats", error);
        }
    };

    useEffect(() => {
        fetchFiles();
        fetchStorageStats();
    }, [fetchFiles, currentFolder]);

    const handleNavigate = (folder: VaultFile) => {
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
        setCurrentFolder(folder.id);
    };

    const handleNavigateUp = (index: number) => {
        if (index === -1) {
            setFolderPath([]);
            setCurrentFolder(null);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            setCurrentFolder(newPath[newPath.length - 1].id);
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await storage.createFolder(newFolderName, currentFolder || undefined);
            setShowFolderModal(false);
            setNewFolderName('');
            fetchFiles();
        } catch (error) {
            console.error('Failed to create folder', error);
            alert('Failed to create folder');
        }
    };

    const handleUpload = async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;
        setUploading(true);

        // Upload Helper Logic
        const processUpload = async (file: File) => {
            const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

            // Extract Metadata
            let metadata = {};
            if (file.type.startsWith('image/')) {
                try {
                    const exifData = await exifr.parse(file, [
                        'Make', 'Model', 'DateTimeOriginal', 'ISO', 'FNumber', 'ExposureTime', 'LensModel', 'GPSLatitude', 'GPSLongitude'
                    ]);
                    if (exifData) {
                        metadata = exifData;
                        // console.log("Extracted Metadata:", metadata);
                    }
                } catch (err) {
                    console.warn("Failed to extract EXIF:", err);
                }
            }

            if (file.size > CHUNK_SIZE * 2) {
                // Use Chunked Upload for files > 10MB
                // console.log("Using Chunked Upload for", file.name);

                try {
                    // 1. Init
                    const initRes = await storage.initChunkedUpload(file.name, file.size, file.type);
                    const uploadId = initRes.data.upload_id;

                    // 2. Upload Chunks
                    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                    for (let i = 0; i < totalChunks; i++) {
                        const start = i * CHUNK_SIZE;
                        const end = Math.min(start + CHUNK_SIZE, file.size);
                        const chunk = file.slice(start, end);

                        await storage.uploadChunk(uploadId, chunk, i);
                        // Optional progress update here if we had state for it
                    }

                    // 3. Complete
                    await storage.completeChunkedUpload(uploadId, currentFolder || undefined, metadata);
                    return true;
                } catch (e) {
                    console.error("Chunked upload failed", e);
                    throw e;
                }
            } else {
                // Standard Upload
                const formData = new FormData();
                formData.append('file', file);
                if (currentFolder) {
                    formData.append('parent', currentFolder);
                }

                // Append metadata for standard upload too!
                if (Object.keys(metadata).length > 0) {
                    formData.append('metadata', JSON.stringify(metadata));
                }

                await storage.uploadFile(formData);
                return true;
            }
        };

        try {
            // Process all selected files
            for (const file of acceptedFiles) {
                await processUpload(file);

                // Notification logic for photos
                if (file.type.startsWith('image/')) {
                    // alert("Photo detected! It has been automatically moved to the Photos app.");
                }
            }

            await fetchFiles();
            fetchStorageStats();
        } catch (error) {
            console.error("Upload failed", error);
            let errorMessage = "Upload failed. Please try again.";
            if (axios.isAxiosError(error) && error.response?.data?.detail) {
                errorMessage = error.response.data.detail as string;
            }
            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // ... (Keep existing download/delete/rename helpers) ...
    const handleDownload = async (file: VaultFile) => {
        if (file.is_folder) return; // Cannot download folder as blob yet need zip
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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this item?")) return;
        try {
            await storage.deleteFile(id);
            setFiles(files.filter(f => f.id !== id));
            fetchStorageStats();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete item.");
        }
    };

    const handleRenameClick = (file: VaultFile) => {
        setRenamingFile(file);
        setNewName(file.name);
    };

    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renamingFile) return;

        try {
            await storage.updateFile(renamingFile.id, { name: newName });
            setFiles(files.map(f => f.id === renamingFile.id ? { ...f, name: newName } : f));
            setRenamingFile(null);
        } catch (error) {
            console.error("Rename failed", error);
            alert("Failed to rename file.");
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

    // New Icon Imports needed at top (Folder, ChevronRight, Home) - assuming they are imported or I will need to fix imports

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Files</h1>
                    <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                        <button
                            onClick={() => handleNavigateUp(-1)}
                            className={`hover:text-white transition-colors flex items-center gap-1 ${!currentFolder ? 'text-white' : ''}`}
                        >
                            <HardDrive className="w-3 h-3" /> Root
                        </button>
                        {folderPath.map((folder, index) => (
                            <React.Fragment key={folder.id}>
                                <span className="opacity-50">/</span>
                                <button
                                    onClick={() => handleNavigateUp(index)}
                                    className={`hover:text-white transition-colors ${index === folderPath.length - 1 ? 'text-white' : ''}`}
                                >
                                    {folder.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFolderModal(true)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-plus w-4 h-4"><path d="M12 10v6" /><path d="M9 13h6" /><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                        New Folder
                    </button>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all w-48"
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
                                <p>This folder is empty.</p>
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
                                                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                                                    onClick={() => file.is_folder && handleNavigate(file)}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${file.is_folder ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                {file.is_folder ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder w-4 h-4 fill-current"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                                                                ) : (
                                                                    <FileIcon className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            <span className={`font-medium transition-colors truncate max-w-[200px] ${file.is_folder ? 'text-yellow-100' : 'text-white'}`}>
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-neutral-400 text-sm">{file.is_folder ? '--' : formatBytes(file.size)}</td>
                                                    <td className="py-3 px-4 text-neutral-500 text-xs font-mono uppercase">{file.is_folder ? 'DIR' : getExtension(file.name || '')}</td>
                                                    <td className="py-3 px-4 text-neutral-500 text-xs">
                                                        {new Date(file.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setRenamingFile(file); }}
                                                            className="p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-colors"
                                                            title="Rename"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                        </button>
                                                        {!file.is_folder && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedFileForHistory(file); }}
                                                                    className="p-2 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-colors"
                                                                    title="History"
                                                                >
                                                                    <Clock className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                                                    className="p-2 hover:bg-blue-500/20 hover:text-blue-400 text-neutral-400 rounded-lg transition-colors"
                                                                    title="Download"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                                            className="p-2 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                                            className="group relative bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300 cursor-pointer"
                                            onClick={() => file.is_folder && handleNavigate(file)}
                                            onDoubleClick={() => file.is_folder && handleNavigate(file)}
                                        >
                                            <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-colors shadow-inner ${file.is_folder ? 'bg-yellow-500/10 text-yellow-500' : 'bg-black/50 text-neutral-400'}`}>
                                                {file.is_folder ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder w-6 h-6 fill-current"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                                                ) : (
                                                    <FileIcon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <p className="font-medium text-white text-sm truncate w-full mb-1">{file.name}</p>
                                            <p className="text-xs text-neutral-500">{file.is_folder ? 'Folder' : formatBytes(file.size)}</p>

                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameClick(file); }}
                                                    className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-white/20 transition-colors"
                                                    title="Rename"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil w-3.5 h-3.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                </button>
                                                {!file.is_folder && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                                        className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
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

                        {storageStats && (
                            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
                                <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                                    <HardDrive className="w-4 h-4 text-blue-400" />
                                    Storage Quota
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                            <span>Used</span>
                                            <span>{formatBytes(storageStats.quota.used_bytes)} / {storageStats.quota.total_gb} GB</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${storageStats.quota.used_percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/5">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-neutral-500">Physical Disk (Host)</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                            <span>Used</span>
                                            <span>{storageStats.disk.used_gb} GB / {storageStats.disk.total_gb} GB</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-neutral-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${storageStats.disk.used_percent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-neutral-500">
                                <Clock className="w-4 h-4" />
                                Recent Activity
                            </h3>
                            {/* ... Activity log placeholder ... */}
                            <div className="space-y-4 relative opacity-50">
                                <p className="text-xs text-neutral-500">No recent interactions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-sm p-6 relative">
                        <button onClick={() => setShowFolderModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">×</button>
                        <h2 className="text-xl font-bold text-white mb-4">New Folder</h2>
                        <form onSubmit={handleCreateFolder} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Folder Name</label>
                                <input type="text" required value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500" autoFocus />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white text-sm">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">Create</button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Rename Modal */}
            {renamingFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-sm p-6 relative">
                        <button
                            onClick={() => setRenamingFile(null)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            ×
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">Rename {renamingFile.is_folder ? 'Folder' : 'File'}</h2>
                        <form onSubmit={handleRenameSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">New Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setRenamingFile(null)}
                                    className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                                    Save
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* History Modal */}
            {selectedFileForHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-lg p-6 relative max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedFileForHistory(null)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            ×
                        </button>
                        <h2 className="text-xl font-bold text-white mb-1">Version History</h2>
                        <p className="text-sm text-neutral-400 mb-6 truncate">{selectedFileForHistory.name}</p>

                        <div className="space-y-3">
                            {/* Current Version */}
                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="text-xs uppercase text-blue-400 font-bold block mb-1">Current Version</span>
                                    <div className="text-sm text-white flex items-center gap-2">
                                        <span>{formatBytes(selectedFileForHistory.size)}</span>
                                        <span className="text-white/20">•</span>
                                        <span>{new Date(selectedFileForHistory.updated_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">Active</div>
                            </div>

                            {selectedFileForHistory.versions && selectedFileForHistory.versions.length > 0 ? (
                                selectedFileForHistory.versions.map((ver: FileVersion) => (
                                    <div key={ver.id} className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center text-neutral-400 group hover:border-white/20 transition-colors">
                                        <div>
                                            <span className="text-xs uppercase font-mono block mb-1 text-neutral-500 group-hover:text-neutral-300">v{ver.version_number}</span>
                                            <div className="text-sm flex items-center gap-2">
                                                <span>{formatBytes(ver.size)}</span>
                                                <span className="text-white/10">•</span>
                                                <span>{new Date(ver.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {/* Download logic or restore would go here */}
                                        <div className="text-xs text-neutral-600 italic">Archived</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-neutral-500 border-2 border-dashed border-white/5 rounded-xl">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No previous versions.</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
