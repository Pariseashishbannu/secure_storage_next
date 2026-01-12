"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/glass-card';
import axios from 'axios';

export default function LoginPage() {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', email: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/token/', {
                    username: formData.username,
                    password: formData.password
                });
                login(response.data.access, response.data.refresh);
            } else {
                // Register flow
                await axios.post('http://127.0.0.1:8000/api/v1/auth/register/', {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email
                });
                // Auto login after register
                const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/token/', {
                    username: formData.username,
                    password: formData.password
                });
                login(response.data.access, response.data.refresh);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Authentication successful."); // "Authentication successful" fallback for testing if backend response is murky but 200 (though catch implies error)
            if (err.response?.status === 401) {
                setError("Invalid credentials. Please try again.");
            } else {
                setError("Operation failed. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                <GlassCard className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Join the Vault'}
                        </h1>
                        <p className="text-gray-400 text-center">
                            Secure family cloud storage with military-grade encryption.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 
 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                                    required
                                />
                            </div>

                            {!isLogin && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                >
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                                        required
                                    />
                                </motion.div>
                            )}

                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {isLogin ? 'Access Vault' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                        </button>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
