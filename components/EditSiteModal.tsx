import React, { useState, useEffect } from 'react';
import { X, Globe, Edit2, Save, Search } from 'lucide-react';
import { StatusResult } from '@/types';

interface EditSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, url: string, name: string, keyword: string) => void;
    site: StatusResult | null;
}

const EditSiteModal: React.FC<EditSiteModalProps> = ({ isOpen, onClose, onUpdate, site }) => {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        if (site) {
            setUrl(site.url);
            setName(site.name || '');
            setKeyword(site.keyword || '');
        }
    }, [site, isOpen]);

    if (!isOpen || !site) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(site.id, url, name, keyword);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
            <div className="glass apple-card w-full max-w-md overflow-hidden animate-fade-in-slide-up shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <header className="px-6 py-5 border-b border-[var(--apple-border)] flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--apple-text)]">Editar Site</h3>
                        <p className="text-xs text-[var(--apple-text-secondary)] font-medium">Ajuste as configurações de monitoramento.</p>
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
                            <Globe className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all duration-300 group-focus-within:opacity-0 group-focus-within:translate-x-4" size={20} />
                            <input 
                                type="url" 
                                placeholder="https://exemplo.com.br"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none text-[var(--apple-text)]"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Nome amigável (Opcional)</label>
                        <div className="relative group">
                            <Edit2 className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all duration-300 group-focus-within:opacity-0 group-focus-within:translate-x-4" size={20} />
                            <input 
                                type="text" 
                                placeholder="Minha Loja Virtual"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none text-[var(--apple-text)]"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Palavra-Chave (Opcional)</label>
                            <span className="text-[8px] font-bold text-[var(--apple-accent)] uppercase">Monitoramento Real</span>
                        </div>
                        <div className="relative group">
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all duration-300 group-focus-within:opacity-0 group-focus-within:translate-x-4" size={20} />
                            <input 
                                type="text" 
                                placeholder="Ex: 'Login' ou 'Dashboard'"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-4 focus:ring-[var(--apple-accent)]/10 focus:border-[var(--apple-accent)] transition-all outline-none text-[var(--apple-text)]"
                            />
                        </div>
                        <p className="text-[9px] text-[var(--apple-text-secondary)] leading-relaxed italic px-1">
                            Deixe em branco para monitorar apenas o status HTTP.
                        </p>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button 
                            type="submit"
                            className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#007AFF]/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Save size={20} />
                            Salvar Alterações
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

export default EditSiteModal;
