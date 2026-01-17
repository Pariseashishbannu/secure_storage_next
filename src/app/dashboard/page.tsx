"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, File, Upload, Clock, Activity, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { storage, secrets, audit } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadDashboardData = async () => {
            try {
                // Fetch all data in parallel
                const [filesRes, secretsRes, logsRes, storageStatsRes] = await Promise.all([
                    storage.getFiles(),
                    secrets.getAll(),
                    audit.getLogs(),
                    storage.getStorageStats()
                ]);

                if (!isMounted) return;

                const files = filesRes.data;
                const secretList = secretsRes.data;
                const logs = logsRes.data;
                const storageStats = storageStatsRes.data;

                const totalFiles = files.length;
                const totalSecrets = secretList.length;

                // Calculate uploads in last 24h
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const recentUploadsCount = files.filter((f: any) => new Date(f.created_at) > oneDayAgo).length;

                setStats({
                    ...storageStats, // disk and quota
                    total_files: totalFiles,
                    total_secrets: totalSecrets,
                    recent_uploads_count: recentUploadsCount,
                    // Legacy support/direct access if needed
                    total_storage: storageStats.quota.used_bytes
                });

                setAuditLogs(logs.slice(0, 5)); // Top 5 recent logs
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadDashboardData();

        // Real-time polling every 5 seconds
        const interval = setInterval(loadDashboardData, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
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

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
                    <p className="text-neutral-400 mt-1">Real-time metrics from your private vault.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-mono text-green-400">SYSTEM OPTIMAL</span>
                    </div>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Storage Used"
                    value={loading ? "-" : formatBytes(stats?.quota?.used_bytes || 0)}
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
                    title="Active Secrets"
                    value={loading ? "-" : stats?.total_secrets || 0}
                    icon={Lock}
                    color="text-yellow-400"
                    borderColor="border-yellow-500/20"
                    bgGlow="bg-yellow-500/10"
                />
                <StatCard
                    title="Remaining Quota"
                    value={loading ? "-" : formatBytes(stats?.quota?.remaining_bytes || 0)}
                    icon={Clock}
                    color="text-orange-400"
                    borderColor="border-orange-500/20"
                    bgGlow="bg-orange-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area: Quick Actions & Storage Breakdown */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Actions */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <QuickActionButton href="/dashboard/vault" icon={Upload} label="Upload File" color="bg-blue-600 hover:bg-blue-500" />
                            <QuickActionButton href="/dashboard/vault?new_folder=true" icon={File} label="New Folder" color="bg-neutral-800 hover:bg-neutral-700" />
                            <QuickActionButton href="/dashboard/secrets" icon={Lock} label="New Secret" color="bg-neutral-800 hover:bg-neutral-700" />
                            <QuickActionButton href="/dashboard/settings" icon={Activity} label="Manage Quota" color="bg-neutral-800 hover:bg-neutral-700" />
                        </div>
                    </section>

                    {/* Storage Breakdown */}
                    <GlassCard>
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-neutral-400" />
                            Storage Breakdown
                        </h3>
                        {/* Breakdown Visualization */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats?.usage_by_category?.length > 0 ? (
                                stats.usage_by_category.map((cat: any) => (
                                    <div key={cat.category} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-neutral-400 text-xs uppercase font-bold">{cat.category}</p>
                                        <p className="text-white font-mono mt-1 text-lg">
                                            {formatBytes(cat.total_size)}
                                        </p>
                                        <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full"
                                                style={{ width: `${(cat.total_size / (stats.total_storage || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                ['Documents', 'Images', 'Videos', 'Others'].map((cat) => (
                                    <div key={cat} className="p-4 bg-white/5 rounded-xl border border-white/5 opacity-50">
                                        <p className="text-neutral-400 text-xs uppercase font-bold">{cat}</p>
                                        <p className="text-neutral-500 font-mono mt-1 text-sm">Empty</p>
                                        <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full w-0" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-neutral-400" />
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)
                            ) : auditLogs.length > 0 ? (
                                auditLogs.map((log: any) => (
                                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono",
                                            log.action.includes('FAIL') ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {log.action.substring(0, 1)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{log.action.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-neutral-500 truncate max-w-[300px]">
                                                {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                            </p>
                                        </div>
                                        <span className="text-xs text-neutral-600 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-500 text-center py-8">No recent activity</p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <GlassCard className="min-h-[400px]">
                        <h3 className="text-lg font-semibold mb-6">Quick Status</h3>
                        <div className="space-y-6">
                            {/* User Quota Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-neutral-400">Your Quota Usage</span>
                                    <span className="text-white font-mono">{loading ? '0%' : stats?.quota?.used_percent}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, stats?.quota?.used_percent || 0)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 text-right">
                                    {loading ? '-' : `${stats?.quota?.total_gb}GB Total Allocation`}
                                </p>
                            </div>

                            {/* Host Disk Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-neutral-400">Host Disk Status (/data)</span>
                                    <span className="text-white font-mono">{loading ? '0%' : stats?.disk?.used_percent}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            (stats?.disk?.used_percent || 0) > 80 ? "bg-red-500" : "bg-green-500"
                                        )}
                                        style={{ width: `${Math.min(100, stats?.disk?.used_percent || 0)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 text-right">
                                    {loading ? '-' : `${stats?.disk?.free_gb}GB Free on Host`}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5 mt-4">
                                <h4 className="font-bold text-white text-sm mb-1">Proxmox Node</h4>
                                <p className="text-xs text-neutral-400">Connected via internal network.</p>
                                <div className="flex items-center gap-2 mt-3 text-xs text-green-400">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Online
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    );
}

const QuickActionButton = ({ href, icon: Icon, label, color }: any) => (
    <a href={href} className={cn("flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-105 gap-3", color)}>
        <Icon className="w-6 h-6 text-white" />
        <span className="text-sm font-medium text-white">{label}</span>
    </a>
);

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
