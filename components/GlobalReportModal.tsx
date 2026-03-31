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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose}></div>
            
            <div className="glass apple-card w-full max-w-2xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col p-0">
                {/* Close Button X */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-[var(--apple-text-secondary)] transition-all z-50 group hover:rotate-90"
                >
                    <X size={20} className="group-hover:text-white" />
                </button>

                <div className="p-10 pb-6">
                    <header className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-[var(--apple-accent)] text-white shadow-lg shadow-[#007AFF]/20">
                            <FilePdf size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Exportar Inteligência</h2>
                            <p className="text-sm text-[var(--apple-text-secondary)] font-medium">Relatórios analíticos e links de acesso seguro.</p>
                        </div>
                    </header>

                    <div className="space-y-8">
                        {/* Date Pickers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1 flex items-center gap-2">
                                    <Calendar size={12} className="text-[var(--apple-accent)]" /> Início do Período
                                </label>
                                <input 
                                    type="datetime-local" 
                                    className="apple-datepicker"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1 flex items-center gap-2">
                                    <Clock size={12} className="text-[#AF52DE]" /> Fim do Período
                                </label>
                                <input 
                                    type="datetime-local" 
                                    className="apple-datepicker"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Link Sharing Expiration */}
                        <div className="p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-[#34C759]/10 text-[#34C759]">
                                    <Shield size={18} />
                                </div>
                                <h3 className="font-bold text-sm">Tempo de Autodestruição do Link</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { id: '5m', label: '5m' },
                                    { id: '1h', label: '1h' },
                                    { id: '1d', label: '1d' },
                                    { id: 'indefinite', label: '♾️' }
                                ].map((t) => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setExpiration(t.id as any)}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expiration === t.id ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'bg-white/5 text-[var(--apple-text-secondary)] hover:bg-white/10'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-10 pt-6 flex flex-col gap-3">
                    <button 
                        onClick={handleExportPDF}
                        className="w-full bg-[var(--apple-text)] text-[var(--apple-bg)] h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                    >
                        <FilePdf size={18} /> Gerar PDF Global em Uma Linha
                    </button>
                    <button 
                        onClick={handleShare}
                        className="w-full bg-[#AF52DE] text-white h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#AF52DE]/20"
                    >
                        <Activity size={18} /> Compartilhar Visão Segura (Clipboard)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalReportModal;
