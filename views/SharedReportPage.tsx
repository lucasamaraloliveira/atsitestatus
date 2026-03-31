import React, { useMemo } from 'react';
import { StatusResult, LogEntry, CheckStatus } from '@/types';
import { calculateGlobalStats, GlobalStats } from '@/services/reportService';

interface SharedReportData {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    startDate: string;
    endDate: string;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string; }> = ({ title, value, description }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center flex-1 min-w-[150px]">
        <div className="text-3xl font-bold text-cyan-400">{value}</div>
        <div className="text-sm text-gray-400 mt-1">{title}</div>
        <div className="text-xs text-gray-500 mt-1 truncate">{description}</div>
    </div>
);

const getStatusColor = (status: CheckStatus) => {
    if (status === CheckStatus.ONLINE) return 'text-[#34C759]';
    if (status === CheckStatus.OFFLINE) return 'text-[#FF3B30]';
    if (status === CheckStatus.ERROR) return 'text-[#FF9500]';
    return 'text-[var(--apple-text-secondary)]';
};

const SharedReportPage: React.FC<{ data: SharedReportData }> = ({ data }) => {
    const { sites, logs, startDate, endDate } = data;

    const stats: GlobalStats = useMemo(() => {
        return calculateGlobalStats(sites, logs, startDate, endDate);
    }, [sites, logs, startDate, endDate]);
    
    const period = startDate || endDate 
        ? `Período: ${startDate ? new Date(startDate).toLocaleString() : 'Início'} até ${endDate ? new Date(endDate).toLocaleString() : 'Fim'}`
        : 'Todo o Período';

    return (
        <div className="min-h-screen bg-[var(--apple-bg)] text-[var(--apple-text)] font-sans selection:bg-[var(--apple-accent)]/30">
            <div className="container mx-auto p-6 md:p-12 max-w-7xl">
                <header className="glass apple-card p-10 mb-12 border-none">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0071E3]/20">AT</div>
                                <span className="text-xl font-extrabold tracking-tight">ATSiteStatus</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Relatório de Status de Site</h1>
                            <p className="text-lg font-medium text-[var(--apple-text-secondary)]">Este é um relatório compartilhado de ATSiteStatus.</p>
                            <p className="text-sm font-bold text-[var(--apple-accent)] mt-2 uppercase tracking-widest">{period}</p>
                        </div>
                        <div className="text-right">
                             <a href="/" className="apple-button py-3 px-8 text-sm font-bold shadow-xl shadow-[var(--apple-accent)]/20 inline-block">
                                Acessar Painel
                            </a>
                        </div>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="glass apple-card p-8 border-none">
                        <div className="text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2">Uptime Médio</div>
                        <div className="text-4xl font-extrabold text-[#34C759]">{stats.globalAvgUptime.toFixed(2)}%</div>
                        <div className="text-xs font-medium text-[var(--apple-text-secondary)] mt-1">Média de todos os sites</div>
                    </div>
                    <div className="glass apple-card p-8 border-none">
                        <div className="text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2">Total de Incidentes</div>
                        <div className="text-4xl font-extrabold text-[#FF3B30]">{stats.totalIncidents}</div>
                        <div className="text-xs font-medium text-[var(--apple-text-secondary)] mt-1">Somas de todas as quedas</div>
                    </div>
                    <div className="glass apple-card p-8 border-none">
                        <div className="text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2">Latência Média</div>
                        <div className="text-4xl font-extrabold text-[var(--apple-accent)]">{stats.globalAvgLatency.toFixed(0)} ms</div>
                        <div className="text-xs font-medium text-[var(--apple-text-secondary)] mt-1">Média de todos os sites</div>
                    </div>
                </div>

                <div className="glass apple-card p-10 border-none mb-12 overflow-hidden">
                    <h2 className="text-2xl font-extrabold mb-8 tracking-tight">Estatísticas por Site</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--apple-border)]">
                             <thead>
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Site</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Uptime</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Incidentes</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Latência Média</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-[var(--apple-border)]">
                                {stats.siteStats.length > 0 ? (
                                    stats.siteStats.map(s => (
                                        <tr key={s.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[var(--apple-text)]">{s.displayName}</td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[#34C759]">{s.uptime.toFixed(2)}%</td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[#FF3B30]">{s.incidents}</td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[var(--apple-accent)]">{s.avgLatency.toFixed(0)} ms</td>
                                        </tr>
                                    ))
                                ) : (
                                     <tr><td colSpan={4} className="text-center py-20 text-[var(--apple-text-secondary)] font-medium">Nenhum dado de site para o período.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass apple-card p-10 border-none overflow-hidden">
                    <h2 className="text-2xl font-extrabold mb-8 tracking-tight">Logs Consolidados</h2>
                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="min-w-full divide-y divide-[var(--apple-border)]">
                             <thead className="bg-white/30 dark:bg-white/5 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Data e Hora</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Site</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Latência</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Mensagem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--apple-border)]">
                                {stats.filteredLogs.length > 0 ? (
                                    stats.filteredLogs.map((log, index) => (
                                        <tr key={index} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-[var(--apple-text)] opacity-60">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[var(--apple-text)]">{log.displayName}</td>
                                            <td className={`px-8 py-5 whitespace-nowrap text-sm font-bold ${getStatusColor(log.status)}`}>{log.status}</td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[var(--apple-accent)]">{log.latency ?? '—'}</td>
                                            <td className="px-8 py-5 text-sm font-medium text-[var(--apple-text-secondary)]">{log.message}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center py-20 text-[var(--apple-text-secondary)] font-medium">Nenhum log encontrado para o período selecionado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <footer className="mt-12 text-center text-sm font-medium text-[var(--apple-text-secondary)]">
                    &copy; {new Date().getFullYear()} ATSiteStatus. Monitoramento de infraestrutura com precisão.
                </footer>
            </div>
        </div>
    );
};

export default SharedReportPage;

