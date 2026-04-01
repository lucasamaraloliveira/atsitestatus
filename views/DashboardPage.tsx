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
import LatencySparkline from '@/components/LatencySparkline';

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
    handleUpdateSiteUrl: (id: string, url: string, name: string, keyword: string) => void;
    handleRefreshSite: (id: string) => void;
    handleRequestDelete: (id: string) => void;
    handleRefreshAll: () => void;
    currentUser: string;
    onLogout: () => void;
    userProfile: any;
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
    userProfile
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const userRole = userProfile?.role || 'admin';
    const userProfileType = userProfile?.profile || 'admin';
    
    // Regras de acesso
    const canAdd = userRole === 'admin' || userProfileType === 'analyst';
    const canEdit = userRole === 'admin' || userProfileType === 'analyst';
    const canDelete = userRole === 'admin'; 

    type FilterType = CheckStatus | 'ALL';

    const filteredSites = sites
        .filter(site => {
            const matchesStatus = filter === 'ALL' || site.status === filter;
            const matchesSearch = !searchQuery.trim() || 
                (site.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                site.url.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        })
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
                    {userRole === 'admin' && (
                        <>
                            <div className="w-px h-6 bg-[var(--apple-border)]"></div>
                            <button 
                                onClick={() => setIsMonitoring(!isMonitoring)}
                                className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isMonitoring ? 'bg-[#FF3B30] text-white' : 'bg-[#34C759] text-white'}`}
                            >
                                {isMonitoring ? 'Pausar' : 'Iniciar'}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="flex flex-col gap-6 mb-10">
                {/* Search and Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                    {/* Search Field */}
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-colors group-focus-within:text-[var(--apple-accent)]">
                            <Search size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Buscar site por nome ou URL..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-[22px] md:rounded-[18px] py-3.5 pl-12 pr-6 text-sm font-medium text-[var(--apple-text)] placeholder:text-[var(--apple-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent)]/20 focus:border-[var(--apple-accent)]/40 transition-all shadow-sm backdrop-blur-xl"
                        />
                    </div>

                    {/* Status Filters */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex items-center bg-[var(--apple-input-bg)] rounded-[22px] md:rounded-[18px] p-1 border border-[var(--apple-border)] backdrop-blur-xl shadow-sm gap-1">
                        {([
                            { value: 'ALL', label: 'Todos', icon: <Search size={13} strokeWidth={2.5} /> },
                            { value: 'Online', label: 'Online', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#34C759]" /> },
                            { value: 'Offline', label: 'Offline', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#FF3B30]" /> },
                            { value: 'Verificando', label: 'Verificando', icon: <div className="w-[10px] h-[10px] rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" /> },
                            { value: 'Erro', label: 'Erro', icon: <div className="w-[7px] h-[7px] rounded-full bg-[#FF9500]" /> },
                        ] as { value: FilterType; label: string; icon: React.ReactNode }[]).map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setFilter(item.value)}
                                className={`relative z-10 flex items-center justify-center md:justify-start gap-2 px-4 py-2.5 rounded-[16px] md:rounded-[14px] text-[12px] md:text-[13px] font-bold transition-all duration-300
                                    ${item.value === 'ALL' ? 'col-span-2 sm:col-span-1 md:col-span-auto' : ''}
                                    ${filter === item.value 
                                        ? 'bg-[var(--apple-card-bg)] text-[var(--apple-text)] shadow-lg scale-[1.02]' 
                                        : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] opacity-60'
                                    }`}
                            >
                                <div className="flex items-center justify-center w-4 h-4">{item.icon}</div>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Secondary Controls - Sort & View Mode */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)]">
                        <button 
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-all group"
                        >
                            <div className={`transition-transform duration-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`}>
                                <ChevronRight size={14} className="text-[var(--apple-accent)] rotate-90" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] group-hover:text-[var(--apple-text)]">
                                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                            </span>
                        </button>
                        
                        <div className="w-px h-4 bg-[var(--apple-border)]"></div>
                        
                        <div className="flex items-center gap-1 px-1">
                            <button 
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-md' : 'text-[var(--apple-text-secondary)] opacity-40 hover:opacity-100'}`}
                            >
                                <LayoutGrid size={16} strokeWidth={2.5} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-md' : 'text-[var(--apple-text-secondary)] opacity-40 hover:opacity-100'}`}
                            >
                                <List size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleRefreshAll}
                            className="p-3.5 bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] rounded-2xl border border-[var(--apple-border)] hover:text-[var(--apple-accent)] active:scale-95 transition-all shadow-sm"
                            title="Atualizar Tudo"
                        >
                            <RefreshCw size={18} strokeWidth={2.5} className={isMonitoring ? 'animate-spin opacity-50' : ''} />
                        </button>
                        {canAdd && (
                            <button 
                                onClick={onOpenAddSiteModal} 
                                className="hidden md:flex bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold py-3.5 px-6 rounded-2xl transition-all text-sm items-center gap-2 shadow-lg shadow-[#007AFF]/20"
                            >
                                <Activity size={16} strokeWidth={2.5} />
                                Novo Site
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredSites.map((site) => (
                        <div key={site.id} className="glass apple-card animate-fade-in-slide-up hover:translate-y-[-4px] transition-all group">
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <a 
                                            href={site.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Acessar Site"
                                            className={`p-4 rounded-2xl ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]/10 text-[#007AFF]' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'} transition-all duration-500 hover:scale-110 active:scale-95`}
                                        >
                                            <Globe size={24} className={site.status === CheckStatus.CHECKING ? 'animate-pulse' : ''} />
                                        </a>
                                        <div>
                                            <h3 className="font-black text-lg text-[var(--apple-text)] truncate max-w-[120px] sm:max-w-[140px]">{site.name || site.url}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF] animate-pulse' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'}`}></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">{site.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {(canEdit || canDelete) && (
                                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canEdit && <button onClick={() => handleEditSite(site.id)} className="p-2 rounded-lg hover:bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)]"><Edit2 size={14} /></button>}
                                            {canDelete && <button onClick={() => handleRequestDelete(site.id)} className="p-2 rounded-lg hover:bg-[#FF3B30]/10 text-[#FF3B30]"><Trash2 size={14} /></button>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                        <div className="flex items-center gap-3"><Activity size={14} className="text-[var(--apple-text-secondary)]"/><span className="text-xs font-bold text-[var(--apple-text-secondary)]">Latência</span></div>
                                        <span className="font-black text-[var(--apple-text)] text-sm">{site.latency ? `${site.latency}ms` : '--'}</span>
                                    </div>
                                    
                                    <div className="p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--apple-text-secondary)] mb-3">Tendência de Performance</p>
                                        <LatencySparkline logs={logs[site.id] || []} color={site.status === CheckStatus.ONLINE ? '#34C759' : site.status === CheckStatus.CHECKING ? '#007AFF' : site.status === CheckStatus.ERROR ? '#FF9500' : '#FF3B30'} height={50} />
                                    </div>

                                    <div className="flex items-center justify-between px-4 text-[var(--apple-text-secondary)]">
                                        <div className="flex items-center gap-2"><Clock size={12} className="opacity-50"/><span className="text-[10px] font-bold italic">Último check: {site.timestamp ? site.timestamp.split(',')[1] : '--'}</span></div>
                                    </div>
                                </div>

                                <button onClick={() => setSelectedSiteId(site.id)} className="w-full py-4 rounded-2xl bg-[var(--apple-input-bg)] text-[var(--apple-text)] font-semibold text-xs hover:bg-[var(--apple-accent)] hover:text-white transition-all flex items-center justify-center gap-2 border border-[var(--apple-border)]">
                                    Histórico Detalhado <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass apple-card border-none shadow-2xl overflow-hidden">
                    {/* Header da "Lista" - Apenas Desktop */}
                    <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_120px_100px] bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] text-[10px] font-black uppercase tracking-[0.15em] px-8 py-5 border-b border-[var(--apple-border)]">
                        <div>Website</div>
                        <div>Status</div>
                        <div>Latência</div>
                        <div>Tendência</div>
                        <div>Check</div>
                        <div className="text-right">Ações</div>
                    </div>

                    <div className="divide-y divide-[var(--apple-border)]">
                        {filteredSites.map((site) => (
                            <div 
                                key={site.id} 
                                onClick={() => setSelectedSiteId(site.id)} 
                                className="px-5 py-6 md:px-8 hover:bg-white/5 transition-colors cursor-pointer group flex flex-col md:grid md:grid-cols-[1fr_120px_100px_140px_120px_100px] md:items-center gap-5 md:gap-0"
                            >
                                {/* Row 1: Logo, Title and Status */}
                                <div className="flex items-center justify-between md:justify-start gap-3 min-w-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <a 
                                            href={site.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Acessar Site"
                                            className={`p-2.5 rounded-xl ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'} shrink-0 transition-all duration-500 hover:scale-110 active:scale-95`}
                                        >
                                            <Globe size={18} className={site.status === CheckStatus.CHECKING ? 'animate-pulse' : ''} />
                                        </a>
                                        <span className="font-bold text-[15px] md:text-sm tracking-tight truncate text-[var(--apple-text)]">{site.name || site.url}</span>
                                    </div>
                                    <span className={`md:hidden px-3 py-1 rounded-full text-[9px] font-black uppercase ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]/10 text-[#007AFF]' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                                        {site.status}
                                    </span>
                                </div>

                                {/* Desktop Status - MD and up */}
                                <div className="hidden md:block">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : site.status === CheckStatus.CHECKING ? 'bg-[#007AFF]/10 text-[#007AFF]' : site.status === CheckStatus.ERROR ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                                        {site.status}
                                    </span>
                                </div>

                                {/* Latency - Desktop Cell */}
                                <div className="hidden md:block text-sm font-black text-[var(--apple-text)]">
                                    {site.latency ? `${site.latency}ms` : '--'}
                                </div>

                                {/* Trend - Desktop Cell */}
                                <div className="hidden md:block w-[120px]">
                                    <LatencySparkline logs={logs[site.id] || []} color={site.status === CheckStatus.ONLINE ? '#34C759' : site.status === CheckStatus.CHECKING ? '#007AFF' : site.status === CheckStatus.ERROR ? '#FF9500' : '#FF3B30'} height={20} />
                                </div>

                                {/* Last Check - Desktop Cell */}
                                <div className="hidden md:block text-[11px] font-bold text-[var(--apple-text-secondary)]">
                                    {site.timestamp ? site.timestamp.split(',')[1] : '--'}
                                </div>

                                {/* Mobile Only Info Grid */}
                                <div className="md:hidden grid grid-cols-3 gap-4 py-4 px-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-wider mb-1">Latência</span>
                                        <span className="text-sm font-black text-[var(--apple-text)]">{site.latency ? `${site.latency}ms` : '--'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-wider mb-1">Tendência</span>
                                        <div className="w-full">
                                            <LatencySparkline logs={logs[site.id] || []} color={site.status === CheckStatus.ONLINE ? '#34C759' : site.status === CheckStatus.CHECKING ? '#007AFF' : site.status === CheckStatus.ERROR ? '#FF9500' : '#FF3B30'} height={20} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-wider mb-1">Check</span>
                                        <span className="text-[11px] font-bold text-[var(--apple-text-secondary)] truncate">
                                            {site.timestamp ? site.timestamp.split(',')[1] : '--'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions Cell */}
                                <div className="flex items-center justify-between md:justify-end gap-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity min-w-[100px]">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRefreshSite(site.id); }} 
                                            className="p-3 md:p-2 bg-[var(--apple-input-bg)] md:bg-transparent rounded-xl md:rounded-lg text-[var(--apple-text-secondary)] hover:text-[var(--apple-accent)] transition-all"
                                        >
                                            <RefreshCw size={14} strokeWidth={2.5} />
                                            <span className="md:hidden text-[10px] font-bold ml-2">Atualizar</span>
                                        </button>
                                            {canEdit && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditSite(site.id); }} 
                                                    className="p-3 md:p-2 bg-[var(--apple-input-bg)] md:bg-transparent rounded-xl md:rounded-lg text-[var(--apple-text-secondary)] hover:text-[var(--apple-accent)] transition-all"
                                                >
                                                    <Edit2 size={14} strokeWidth={2.5} />
                                                    <span className="md:hidden text-[10px] font-bold ml-2">Editar</span>
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRequestDelete(site.id); }} 
                                                    className="p-3 md:p-2 bg-[var(--apple-input-bg)] md:bg-transparent rounded-xl md:rounded-lg text-[#FF3B30]/60 hover:text-[#FF3B30] transition-all"
                                                >
                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                    <span className="md:hidden text-[10px] font-bold ml-2 text-[#FF3B30]">Remover</span>
                                                </button>
                                            )}
                                    </div>
                                    <ChevronRight size={14} className="md:hidden text-[var(--apple-text-secondary)] opacity-30" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {filteredSites.length === 0 && (
                <div className="glass apple-card py-20 text-center border-none shadow-xl border border-[var(--apple-border)]">
                    <AlertCircle size={40} className="mx-auto mb-4 text-[var(--apple-text-secondary)] opacity-50" />
                    <h3 className="text-xl font-black text-[var(--apple-text)]">Nenhum monitoramento para exibir</h3>
                    <p className="text-[var(--apple-text-secondary)] text-sm mt-1">Tente ajustar seus filtros ou adicione um novo site.</p>
                    {canAdd && <button onClick={onOpenAddSiteModal} className="apple-button mt-6 h-11 px-8">Adicionar Novo Site</button>}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
