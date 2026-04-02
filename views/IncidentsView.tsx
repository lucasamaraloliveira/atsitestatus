import React, { useState } from 'react';
import { 
    ChevronRight, 
    Search, 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    History,
    FileText,
    ArrowUpRight,
    MessageSquare,
    Save,
    Trash2,
    Eraser,
    ShieldAlert,
    Archive,
    Hourglass,
    CheckCheck,
    ShieldCheck
} from 'lucide-react';
import { type Incident } from '@/types';

interface IncidentsViewProps {
    incidents: Incident[];
    updateIncident: (id: string, data: Partial<Incident>) => Promise<void>;
    deleteIncident: (id: string) => Promise<void>;
    clearAllIncidents: () => Promise<void>;
    addToastNotification: (msg: string, type?: 'alert' | 'warning' | 'success' | 'info') => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ 
    incidents, 
    updateIncident, 
    deleteIncident, 
    clearAllIncidents,
    addToastNotification 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'concluded'>('pending');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [rootCause, setRootCause] = useState('');
    const [resolution, setResolution] = useState('');
    const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

    // Lógica de Separação Inteligente
    const pendingIncidents = incidents.filter(inc => 
        !inc.rootCause || 
        inc.rootCause === 'Aguardando diagnóstico...' || 
        !inc.resolution
    );

    const concludedIncidents = incidents.filter(inc => 
        inc.rootCause && 
        inc.rootCause !== 'Aguardando diagnóstico...' && 
        inc.resolution
    );

    const currentIncidentsList = activeTab === 'pending' ? pendingIncidents : concludedIncidents;

