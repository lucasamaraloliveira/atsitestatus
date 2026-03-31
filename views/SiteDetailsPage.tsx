import React, { useState, useMemo, useRef } from 'react';
import { CheckStatus, StatusResult, LogEntry } from '@/types';
import StatusIcon from '@/components/StatusIcon';
import StatusHistoryChart from '@/components/StatusHistoryChart';
import { 
    PlusCircle, 
    Activity, 
    Clock, 
    ChevronLeft, 
    BarChart3, 
    ShieldAlert, 
    CheckCircle2, 
    Info 
} from 'lucide-react';

declare var jspdf: any;
declare var XLSX: any;

type HistoryPoint = { timestamp: Date; status: CheckStatus, latency?: number };

const SiteDetailsPage: React.FC<{
  site: StatusResult;
  logs: LogEntry[];
  onBack: () => void;
  onRequestClearHistory: (id: string) => void;
}> = ({ site, logs, onBack, onRequestClearHistory }) => {
    const chartInstanceRef = useRef<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredLogs = useMemo(() => {
        if (!startDate && !endDate) return logs;
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) : Date.now();
        return logs.filter(log => log.timestamp >= start && log.timestamp <= end);
    }, [logs, startDate, endDate]);

    const history: HistoryPoint[] = useMemo(() => {
        return filteredLogs.map(log => ({ timestamp: new Date(log.timestamp), status: log.status, latency: log.latency }));
    }, [filteredLogs]);

    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleSetDateRange = (period: '24h' | '7d' | '30d') => {
        const now = new Date();
        const start = new Date();
        if (period === '24h') start.setHours(start.getHours() - 24);
        else if (period === '7d') start.setDate(start.getDate() - 7);
        else if (period === '30d') start.setDate(start.getDate() - 30);
        setEndDate(formatDateForInput(now));
        setStartDate(formatDateForInput(start));
    };

    const exportToPDF = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        doc.text(`Relatório de Monitoramento - ${site.name || site.url}`, 20, 10);
        doc.autoTable({
            head: [['Data/Hora', 'Status', 'Latência', 'Mensagem']],
            body: filteredLogs.map(log => [new Date(log.timestamp).toLocaleString(), log.status, `${log.latency || 0}ms`, log.message]),
        });
        doc.save(`detalhes-${site.id}.pdf`);
    };

    const exportToXLSX = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
            'Data/Hora': new Date(log.timestamp).toLocaleString(),
            Status: log.status,
            'Latência (ms)': log.latency || 0,
            Mensagem: log.message
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
        XLSX.writeFile(workbook, `detalhes-${site.id}.xlsx`);
    };

    const getStatusColor = (status: CheckStatus) => {
        if (status === CheckStatus.ONLINE) return 'text-[#34C759]';
        if (status === CheckStatus.OFFLINE) return 'text-[#FF3B30]';
        return 'text-[#FF9500]';
    };

    const uptimePercentage = useMemo(() => {
        if (logs.length === 0) return 100;
        const online = logs.filter(l => l.status === CheckStatus.ONLINE).length;
        return ((online / logs.length) * 100).toFixed(1);
    }, [logs]);

    return (
        <div className="container mx-auto max-w-7xl pb-20 animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[var(--apple-text-secondary)] hover:text-[var(--apple-accent)] mb-8 transition-all group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
            </button>
            
            <div className="glass apple-card p-10 mb-8 border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Activity size={200} />
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                         <div className="transform scale-[1.8] origin-left">
                            <StatusIcon status={site.status} />
                         </div>
                         <div className="min-w-0">
                            <h1 className="text-5xl font-black text-[var(--apple-text)] tracking-tighter break-words leading-tight">{site.name || site.url}</h1>
                            {site.name && <p className="text-xl font-bold text-[var(--apple-text-secondary)] opacity-60 mt-1">{site.url}</p>}
                            <div className="flex items-center gap-4 mt-6">
                                <span className={`text-2xl font-black uppercase tracking-tight ${getStatusColor(site.status)}`}>{site.status}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--apple-border)]"></div>
                                {site.latency !== undefined && (
                                    <span className="text-2xl font-black text-[var(--apple-accent)]">~{site.latency}ms</span>
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Diagnóstico e Uptime */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 glass apple-card p-10 border-none space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[var(--apple-accent)]/10 text-[var(--apple-accent)]">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Diagnóstico de Performance</h3>
                    </div>

                    {site.latency !== undefined ? (
                        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-[var(--apple-input-bg)] rounded-[2.5rem] border border-[var(--apple-border)]">
                            <div className="text-5xl font-black text-[var(--apple-accent)] opacity-10 hidden md:block">{site.latency}ms</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {site.latency < 200 ? <CheckCircle2 size={20} className="text-[#34C759]" /> : <Info size={20} className="text-[#FF9500]" />}
                                    <h4 className="font-black text-lg">
                                        {site.latency < 200 ? 'Velocidade Excepcional' : 
                                         site.latency < 600 ? 'Resposta Nominal' : 
                                         site.latency < 1500 ? 'Latência de Rede Detectada' : 'Sobrecarga Crítica'}
                                    </h4>
                                </div>
                                <p className="text-sm text-[var(--apple-text-secondary)] font-medium leading-relaxed">
                                    {site.latency < 200 ? 'Seu servidor está respondendo em tempo recorde. Nenhuma ação é necessária.' : 
                                     site.latency < 600 ? 'A latência é normal para conexões de longa distância ou servidores compartilhados.' : 
                                     site.latency < 1500 ? 'Atenção: O tempo de resposta está elevado. Recomendamos verificar o uso de CDN ou cache no servidor.' : 
                                     'Alerta: O servidor está demorando muito para responder (>1.5s). Isso pode afetar o SEO e a experiência do usuário.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-[var(--apple-input-bg)] rounded-3xl opacity-50">Aguardando dados...</div>
                    )}
                </div>

                {/* Nova Seção: Distribuição de Resposta */}
                <div className="glass apple-card p-10 border-none space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#5856D6]/10 text-[#5856D6]">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Distribuição de Resposta</h3>
                            <p className="text-sm text-[var(--apple-text-secondary)] font-medium">Consistência de performance nos últimos {logs.length} logs.</p>
                        </div>
                    </div>

                    {logs.length > 0 ? (() => {
                        const fast = logs.filter(l => (l.latency || 0) < 200).length;
                        const nominal = logs.filter(l => (l.latency || 0) >= 200 && (l.latency || 0) < 600).length;
                        const slow = logs.filter(l => (l.latency || 0) >= 600 && (l.latency || 0) < 1500).length;
                        const critical = logs.filter(l => (l.latency || 0) >= 1500).length;
                        const total = logs.length;

                        const getPct = (val: number) => ((val / total) * 100).toFixed(0);

                        return (
                            <div className="space-y-10">
                                <div className="h-6 w-full flex rounded-full overflow-hidden bg-[var(--apple-input-bg)] shadow-inner">
                                    <div style={{ width: `${getPct(fast)}%` }} className="bg-[#34C759] h-full transition-all duration-1000" title="Instantâneo"></div>
                                    <div style={{ width: `${getPct(nominal)}%` }} className="bg-[#007AFF] h-full transition-all duration-1000" title="Nominal"></div>
                                    <div style={{ width: `${getPct(slow)}%` }} className="bg-[#FF9500] h-full transition-all duration-1000" title="Lento"></div>
                                    <div style={{ width: `${getPct(critical)}%` }} className="bg-[#FF3B30] h-full transition-all duration-1000" title="Crítico"></div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
                                            <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest">Instantâneo</span>
                                        </div>
                                        <p className="text-lg font-black">{getPct(fast)}% <span className="text-[10px] opacity-40 font-bold ml-1">(&lt;200ms)</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                                            <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest">Nominal</span>
                                        </div>
                                        <p className="text-lg font-black">{getPct(nominal)}% <span className="text-[10px] opacity-40 font-bold ml-1">(200-600ms)</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#FF9500]"></div>
                                            <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest">Elevada</span>
                                        </div>
                                        <p className="text-lg font-black">{getPct(slow)}% <span className="text-[10px] opacity-40 font-bold ml-1">(0.6-1.5s)</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div>
                                            <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest">Crítica</span>
                                        </div>
                                        <p className="text-lg font-black">{getPct(critical)}% <span className="text-[10px] opacity-40 font-bold ml-1">(&gt;1.5s)</span></p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-[var(--apple-border)] flex items-center gap-3">
                                    <Info size={16} className="text-[var(--apple-accent)] shrink-0" />
                                    <p className="text-[10px] font-medium text-[var(--apple-text-secondary)]">
                                        A barra de distribuição mostra a consistência do seu serviço. Sites estáveis devem concentrar a maior parte da cor no <span className="text-[#34C759] font-bold">Verde</span> e <span className="text-[#007AFF] font-bold">Azul</span>.
                                    </p>
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="py-10 text-center opacity-40 italic">Processando dados de distribuição...</div>
                    )}
                </div>

                <div className="glass apple-card p-10 border-none flex flex-col justify-between text-center overflow-hidden relative">
                    <div className="absolute -top-4 -right-4 opacity-5 pointer-events-none rotate-12">
                        <Clock size={160} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--apple-text-secondary)]">Confiabilidade Total</p>
                        <h3 className="text-xl font-bold mt-2">Disponibilidade (Uptime)</h3>
                    </div>
                    <div className="my-10 relative">
                        <span className="text-7xl font-black tracking-tighter text-[var(--apple-text)]">{uptimePercentage}%</span>
                        <div className="mt-4 flex justify-center gap-1">
                            {[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-2 rounded-full ${Number(uptimePercentage) > 90 ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`}></div>)}
                        </div>
                    </div>
                    <p className="text-xs font-medium text-[var(--apple-text-secondary)]">Baseado em {logs.length} verificações recentes.</p>
                </div>
            </div>

            <div className="glass apple-card p-10 border-none">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8">
                    <div>
                        <h2 className="text-2xl font-black text-[var(--apple-text)]">Gráfico de Histórico</h2>
                        <p className="text-sm font-medium text-[var(--apple-text-secondary)] mt-1">Variação de latência em milissegundos.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <div className="flex bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)]">
                            <button onClick={() => handleSetDateRange('24h')} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white dark:hover:bg-white/10 transition-all">24h</button>
                            <button onClick={() => handleSetDateRange('7d')} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white dark:hover:bg-white/10 transition-all">7d</button>
                            <button onClick={() => handleSetDateRange('30d')} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white dark:hover:bg-white/10 transition-all">30d</button>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)]">
                            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black p-2 outline-none" />
                            <div className="w-px h-4 bg-[var(--apple-border)]"></div>
                            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black p-2 outline-none" />
                            <button onClick={() => {setStartDate(''); setEndDate('');}} className="p-2 text-[#FF3B30]"><PlusCircle size={14} className="rotate-45" /></button>
                        </div>
                    </div>
                </div>

                <div className="mb-14 h-[350px]">
                    <StatusHistoryChart history={history} instanceRef={chartInstanceRef} />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 border-t border-[var(--apple-border)] pt-10">
                    <h3 className="text-xl font-bold">Registros de Eventos</h3>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={exportToPDF} className="flex items-center gap-2 bg-[var(--apple-input-bg)] py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-[var(--apple-border)]">PDF</button>
                        <button onClick={exportToXLSX} className="flex items-center gap-2 bg-[var(--apple-input-bg)] py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-[var(--apple-border)]">Excel</button>
                        <button onClick={() => onRequestClearHistory(site.id)} className="flex items-center gap-2 bg-[#FF3B30]/10 text-[#FF3B30] py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3B30]/20 transition-all">Limpar Logs</button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--apple-border)]">
                    <table className="min-w-full text-left">
                        <thead className="bg-[var(--apple-input-bg)] text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">
                            <tr>
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Latência</th>
                                <th className="px-8 py-5">Mensagem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--apple-border)]">
                            {filteredLogs.map((log, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5 text-sm font-medium opacity-70">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className={`px-8 py-5 text-sm font-black ${getStatusColor(log.status)}`}>{log.status}</td>
                                    <td className="px-8 py-5 text-sm font-black text-[var(--apple-accent)]">{log.latency || 0}ms</td>
                                    <td className="px-8 py-5 text-sm font-medium text-[var(--apple-text-secondary)]">{log.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SiteDetailsPage;
