"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';

interface DropZoneProps {
    onUpload: (files: File[]) => void;
    uploading: boolean;
    className?: string;
}

export default function DropZone({ onUpload, uploading, className }: DropZoneProps) {
    const [dragActive, setDragActive] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false // For now single file upload as per backend
    });

    return (
        <div {...getRootProps()} className={cn("relative group cursor-pointer", className)}>
            <input {...getInputProps()} />

            <GlassCard
                className={cn(
                    "relative overflow-hidden border-dashed border-2 h-40 flex items-center justify-center transition-all duration-300",
                    isDragActive ? "border-blue-500 bg-blue-500/10" : "border-neutral-200 dark:border-white/10 hover:border-blue-400/50 dark:hover:border-white/20 hover:bg-blue-50 dark:hover:bg-white/5"
                )}
            >
                <AnimatePresence mode='wait'>
                    {uploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-12 h-12 mb-3">
                                <motion.div
                                    className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
                                />
                                <motion.div
                                    className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                            <p className="text-sm font-medium text-blue-400 animate-pulse">Encrypting & Uploading...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center p-4"
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-300",
                                isDragActive ? "bg-blue-500 text-white" : "bg-neutral-100 dark:bg-white/5 text-neutral-400 group-hover:bg-blue-500/20 group-hover:text-blue-400"
                            )}>
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-foreground font-medium mb-1">
                                {isDragActive ? "Drop to secure" : "Upload File"}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px]">
                                Drag & drop or click to encrypt and store in your private vault.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ambient Glow */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/5 to-transparent blur-[40px] opacity-0 transition-opacity duration-500",
                    isDragActive && "opacity-100"
                )} />
            </GlassCard>
        </div>
    );
}
