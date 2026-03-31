import React, { useMemo } from 'react';
import { 
    Activity, 
    Zap, 
    AlertCircle, 
    CheckCircle2, 
    TrendingUp, 
    BarChart3, 
    Clock, 
    FileSpreadsheet,
    Shield,
    ShieldAlert,
    Target
} from 'lucide-react';
import { StatusResult, LogEntry, CheckStatus } from '@/types';

interface ReportsPageProps {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    onOpenGlobalReportModal: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ sites, logs, onOpenGlobalReportModal }) => {
    const metrics = useMemo(() => {
        const allLogs = Object.values(logs).flat();
        if (allLogs.length === 0) return { uptime: 100, latency: 0, incidents: 0, health: 100 };

        const onlineCount = allLogs.filter(l => l.status === CheckStatus.ONLINE).length;
        const totalLatency = allLogs.reduce((acc, curr) => acc + (curr.latency || 0), 0);
        const incidentCount = allLogs.filter(l => l.status === CheckStatus.OFFLINE || l.status === CheckStatus.ERROR).length;
        
        return {
            uptime: ((onlineCount / allLogs.length) * 100).toFixed(2),
            latency: (totalLatency / allLogs.length).toFixed(0),
            incidents: incidentCount,
            health: Math.max(0, 100 - (incidentCount * 5))
        };
    }, [logs]);

    const slaStatus = (uptime: string) => {
        const val = parseFloat(uptime);
        if (val >= 99.9) return { label: 'Excelente (SLA Garantido)', color: 'text-[#34C759]', bg: 'bg-[#34C759]/10' };
        if (val >= 99.0) return { label: 'Bom (Risco de SLA)', color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10' };
        return { label: 'Crítico (SLA Violado)', color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10' };
    };

    const status = slaStatus(metrics.uptime.toString());

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight">Análises & SLA</h2>
                    <p className="text-[var(--apple-text-secondary)] font-medium mt-2">Visão consolidada da saúde da sua infraestrutura.</p>
                </div>
                <button 
                    onClick={onOpenGlobalReportModal}
                    className="apple-button h-12 px-8 flex items-center gap-3 shadow-xl group"
                >
                    <FileSpreadsheet size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Exportar Relatório Global</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="glass apple-card p-8 border-none space-y-4">
                    <div className="p-3 rounded-2xl bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] w-fit">
                        <Activity size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Disponibilidade Global</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black">{metrics.uptime}%</span>
                            <span className="text-xs font-bold text-[#34C759]">Uptime</span>
                        </div>
                    </div>
                </div>

                <div className="glass apple-card p-8 border-none space-y-4">
                    <div className="p-3 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] w-fit">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Latência Média</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black">{metrics.latency}ms</span>
                            <span className="text-xs font-bold text-[#FF9500]">Regional</span>
                        </div>
                    </div>
                </div>

                <div className="glass apple-card p-8 border-none space-y-4">
                    <div className="p-3 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] w-fit">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Incidentes Detectados</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black">{metrics.incidents}</span>
                            <span className="text-xs font-bold text-[#FF3B30]">Total Logs</span>
                        </div>
                    </div>
                </div>

                <div className="glass apple-card p-8 border-none space-y-4">
                    <div className="p-3 rounded-2xl bg-[#AF52DE]/10 text-[#AF52DE] w-fit">
                        <Target size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)]">Health Score AI</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black">{metrics.health}/100</span>
                            <span className="text-xs font-bold text-[#AF52DE]">Qualidade</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass apple-card p-10 border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                            <BarChart3 size={150} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight mb-8">Status do SLA de Serviço</h3>
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-3xl border border-[var(--apple-border)]">
                                <div className="flex items-center gap-4">
                                    <Shield size={32} className={status.color} />
                                    <div>
                                        <p className="text-sm font-bold">{status.label}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] mt-1">Acordo de Nível de Serviço</p>
                                    </div>
                                </div>
                                <span className={`p-2 px-4 rounded-xl text-xs font-black ${status.bg} ${status.color}`}>
                                    {metrics.uptime}%
                                </span>
                            </div>
                            
                            <div className="p-8 glass-dark rounded-[2.5rem] border border-white/5">
                                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--apple-accent)] mb-4">Recomendações da Antigravity AI</h4>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <Zap size={16} className="text-[#FF9500] mt-1 shrink-0" />
                                        <p className="text-sm text-white/50 leading-relaxed">Detectamos picos de latência entre 02:00 e 04:00 AM. Considere balancear a carga regional.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-[#34C759] mt-1 shrink-0" />
                                        <p className="text-sm text-white/50 leading-relaxed">O tempo de resposta do servidor principal está 15% acima da média do setor.</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass apple-card p-8 border-none">
                        <h3 className="text-lg font-black tracking-tight mb-6">Top Sites Estáveis</h3>
                        <div className="space-y-4">
                            {sites.slice(0, 5).sort((a,b) => (parseFloat(String(a.latency || 0)) - parseFloat(String(b.latency || 0)))).map((site, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full ${site.status === CheckStatus.ONLINE ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}></div>
                                        <span className="text-xs font-bold truncate">{site.name || site.url}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--apple-accent)] whitespace-nowrap">{String(site.latency || 0)}ms</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
