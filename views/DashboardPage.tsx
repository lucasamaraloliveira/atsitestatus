import React from 'react';
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
    ArrowUpRight
} from 'lucide-react';

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
}) => {
    type FilterType = CheckStatus | 'ALL';

    const filteredSites = sites
        .filter(site => filter === 'ALL' || site.status === filter)
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
                        className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isMonitoring ? 'bg-[#FF3B30] text-white' : 'bg-[#34C759] text-white'}`}
                    >
                        {isMonitoring ? 'Pausar' : 'Iniciar'}
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* iOS-style Segmented Control - Status Filter */}
                    <div className="relative flex items-center bg-[var(--apple-input-bg)] rounded-[14px] p-[3px] border border-[var(--apple-border)] backdrop-blur-xl shadow-sm">
                        {([
                            { value: 'ALL', label: 'Todos', icon: <Search size={13} strokeWidth={2.5} /> },
                            { value: 'Online', label: 'Online', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#34C759]" /> },
                            { value: 'Offline', label: 'Offline', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#FF3B30]" /> },
                            { value: 'Verificando', label: 'Verificando', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#007AFF]" /> },
                            { value: 'Erro', label: 'Erro', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#FF9500]" /> },
                        ] as { value: FilterType; label: string; icon: React.ReactNode }[]).map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setFilter(item.value)}
                                className={`relative z-10 flex items-center gap-1.5 px-3.5 py-[7px] rounded-[11px] text-[12px] font-semibold transition-all duration-200 ease-in-out
                                    ${filter === item.value 
                                        ? 'bg-[var(--apple-card-bg)] text-[var(--apple-text)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                                        : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'
                                    }`}
                            >
                                {item.icon}
                                <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* iOS-style Segmented Control - Sort Order */}
                    <div className="relative flex items-center bg-[var(--apple-input-bg)] rounded-[14px] p-[3px] border border-[var(--apple-border)] backdrop-blur-xl shadow-sm">
                        {([
                            { value: 'asc', label: 'A-Z' },
                            { value: 'desc', label: 'Z-A' },
                        ] as { value: 'asc' | 'desc'; label: string }[]).map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setSortOrder(item.value)}
                                className={`relative z-10 flex items-center gap-1.5 px-4 py-[7px] rounded-[11px] text-[12px] font-semibold transition-all duration-200 ease-in-out
                                    ${sortOrder === item.value 
                                        ? 'bg-[var(--apple-card-bg)] text-[var(--apple-text)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                                        : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* iOS-style Segmented Control - View Mode */}
                    <div className="relative flex items-center bg-[var(--apple-input-bg)] rounded-[14px] p-[3px] border border-[var(--apple-border)] backdrop-blur-xl shadow-sm">
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`relative z-10 p-[7px] rounded-[11px] transition-all duration-200 ease-in-out
                                ${viewMode === 'card' 
                                    ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                                    : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'
                                }`}
                        >
                            <LayoutGrid size={16} strokeWidth={2} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`relative z-10 p-[7px] rounded-[11px] transition-all duration-200 ease-in-out
                                ${viewMode === 'list' 
                                    ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                                    : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'
                                }`}
                        >
                            <List size={16} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleRefreshAll} className="bg-[var(--apple-card-bg)] text-[var(--apple-text)] font-bold py-3 px-6 rounded-2xl border border-[var(--apple-border)] hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm flex items-center gap-2">
                        <RefreshCw size={14} className={isMonitoring ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                    <button onClick={onOpenGlobalReportModal} className="bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold py-3 px-6 rounded-2xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-[#007AFF]/20">
                        <FileSpreadsheet size={16} />
                        Exportar Tudo
                    </button>
                </div>
            </div>

            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredSites.map((site) => (
                        <div key={site.id} className="glass apple-card animate-fade-in-slide-up hover:translate-y-[-4px] transition-all group">
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6 md:mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]/10 text-[#007AFF]' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-[var(--apple-text)] truncate max-w-[120px] sm:max-w-[140px]">{site.name || site.url}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'}`}></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">{site.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditSite(site.id)} className="p-2 rounded-lg hover:bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)]"><Edit2 size={14} /></button>
                                        <button onClick={() => handleRequestDelete(site.id)} className="p-2 rounded-lg hover:bg-[#FF3B30]/10 text-[#FF3B30]"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                        <div className="flex items-center gap-3"><Activity size={14} className="text-[var(--apple-text-secondary)]"/><span className="text-xs font-bold text-[var(--apple-text-secondary)]">Latência</span></div>
                                        <span className="font-black text-[var(--apple-text)] text-sm">{site.latency ? `${site.latency}ms` : '--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                        <div className="flex items-center gap-3"><Clock size={14} className="text-[var(--apple-text-secondary)]"/><span className="text-xs font-bold text-[var(--apple-text-secondary)]">Verificação</span></div>
                                        <span className="font-black text-[var(--apple-text)] text-[10px]">{site.timestamp ? site.timestamp.split(',')[1] : '--'}</span>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedSiteId(site.id)} className="w-full mt-6 md:mt-8 py-3.5 md:py-4 rounded-2xl bg-[var(--apple-input-bg)] text-[var(--apple-text)] font-semibold text-xs hover:bg-[var(--apple-accent)] hover:text-white transition-all flex items-center justify-center gap-2">
                                    Histórico Detalhado <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass apple-card overflow-x-auto border-none shadow-2xl no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] text-[10px] font-black uppercase tracking-[0.15em]">
                                <th className="px-8 py-6">Website</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Latência</th>
                                <th className="px-8 py-6">Visto pela última vez</th>
                                <th className="px-8 py-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--apple-border)]">
                            {filteredSites.map((site) => (
                                <tr key={site.id} onClick={() => setSelectedSiteId(site.id)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <Globe size={18} className="text-[var(--apple-text-secondary)]" />
                                            <span className="font-bold text-sm tracking-tight">{site.name || site.url}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]/10 text-[#007AFF]' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>{site.status}</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-[var(--apple-text)]">{site.latency ? `${site.latency}ms` : '--'}</td>
                                    <td className="px-8 py-5 text-[10px] font-bold text-[var(--apple-text-secondary)]">{site.timestamp || '--'}</td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleRefreshSite(site.id); }} className="p-2 rounded-lg hover:bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)]"><RefreshCw size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleRequestDelete(site.id); }} className="p-2 rounded-lg hover:bg-[#FF3B30]/10 text-[#FF3B30]"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredSites.length === 0 && (
                <div className="glass apple-card py-20 text-center border-none shadow-xl border border-[var(--apple-border)]">
                    <AlertCircle size={40} className="mx-auto mb-4 text-[var(--apple-text-secondary)] opacity-50" />
                    <h3 className="text-xl font-black text-[var(--apple-text)]">Nenhum monitoramento para exibir</h3>
                    <p className="text-[var(--apple-text-secondary)] text-sm mt-1">Tente ajustar seus filtros ou adicione um novo site.</p>
                    <button onClick={onOpenAddSiteModal} className="apple-button mt-6 h-11 px-8">Adicionar Novo Site</button>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