    const filteredIncidents = currentIncidentsList.filter(inc => 
        inc.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.rootCause && inc.rootCause.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleOpenPostMortem = (inc: Incident) => {
        setSelectedIncident(inc);
        setRootCause(inc.rootCause === 'Aguardando diagnóstico...' ? '' : (inc.rootCause || ''));
        setResolution(inc.resolution || '');
    };

    const handleSavePostMortem = async () => {
        if (!selectedIncident) return;
        setIsSaving(true);
        try {
            await updateIncident(selectedIncident.id, {
                rootCause: rootCause.trim() || 'Aguardando diagnóstico...',
                resolution: resolution.trim()
            });
            addToastNotification("Incidente arquivado com sucesso!", "success");
            setSelectedIncident(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, inc: Incident) => {
        e.stopPropagation();
        setIncidentToDelete(inc);
    };

    const confirmDelete = async () => {
        if (!incidentToDelete) return;
        await deleteIncident(incidentToDelete.id);
        addToastNotification(`Registro de ${incidentToDelete.siteName} removido.`, 'warning');
        setIncidentToDelete(null);
        if (selectedIncident?.id === incidentToDelete.id) setSelectedIncident(null);
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header / Tabs Selector */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--apple-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--apple-accent)]/20">
                            <ShieldAlert size={28} />
                        </div>
                        <h2 className="text-4xl font-black text-[var(--apple-text)] tracking-tight">Central de Crises</h2>
                    </div>
                    
                    <div className="flex p-1 bg-[var(--apple-input-bg)] rounded-2xl w-fit border border-[var(--apple-border)]">
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-white/10 shadow-lg text-[var(--apple-text)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                        >
                            <Hourglass size={16} />
                            Fila de Análise
                            <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'pending' ? 'bg-[var(--apple-accent)] text-white' : 'bg-gray-400/20 text-[var(--apple-text-secondary)]'}`}>
                                {pendingIncidents.length}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('concluded')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'concluded' ? 'bg-white dark:bg-white/10 shadow-lg text-[var(--apple-text)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                        >
                            <ShieldCheck size={16} />
                            Casos Encerrados
                            <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'concluded' ? 'bg-[#34C759] text-white' : 'bg-gray-400/20 text-[var(--apple-text-secondary)]'}`}>
                                {concludedIncidents.length}
                            </span>
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group flex-grow md:flex-grow-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--apple-text-secondary)] transition-colors group-hover:text-[var(--apple-accent)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar no histórico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--apple-card-bg)] border border-[var(--apple-border)] text-[var(--apple-text)] text-sm font-medium focus:ring-2 focus:ring-[var(--apple-accent)]/20 focus:border-[var(--apple-accent)] transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={() => setIsClearAllModalOpen(true)}
                        className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        title="Esvaziar Tudo"
                    >
                        <Eraser size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* List Content Area */}
                <div className="xl:col-span-8 space-y-4">
                    {filteredIncidents.length === 0 ? (
                        <div className="bg-[var(--apple-card-bg)] rounded-[40px] border border-[var(--apple-border)] p-24 text-center shadow-sm animate-fade-in">
                            <div className="w-24 h-24 rounded-full bg-[var(--apple-accent)]/5 flex items-center justify-center mx-auto mb-8">
                                {activeTab === 'pending' ? <Archive className="w-10 h-10 text-[var(--apple-accent)] opacity-20" /> : <ShieldCheck className="w-10 h-10 text-[var(--apple-accent)] opacity-20" />}
                            </div>
                            <h3 className="text-2xl font-black text-[var(--apple-text)] mb-3">
                                {activeTab === 'pending' ? 'Fila Vazia' : 'Histórico Limpo'}
                            </h3>
                            <p className="text-[var(--apple-text-secondary)] max-w-sm mx-auto font-medium">
                                {activeTab === 'pending' 
                                    ? 'Não há incidentes pendentes de análise no momento.' 
                                    : 'Ainda não existem incidentes arquivados e documentados.'}
                            </p>
                        </div>
                    ) : (
                        filteredIncidents.map((inc) => (
                            <div
                                key={inc.id}
                                onClick={() => handleOpenPostMortem(inc)}
                                className={`group relative bg-[var(--apple-card-bg)] rounded-[32px] border border-[var(--apple-border)] p-7 transition-all cursor-pointer hover:shadow-2xl hover:shadow-[var(--apple-accent)]/5 hover:-translate-y-1 ${selectedIncident?.id === inc.id ? 'ring-2 ring-[var(--apple-accent)] border-transparent' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${activeTab === 'pending' ? 'bg-red-500 text-white' : 'bg-[#34C759]/10 text-[#34C759]'}`}>
                                            {activeTab === 'concluded' ? <CheckCheck size={28} /> : (inc.status === 'active' ? <AlertTriangle size={28} className="animate-pulse" /> : <Clock size={28} />)}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h4 className="font-black text-[var(--apple-text)] text-xl tracking-tight">{inc.siteName}</h4>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getSeverityStyles(inc.severity)}`}>
                                                    {inc.severity}
                                                </span>
                                                {activeTab === 'concluded' && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[#34C759] text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#34C759]/20">
                                                        <ShieldCheck size={12} />
                                                        Caso Encerrado
                                                    </span>
                                                )}
                                                {activeTab === 'pending' && (
                                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${inc.status === 'active' ? 'bg-red-500 text-white' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                        {inc.status === 'active' ? 'Emergência' : 'Aguardando Post-Mortem'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--apple-text-secondary)] font-semibold">
                                                <span className="flex items-center gap-2 text-[var(--apple-text)]">
                                                    <Clock size={16} className="text-[var(--apple-accent)]" />
                                                    {new Date(inc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {inc.duration && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-black opacity-40">Tempo Offline:</span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${activeTab === 'concluded' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-red-500/10 text-red-500'}`}>
                                                            {inc.duration}
                                                        </span>
                                                    </div>
                                                )}
                                                {!inc.duration && inc.status === 'active' && (
                                                    <span className="text-red-500 flex items-center gap-1.5 uppercase text-[10px] font-black tracking-widest">
                                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                                                        Impacto em Tempo Real
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, inc)}
                                            className="p-3 rounded-xl hover:bg-red-500/10 text-[var(--apple-text-secondary)] hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            title="Excluir Registro"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <ChevronRight className="w-6 h-6 text-[var(--apple-text-secondary)] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>

                                {(inc.rootCause && inc.rootCause !== 'Aguardando diagnóstico...') && (
                                    <div className="mt-6 pt-5 border-t border-[var(--apple-border)] border-dashed">
                                        <div className="flex gap-4">
                                            <div className="p-2.5 bg-[#34C759]/5 rounded-xl h-fit border border-[#34C759]/10">
                                                <MessageSquare size={18} className="text-[#34C759]" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.1em] mb-1">Diagnóstico & RCA</p>
                                                <p className="text-[var(--apple-text)] text-sm font-medium italic opacity-90 leading-relaxed">
                                                    "{inc.rootCause}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Editor Post-Mortem Lateral */}
                <div className="xl:col-span-4">
                    <div className="bg-[var(--apple-card-bg)] rounded-[40px] border border-[var(--apple-border)] p-8 sticky top-24 shadow-2xl overflow-hidden min-h-[580px] flex flex-col">
                        {!selectedIncident ? (
                            <div className="flex flex-col items-center justify-center flex-grow text-center py-20 animate-fade-in">
                                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[var(--apple-accent)]/5 to-transparent flex items-center justify-center mb-8 border border-[var(--apple-border)]">
                                    <FileText className="w-10 h-10 text-[var(--apple-text-secondary)] opacity-20" />
                                </div>
                                <h4 className="text-[var(--apple-text)] font-black text-xl mb-3 tracking-tight">Análise Executiva</h4>
                                <p className="text-[var(--apple-text-secondary)] text-sm font-medium leading-relaxed max-w-[240px]">Selecione um evento para converter a falha em um caso encerrado e documentado.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in-slide-up flex flex-col flex-grow">
                                <div className="flex items-center gap-5 pb-6 border-b border-[var(--apple-border)]">
                                    <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all ${selectedIncident.status === 'active' ? 'bg-red-500 shadow-red-500/20' : 'bg-[#34C759] shadow-[#34C759]/20'}`}>
                                        {selectedIncident.status === 'active' ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-[var(--apple-text)] text-xl leading-tight truncate">{selectedIncident.siteName}</h4>
                                        <p className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-[0.2em] mt-0.5">Ref: {selectedIncident.id.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-grow">
                                    {selectedIncident.duration && (
                                        <div className="p-5 bg-[#34C759]/5 border border-[#34C759]/20 rounded-3xl">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black uppercase text-[#34C759] tracking-widest">Restabelecido em</span>
                                                <CheckCheck size={14} className="text-[#34C759]" />
                                            </div>
                                            <p className="text-2xl font-black text-[#34C759]">{selectedIncident.duration}</p>
                                            <p className="text-[10px] font-medium text-[var(--apple-text-secondary)] mt-1">Tempo total offline monitorado.</p>
                                        </div>
                                    )}

                                    <div className="group">
                                        <label className="block text-[11px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em] mb-3 ml-1">Causa Raiz Identificada</label>
                                        <textarea 
                                            value={rootCause}
                                            onChange={(e) => setRootCause(e.target.value)}
                                            placeholder="Descreva o motivo técnico da falha..."
                                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] focus:border-[var(--apple-accent)] rounded-2xl p-5 text-sm font-medium outline-none min-h-[140px] transition-all resize-none shadow-inner"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-[11px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em] mb-3 ml-1">Plano de Ação Corretiva</label>
                                        <textarea 
                                            value={resolution}
                                            onChange={(e) => setResolution(e.target.value)}
                                            placeholder="O que foi feito para garantir a estabilidade?"
                                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] focus:border-[var(--apple-accent)] rounded-2xl p-5 text-sm font-medium outline-none min-h-[120px] transition-all resize-none shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[var(--apple-border)] mt-auto">
                                    <button
                                        onClick={handleSavePostMortem}
                                        disabled={isSaving}
                                        className="w-full h-16 bg-[var(--apple-text)] text-[var(--apple-bg)] rounded-[24px] font-black text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.03] active:scale-[0.97] hover:shadow-xl disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <ShieldCheck size={20} />
                                                Concluir e Arquivar
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => setSelectedIncident(null)}
                                        className="w-full text-center mt-5 text-[10px] font-black text-[var(--apple-text-secondary)] hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Fechar Relatório
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modais Customizados */}
            {(incidentToDelete || isClearAllModalOpen) && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setIncidentToDelete(null); setIsClearAllModalOpen(false); }}></div>
                    <div className="bg-[var(--apple-card-bg)] w-full max-w-sm rounded-[40px] border border-[var(--apple-border)] p-10 glass shadow-2xl relative z-10 animate-fade-in-slide-up border-none text-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 ${isClearAllModalOpen ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {isClearAllModalOpen ? <Eraser size={40} /> : <AlertTriangle size={40} />}
                        </div>
                        <h3 className="text-3xl font-black text-[var(--apple-text)] mb-3 tracking-tight">
                            {isClearAllModalOpen ? 'Limpar Tudo?' : 'Excluir?'}
                        </h3>
                        <p className="text-[var(--apple-text-secondary)] font-medium leading-relaxed mb-10 text-sm">
                            {isClearAllModalOpen 
                                ? 'Isso apagará permanentemente todo o histórico de crises e análises post-mortem.'
                                : `Deseja remover o registro de ${incidentToDelete?.siteName} da sua Central de Crises?`}
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={isClearAllModalOpen ? async () => { await clearAllIncidents(); setIsClearAllModalOpen(false); } : confirmDelete}
                                className="w-full py-5 bg-red-500 text-white rounded-[24px] font-black text-lg active:scale-95 transition-all shadow-lg shadow-red-500/20"
                            >
                                Confirmar
                            </button>
                            <button 
                                onClick={() => { setIncidentToDelete(null); setIsClearAllModalOpen(false); }}
                                className="w-full py-5 bg-[var(--apple-input-bg)] text-[var(--apple-text)] rounded-[24px] font-black text-lg active:scale-95 transition-all"
                            >
                                Manter Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
