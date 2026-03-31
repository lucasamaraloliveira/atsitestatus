import React, { useState } from 'react';
import { 
    X, 
    Download, 
    Calendar, 
    FileText as FilePdf, 
    Table as FileExcel,
    Clock,
    AlertCircle,
    CheckCircle2,
    Activity,
    Shield
} from 'lucide-react';
import { StatusResult, LogEntry, CheckStatus } from '@/types';

declare var jspdf: any;
declare var XLSX: any;

interface GlobalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
}

const GlobalReportModal: React.FC<GlobalReportModalProps> = ({ isOpen, onClose, sites, logs }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expiration, setExpiration] = useState<'5m' | '1h' | '1d' | 'indefinite'>('1h');
    const [sharedLink, setSharedLink] = useState('');

    if (!isOpen) return null;

    const handleShare = () => {
        const reportData = {
            sites,
            logs,
            generatedAt: Date.now(),
            expiresAt: expiration === 'indefinite' ? null : 
                       Date.now() + (expiration === '5m' ? 5*60*1000 : 
                                    expiration === '1h' ? 60*60*1000 : 
                                    24*60*60*1000)
        };
        const encoded = btoa(JSON.stringify(reportData));
        const link = `${window.location.origin}/#report=${encoded}`;
        setSharedLink(link);
        navigator.clipboard.writeText(link);
        alert("Link de relatório (com autodestruição) copiado para a área de transferência!");
    };

    const handleExportPDF = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Relatório Global de Monitoramento - ATSiteStatus", 20, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 20, 30);

        const body = sites.map(site => {
            const siteLogs = logs[site.id] || [];
            const uptime = siteLogs.length > 0 ? 
                ((siteLogs.filter(l => l.status === CheckStatus.ONLINE).length / siteLogs.length) * 100).toFixed(2) : '100';
            return [site.name || site.url, site.status, `${site.latency || 0}ms`, `${uptime}%`];
        });

        doc.autoTable({
            startY: 40,
            head: [['Site', 'Status Atual', 'Latência', 'Uptime Histórico']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [0, 122, 255] }
        });

        doc.save(`relatorio-global-${Date.now()}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="glass apple-card w-full max-w-xl border border-[var(--apple-border)] shadow-2xl relative flex flex-col p-8">
                {/* Header com X discreto de fechar */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <FilePdf size={20} className="text-[var(--apple-accent)]" />
                        <h2 className="text-xl font-bold tracking-tight">Exportar Relatório Global</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </header>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase font-black tracking-widest text-[var(--apple-text-secondary)] ml-1">Início</label>
                             <input type="datetime-local" className="apple-datepicker" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] uppercase font-black tracking-widest text-[var(--apple-text-secondary)] ml-1">Fim</label>
                             <input type="datetime-local" className="apple-datepicker" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="p-4 bg-[var(--apple-input-bg)] rounded-2xl border border-[var(--apple-border)]">
                        <h3 className="text-[10px] uppercase font-black tracking-widest text-[var(--apple-text-secondary)] mb-4">Tempo de Autodestruição do Link</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {['5m', '1h', '1d', 'indefinite'].map((t) => (
                                <button 
                                    key={t}
                                    onClick={() => setExpiration(t as any)}
                                    className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${expiration === t ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'bg-white/50 text-[var(--apple-text-secondary)] hover:bg-white'}`}
                                >
                                    {t === 'indefinite' ? '♾️' : t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleExportPDF}
                            className="w-full bg-[var(--apple-text)] text-[var(--apple-bg)] h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-xl"
                        >
                            <Download size={18} /> Gerar PDF Global
                        </button>
                        <button 
                            onClick={handleShare}
                            className="w-full bg-[#AF52DE] text-white h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-xl shadow-[#AF52DE]/20"
                        >
                            <Activity size={18} /> Copiar Link de Compartilhamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalReportModal;
