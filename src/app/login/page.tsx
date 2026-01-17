"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/glass-card';
import axios from 'axios';

import { authService } from '@/services/auth';
import { toast } from 'sonner';

export default function LoginPage() {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', email: '' });
    const [error, setError] = useState('');

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        // In a real implementation:
        // 1. Initialize SDK (Google Identity Services or Sign in with Apple JS)
        // 2. Trigger popup/redirect
        // 3. Get ID Token
        // 4. Send to backend

        toast.info(`${provider === 'google' ? 'Google' : 'Apple'} Login`, {
            description: "Initiating social authentication flow..."
        });

        // Simulating the flow since we don't have a real Client ID
        try {
            // Mock token - this will likely fail 400 on backend if trying to verify real signature
            // unless we had a "mock" mode on backend too. The backend currently TRIES to verify.
            // So we expect an error or need a valid token.

            // For now, let's just show we can call the service.
            // const res = await authService.socialLogin({ token: 'mock_token', provider });
            // login(res.access, res.refresh);

            toast.warning("Missing Client ID", {
                description: `Configure ${provider} Credentials to enable this feature.`
            });

        } catch (error: any) {
            console.error(error);
            toast.error("Social login failed");
        }
    };

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
            setError(err.response?.data?.detail || "Authentication successful.");
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

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0c0c0c] px-2 text-neutral-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('google')}
                                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 transition-colors text-white text-sm font-medium"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" style={{ fill: '#4285F4' }} />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" style={{ fill: '#34A853' }} />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" style={{ fill: '#FBBC05' }} />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" style={{ fill: '#EA4335' }} />
                                </svg>
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('apple')}
                                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 transition-colors text-white text-sm font-medium"
                            >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08 0-1.44.7-2.29.23-3.11-.96-3.32-4.93-1.07-10.04 2.89-10.36 1.44-.12 2.39.81 3.06.84.69.02 1.83-.84 3.23-.74 1.14.08 2.02.58 2.58 1.4-2.31 1.34-1.92 4.38.44 5.48-.46 1.3-1.07 2.55-2.03 3.99zm-3.21-13.6c.58-1.57 2.4-2.5 4.02-2.65.17 1.82-1.63 3.53-4.02 2.65z" />
                                </svg>
                                Apple
                            </button>
                        </div>
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
