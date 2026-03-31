import React, { useMemo } from 'react';
import type { StatusResult, FilterType, LogEntry } from '@/types';
import StatusCard from '@/components/StatusCard';
import DashboardHeader from '@/components/DashboardHeader';

interface DashboardPageProps {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    newSiteUrl: string;
    setNewSiteUrl: (url: string) => void;
    newSiteName: string;
    setNewSiteName: (name: string) => void;
    filter: FilterType;
    setFilter: (filter: FilterType) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (order: 'asc' | 'desc') => void;
    editingSiteId: string | null;
    isMonitoring: boolean;
    setIsMonitoring: (isMonitoring: boolean) => void;
    monitoringInterval: number;
    setMonitoringInterval: (interval: number) => void;
    setSelectedSiteId: (id: string | null) => void;
    onOpenGlobalReportModal: () => void;
    handleAddSite: () => void;
    handleEditSite: (id: string) => void;
    handleUpdateSiteUrl: (id: string, newUrl: string, newName: string) => void;
    handleRefreshSite: (id: string) => void;
    handleRequestDelete: (id: string) => void;
    handleRefreshAll: () => void;
    currentUser: string;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { sites, logs, newSiteUrl, setNewSiteUrl, newSiteName, setNewSiteName, filter, setFilter, sortOrder, setSortOrder, editingSiteId,
            isMonitoring, setIsMonitoring, monitoringInterval, setMonitoringInterval, setSelectedSiteId, onOpenGlobalReportModal,
            handleAddSite, handleEditSite, handleUpdateSiteUrl, handleRefreshSite, handleRequestDelete, handleRefreshAll,
            currentUser, onLogout, theme, toggleTheme } = props;

    const filteredAndSortedSites = useMemo(() => {
        return [...sites]
            .filter(site => filter === 'ALL' || site.status === filter)
            .sort((a, b) => {
                const nameA = a.name || a.url;
                const nameB = b.name || b.url;
                if (sortOrder === 'asc') return nameA.localeCompare(nameB);
                return nameB.localeCompare(nameA);
            });
    }, [sites, filter, sortOrder]);

    return (
        <div className="container mx-auto max-w-7xl px-4 animate-fade-in">
            <header className="text-left mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold text-[var(--apple-text)] tracking-tight leading-tight">ATSiteStatus</h1>
                <p className="text-xl text-[var(--apple-text-secondary)] mt-3 font-medium max-w-2xl">Monitoramento inteligente e disponibilidade em tempo real para sua infraestrutura digital.</p>
            </header>
            
            <DashboardHeader sites={sites} logs={logs} />

            <div className="glass apple-card p-8 mb-12 border-none">
                <h2 className="text-lg font-bold mb-6 text-[var(--apple-text)]">Adicionar Novo Site</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow relative">
                        <input
                            type="text"
                            value={newSiteUrl}
                            onChange={(e) => setNewSiteUrl(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSite()}
                            placeholder="https://exemplo.com"
                            className="apple-input w-full text-base placeholder:text-[var(--apple-text-secondary)]/50"
                            aria-label="URL do novo site"
                        />
                    </div>
                     <input
                        type="text"
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSite()}
                        placeholder="Nome Amigável (Opcional)"
                        className="apple-input flex-grow md:flex-grow-0 md:w-1/3 text-base placeholder:text-[var(--apple-text-secondary)]/50"
                        aria-label="Nome do novo site (Opcional)"
                    />
                    <button onClick={handleAddSite} className="apple-button shadow-lg shadow-blue-500/30">
                        Adicionar
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center bg-[var(--apple-input-bg)] rounded-full p-1 border border-[var(--apple-border)]">
                        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value as FilterType)} className="bg-transparent px-4 py-2 rounded-full text-sm font-semibold focus:outline-none cursor-pointer text-[var(--apple-text)]">
                            <option value="ALL" className="bg-[var(--apple-bg)]">Todos Status</option>
                            {Object.values(props.sites[0]?.status ? CheckStatus : {}).map(s => <option key={s} value={s} className="bg-[var(--apple-bg)]">{s}</option>)}
                        </select>
                        <div className="w-px h-4 bg-[var(--apple-border)] mx-1"></div>
                        <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className="bg-transparent px-4 py-2 rounded-full text-sm font-semibold focus:outline-none cursor-pointer text-[var(--apple-text)]">
                            <option value="asc" className="bg-[var(--apple-bg)]">A-Z</option>
                            <option value="desc" className="bg-[var(--apple-bg)]">Z-A</option>
                        </select>
                    </div>
                    
                    <button onClick={handleRefreshAll} className="bg-[var(--apple-card-bg)] text-[var(--apple-text)] font-bold py-3 px-6 rounded-full border border-[var(--apple-border)] hover:bg-gray-50 dark:hover:bg-white/20 transition-all text-sm">
                        Atualizar Todos
                    </button>
                    <button onClick={onOpenGlobalReportModal} className="bg-[#34C759] hover:bg-[#32B350] text-white font-bold py-3 px-6 rounded-full transition-all text-sm shadow-lg shadow-green-500/20">
                        Relatório PDF
                    </button>
                </div>

                <div className="flex items-center gap-6 flex-wrap bg-[var(--apple-input-bg)] px-6 py-3 rounded-full border border-[var(--apple-border)]">
                    <div className="flex items-center gap-3">
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="monitoring-toggle" checked={isMonitoring} onChange={() => setIsMonitoring(!isMonitoring)} className="sr-only peer"/>
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#34C759]"></div>
                            <label htmlFor="monitoring-toggle" className="ml-3 text-sm font-semibold text-[var(--apple-text)]">Monitoramento</label>
                        </div>
                    </div>
                    {isMonitoring && (
                        <div className="flex items-center gap-2">
                            <input type="number" value={monitoringInterval} onChange={(e) => setMonitoringInterval(parseInt(e.target.value, 10))} className="bg-transparent w-12 text-center font-bold text-[var(--apple-accent)]" min="5" />
                            <span className="text-xs font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">seg</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedSites.map(site => (
                    <StatusCard
                        key={site.id}
                        site={site}
                        onRefresh={handleRefreshSite}
                        onDelete={handleRequestDelete}
                        onEdit={handleEditSite}
                        onUpdate={handleUpdateSiteUrl}
                        onViewDetails={setSelectedSiteId}
                        isEditing={editingSiteId === site.id}
                        logs={logs[site.id] || []}
                    />
                ))}
            </div>
             {sites.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>Nenhum site adicionado ainda.</p>
                    <p>Adicione uma URL acima para começar a monitorar.</p>
                </div>
            )}
        </div>
    );
}

// Para evitar erro no primeiro render se sites estiver vazio
enum CheckStatus {
    ONLINE = 'Online', OFFLINE = 'Offline', CHECKING = 'Verificando', ERROR = 'Erro',
}

export default DashboardPage;
