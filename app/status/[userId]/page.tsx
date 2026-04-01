"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckStatus, StatusResult } from '@/types';
import { ShieldCheck, Globe, Clock, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PublicStatusPage() {
    const { userId } = useParams();
    const [sites, setSites] = useState<StatusResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [ownerName, setOwnerName] = useState('');

    useEffect(() => {
        if (!userId) return;

        const userRef = doc(db, 'users', userId as string);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const allSites = data.sites || [];
                console.log("Sites carregados (Públicos e Privados):", allSites);
                // Filtro robusto para garantir que 'true' (booleano ou string por engano) seja capturado
                const publicSites = allSites.filter((s: any) => s.isPublic === true || s.isPublic === 'true');
                console.log("Sites filtrados (Apenas Públicos):", publicSites);
                setSites(publicSites);
                setOwnerName(data.name || data.username || 'Sistema');
            }
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar página pública:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const allOnline = sites.every(s => s.status === CheckStatus.ONLINE);
    const someChecking = sites.some(s => s.status === CheckStatus.CHECKING);
    const downCount = sites.filter(s => s.status === CheckStatus.OFFLINE || s.status === CheckStatus.ERROR).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] flex items-center justify-center p-6">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[var(--apple-text)]">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                {/* Header */}
                <header className="flex flex-col items-center text-center mb-16 animate-fade-in">
                    <div className="p-3 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-white dark:border-white/5 mb-6">
                        <ShieldCheck size={40} className="text-[#007AFF]" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Status do Sistema</h1>
                    <p className="text-[var(--apple-text-secondary)] font-medium">Monitoramento de serviços de {ownerName}</p>
                </header>

                {/* Main Status Banner */}
                <div className={`mb-12 p-8 rounded-[2.5rem] border-2 transition-all duration-500 animate-fade-in-slide-up shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
                    sites.length === 0
                    ? 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-[var(--apple-text-secondary)]'
                    : downCount > 0 
                    ? 'bg-[#FF3B30]/5 border-[#FF3B30]/20 text-[#FF3B30]' 
                    : someChecking 
                    ? 'bg-[#007AFF]/5 border-[#007AFF]/20 text-[#007AFF]'
                    : 'bg-[#34C759]/5 border-[#34C759]/20 text-[#34C759]'
                }`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-4 h-4 rounded-full animate-pulse shadow-[0_0_15px_rgba(currentcolor)] ${
                            sites.length === 0 ? 'bg-gray-400' : downCount > 0 ? 'bg-[#FF3B30]' : someChecking ? 'bg-[#007AFF]' : 'bg-[#34C759]'
                        }`} />
                        <div>
                            <h2 className="text-2xl font-black">
                                {sites.length === 0 
                                    ? 'Aguardando Configuração'
                                    : downCount > 0 
                                    ? `${downCount} ${downCount === 1 ? 'Interrupção Detectada' : 'Interrupções Detectadas'}` 
                                    : someChecking 
                                    ? 'Verificando Sistemas...' 
                                    : sites.length === 1 
                                    ? `O serviço ${sites[0].name || sites[0].url} está operando`
                                    : `Todos os ${sites.length} serviços operando`
                                }
                            </h2>
                            <p className="opacity-70 font-medium">
                                {sites.length === 0 
                                    ? 'Este Painel de Status ainda não possui serviços liberados para visualização pública.' 
                                    : 'Informações em tempo real sobre a nossa infraestrutura.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Services List */}
                <div className="space-y-4 animate-fade-in-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between px-6 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Serviço</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Disponibilidade</span>
                    </div>

                    {sites.length === 0 ? (
                        <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[2rem] border border-[var(--apple-border)] text-center">
                            <p className="text-[var(--apple-text-secondary)] font-medium italic">Nenhum serviço público configurado no momento.</p>
                        </div>
                    ) : (
                        sites.map((site) => (
                            <div 
                                key={site.id}
                                className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[2rem] border border-[var(--apple-border)] flex items-center justify-between group hover:scale-[1.01] transition-all duration-300 shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-[#F5F5F7] dark:bg-black/20 rounded-xl">
                                        <Globe size={22} className="text-[var(--apple-text-secondary)]" />
                                    </div>
                                    <span className="text-lg font-bold tracking-tight">{site.name || site.url}</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        site.status === CheckStatus.ONLINE 
                                        ? 'bg-[#34C759]/10 text-[#34C759]' 
                                        : site.status === CheckStatus.CHECKING 
                                        ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                                        : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                                    }`}>
                                        {site.status === CheckStatus.ONLINE ? 'Operacional' : site.status === CheckStatus.CHECKING ? 'Verificando' : 'Fora do Ar'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-20 pt-10 border-t border-[var(--apple-border)] flex flex-col md:flex-row items-center justify-between gap-6 text-[var(--apple-text-secondary)]">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <Clock size={14} />
                        <span>Atualizado em tempo real</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">© 2026 AT Site Status Premium</p>
                </footer>
            </div>
            
            <style jsx>{`
                .animate-fade-in { animation: fadeIn 0.8s ease-out; }
                .animate-fade-in-slide-up { animation: fadeInSlideUp 0.8s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
