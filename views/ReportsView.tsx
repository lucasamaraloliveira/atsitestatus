import React, { useMemo, useState } from 'react';
import { CheckStatus, StatusResult, LogEntry } from '@/types';
import StatusPieChart from '@/components/StatusPieChart';
import { 
    TrendingUp, 
    Activity, 
    Clock, 
    AlertTriangle, 
    Shield, 
    Zap, 
    Globe, 
    ArrowUpRight, 
    FileSpreadsheet,
    BarChart3,
    Calendar,
    Repeat,
    TrendingUp as TrendingIcon,
    BarChart,
    Mail,
    Bell,
    ChevronDown,
    Play
} from 'lucide-react';

interface ReportsViewProps {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    onExportReport: () => void;
    notificationEmail: string;
    weeklyReportsEnabled: boolean;
    setWeeklyReportsEnabled: (val: boolean) => void;
    onSendTestReport: () => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ 
    sites, 
    logs, 
    onExportReport, 
    notificationEmail,
    weeklyReportsEnabled,
    setWeeklyReportsEnabled,
    onSendTestReport
}) => {
    const [activeTab, setActiveTab] = useState<'data' | 'scheduled'>('data');

    // === Computed Stats ===
    const stats = useMemo(() => {
        const allLogs = Object.values(logs).flat();
        const totalSites = sites.length;
        const onlineSites = sites.filter(s => s.status === CheckStatus.ONLINE).length;
        const offlineSites = sites.filter(s => s.status === CheckStatus.OFFLINE).length;
        const checkingSites = sites.filter(s => s.status === CheckStatus.CHECKING).length;
        const errorSites = sites.filter(s => s.status === CheckStatus.ERROR).length;

        // Global uptime
        const onlineLogs = allLogs.filter(l => l.status === CheckStatus.ONLINE).length;
        const globalUptime = allLogs.length > 0 ? (onlineLogs / allLogs.length) * 100 : 100;

        // Average latency
        const latencies = allLogs.map(l => l.latency).filter((l): l is number => l !== undefined);
        const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
        const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
        const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;

        // Incidents count (transitions to non-online)
        let totalIncidents = 0;
        for (const siteId of Object.keys(logs)) {
            const siteLogs = logs[siteId];
            for (let i = 1; i < siteLogs.length; i++) {
                if (siteLogs[i - 1].status === CheckStatus.ONLINE && siteLogs[i].status !== CheckStatus.ONLINE) {
                    totalIncidents++;
                }
            }
        }

        // Status distribution for pie chart
        const statusDistribution: Record<string, number> = {};
        if (onlineSites > 0) statusDistribution[CheckStatus.ONLINE] = onlineSites;
        if (offlineSites > 0) statusDistribution[CheckStatus.OFFLINE] = offlineSites;
        if (checkingSites > 0) statusDistribution[CheckStatus.CHECKING] = checkingSites;
        if (errorSites > 0) statusDistribution[CheckStatus.ERROR] = errorSites;

        // Per-site stats
        const siteStats = sites.map(site => {
            const siteLogs = logs[site.id] || [];
            const siteOnline = siteLogs.filter(l => l.status === CheckStatus.ONLINE).length;
            const siteUptime = siteLogs.length > 0 ? (siteOnline / siteLogs.length) * 100 : 100;
            const siteLatencies = siteLogs.map(l => l.latency).filter((l): l is number => l !== undefined);
            const siteAvgLatency = siteLatencies.length > 0 ? siteLatencies.reduce((a, b) => a + b, 0) / siteLatencies.length : 0;

            let siteIncidents = 0;
            for (let i = 1; i < siteLogs.length; i++) {
                if (siteLogs[i - 1].status === CheckStatus.ONLINE && siteLogs[i].status !== CheckStatus.ONLINE) {
                    siteIncidents++;
                }
            }

            return {
                id: site.id,
                name: site.name || site.url,
                url: site.url,
                status: site.status,
                uptime: siteUptime,
                avgLatency: siteAvgLatency,
                incidents: siteIncidents,
                totalChecks: siteLogs.length,
            };
        }).sort((a, b) => a.uptime - b.uptime);

        const now = Date.now();
        const last24h = now - 24 * 60 * 60 * 1000;
        const recentLogs = allLogs.filter(l => l.timestamp >= last24h);
        
        const hourlyBuckets: { hour: string; avgLatency: number; count: number }[] = [];
        for (let i = 23; i >= 0; i--) {
            const bucketStart = now - (i + 1) * 60 * 60 * 1000;
            const bucketEnd = now - i * 60 * 60 * 1000;
            const bucketLogs = recentLogs.filter(l => l.timestamp >= bucketStart && l.timestamp < bucketEnd);
            const bucketLatencies = bucketLogs.map(l => l.latency).filter((l): l is number => l !== undefined);
            const avg = bucketLatencies.length > 0 ? bucketLatencies.reduce((a, b) => a + b, 0) / bucketLatencies.length : 0;
            const hour = new Date(bucketEnd).getHours();
            hourlyBuckets.push({ hour: `${hour}h`, avgLatency: avg, count: bucketLogs.length });
        }

        return {
            totalSites, onlineSites, offlineSites, checkingSites, errorSites,
            globalUptime, avgLatency, maxLatency, minLatency,
            totalIncidents, statusDistribution, siteStats,
            totalLogs: allLogs.length, hourlyBuckets
        };
    }, [sites, logs]);

    const getUptimeColor = (uptime: number) => {
        if (uptime >= 99) return '#34C759';
        if (uptime >= 95) return '#007AFF';
        if (uptime >= 90) return '#FF9500';
        return '#FF3B30';
    };

    const getStatusColor = (status: CheckStatus) => {
        if (status === CheckStatus.ONLINE) return '#34C759';
        if (status === CheckStatus.CHECKING) return '#007AFF';
        if (status === CheckStatus.ERROR) return '#FF9500';
        return '#FF3B30';
    };

    const maxBucketLatency = Math.max(...stats.hourlyBuckets.map(b => b.avgLatency), 1);

    return (
        <div className="animate-fade-in pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-[var(--apple-text)]">Relatórios</h2>
                    <p className="text-[var(--apple-text-secondary)] font-medium mt-1">Visão consolidada da sua infraestrutura em tempo real.</p>
                </div>
                {activeTab === 'data' && (
                    <button onClick={onExportReport} className="apple-button h-11 px-6 shadow-lg shadow-[var(--apple-accent)]/20 flex items-center gap-2">
                        <FileSpreadsheet size={16} />
                        Exportar Relatório
                    </button>
                )}
            </header>

            {/* Tabs Selector */}
            <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)] w-full md:w-fit mb-10 gap-1 overflow-hidden backdrop-blur-xl">
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'data' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-lg shadow-[var(--apple-accent)]/5' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Performance Global
                </button>
                <button 
                    onClick={() => setActiveTab('scheduled')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'scheduled' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-lg shadow-[var(--apple-accent)]/5' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Resumo Semanal
                </button>
            </div>

            {activeTab === 'data' && (
                <div className="animate-fade-in space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="glass apple-card p-6 md:p-8 border-none relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 opacity-[0.04] pointer-events-none">
                                <Shield size={100} />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-xl" style={{ backgroundColor: `${getUptimeColor(stats.globalUptime)}15` }}>
                                    <Shield size={14} style={{ color: getUptimeColor(stats.globalUptime) }} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Uptime</span>
                            </div>
                            <p className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: getUptimeColor(stats.globalUptime) }}>
                                {stats.globalUptime.toFixed(1)}%
                            </p>
                            <p className="text-[11px] font-medium text-[var(--apple-text-secondary)] mt-2">{stats.totalLogs} verificações</p>
                        </div>

                        <div className="glass apple-card p-6 md:p-8 border-none relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 opacity-[0.04] pointer-events-none">
                                <Zap size={100} />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-xl bg-[#007AFF]/10">
                                    <Zap size={14} className="text-[#007AFF]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Latência Média</span>
                            </div>
                            <p className="text-3xl md:text-4xl font-black tracking-tight text-[var(--apple-text)]">
                                {stats.avgLatency.toFixed(0)}<span className="text-lg opacity-40">ms</span>
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-bold text-[#34C759]">↓{stats.minLatency}ms</span>
                                <span className="text-[10px] font-bold text-[#FF3B30]">↑{stats.maxLatency}ms</span>
                            </div>
                        </div>

                        <div className="glass apple-card p-6 md:p-8 border-none relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 opacity-[0.04] pointer-events-none">
                                <AlertTriangle size={100} />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-xl bg-[#FF9500]/10">
                                    <AlertTriangle size={14} className="text-[#FF9500]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Incidentes</span>
                            </div>
                            <p className="text-3xl md:text-4xl font-black tracking-tight text-[var(--apple-text)]">
                                {stats.totalIncidents}
                            </p>
                            <p className="text-[11px] font-medium text-[var(--apple-text-secondary)] mt-2">
                                {stats.totalIncidents === 0 ? 'Nenhuma queda detectada' : `Em ${stats.totalSites} sites`}
                            </p>
                        </div>

                        <div className="glass apple-card p-6 md:p-8 border-none relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 opacity-[0.04] pointer-events-none">
                                <Globe size={100} />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-xl bg-[#34C759]/10">
                                    <Globe size={14} className="text-[#34C759]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Sites Online</span>
                            </div>
                            <p className="text-3xl md:text-4xl font-black tracking-tight text-[var(--apple-text)]">
                                {stats.onlineSites}<span className="text-lg opacity-40">/{stats.totalSites}</span>
                            </p>
                            <p className="text-[11px] font-medium text-[var(--apple-text-secondary)] mt-2">
                                {stats.offlineSites > 0 ? `${stats.offlineSites} offline` : 'Todos operacionais'}
                            </p>
                        </div>
                    </div>

                    {/* Chart Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        <div className="lg:col-span-2 glass apple-card p-8 md:p-10 border-none">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-[#5856D6]/10 text-[#5856D6]">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--apple-text)]">Tendência de Latência</h3>
                                        <p className="text-[11px] font-medium text-[var(--apple-text-secondary)]">Últimas 24 horas · média por hora</p>
                                    </div>
                                </div>
                            </div>
                            {stats.totalLogs > 0 ? (
                                <div className="flex items-end gap-[3px] h-[160px] px-1">
                                    {stats.hourlyBuckets.map((bucket, i) => {
                                        const height = maxBucketLatency > 0 ? (bucket.avgLatency / maxBucketLatency) * 100 : 0;
                                        const barColor = bucket.avgLatency === 0 ? 'var(--apple-input-bg)' :
                                            bucket.avgLatency < 200 ? '#34C759' :
                                            bucket.avgLatency < 600 ? '#007AFF' :
                                            bucket.avgLatency < 1500 ? '#FF9500' : '#FF3B30';
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    <div className="bg-[#1C1C1E] text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                                                        {bucket.avgLatency > 0 ? `${bucket.avgLatency.toFixed(0)}ms` : 'Sem dados'}
                                                    </div>
                                                </div>
                                                <div
                                                    className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 min-h-[2px]"
                                                    style={{
                                                        height: `${Math.max(height, 2)}%`,
                                                        backgroundColor: barColor,
                                                        opacity: bucket.avgLatency === 0 ? 0.3 : 1,
                                                    }}
                                                />
                                                {i % 4 === 0 && (
                                                    <span className="text-[8px] font-bold text-[var(--apple-text-secondary)] opacity-50">{bucket.hour}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-[160px] flex items-center justify-center opacity-40">
                                    <p className="text-sm font-medium">Aguardando dados de monitoramento...</p>
                                </div>
                            )}
                        </div>

                        <div className="glass apple-card p-8 md:p-10 border-none">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--apple-text)]">Distribuição</h3>
                                    <p className="text-[11px] font-medium text-[var(--apple-text-secondary)]">Status atual dos sites</p>
                                </div>
                            </div>
                            {stats.totalSites > 0 ? (
                                <div className="space-y-6">
                                    <div className="h-[140px]">
                                        <StatusPieChart data={Object.keys(stats.statusDistribution).length > 0 ? stats.statusDistribution : { [CheckStatus.ONLINE]: 1 }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Online', count: stats.onlineSites, color: '#34C759' },
                                            { label: 'Offline', count: stats.offlineSites, color: '#FF3B30' },
                                            { label: 'Verificando', count: stats.checkingSites, color: '#007AFF' },
                                            { label: 'Erro', count: stats.errorSites, color: '#FF9500' },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-[11px] font-semibold text-[var(--apple-text-secondary)]">
                                                    {item.label} <span className="text-[var(--apple-text)] font-black">{item.count}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center opacity-40">
                                    <p className="text-sm font-medium">Nenhum site monitorado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Site Performance Table */}
                    {stats.siteStats.length > 0 && (
                        <div className="glass apple-card border-none overflow-hidden">
                            <div className="p-8 md:p-10 pb-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-2xl bg-[#007AFF]/10 text-[#007AFF]">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--apple-text)]">Performance por Site</h3>
                                        <p className="text-[11px] font-medium text-[var(--apple-text-secondary)]">Ranking de disponibilidade e latência</p>
                                    </div>
                                </div>
                            </div>
                            {/* Desktop View Table */}
                            <div className="hidden md:block overflow-x-auto no-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-[var(--apple-input-bg)] text-[10px] font-black uppercase tracking-[0.15em] text-[var(--apple-text-secondary)]">
                                            <th className="px-8 md:px-10 py-5">Site</th>
                                            <th className="px-6 py-5">Status</th>
                                            <th className="px-6 py-5">Uptime</th>
                                            <th className="px-6 py-5">Latência</th>
                                            <th className="px-6 py-5">Incidentes</th>
                                            <th className="px-6 py-5">Checks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--apple-border)]">
                                        {stats.siteStats.map((site) => (
                                            <tr key={site.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-8 md:px-10 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Globe size={16} className="text-[var(--apple-text-secondary)] shrink-0" />
                                                        <span className="font-bold text-sm text-[var(--apple-text)] truncate max-w-[200px]">{site.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(site.status) }} />
                                                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: getStatusColor(site.status) }}>
                                                            {site.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-[var(--apple-input-bg)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-1000"
                                                                style={{
                                                                    width: `${site.uptime}%`,
                                                                    backgroundColor: getUptimeColor(site.uptime),
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-black" style={{ color: getUptimeColor(site.uptime) }}>
                                                            {site.uptime.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-black text-[var(--apple-text)]">
                                                        {site.avgLatency.toFixed(0)}<span className="text-[10px] opacity-40 ml-0.5">ms</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-sm font-black ${site.incidents > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                                                        {site.incidents}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-[var(--apple-text-secondary)]">{site.totalChecks}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View Grid (Estilo Filtros/Cards) */}
                            <div className="md:hidden p-4 space-y-4">
                                {stats.siteStats.map((site) => (
                                    <div key={site.id} className="p-5 bg-[var(--apple-input-bg)] rounded-3xl border border-[var(--apple-border)] space-y-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white/5 rounded-2xl text-[var(--apple-text-secondary)]">
                                                    <Globe size={18} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-sm text-[var(--apple-text)] truncate max-w-[160px]">{site.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(site.status) }} />
                                                        <span className="text-[9px] font-black uppercase tracking-wider opacity-60" style={{ color: getStatusColor(site.status) }}>
                                                            {site.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-[var(--apple-text)]">{site.uptime.toFixed(1)}%</span>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] opacity-50">Uptime</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-3 bg-white/5 rounded-2xl text-center">
                                                <p className="text-[14px] font-black">{site.avgLatency.toFixed(0)}ms</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Latência</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-2xl text-center">
                                                <p className={`text-[14px] font-black ${site.incidents > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>{site.incidents}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Quedas</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-2xl text-center">
                                                <p className="text-[14px] font-black opacity-60">{site.totalChecks}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Checks</p>
                                            </div>
                                        </div>

                                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full transition-all duration-1000"
                                                style={{ 
                                                    width: `${site.uptime}%`,
                                                    backgroundColor: getUptimeColor(site.uptime)
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {stats.totalSites === 0 && (
                        <div className="glass apple-card py-20 text-center border-none shadow-xl">
                            <BarChart3 size={48} className="mx-auto mb-4 text-[var(--apple-text-secondary)] opacity-30" />
                            <h3 className="text-xl font-black text-[var(--apple-text)]">Sem dados para exibir</h3>
                            <p className="text-[var(--apple-text-secondary)] text-sm mt-2">
                                Adicione sites ao monitoramento para gerar relatórios dinâmicos.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'scheduled' && (
                <div className="space-y-8 animate-fade-in">
                    <section className="glass apple-card p-6 md:p-10 border-none space-y-10 relative group">
                        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--apple-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] rounded-2xl transition-transform group-hover:scale-110 shrink-0">
                                    <Calendar size={24} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-[var(--apple-text)] truncate">Resumo Semanal Automático</h3>
                                    <p className="text-[var(--apple-text-secondary)] text-sm font-medium leading-tight">Relatórios executivos entregues toda segunda-feira.</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 bg-[var(--apple-input-bg)] sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-[var(--apple-border)] sm:border-none">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Status do Serviço</span>
                                <button 
                                    onClick={() => setWeeklyReportsEnabled(!weeklyReportsEnabled)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-500 focus:outline-none ${weeklyReportsEnabled ? 'bg-[#34C759] shadow-[0_0_20px_#34C759]/30' : 'bg-gray-300 dark:bg-gray-700 shadow-inner'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${weeklyReportsEnabled ? 'translate-x-6 shadow-md' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)] space-y-3">
                                        <div className="flex items-center gap-2 text-[var(--apple-accent)]">
                                            <Repeat size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Frequência</span>
                                        </div>
                                        <p className="font-bold text-sm">Toda segunda-feira</p>
                                        <p className="text-[10px] text-[var(--apple-text-secondary)] font-medium leading-relaxed">Você receberá o consolidado da semana às 08:00 AM.</p>
                                    </div>
                                    <div className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)] space-y-3">
                                        <div className="flex items-center gap-2 text-[#AF52DE]">
                                            <TrendingIcon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Métricas Inclusas</span>
                                        </div>
                                        <p className="font-bold text-sm">Uptime, Latência e Incidentes</p>
                                        <p className="text-[10px] text-[var(--apple-text-secondary)] font-medium leading-relaxed">Comparativo de performance em relação aos 7 dias anteriores.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">PERSONALIZAÇÃO DO RELATÓRIO</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { label: 'Anexo em PDF', active: true, icon: <FileSpreadsheet size={14} /> },
                                            { label: 'Ranking de Instabilidade', active: true, icon: <BarChart size={14} /> },
                                            { label: 'SSL Watchdog', active: true, icon: <Shield size={14} /> },
                                            { label: 'Logs de Erros Críticos', active: false, icon: <AlertTriangle size={14} /> },
                                        ].map((feature, i) => (
                                            <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${feature.active ? 'bg-white/5 border-[var(--apple-accent)]/30 text-[var(--apple-text)]' : 'bg-transparent border-[var(--apple-border)] text-[var(--apple-text-secondary)] opacity-40'}`}>
                                                <div className="flex items-center gap-3">
                                                    {feature.icon}
                                                    <span className="text-xs font-bold">{feature.label}</span>
                                                </div>
                                                <div className={`w-1.5 h-1.5 rounded-full ${feature.active ? 'bg-[var(--apple-accent)]' : 'bg-transparent border border-white/20'}`}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-[var(--apple-text)] text-[var(--apple-bg)] rounded-[2.5rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group/card min-h-[320px]">
                                <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 transition-transform group-hover/card:scale-175 duration-700">
                                    <FileSpreadsheet size={120} />
                                </div>
                                
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Simulação do Resumo</p>
                                    <h4 className="text-2xl font-black leading-tight">Envie um relatório de teste agora.</h4>
                                    <p className="text-xs font-medium mt-4 opacity-70 leading-relaxed">Valide como os dados serão apresentados no e-mail definido para {notificationEmail || 'sua conta'}.</p>
                                </div>

                                <button 
                                    onClick={onSendTestReport}
                                    id="test-report-reports-btn"
                                    className="relative z-10 w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                >
                                    Disparar Teste
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-[var(--apple-border)] rounded-[2.5rem] bg-white/[0.02]">
                        <div className="text-center space-y-2">
                            <p className="text-sm font-bold text-[var(--apple-text-secondary)]">Insights de Performance em Breve</p>
                            <p className="text-[10px] font-medium text-[var(--apple-text-secondary)] opacity-60 italic">Estamos treinando nossos modelos para prever quedas antes que elas aconteçam.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
