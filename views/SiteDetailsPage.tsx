import React, { useState, useMemo, useRef } from 'react';
import { CheckStatus, StatusResult, LogEntry } from '@/types';
import StatusIcon from '@/components/StatusIcon';
import StatusHistoryChart from '@/components/StatusHistoryChart';
import { PlusCircle } from 'lucide-react';

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

        if (period === '24h') {
            start.setHours(start.getHours() - 24);
        } else if (period === '7d') {
            start.setDate(start.getDate() - 7);
        } else if (period === '30d') {
            start.setDate(start.getDate() - 30);
        }
        
        setEndDate(formatDateForInput(now));
        setStartDate(formatDateForInput(start));
    };


    const exportToPDF = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        doc.text(`Histórico de Logs para ${site.name || site.url}`, 20, 10);
        doc.autoTable({
            head: [['Timestamp', 'Status', 'Latência (ms)', 'Mensagem']],
            body: filteredLogs.map(log => [new Date(log.timestamp).toLocaleString(), log.status, log.latency ?? 'N/A', log.message]),
        });
        doc.save(`logs-${site.id}.pdf`);
    };

    const exportToXLSX = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
            Timestamp: new Date(log.timestamp).toLocaleString(),
            Status: log.status,
            'Latência (ms)': log.latency ?? 'N/A',
            Mensagem: log.message
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
        XLSX.writeFile(workbook, `logs-${site.id}.xlsx`);
    };

    const exportChart = () => {
        if (chartInstanceRef.current) {
            const link = document.createElement('a');
            link.href = chartInstanceRef.current.toBase64Image();
            link.download = `chart-${site.id}.png`;
            link.click();
        } else {
            alert("O gráfico ainda não foi renderizado.");
        }
    };

    const getStatusColor = (status: CheckStatus) => {
        if (status === CheckStatus.ONLINE) return 'text-[#34C759]';
        if (status === CheckStatus.OFFLINE) return 'text-[#FF3B30]';
        if (status === CheckStatus.ERROR) return 'text-[#FF9500]';
        return 'text-[var(--apple-text-secondary)]';
    };

    const HIGH_LATENCY_THRESHOLD = 1500;
    const isHighLatency = site.status === CheckStatus.ONLINE && site.latency !== undefined && site.latency > HIGH_LATENCY_THRESHOLD;

    return (
        <div className="container mx-auto max-w-7xl pb-20">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-[var(--apple-accent)] hover:bg-[var(--apple-accent)]/10 py-2 px-4 rounded-full mb-8 transition-all">
                &larr; Voltar ao Painel
            </button>
            
            <div className="glass apple-card p-10 mb-10 border-none">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                         <div className="transform scale-150">
                            <StatusIcon status={site.status} />
                         </div>
                         <div className="min-w-0">
                            <h1 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight break-words">{site.name || site.url}</h1>
                            {site.name && <p className="text-lg font-medium text-[var(--apple-text-secondary)] break-all mt-1">{site.url}</p>}
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`text-xl font-bold ${getStatusColor(site.status)}`}>{site.status}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--apple-border)]"></div>
                                {site.latency !== undefined && (
                                    <span className={`text-xl font-bold ${isHighLatency ? 'text-[#FF9500]' : 'text-[var(--apple-accent)]'}`}>
                                        ~{site.latency}ms
                                    </span>
                                )}
                            </div>
                         </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        <div className="text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-1">Última Verificação</div>
                        <div className="text-sm font-bold text-[var(--apple-text)] opacity-70">{site.timestamp}</div>
                        <p className="text-sm font-medium text-[var(--apple-text-secondary)] mt-2 max-w-xs">{site.message}</p>
                    </div>
                </div>
            </div>

            <div className="glass apple-card p-10 border-none">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8">
                    <div>
                        <h2 className="text-2xl font-extrabold text-[var(--apple-text)] tracking-tight">Histórico de Performance</h2>
                        <p className="text-sm font-medium text-[var(--apple-text-secondary)] mt-1">Análise detalhada de latência e disponibilidade.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center bg-[var(--apple-input-bg)] rounded-2xl p-1 border border-[var(--apple-border)] w-full sm:w-auto">
                            <button onClick={() => handleSetDateRange('24h')} className="flex-1 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white dark:hover:bg-white/10 transition-all">24h</button>
                            <button onClick={() => handleSetDateRange('7d')} className="flex-1 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white dark:hover:bg-white/10 transition-all">7d</button>
                            <button onClick={() => handleSetDateRange('30d')} className="flex-1 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white dark:hover:bg-white/10 transition-all">30d</button>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto bg-[var(--apple-input-bg)] p-1 rounded-2xl border border-[var(--apple-border)]">
                            <input 
                                type="datetime-local" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="bg-transparent text-[10px] font-black uppercase tracking-tighter p-2 focus:outline-none transition-all" 
                                aria-label="Data de início" 
                            />
                            <div className="w-px h-4 bg-[var(--apple-border)]"></div>
                            <input 
                                type="datetime-local" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="bg-transparent text-[10px] font-black uppercase tracking-tighter p-2 focus:outline-none transition-all" 
                                aria-label="Data de fim" 
                            />
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); }} 
                                className="p-2 text-[var(--apple-text-secondary)] hover:text-[#FF3B30] transition-colors"
                            >
                                <PlusCircle size={16} className="rotate-45" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-12 h-80">
                    <StatusHistoryChart history={history} instanceRef={chartInstanceRef} />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
                    <h3 className="text-xl font-extrabold text-[var(--apple-text)] tracking-tight">Registros de Eventos</h3>
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={exportChart} className="text-xs font-bold bg-[var(--apple-card-bg)] text-[var(--apple-text)] py-3 px-5 rounded-full border border-[var(--apple-border)] hover:bg-gray-50 dark:hover:bg-white/20 transition-all">Exportar Gráfico</button>
                        <button onClick={exportToPDF} className="text-xs font-bold bg-[var(--apple-card-bg)] text-[var(--apple-text)] py-3 px-5 rounded-full border border-[var(--apple-border)] hover:bg-gray-50 dark:hover:bg-white/20 transition-all">PDF</button>
                        <button onClick={exportToXLSX} className="text-xs font-bold bg-[var(--apple-card-bg)] text-[var(--apple-text)] py-3 px-5 rounded-full border border-[var(--apple-border)] hover:bg-gray-50 dark:hover:bg-white/20 transition-all">Excel</button>
                        <button onClick={() => onRequestClearHistory(site.id)} className="text-xs font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 py-3 px-5 rounded-full transition-all">Limpar Tudo</button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--apple-border)]">
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-[var(--apple-border)]">
                            <thead className="bg-white/30 dark:bg-white/5 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Data e Hora</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Latência</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Mensagem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--apple-border)] bg-transparent">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log, index) => (
                                        <tr key={index} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-[var(--apple-text)] opacity-60">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className={`px-8 py-5 whitespace-nowrap text-sm font-bold ${getStatusColor(log.status)}`}>{log.status}</td>
                                            <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-[var(--apple-accent)]">{log.latency !== undefined ? `${log.latency}ms` : '—'}</td>
                                            <td className="px-8 py-5 text-sm font-medium text-[var(--apple-text-secondary)]">{log.message}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-20 text-[var(--apple-text-secondary)] font-medium">
                                            Nenhum registro encontrado para o período selecionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteDetailsPage;

