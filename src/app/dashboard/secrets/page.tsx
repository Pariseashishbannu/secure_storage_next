"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Copy, Eye, EyeOff, Trash2, Key } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { secrets } from '@/lib/api';
import { cn } from '@/lib/utils'; // Assuming utils exists

export default function SecretsPage() {
    const [secretList, setSecretList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [newSecret, setNewSecret] = useState({ title: '', type: 'PASSWORD', payload: '' });
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    const toggleReveal = (id: string) => {
        setRevealed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this secret permanently?")) return;
        try {
            await secrets.delete(id);
            setSecretList(list => list.filter(s => s.id !== id));
        } catch (error) {
            console.error("Failed to delete secret", error);
        }
    };

    useEffect(() => {
        fetchSecrets();
    }, []);

    const fetchSecrets = async () => {
        try {
            const response = await secrets.getAll();
            setSecretList(response.data);
        } catch (error) {
            console.error("Failed to fetch secrets", error);
        } finally {
            setLoading(false);
        }
    };

    const [editMode, setEditMode] = useState(false);
    const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);

    const handleEditClick = (secret: any) => {
        setNewSecret({ title: secret.title, type: secret.type, payload: secret.encrypted_payload });
        setSelectedSecretId(secret.id);
        setEditMode(true);
        setShowCreateModal(true);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && selectedSecretId) {
                await secrets.update(selectedSecretId, {
                    title: newSecret.title,
                    type: newSecret.type,
                    encrypted_payload: newSecret.payload
                });
            } else {
                await secrets.create({
                    title: newSecret.title,
                    type: newSecret.type,
                    encrypted_payload: newSecret.payload
                });
            }
            setShowCreateModal(false);
            setEditMode(false);
            setSelectedSecretId(null);
            setNewSecret({ title: '', type: 'PASSWORD', payload: '' });
            fetchSecrets();
        } catch (error) {
            console.error("Failed to save secret", error);
        }
    };



    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Show toast
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Secrets Vault</h1>
                    <p className="text-neutral-400 text-sm">Manage passwords, API keys, and notes.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Secret
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="md:col-span-3 text-center py-12 text-neutral-500">Loading secrets...</div>
                ) : secretList.length === 0 ? (
                    <div className="md:col-span-3 text-center py-12 text-neutral-500 flex flex-col items-center">
                        <Lock className="w-12 h-12 mb-4 opacity-20" />
                        <p>No secrets stored yet.</p>
                    </div>
                ) : (
                    secretList.map((secret) => (
                        <GlassCard key={secret.id} className="p-5 flex flex-col gap-4 group hover:border-blue-500/30 transition-colors relative">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{secret.title}</h3>
                                        <p className="text-xs text-neutral-500 font-mono mt-0.5">{secret.type}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditClick(secret)}
                                        className="p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(secret.id)}
                                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between group/payload">
                                <code className="text-xs text-neutral-400 truncate max-w-[200px] select-all font-mono">
                                    {revealed[secret.id] ? secret.encrypted_payload : '••••••••••••••••'}
                                </code>
                                <div className="flex gap-1 opacity-0 group-hover/payload:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleReveal(secret.id)}
                                        className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                                        title={revealed[secret.id] ? "Hide" : "Reveal"}
                                    >
                                        {revealed[secret.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(secret.encrypted_payload)}
                                        className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                                        title="Copy"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-neutral-600 border-t border-white/5 pt-3">
                                <span>Updated {new Date(secret.updated_at).toLocaleDateString()}</span>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Simple Modal for MVP */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md p-6 relative">
                        <button
                            onClick={() => { setShowCreateModal(false); setEditMode(false); setSelectedSecretId(null); setNewSecret({ title: '', type: 'PASSWORD', payload: '' }); }}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            ×
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">{editMode ? 'Edit Secret' : 'Add Secret'}</h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newSecret.title}
                                    onChange={e => setNewSecret({ ...newSecret, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Type</label>
                                <select
                                    value={newSecret.type}
                                    onChange={e => setNewSecret({ ...newSecret, type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="PASSWORD">Password</option>
                                    <option value="NOTE">Note</option>
                                    <option value="API_KEY">API Key</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-neutral-500 mb-1">Content</label>
                                <textarea
                                    required
                                    value={newSecret.payload}
                                    onChange={e => setNewSecret({ ...newSecret, payload: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white h-24 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">
                                Save Secret
                            </button>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
