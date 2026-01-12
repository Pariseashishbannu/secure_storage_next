"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, File, Upload, Clock, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { storage } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Fetch all files to calculate stats client-side
                const response = await storage.getFiles();
                const files = response.data;

                const totalBytes = files.reduce((acc: number, file: any) => acc + (parseInt(file.size) || 0), 0);
                const totalFiles = files.length;

                // Calculate uploads in last 24h
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const recentUploadsCount = files.filter((f: any) => new Date(f.created_at) > oneDayAgo).length;

                setStats({
                    total_storage: totalBytes,
                    total_files: totalFiles,
                    recent_uploads: files.slice(0, 5), // Keep first 5 for the list
                    recent_uploads_count: recentUploadsCount
                });
            } catch (error) {
                console.error("Failed to load stats", error);
                // Fallback to empty stats on error
                setStats({
                    total_storage: 0,
                    total_files: 0,
                    recent_uploads: [],
                    recent_uploads_count: 0
                });
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const formatBytes = (bytes: number) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    // 1GB Quota
    const TOTAL_QUOTA = 1073741824;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
                    <p className="text-neutral-400 mt-1">Real-time metrics from your private vault.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Storage"
                    value={loading ? "-" : formatBytes(stats?.total_storage || 0)}
                    icon={HardDrive}
                    color="text-blue-400"
                    borderColor="border-blue-500/20"
                    bgGlow="bg-blue-500/10"
                />
                <StatCard
                    title="Files Stored"
                    value={loading ? "-" : stats?.total_files || 0}
                    icon={File}
                    color="text-purple-400"
                    borderColor="border-purple-500/20"
                    bgGlow="bg-purple-500/10"
                />
                <StatCard
                    title="Uploads (24h)"
                    value={loading ? "-" : stats?.recent_uploads_count || 0}
                    icon={Upload}
                    color="text-green-400"
                    borderColor="border-green-500/20"
                    bgGlow="bg-green-500/10"
                />
                <StatCard
                    title="Remaining Storage"
                    value={loading ? "-" : formatBytes(Math.max(0, TOTAL_QUOTA - (stats?.total_storage || 0)))}
                    icon={Clock}
                    color="text-orange-400"
                    borderColor="border-orange-500/20"
                    bgGlow="bg-orange-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard className="lg:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-neutral-400" />
                        Storage Distribution
                    </h3>
                    <div className="flex items-center justify-center h-64 text-neutral-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        Chart Visualization (Recharts) Placeholder
                    </div>
                </GlassCard>

                <GlassCard className="min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-6">Recent Uploads</h3>
                    <div className="space-y-4">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                            ))
                        ) : stats?.recent_uploads?.length > 0 ? (
                            stats.recent_uploads.map((file: any) => (
                                <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-neutral-400">
                                        <File className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-white">{file.name}</p>
                                        <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>
                                    </div>
                                    <div className="text-xs text-neutral-600 font-mono">
                                        {new Date(file.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-neutral-500 text-center py-8">No recent uploads</p>
                        )}
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );
}

const StatCard = ({ title, value, icon: Icon, color, borderColor, bgGlow }: any) => (
    <GlassCard className={cn("relative overflow-hidden group hover:scale-[1.02] transition-transform", borderColor)}>
        <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity", bgGlow)} />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-neutral-400 font-medium text-sm">{title}</h3>
                <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
    </GlassCard>
);
