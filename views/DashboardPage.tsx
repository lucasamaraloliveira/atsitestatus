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
                    <div className="flex items-center bg-[var(--apple-input-bg)] rounded-2xl p-1.5 border border-[var(--apple-border)] glass">
                        <div className="relative group">
                            <select 
                                id="filter" 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value as FilterType)} 
                                className="appearance-none bg-transparent pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold focus:outline-none cursor-pointer text-[var(--apple-text)]"
                            >
                                <option value="ALL">🔍 Todos</option>
                                <option value="Online">🟢 Online</option>
                                <option value="Offline">🔴 Offline</option>
                                <option value="Verificando">🔵 Verificando</option>
                                <option value="Erro">🟠 Erro</option>
                            </select>
                        </div>
                        
                        <div className="w-px h-5 bg-[var(--apple-border)] mx-1"></div>
                        
                        <div className="relative group">
                            <select 
                                id="sort" 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} 
                                className="appearance-none bg-transparent pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold focus:outline-none cursor-pointer text-[var(--apple-text)]"
                            >
                                <option value="asc">🔡 A-Z</option>
                                <option value="desc">🔠 Z-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)]">
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)]'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)]'}`}
                        >
                            <List size={18} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSites.map((site) => (
                        <div key={site.id} className="glass apple-card animate-fade-in-slide-up hover:translate-y-[-4px] transition-all group">
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-[var(--apple-text)] truncate max-w-[140px]">{site.name || site.url}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">{site.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditSite(site.id)} className="p-2 rounded-lg hover:bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)]"><Edit2 size={14} /></button>
                                        <button onClick={() => handleRequestDelete(site.id)} className="p-2 rounded-lg hover:bg-[#FF3B30]/10 text-[#FF3B30]"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                        <div className="flex items-center gap-3"><Activity size={14} className="text-[var(--apple-text-secondary)]"/><span className="text-xs font-bold text-[var(--apple-text-secondary)]">Latência</span></div>
                                        <span className="font-black text-[var(--apple-text)] text-sm">{site.latency ? `${site.latency}ms` : '--'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                        <div className="flex items-center gap-3"><Clock size={14} className="text-[var(--apple-text-secondary)]"/><span className="text-xs font-bold text-[var(--apple-text-secondary)]">Verificação</span></div>
                                        <span className="font-black text-[var(--apple-text)] text-[10px]">{site.timestamp ? site.timestamp.split(',')[1] : '--'}</span>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedSiteId(site.id)} className="w-full mt-8 py-4 rounded-2xl bg-[var(--apple-input-bg)] text-[var(--apple-text)] font-semibold text-xs hover:bg-[var(--apple-accent)] hover:text-white transition-all flex items-center justify-center gap-2">
                                    Histórico Detalhado <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass apple-card overflow-hidden border-none shadow-2xl">
                    <table className="w-full text-left border-collapse">
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
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>{site.status}</span>
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
