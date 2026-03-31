import React, { useState } from 'react';
import type { StatusResult, LogEntry } from '@/types';
import { generateGlobalPdfReport, generateGlobalXlsxReport } from '@/services/reportService';
import { X, FileText, Share2, FileSpreadsheet } from 'lucide-react';

interface GlobalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
}

const GlobalReportModal: React.FC<GlobalReportModalProps> = ({ isOpen, onClose, sites, logs }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sharedLink, setSharedLink] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copiar');

    if (!isOpen) return null;

    const handleExportPdf = () => {
        generateGlobalPdfReport(sites, logs, startDate, endDate);
        onClose();
    };

    const handleExportXlsx = () => {
        generateGlobalXlsxReport(sites, logs, startDate, endDate);
        onClose();
    };

    const handleShare = () => {
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) : Date.now();

        const relevantSiteIds = new Set(
            Object.keys(logs).filter(siteId =>
                logs[siteId].some(log => log.timestamp >= start && log.timestamp <= end)
            )
        );

        const sitesToShare = sites.filter(site => relevantSiteIds.has(site.id));
        const logsToShare: Record<string, LogEntry[]> = {};
        for (const siteId of relevantSiteIds) {
            logsToShare[siteId] = logs[siteId].filter(log => log.timestamp >= start && log.timestamp <= end);
        }

        const dataToEncode = { sites: sitesToShare, logs: logsToShare, startDate, endDate };
        const jsonString = JSON.stringify(dataToEncode);
        const encodedData = btoa(jsonString);

        const link = `${window.location.origin}${window.location.pathname}#report=${encodedData}`;
        setSharedLink(link);
        setCopyButtonText('Copiar');
    };
    
    const handleCopyToClipboard = () => {
        if (!navigator.clipboard) {
            alert('Não foi possível copiar automaticamente.');
            return;
        }
        navigator.clipboard.writeText(sharedLink).then(() => {
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Copiar'), 2000);
        }).catch(err => {
            console.error('Falha ao copiar link: ', err);
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
        >
            <div
                className="glass apple-card p-10 w-full max-w-xl border-none shadow-2xl animate-fade-in-slide-up relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button X */}
                <button 
                    onClick={onClose} 
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--apple-text-secondary)]"
                    aria-label="Fechar"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0071E3]/20">AT</div>
                    <div>
                        <h2 id="modal-title" className="text-2xl font-black text-[var(--apple-text)] tracking-tight">Relatório Global</h2>
                        <p className="text-sm text-[var(--apple-text-secondary)] font-medium">Extraia dados da sua infraestrutura.</p>
                    </div>
                </div>
                
                <div className="text-[var(--apple-text)] mb-10">
                    <p className="text-sm font-medium leading-relaxed mb-10 opacity-70">Selecione o período desejado. Se vazio, exportaremos todo o histórico disponível.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Data de Início</label>
                            <input
                                type="datetime-local"
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setSharedLink(''); }}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl p-4 text-sm font-medium outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Data de Fim</label>
                            <input
                                type="datetime-local"
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setSharedLink(''); }}
                                className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl p-4 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>
                </div>

                {sharedLink && (
                    <div className="mb-10 p-6 bg-[var(--apple-accent)]/5 rounded-3xl border border-[var(--apple-accent)]/10 animate-fade-in">
                        <label className="block text-[11px] font-bold text-[var(--apple-accent)] uppercase tracking-widest mb-3 ml-1">Link compartilhável</label>
                        <div className="flex gap-3">
                             <input
                                type="text"
                                readOnly
                                value={sharedLink}
                                className="w-full bg-white/5 border border-[var(--apple-border)] rounded-xl px-4 text-xs font-medium outline-none"
                                onFocus={(e) => e.target.select()}
                            />
                            <button onClick={handleCopyToClipboard} className="bg-[var(--apple-accent)] text-white font-bold py-4 px-6 rounded-xl transition-all hover:bg-[var(--apple-accent)]/90 active:scale-95 text-xs min-w-[100px]">
                                {copyButtonText}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleShare}
                            className="h-14 bg-[var(--apple-input-bg)] text-[var(--apple-text)] font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:bg-white/10 flex items-center justify-center gap-3 border border-white/5"
                        >
                            <Share2 size={16} /> Link Direto
                        </button>
                        <button
                            onClick={handleExportXlsx}
                            className="h-14 bg-[var(--apple-input-bg)] text-[var(--apple-text)] font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all hover:bg-white/10 flex items-center justify-center gap-3 border border-white/5"
                        >
                            <FileSpreadsheet size={16} /> Planilha Excel
                        </button>
                    </div>
                    
                    <button
                        onClick={handleExportPdf}
                        className="w-full h-16 bg-[var(--apple-accent)] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[var(--apple-accent)]/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 border border-[var(--apple-accent)]/30"
                    >
                        <FileText size={20} /> Exportar Arquivo PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalReportModal;
