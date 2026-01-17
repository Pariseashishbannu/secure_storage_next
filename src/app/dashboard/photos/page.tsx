"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Search, ZoomIn, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { storage } from '@/lib/api';
import DropZone from '@/components/ui/drop-zone';

export default function PhotosPage() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

    const fetchPhotos = async () => {
        try {
            const response = await storage.getFiles('photo');
            setPhotos(response.data);
        } catch (error) {
            console.error("Failed to fetch photos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const handleUpload = async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);

        try {
            await storage.uploadFile(formData);
            await fetchPhotos();
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || "Upload failed.";
            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // Group photos by date
    const groupedPhotos = photos.reduce((groups: any, photo) => {
        const date = new Date(photo.created_at);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        if (date.toDateString() === today.toDateString()) {
            key = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(photo);
        return groups;
    }, {});

    const groupKeys = Object.keys(groupedPhotos); // Keys are already sorted if backend returns sorted data, but we might want to ensure 'Today' is first.
    // Since backend sorts by created_at desc, 'Today' should naturally appear first if keys are insertion ordered (mostly true in JS).

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Photos</h1>
                    <p className="text-neutral-400 text-sm"> immersive secure gallery.</p>
                </div>
                <div>
                    {/* Upload Button or Dropzone trigger could go here */}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">
                {/* Main Gallery Area */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <DropZone onUpload={handleUpload} uploading={uploading} className="mb-8" />

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                            <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p>No photos yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-20">
                            {groupKeys.map(dateGroup => (
                                <div key={dateGroup}>
                                    <h3 className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md py-4 text-sm font-medium text-white/80 border-b border-white/5 mb-4">
                                        {dateGroup}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {groupedPhotos[dateGroup].map((photo: any) => (
                                            <motion.div
                                                layoutId={photo.id}
                                                key={photo.id}
                                                className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-white/5"
                                                onClick={() => setSelectedPhoto(photo)}
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                {/* In a real app we would use a thumbnail URL. For now we use the download URL or a placeholder if protected */}
                                                {/* Since these are protected, we can't just put src=url unless we have a token-based proxy or blob url. 
                                                    For MVP, we might show a placeholder icon or fetch the blob. 
                                                    Let's use a placeholder for security/performance unless we implemented the thumbnail endpoint.
                                                    Actually, let's try to fetch the image blob for the preview! */}
                                                <SecureImage
                                                    fileId={photo.id}
                                                    alt={photo.name}
                                                    thumbnailUrl={photo.thumbnail}
                                                />

                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                    <p className="text-white text-xs truncate max-w-[80%] absolute left-3 bottom-3">{photo.name}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox / Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
                            {/* In a real app, high res image here */}
                            <SecureImage fileId={selectedPhoto.id} alt={selectedPhoto.name} className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" />

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                                <a
                                    href={storage.getDownloadUrl(selectedPhoto.id)} // This needs auth token handling usually, or use handleDownload helper
                                    className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SecureImage({ fileId, alt, className, thumbnailUrl }: { fileId: string, alt: string, className?: string, thumbnailUrl?: string }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                // If we have a thumbnail URL, we still need to fetch it securely if it's protected
                // Assuming thumbnails are served via media URL which might be protected in our setup?
                // If it's a direct media URL (e.g. /media/...), we might need token auth if our Nginx protects it.
                // Or we use the storage download endpoint logic.

                // For this implementation, if we have a thumbnail field (containing absolute or relative path),
                // we probably need a new API endpoint to fetch it securely OR allow public read for thumbnails (less secure).
                // Let's assume we fetch it via the same download proxy logic but append 'thumbnail' param or similar.

                // Simplified: If thumbnailUrl exists (which is a path like users/uuid/thumbnails/foo.jpg), 
                // we can't just fetch it directly if media is protected. 
                // For MVP, since we added `thumbnail` field to serializer, it likely returns the URL string.

                // We'll trust the download endpoint for the main file. 
                // For thumbnails, we really SHOULD have a secure thumbnail endpoint. 
                // But let's check `getDownloadUrl` usage.

                const token = localStorage.getItem('access_token');

                // Construct URL
                let urlToFetch = storage.getDownloadUrl(fileId);
                // If we want the thumbnail, we really should have a way to ask for it.
                // Let's hack: The frontend receives `thumbnail` from serializer (url string or null).
                // If it's a URL, use it. But wait, `storage.getDownloadUrl` returns an API endpoint string.

                if (thumbnailUrl) {
                    // Since we don't have a dedicated thumbnail secure endpoint yet, 
                    // and directly accessing media files bypasses Django (usually served by Nginx),
                    // we need to be careful. 
                    // If we are developing locally, Django serves media. 
                    // Let's rely on the main download for now unless we add `?variant=thumbnail` to the API.

                    // PROPOSAL: Use the API download endpoint with a query param
                    urlToFetch += '?variant=thumbnail';
                }

                const response = await fetch(urlToFetch, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Failed to load");

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                if (active) setSrc(url);
            } catch (e) {
                console.error("Failed to load image", e);
            }
        };
        load();
        return () => { active = false; if (src) URL.revokeObjectURL(src); };
    }, [fileId, thumbnailUrl]);

    if (!src) return <div className={`flex items-center justify-center bg-white/5 text-neutral-600 ${className || 'w-full h-full'}`}><ImageIcon className="w-8 h-8 opacity-20" /></div>;

    return <img src={src} alt={alt} className={className || "w-full h-full object-cover"} />;
}
