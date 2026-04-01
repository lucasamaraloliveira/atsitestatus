import React, { useState } from 'react';
import { X, User, Shield, Lock, UserPlus } from 'lucide-react';

interface AddTeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (member: { username: string, name: string, password: string }) => void;
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        onAdd({ username, name: name || username, password });
        resetFields();
        onClose();
    };

    const resetFields = () => {
        setUsername('');
        setName('');
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass apple-card w-full max-w-md overflow-hidden animate-fade-in-slide-up shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <header className="px-6 py-5 border-b border-[var(--apple-border)] flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[var(--apple-accent)]/10 text-[var(--apple-accent)]">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--apple-text)]">Novo Membro</h3>
                            <p className="text-[10px] text-[var(--apple-text-secondary)] font-black uppercase tracking-widest mt-0.5">Acesso de Operador</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { resetFields(); onClose(); }}
                        className="p-2 rounded-full hover:bg-white/5 text-[var(--apple-text-secondary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] ml-1">Username (ID de Login)</label>
                            <div className="relative group">
                                <User className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-40" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="ex: lucas_amaral"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] ml-1">Nome Completo</label>
                            <div className="relative group">
                                <Shield className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-40" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="ex: Lucas Amaral"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-40" size={18} />
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button 
                            type="submit"
                            className="w-full bg-[var(--apple-accent)] hover:opacity-90 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[var(--apple-accent)]/20 flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest text-xs"
                        >
                            <UserPlus size={18} />
                            Criar Novo Membro
                        </button>
                        <button 
                            type="button"
                            onClick={() => { resetFields(); onClose(); }}
                            className="w-full py-2 text-xs font-black uppercase tracking-widest text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeamMemberModal;
