"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
    user: any;
    login: (access: string, refresh: string) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                // Fetch user profile from backend to get real name
                // We reuse the settings service logic here effectively
                const response = await api.get('/users/profile/');
                setUser(response.data);
            } catch (error) {
                console.error("Auth check failed", error);
                // If profile fetch fails but we have token, we might want to keep "Authorized User" fallback or logout
                // For now, let's keep the user logged in but with fallback name if fetch fails
                if (!user) { // Only set fallback if no user set
                    setUser({ name: "Authorized User" });
                }
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        checkAuth(); // Fetch real profile on login
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshProfile: checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
