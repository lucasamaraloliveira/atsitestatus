import React, { useState } from 'react';
import { X, Globe, Type, Plus } from 'lucide-react';

interface AddSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (url: string, name: string) => void;
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(url, name);
        setUrl('');
        setName('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass apple-card w-full max-w-md overflow-hidden animate-fade-in-slide-up shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <header className="px-6 py-5 border-b border-[var(--apple-border)] flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--apple-text)]">Novo Site</h3>
                        <p className="text-xs text-[var(--apple-text-secondary)] font-medium">Preencha os dados e comece o monitoramento.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">URL do Site</label>
                        <div className="relative group">
                            <div className="absolute left-5 inset-y-0 flex items-center text-[var(--apple-text-secondary)] pointer-events-none group-focus-within:opacity-0 transition-opacity duration-300">
                                <Globe size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="ex: google.com.br"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="apple-input w-full pl-16 focus:pl-5 bg-[var(--apple-input-bg)] border-2 border-transparent focus:border-[var(--apple-accent)]/20 transition-all font-bold py-4 text-sm"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Nome amigável (Opcional)</label>
                        <div className="relative group">
                            <div className="absolute left-5 inset-y-0 flex items-center text-[var(--apple-text-secondary)] pointer-events-none group-focus-within:opacity-0 transition-opacity duration-300">
                                <Type size={18} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="ex: Site do Cliente A"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="apple-input w-full pl-16 focus:pl-5 bg-[var(--apple-input-bg)] border-2 border-transparent focus:border-[var(--apple-accent)]/20 transition-all font-bold py-4 text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button 
                            type="submit"
                            className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#007AFF]/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Plus size={20} />
                            Adicionar Site
                        </button>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-sm font-bold text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSiteModal;
