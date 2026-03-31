import React, { useState } from 'react';
import { 
    CheckStatus 
} from '@/types';
import type { StatusResult, LogEntry } from '@/types';
import { 
    Search, 
    RefreshCw, 
    Trash2, 
    Edit2, 
    Clock, 
    Activity,
    ChevronRight,
    LayoutGrid,
    List,
    FileSpreadsheet,
    Globe,
    AlertCircle,
    ArrowUpRight,
    Filter,
    ArrowDownWideNarrow,
    ChevronDown,
    Plus,
    Monitor,
    Zap,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import StatusIcon from '@/components/StatusIcon';

interface DashboardPageProps {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    filter: CheckStatus | 'ALL';
    setFilter: (filter: CheckStatus | 'ALL') => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    viewMode: 'card' | 'list';
    setViewMode: (mode: 'card' | 'list') => void;
    editingSiteId: string | null;
    isMonitoring: boolean;
    setIsMonitoring: (val: boolean) => void;
    monitoringInterval: number;
    setMonitoringInterval: (val: number) => void;
    setSelectedSiteId: (id: string | null) => void;
    onOpenGlobalReportModal: () => void;
    onOpenAddSiteModal: () => void;
    handleEditSite: (id: string) => void;
    handleUpdateSiteUrl: (id: string, url: string, name: string) => void;
    handleRefreshSite: (id: string) => void;
    handleRequestDelete: (id: string) => void;
    handleRefreshAll: () => void;
    currentUser: string;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
    sites,
    logs,
    filter,
    setFilter,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    isMonitoring,
    setIsMonitoring,
    setSelectedSiteId,
    onOpenGlobalReportModal,
    onOpenAddSiteModal,
    handleRefreshSite,
    handleRequestDelete,
    handleRefreshAll,
    editingSiteId,
    handleEditSite,
    handleUpdateSiteUrl,
    currentUser,
    onLogout
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const filteredSites = sites
        .filter(site => (filter === 'ALL' || site.status === filter))
        .filter(site => (site.name || site.url).toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const nameA = a.name || a.url;
            const nameB = b.name || b.url;
            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Painel de Controle</h2>
                    <p className="text-[var(--apple-text-secondary)] mt-2 font-medium">Controle total sobre a disponibilidade de sua infraestrutura.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-[var(--apple-input-bg)] p-1.5 rounded-3xl border border-[var(--apple-border)]">
                    <div className="flex items-center px-4 py-2 gap-3">
                        <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-[#34C759] shadow-[0_0_12px_rgba(52,199,89,0.5)] animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text)]">
                            {isMonitoring ? 'Ativo' : 'Pausado'}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-[var(--apple-border)]"></div>
                    <button 
                        onClick={() => setIsMonitoring(!isMonitoring)}
                        className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isMonitoring ? 'bg-[#FF3B30] text-white' : 'bg-[#34C759] text-white hover:scale-105 active:scale-95'}`}
                    >
                        {isMonitoring ? 'Pausar' : 'Iniciar'}
                    </button>
                </div>
            </header>

            {/* Barra de Ações Premium */}
            <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all group-focus-within:text-[var(--apple-accent)]" size={20} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar infraestrutura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-[2rem] py-5 pl-16 pr-6 text-sm font-medium outline-none focus:border-[var(--apple-accent)] focus:bg-white/5 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Botão Novo Site Estilizado */}
                    <button 
                        onClick={onOpenAddSiteModal}
                        className="bg-[var(--apple-accent)] text-white h-14 px-8 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-[#007AFF]/20"
                    >
                        <Plus size={18} /> Novo Site
                    </button>

                    {/* Popover Filter - Premium Custom Select */}
                    <div className="relative">
                        <button 
                            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                            className={`h-14 px-6 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${filter !== 'ALL' ? 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20' : 'bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] hover:bg-white/5'}`}
                        >
                            <Filter size={16} /> {filter === 'ALL' ? 'Todos' : filter} <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isFilterOpen && (
                            <div className="absolute top-16 right-0 w-56 filter-popover">
                                <div onClick={() => { setFilter('ALL'); setIsFilterOpen(false); }} className={`filter-item ${filter === 'ALL' ? 'active' : ''}`}>
                                    <Globe size={14} /> Todos
                                </div>
                                <div onClick={() => { setFilter(CheckStatus.ONLINE); setIsFilterOpen(false); }} className={`filter-item ${filter === CheckStatus.ONLINE ? 'active' : ''}`}>
                                    <CheckCircle2 size={14} className="text-[#34C759]" /> Online
                                </div>
                                <div onClick={() => { setFilter(CheckStatus.OFFLINE); setIsFilterOpen(false); }} className={`filter-item ${filter === CheckStatus.OFFLINE ? 'active' : ''}`}>
                                    <XCircle size={14} className="text-[#FF3B30]" /> Offline
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Popover Sort - Premium Custom Select */}
                    <div className="relative">
                        <button 
                            onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                            className="h-14 px-6 rounded-2xl bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                            <ArrowDownWideNarrow size={16} /> {sortOrder === 'asc' ? 'A-Z' : 'Z-A'} <ChevronDown size={14} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSortOpen && (
                            <div className="absolute top-16 right-0 w-48 filter-popover">
                                <div onClick={() => { setSortOrder('asc'); setIsSortOpen(false); }} className={`filter-item ${sortOrder === 'asc' ? 'active' : ''}`}>
                                    Crescente (A-Z)
                                </div>
                                <div onClick={() => { setSortOrder('desc'); setIsSortOpen(false); }} className={`filter-item ${sortOrder === 'desc' ? 'active' : ''}`}>
                                    Decrescente (Z-A)
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-8 bg-[var(--apple-border)] mx-1"></div>

                    <div className="flex bg-[var(--apple-input-bg)] p-1.5 rounded-2xl">
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-white shadow-md text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid de Sites */}
            {filteredSites.length === 0 ? (
                <div className="glass apple-card p-32 text-center border-none shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className="p-8 rounded-full bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] opacity-10 mb-8 animate-pulse">
                        <Monitor size={120} />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-[var(--apple-text)]">Vazio Absoluto</h3>
                    <p className="text-[var(--apple-text-secondary)] mt-4 max-w-md font-medium leading-relaxed">Nenhum site corresponde aos critérios atuais. Adicione um novo endpoint ou mude os filtros para monitorar sua infraestrutura.</p>
                </div>
            ) : (
                <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "flex flex-col gap-4"}>
                    {filteredSites.map((site) => (
                        <div 
                            key={site.id} 
                            onClick={() => setSelectedSiteId(site.id)}
                            className={`glass apple-card group relative p-8 border-none ring-1 ring-white/5 shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-500 cursor-pointer overflow-hidden ${viewMode === 'list' ? 'flex flex-row items-center py-4 px-8' : ''}`}
                        >
                            {/* Card Background Bloom */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-all ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]' : site.status === CheckStatus.OFFLINE ? 'bg-[#FF3B30]' : 'bg-[#FF9500]'}`}></div>
                            
                            <div className={`${viewMode === 'list' ? 'flex items-center gap-6 w-full' : 'space-y-6'}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="transform group-hover:scale-110 transition-transform duration-500 origin-left">
                                        <StatusIcon status={site.status} />
                                    </div>
                                    <div className="flex h-12 items-center gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRefreshSite(site.id); }}
                                            className="p-3 text-[var(--apple-text-secondary)] hover:bg-[var(--apple-accent)] hover:text-white rounded-xl transition-all group/icon"
                                            title="Atualizar"
                                        >
                                            <RefreshCw size={14} className="group-hover/icon:rotate-180 transition-transform duration-500" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditSite(site.id); }}
                                            className="p-3 text-[var(--apple-text-secondary)] hover:bg-[#FF3B30] hover:text-white rounded-xl transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRequestDelete(site.id); }}
                                            className="p-3 text-[var(--apple-text-secondary)] hover:bg-[#FF3B30] hover:text-white rounded-xl transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-grow">
                                    <h3 className="font-black text-xl tracking-tight truncate leading-none mb-1">{site.name || site.url}</h3>
                                    <p className="text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition-opacity truncate leading-none">
                                        <Globe size={10} className="inline mr-1" /> {site.url}
                                    </p>
                                </div>

                                <div className={`flex items-center gap-4 ${viewMode === 'list' ? 'ml-auto shrink-0' : 'pt-4 border-t border-white/5'}`}>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest leading-none mb-1">Latência</span>
                                        <span className={`text-lg font-black tracking-tight ${site.latency && site.latency > 1000 ? 'text-[#FF9500]' : 'text-[var(--apple-accent)]'}`}>
                                            {site.latency !== undefined ? `${site.latency}ms` : '---'}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-white/5"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest leading-none mb-1">Status</span>
                                        <span className={`text-lg font-black tracking-tight uppercase ${site.status === CheckStatus.ONLINE ? 'text-[#34C759]' : site.status === CheckStatus.OFFLINE ? 'text-[#FF3B30]' : 'text-[#FF9500]'}`}>
                                            {site.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Action Button (Mobile) */}
            <button 
                onClick={onOpenAddSiteModal}
                className="md:hidden fixed right-8 bottom-32 w-16 h-16 bg-[var(--apple-accent)] text-white rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,122,255,0.5)] z-50 animate-bounce active:scale-90 transition-all"
            >
                <Plus size={32} />
            </button>
        </div>
    );
};

export default DashboardPage;
