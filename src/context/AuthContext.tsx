"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
    user: any;
    login: (access: string, refresh: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Validate token or fetch user profile if needed
            // For now, we assume if token exists, we are "logged in" for UI purposes
            // In a real app, you'd verify the token with an endpoint like /auth/me/
            setUser({ name: "Authorized User" });
        }
        setLoading(false);
    }, []);

    const login = (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setUser({ name: "Authorized User" });
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
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
