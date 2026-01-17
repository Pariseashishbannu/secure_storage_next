"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, File, User, Clock, AlertTriangle, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { audit } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await audit.getLogs();
                setLogs(response.data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getIcon = (action: string) => {
        if (action.includes('UPLOAD')) return File;
        if (action.includes('DOWNLOAD')) return activityIcons.download;
        if (action.includes('LOGIN')) return User;
        if (action.includes('FAIL')) return AlertTriangle;
        return Activity;
    };

    const activityIcons: any = {
        download: (props: any) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Security Audit</h1>
                    <p className="text-neutral-400 text-sm">Monitor all access and interactions.</p>
                </div>
                <div className="p-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-mono border border-green-500/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    LIVE LOGGING ACTIVE
                </div>
            </div>

            <GlassCard className="min-h-[600px]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Shield className="w-4 h-4" />
                        <span>Audit Trail</span>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {loading ? (
                        <div className="p-8 text-center text-neutral-500">Loading audit trail...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">No activity recorded.</div>
                    ) : (
                        logs.map((log, i) => {
                            const Icon = getIcon(log.action);
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-4 flex items-center hover:bg-white/5 transition-colors gap-4 group"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-white/5 group-hover:border-white/10",
                                        log.action.includes('FAIL') ? "text-red-400 bg-red-500/10" : "text-neutral-400"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white text-sm">{log.action.replace(/_/g, ' ')}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-neutral-500 font-mono">
                                                {log.ip_address}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                                            {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-neutral-400 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </p>
                                        <p className="text-[10px] text-neutral-600">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
