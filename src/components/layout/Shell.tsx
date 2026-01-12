"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Database, Activity, Settings, LogOut, Menu, X, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface ShellProps {
    children: React.ReactNode;
}

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vault', href: '/dashboard/vault', icon: Database },
    { name: 'Activity', href: '/dashboard/activity', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Shell({ children }: ShellProps) {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white flex overflow-hidden relative">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[128px]" />
            </div>

            {/* Sidebar (Desktop) */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden lg:flex flex-col w-72 h-screen z-20 border-r border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-xl"
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Secure Vault</h1>
                        <p className="text-xs text-neutral-500">Proxmox Cloud Storage</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive ? "text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-blue-600/10 border-l-2 border-blue-500"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={cn("w-5 h-5 z-10", isActive && "text-blue-400")} />
                                    <span className="font-medium z-10">{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#1f1f1f]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-neutral-500 truncate">Connected via Encrypted Tunnel</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1f1f1f] z-40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <span className="font-bold">Valt</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden fixed inset-0 z-30 bg-black pt-20 px-4"
                    >
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className={cn(
                                        "flex items-center gap-3 px-4 py-4 rounded-xl",
                                        pathname === item.href ? "bg-white/10 text-white" : "text-neutral-400"
                                    )}>
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                </Link>
                            ))}
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-red-400 mt-8 hover:bg-white/5"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto z-10 lg:pt-0 pt-16">
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
