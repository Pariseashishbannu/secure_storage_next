"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, HardDrive, Lock, Activity, Settings, Menu, X, LogOut, ChevronRight, Shield, Image, FileText, Stethoscope, BookOpen, CreditCard, Cloud } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { SpaceBackground } from '@/components/ui/space-background';
import { ThemeToggle } from '@/components/theme-toggle';

interface ShellProps {
    children: React.ReactNode;
}

const navItems: { name: string; href: string; icon: any }[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Photos', href: '/dashboard/photos', icon: Image },
    { name: 'Documents', href: '/dashboard/documents', icon: BookOpen },
    { name: 'Medical', href: '/dashboard/medical', icon: Stethoscope },
    { name: 'Finance', href: '/dashboard/finance', icon: CreditCard },
    { name: 'Vault', href: '/dashboard/vault', icon: HardDrive },
    { name: 'Secrets', href: '/dashboard/secrets', icon: Lock },
    { name: 'Import', href: '/dashboard/import', icon: Cloud },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Shell({ children }: ShellProps) {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden relative transition-colors duration-300">
            {/* Background Ambience */}
            <SpaceBackground />

            {/* Sidebar (Desktop) */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden lg:flex flex-col w-72 h-screen z-20 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl"
            >
                <div className="p-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">Vault</h1>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive ? "text-accent bg-accent/10" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
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

                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                                {user?.name?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-foreground/50 truncate">Encrypted</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar/90 backdrop-blur-md border-b border-sidebar-border z-40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <span className="font-bold">Valt</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden fixed inset-0 z-30 bg-background pt-20 px-4"
                    >
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                    <div className={cn(
                                        "flex items-center gap-3 px-4 py-4 rounded-xl",
                                        pathname === item.href ? "bg-accent/10 text-accent" : "text-foreground/60"
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
