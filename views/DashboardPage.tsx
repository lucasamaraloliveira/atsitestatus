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
    Plus,
    Monitor,
    Zap,
    Map
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
    handleUpdateSiteUrl
}) => {
    const [searchTerm, setSearchTerm] = useState('');

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
                    <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Status da Infraestrutura</h2>
                    <p className="text-[var(--apple-text-secondary)] mt-2 font-medium">Monitoramento em tempo real de seus endpoints críticos.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)] shadow-sm">
                    <button 
                        onClick={() => setIsMonitoring(!isMonitoring)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${isMonitoring ? 'bg-[#FF3B30] text-white shadow-lg shadow-[#FF3B30]/20' : 'bg-[#34C759] text-white shadow-lg shadow-[#34C759]/20'}`}
                    >
                        {isMonitoring ? 'Parar Monitoramento' : 'Ativar Monitoramento'}
                    </button>
                    <div className="w-px h-6 bg-[var(--apple-border)]"></div>
                    <button 
                        onClick={onOpenGlobalReportModal}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-[var(--apple-text)] hover:bg-white/50 transition-all flex items-center gap-2"
                    >
                        <FileSpreadsheet size={16} /> Relatórios 
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all group-focus-within:text-[var(--apple-accent)]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar infraestrutura (nome ou url)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-[var(--apple-accent)] focus:bg-white transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-xl border border-[var(--apple-border)] overflow-x-auto no-scrollbar whitespace-nowrap max-w-full">
                        <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-white shadow-sm text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}>Todos</button>
                        <button onClick={() => setFilter(CheckStatus.ONLINE)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === CheckStatus.ONLINE ? 'bg-white shadow-sm text-[#34C759]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}>Online</button>
                        <button onClick={() => setFilter(CheckStatus.OFFLINE)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === CheckStatus.OFFLINE ? 'bg-white shadow-sm text-[#FF3B30]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}>Offline</button>
                    </div>

                    <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-xl border border-[var(--apple-border)]">
                        <button 
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2 rounded-lg hover:bg-white/50 text-[var(--apple-text-secondary)] transition-all"
                            title={sortOrder === 'asc' ? 'Ordem: A-Z' : 'Ordem: Z-A'}
                        >
                            <ArrowDownWideNarrow size={18} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-[var(--apple-border)] mx-1"></div>

                    <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-xl border border-[var(--apple-border)]">
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {filteredSites.length === 0 ? (
                <div className="glass apple-card p-24 text-center border-none shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <Monitor size={80} className="text-[var(--apple-text-secondary)] opacity-10 mb-6" />
                    <h3 className="text-2xl font-black tracking-tight text-[var(--apple-text)]">Vazio</h3>
                    <p className="text-[var(--apple-text-secondary)] mt-4 max-w-sm font-medium">Nenhum site encontrado com os filtros atuais. Adicione um novo ou mude a pesquisa.</p>
                </div>
            ) : (
                <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
                    {filteredSites.map((site) => (
                        <div 
                            key={site.id} 
                            onClick={() => setSelectedSiteId(site.id)}
                            className={`glass apple-card group p-6 border-none ring-1 ring-white/5 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer overflow-hidden ${viewMode === 'list' ? 'flex flex-row items-center py-4 px-6' : ''}`}
                        >
                            <div className={`${viewMode === 'list' ? 'flex items-center gap-6 w-full' : 'space-y-6'}`}>
                                <div className="flex items-center justify-between">
                                    <StatusIcon status={site.status} />
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRefreshSite(site.id); }}
                                            className="p-2 text-[var(--apple-text-secondary)] hover:bg-[var(--apple-accent)] hover:text-white rounded-lg transition-all"
                                            title="Atualizar"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditSite(site.id); }}
                                            className="p-2 text-[var(--apple-text-secondary)] hover:bg-[#FF3B30] hover:text-white rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRequestDelete(site.id); }}
                                            className="p-2 text-[var(--apple-text-secondary)] hover:bg-[#FF3B30] hover:text-white rounded-lg transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-grow">
                                    <h3 className="font-bold text-lg tracking-tight truncate leading-tight group-hover:text-[var(--apple-accent)] transition-colors">{site.name || site.url}</h3>
                                    <p className="text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest opacity-60 truncate">
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
                    
                    {viewMode === 'card' && (
                        <button 
                            onClick={onOpenAddSiteModal}
                            className="bg-[var(--apple-input-bg)] border-2 border-dashed border-[var(--apple-border)] rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-[var(--apple-text-secondary)] hover:border-[var(--apple-accent)] hover:text-[var(--apple-accent)] hover:bg-white/50 transition-all group min-h-[160px]"
                        >
                            <div className="p-3 bg-white shadow-sm rounded-2xl group-hover:scale-110 transition-all">
                                <Plus size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Novas Infraestruturas</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
