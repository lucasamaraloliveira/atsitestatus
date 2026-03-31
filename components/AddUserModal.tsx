import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Plus, UserPlus } from 'lucide-react';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (username: string, password?: string, name?: string) => Promise<void>;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;

        setIsLoading(true);
        await onAdd(username.trim(), password, name.trim());
        setIsLoading(false);
        
        // Reset states
        setName('');
        setUsername('');
        setPassword('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass apple-card w-full max-w-md p-8 animate-fade-in-slide-up border-none shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 transition-colors text-[var(--apple-text-secondary)]">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-[var(--apple-accent)] text-white shadow-lg shadow-[var(--apple-accent)]/20">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[var(--apple-text)]">Novo Membro</h2>
                        <p className="text-sm text-[var(--apple-text-secondary)]">Adicione alguém à sua equipe.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Nome Completo</label>
                        <div className="relative group">
                            <User className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all duration-300 group-focus-within:opacity-0 group-focus-within:translate-x-4" size={20} />
                            <input 
                                type="text" 
                                placeholder="ex: João Silva"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Usuário / Login</label>
                        <div className="relative group">
                            <User className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all duration-300 group-focus-within:opacity-0 group-focus-within:translate-x-4" size={20} />
                            <input 
                                type="text" 
                                placeholder="ex: joao.infra"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Senha de Acesso</label>
                        <div className="relative group">
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] transition-colors z-10"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-14 bg-[var(--apple-accent)] hover:bg-[#0062CC] text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-[var(--apple-accent)]/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Plus size={18} /> Criar Membro</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
