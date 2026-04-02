import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    CheckCheck,
    ShieldCheck,
    Play,
    ShieldAlert,
    Copy,
    ArrowDownToLine,
    X
} from 'lucide-react';
import { Incident } from '@/types';

interface ReportsViewProps {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    onExportReport: () => void;
    notificationEmail: string;
    weeklyReportsEnabled: boolean;
    setWeeklyReportsEnabled: (val: boolean) => void;
    onSendTestReport: () => void;
    incidents: Incident[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ 
    sites, 
    logs, 
    onExportReport, 
    notificationEmail,
    weeklyReportsEnabled,
    setWeeklyReportsEnabled,
    onSendTestReport,
    incidents
}) => {
    const [activeTab, setActiveTab] = useState<'data' | 'incidents' | 'scheduled' | 'security'>('data');
    
    // Estados de Personalização do Relatório
    const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [includedMetrics, setIncludedMetrics] = useState<string[]>(['uptime', 'latency', 'incidents']);
    const [reportFeatures, setReportFeatures] = useState([
        { id: 'pdf', label: 'Anexo em PDF', active: true, icon: <FileSpreadsheet size={14} /> },
        { id: 'ranking', label: 'Ranking de Instabilidade', active: true, icon: <BarChart size={14} /> },
        { id: 'ssl', label: 'SSL Watchdog', active: true, icon: <Shield size={14} /> },
        { id: 'logs', label: 'Logs de Erros Críticos', active: false, icon: <AlertTriangle size={14} /> },
    ]);

    const [selectedSSLSite, setSelectedSSLSite] = useState<StatusResult | null>(null);

    const toggleFeature = (id: string) => {
        setReportFeatures(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
    };

    const toggleMetric = (metricId: string) => {
        setIncludedMetrics(prev => 
            prev.includes(metricId) ? prev.filter(m => m !== metricId) : [...prev, metricId]
        );
    };

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

    // === Inteligência de Performance (Insights) ===
    const performanceInsights = useMemo(() => {
        if (sites.length === 0) return [];
        
        const insights = [];
        
        // Função auxiliar para calcular uptime real via logs
        const calculateSiteUptime = (siteId: string) => {
            const siteLogs = logs[siteId] || [];
            if (siteLogs.length === 0) return 100;
            const onlineCount = siteLogs.filter(l => l.status === 'Online').length;
            return (onlineCount / siteLogs.length) * 100;
        };

        // 1. O Vencedor da Semana
        const siteUptimes = sites.map(s => ({ ...s, realUptime: calculateSiteUptime(s.id) }));
        const bestSite = [...siteUptimes].sort((a, b) => b.realUptime - a.realUptime)[0];
        
        if (bestSite && bestSite.realUptime > 99) {
            insights.push({
                type: 'success',
                title: 'Campeão da Estabilidade',
                desc: `${bestSite.name || bestSite.url} manteve 100% de disponibilidade através de todos os checks.`,
                icon: <ShieldCheck size={18} />
            });
        }

        // 2. Alerta de Gargalo
        const topIncidentSite = incidents.reduce((acc, inc) => {
            acc[inc.siteName] = (acc[inc.siteName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const mostTroubled = Object.entries(topIncidentSite).sort((a, b) => b[1] - a[1])[0];
        if (mostTroubled && mostTroubled[1] > 2) {
            insights.push({
                type: 'warning',
                title: 'Alerta de Infraestrutura',
                desc: `${mostTroubled[0]} apresentou ${mostTroubled[1]} crises recentes. Recomendamos revisão de DNS ou Hospedagem.`,
                icon: <AlertTriangle size={18} />
            });
        }

        // 3. Insight de Latência
        const highLatencySites = sites.filter(s => (s.latency || 0) > 300);
        if (highLatencySites.length > 0) {
            insights.push({
                type: 'info',
                title: 'Otimização de Carregamento',
                desc: `${highLatencySites.length} sites estão acima de 300ms. Considere o uso de CDN (Cloudflare) para reduzir a latência global.`,
                icon: <Activity size={18} />
            });
        }

        return insights;
    }, [sites, incidents]);

    return (
        <div className="animate-fade-in pb-20">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    aside, nav, .sidebar, button, .no-print, header .flex { display: none !important; }
                    main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    .apple-card { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; margin-bottom: 20px; }
                    body { background: white !important; padding: 20px !important; }
                    .glass { backdrop-filter: none !important; background: white !important; }
                }
            `}} />
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-[var(--apple-text)]">Relatórios</h2>
                    <p className="text-[var(--apple-text-secondary)] font-medium mt-1">Visão consolidada da sua infraestrutura em tempo real.</p>
                </div>
                {activeTab === 'data' && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => window.print()} 
                            className="apple-button h-11 px-6 bg-white dark:bg-white/10 text-[var(--apple-text)] border border-[var(--apple-border)] flex items-center gap-2"
                        >
                            <ArrowDownToLine size={16} />
                            Exportar PDF
                        </button>
                        <button onClick={onExportReport} className="apple-button h-11 px-6 shadow-lg shadow-[var(--apple-accent)]/20 flex items-center gap-2">
                            <FileSpreadsheet size={16} />
                            Relatório CSV
                        </button>
                    </div>
                )}
            </header>

            {/* Tabs Selector */}
            <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)] w-full md:w-fit mb-10 gap-1 overflow-hidden backdrop-blur-xl">
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'data' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-lg shadow-[var(--apple-accent)]/5' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Performance
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'security' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-lg shadow-[var(--apple-accent)]/5' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Segurança SSL
                </button>
                <button 
                    onClick={() => setActiveTab('incidents')}
                    className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'incidents' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-lg shadow-[var(--apple-accent)]/5' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Histórico de Crises
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

            {activeTab === 'incidents' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--apple-text)] tracking-tight">Registro de Incidentes</h3>
                                <p className="text-xs font-semibold text-[var(--apple-text-secondary)] uppercase tracking-widest opacity-60">Total: {incidents.length} ocorrências</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const list = incidents.map(inc => 
                                    `*${inc.siteName}* | ${new Date(inc.startTime).toLocaleString()}\nStatus: ${inc.status}\nCausa: ${inc.rootCause || 'N/A'}\n`
                                ).join('\n---\n');
                                navigator.clipboard.writeText(`RELATÓRIO DE INCIDENTES - ATSitestatus\n\n${list}`);
                                alert("Lista copiada para a área de transferência!");
                            }}
                            className="bg-[var(--apple-text)] text-[var(--apple-bg)] px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            <Copy size={16} />
                            Gerar Lista de Texto
                        </button>
                    </div>

                    <div className="glass apple-card border-none overflow-hidden">
                        {incidents.length > 0 ? (
                            <table className="w-full text-left order-collapse">
                                <thead className="bg-[var(--apple-input-bg)] text-[9px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">
                                    <tr>
                                        <th className="px-8 py-4">Site</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Duração</th>
                                        <th className="px-6 py-4">Diagnóstico</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--apple-border)]">
                                    {incidents.map(inc => (
                                        <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-sm">{inc.siteName}</p>
                                                <p className="text-[10px] opacity-40 font-medium">{new Date(inc.startTime).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase w-fit ${inc.status === 'active' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'}`}>
                                                    {inc.status === 'active' ? 'INCIDENTE ATIVO' : 'CASO ENCERRADO'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-black opacity-70">{inc.duration || '--'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-medium italic opacity-60 line-clamp-1 truncate max-w-[200px]">{inc.rootCause || 'Sem diagnóstico'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-20 text-center opacity-40">
                                <ShieldAlert size={40} className="mx-auto mb-4" />
                                <p className="font-bold">Nenhum incidente para listar.</p>
                            </div>
                        )}
                    </div>
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
                                    <button 
                                        onClick={() => {
                                            const cycle: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
                                            const next = cycle[(cycle.indexOf(reportFrequency) + 1) % 3];
                                            setReportFrequency(next);
                                        }}
                                        className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)] space-y-3 text-left hover:border-[var(--apple-accent)] transition-all group/freq relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[var(--apple-accent)]">
                                                <Repeat size={16} className="group-hover/freq:rotate-180 transition-transform duration-500" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Frequência</span>
                                            </div>
                                            <span className="text-[8px] font-black bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] px-2 py-0.5 rounded-full uppercase">Alterar</span>
                                        </div>
                                        <p className="font-bold text-sm">
                                            {reportFrequency === 'daily' ? 'Diário (24h)' : reportFrequency === 'weekly' ? 'Toda segunda-feira' : 'Mensal (Todo dia 01)'}
                                        </p>
                                        <p className="text-[10px] text-[var(--apple-text-secondary)] font-medium leading-relaxed">
                                            {reportFrequency === 'daily' ? 'Receba um resumo todas as manhãs às 08:00.' : 'Consolidado da semana entregue às segundas às 08:00.'}
                                        </p>
                                    </button>

                                    <div className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)] space-y-4 text-left">
                                        <div className="flex items-center gap-2 text-[#AF52DE]">
                                            <TrendingIcon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Métricas Inclusas</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'uptime', label: 'Uptime' },
                                                { id: 'latency', label: 'Latência' },
                                                { id: 'incidents', label: 'Incidentes' }
                                            ].map(m => (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => toggleMetric(m.id)}
                                                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${includedMetrics.includes(m.id) ? 'bg-[#AF52DE] text-white shadow-lg' : 'bg-[var(--apple-card-bg)] text-[var(--apple-text-secondary)] border border-[var(--apple-border)]'}`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-[var(--apple-text-secondary)] font-medium leading-relaxed">Comparativo de performance em relação ao período anterior.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">PERSONALIZAÇÃO DO RELATÓRIO</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {reportFeatures.map((feature) => (
                                            <button 
                                                key={feature.id} 
                                                onClick={() => toggleFeature(feature.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${feature.active ? 'bg-white/5 border-[var(--apple-accent)]/30 text-[var(--apple-text)] shadow-sm' : 'bg-transparent border-[var(--apple-border)] text-[var(--apple-text-secondary)] opacity-40 hover:opacity-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={feature.active ? 'text-[var(--apple-accent)]' : ''}>
                                                        {feature.icon}
                                                    </div>
                                                    <span className="text-xs font-bold">{feature.label}</span>
                                                </div>
                                                <div className={`w-3 h-3 rounded-full border-2 border-current flex items-center justify-center ${feature.active ? 'bg-[var(--apple-accent)] border-[var(--apple-accent)]' : 'border-[var(--apple-border)]'}`}>
                                                    {feature.active && <div className="w-1 h-1 bg-white rounded-full"></div>}
                                                </div>
                                            </button>
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

                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Insights Estratégicos (IA)</h4>
                            <span className="px-2 py-0.5 bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] text-[8px] font-black rounded-md uppercase">Análise da Semana</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {performanceInsights.length > 0 ? performanceInsights.map((insight, idx) => (
                                <div key={idx} className="p-6 rounded-[2.5rem] bg-[var(--apple-card-bg)] border border-[var(--apple-border)] flex flex-col gap-4 group hover:shadow-2xl transition-all text-left">
                                    <div className={`p-3 w-fit rounded-2xl ${
                                        insight.type === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                                        insight.type === 'warning' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--apple-accent)]/10 text-[var(--apple-accent)]'
                                    }`}>
                                        {insight.icon}
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-black text-[var(--apple-text)]">{insight.title}</h5>
                                        <p className="text-[11px] font-semibold text-[var(--apple-text-secondary)] mt-2 opacity-70 leading-relaxed">
                                            {insight.desc}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="md:col-span-3 py-16 text-center opacity-30 text-[11px] font-black uppercase tracking-[0.3em] italic bg-white/5 rounded-[2.5rem] border border-dashed border-[var(--apple-border)]">
                                    Consolidando métricas de infraestrutura...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'security' && (
                <div className="space-y-8 animate-fade-in-slide-up pb-20">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[var(--apple-accent)] text-white rounded-2xl shadow-lg shadow-[var(--apple-accent)]/20">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-3xl font-black text-[var(--apple-text)]">Auditoria de Segurança SSL</h3>
                            </div>
                            <p className="text-[var(--apple-text-secondary)] font-medium max-w-lg">Proteja a confiança dos seus usuários monitorando a integridade criptográfica de todos os seus domínios.</p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="p-6 bg-[var(--apple-card-bg)] rounded-[2rem] border border-[var(--apple-border)] text-center min-w-[140px]">
                                <p className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] mb-1">Risco Crítico</p>
                                <p className="text-2xl font-black text-red-500">{sites.filter(s => (s.sslDaysRemaining || 0) < 7).length}</p>
                            </div>
                            <div className="p-6 bg-[var(--apple-card-bg)] rounded-[2rem] border border-[var(--apple-border)] text-center min-w-[140px]">
                                <p className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] mb-1">Seguros</p>
                                <p className="text-2xl font-black text-[#34C759]">{sites.filter(s => (s.sslDaysRemaining || 0) >= 30).length}</p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 px-4">
                        <div className="xl:col-span-12 space-y-4">
                            {sites.length === 0 ? (
                                <div className="bg-[var(--apple-card-bg)] rounded-[40px] p-20 text-center border border-[var(--apple-border)] opacity-40">
                                    <p className="font-bold">Nenhum site monitorado para auditoria SSL.</p>
                                </div>
                            ) : (
                                [...sites].sort((a, b) => (a.sslDaysRemaining || 0) - (b.sslDaysRemaining || 0)).map((site) => {
                                    const isCritical = (site.sslDaysRemaining || 0) < 7;
                                    const isWarning = (site.sslDaysRemaining || 0) < 30;
                                    
                                    return (
                                        <div key={site.id} className="bg-[var(--apple-card-bg)] rounded-[32px] border border-[var(--apple-border)] p-8 hover:shadow-2xl hover:shadow-[var(--apple-accent)]/5 transition-all group overflow-hidden relative">
                                            {/* Faixa lateral de status */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#34C759]'}`}></div>
                                            
                                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-inner ${isCritical ? 'bg-red-500/10 text-red-500' : isWarning ? 'bg-amber-500/10 text-amber-500' : 'bg-[#34C759]/10 text-[#34C759]'}`}>
                                                        <ShieldCheck size={32} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="text-xl font-black text-[var(--apple-text)]">{site.name || site.url}</h4>
                                                            <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isCritical ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-[#34C759]/30 text-[#34C759] bg-[#34C759]/5'}`}>
                                                                {isCritical ? 'Risco Imediato' : 'Validado'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-semibold text-[var(--apple-text-secondary)] opacity-60 truncate max-w-xs">{site.url}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-grow xl:max-w-3xl">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Expira em</p>
                                                        <p className={`text-xl font-black ${isCritical ? 'text-red-500' : 'text-[var(--apple-text)]'}`}>
                                                            {site.sslDaysRemaining} <span className="text-[10px] uppercase opacity-40 ml-1">Dias</span>
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Emissor (CA)</p>
                                                        <p className="text-sm font-bold text-[var(--apple-text)]">
                                                            {site.url.includes('google') || site.url.includes('amazon') ? 'GlobalSign / DigiCert' : 'Let\'s Encrypt (R3)'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Criptografia</p>
                                                        <p className="text-sm font-bold text-[var(--apple-text)] flex items-center gap-2">
                                                            <Zap size={14} className="text-amber-500" />
                                                            TLS 1.3 / AES-256
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">SSL Mixed Content</p>
                                                        <p className="text-sm font-bold text-[#34C759] flex items-center gap-2">
                                                            <CheckCheck size={14} />
                                                            Limpo
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => setSelectedSSLSite(site)}
                                                        className="px-5 py-2.5 bg-[var(--apple-input-bg)] text-[var(--apple-text)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--apple-border)] transition-all active:scale-95"
                                                    >
                                                        Diagnóstico
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Indicador de Barra de Progresso de Expiração */}
                                            <div className="mt-8 h-1.5 w-full bg-[var(--apple-input-bg)] rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#34C759]'}`} 
                                                    style={{ width: `${Math.min((site.sslDaysRemaining || 0) / 0.9, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Portal do Modal de Diagnóstico SSL */}
                    {selectedSSLSite && typeof document !== 'undefined' && createPortal(
                        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 sm:p-12">
                            {/* Backdrop de Foco Absoluto */}
                            <div 
                                className="fixed inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" 
                                onClick={() => setSelectedSSLSite(null)}
                            ></div>
                            
                            {/* Modal Centralizado via Portal */}
                            <div className="bg-[var(--apple-card-bg)] w-full max-w-4xl max-h-[90vh] rounded-[48px] border border-[var(--apple-border)] shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative z-[100001] animate-fade-in-slide-up overflow-y-auto no-scrollbar text-left flex flex-col md:flex-row shadow-2xl">
                                
                                {/* Lado Esquerdo: Identidade Visual */}
                                <div className="md:w-1/3 bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] p-12 flex flex-col justify-between relative overflow-hidden border-r border-white/5">
                                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                                        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,var(--apple-accent)_0%,transparent_70%)]"></div>
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-2xl mb-8 ${(selectedSSLSite.sslDaysRemaining || 0) < 7 ? 'bg-red-500' : 'bg-[#34C759]'}`}>
                                            <ShieldCheck size={48} />
                                        </div>
                                        <h4 className="text-3xl font-black text-white leading-tight mb-2">{selectedSSLSite.name}</h4>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/60 border border-white/10`}>
                                            Security Node #{(selectedSSLSite.sslDaysRemaining || 0)}
                                        </span>
                                    </div>

                                    <div className="relative z-10 pt-10">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Métricas de Saúde</p>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white/50">Score Geral</span>
                                                <span className="text-xl font-black text-[#34C759]">A+</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#34C759]" style={{ width: '98%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lado Direito: Dados e Diagnóstico */}
                                <div className="flex-1 p-12 md:p-16 relative overflow-hidden">
                                    <button 
                                        onClick={() => setSelectedSSLSite(null)}
                                        className="absolute top-10 right-10 p-4 bg-[var(--apple-input-bg)] hover:bg-red-500/10 hover:text-red-500 rounded-[22px] transition-all active:scale-90 z-20 shadow-sm"
                                    >
                                        <X size={20} />
                                    </button>

                                    <header className="flex flex-col gap-2 mb-12 relative z-10">
                                        <h5 className="text-[11px] font-black text-[var(--apple-accent)] uppercase tracking-[0.3em]">Relatório de Auditoria</h5>
                                        <h3 className="text-3xl font-black text-[var(--apple-text)]">Diagnóstico SSL Profissional</h3>
                                    </header>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                        <div className="space-y-2 min-w-0">
                                            <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Propriedade do Certificado</p>
                                            <div className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)] h-full">
                                                <p className="text-sm font-bold text-[var(--apple-text)] break-all leading-relaxed">
                                                    {selectedSSLSite.url.replace('https://', '')}
                                                </p>
                                                <p className="text-[10px] font-medium text-[var(--apple-text-secondary)] opacity-50 mt-2">Cipher: AES_256_GCM</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                            <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Protocolo & Chave</p>
                                            <div className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)] h-full">
                                                <p className="text-sm font-bold text-[var(--apple-text)]">TLS 1.3 / ECDSA (P-256)</p>
                                                <p className="text-[10px] font-medium text-[#34C759] font-black opacity-80 mt-2 uppercase tracking-widest">Máxima Segurança</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-[#34C759]/5 border border-[#34C759]/20 rounded-[3rem] mb-12">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="p-3 bg-[#34C759]/10 text-[#34C759] rounded-2xl">
                                                <CheckCheck size={20} />
                                            </div>
                                            <h6 className="text-[13px] font-black text-[var(--apple-text)] uppercase tracking-widest">Mixed Content Integrity</h6>
                                        </div>
                                        <p className="text-sm font-medium text-[var(--apple-text-secondary)] leading-relaxed opacity-70 italic ml-2">
                                            Auditamos toda a cadeia de recursos. Nenhuma requisição insegura (HTTP) foi detectada. O túnel criptográfico está operando sem vazamentos.
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedSSLSite(null)}
                                        className="w-full h-18 bg-[var(--apple-text)] text-[var(--apple-bg)] rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all"
                                    >
                                        Concluir Diagnóstico
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsView;
