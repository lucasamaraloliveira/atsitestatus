import React, { useState } from 'react';
import type { StatusResult, LogEntry } from '@/types';
import { generateGlobalPdfReport, generateGlobalXlsxReport } from '@/services/reportService';
import { X, FileSpreadsheet, Share2, Table } from 'lucide-react';

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
        navigator.clipboard.writeText(sharedLink).then(() => {
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Copiar'), 2000);
        }).catch(err => {
            console.error('Falha ao copiar link: ', err);
            alert('Não foi possível copiar o link.');
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
                {/* Close Button UI */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--apple-text-secondary)] transition-all hover:rotate-90"
                    aria-label="Fechar modal"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0071E3]/20">AT</div>
                    <h2 id="modal-title" className="text-2xl font-extrabold text-[var(--apple-text)] tracking-tight">Gerar Relatório Global</h2>
                </div>
                
                <div className="text-[var(--apple-text-secondary)] mb-10">
                    <p className="text-sm font-medium leading-relaxed mb-8">Selecione um período para gerar o relatório consolidado de todos os sites monitorados. Se nenhum período for selecionado, o relatório incluirá todos os dados históricos.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="start-date" className="block text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2 ml-1">Data de Início</label>
                            <input
                                type="datetime-local"
                                id="start-date"
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setSharedLink(''); }}
                                className="apple-input w-full p-4 text-sm font-medium focus:ring-2 focus:ring-[var(--apple-accent)] focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-[11px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-2 ml-1">Data de Fim</label>
                            <input
                                type="datetime-local"
                                id="end-date"
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setSharedLink(''); }}
                                className="apple-input w-full p-4 text-sm font-medium focus:ring-2 focus:ring-[var(--apple-accent)] focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {sharedLink && (
                    <div className="mb-10 p-6 bg-[var(--apple-accent)]/5 rounded-3xl border border-[var(--apple-accent)]/10 animate-fade-in">
                        <label className="block text-[11px] font-bold text-[var(--apple-accent)] uppercase tracking-widest mb-3 ml-1">Link compartilhável gerado</label>
                        <div className="flex gap-3">
                             <input
                                type="text"
                                readOnly
                                value={sharedLink}
                                className="apple-input w-full p-4 text-xs font-medium focus:outline-none"
                                onFocus={(e) => e.target.select()}
                            />
                            <button onClick={handleCopyToClipboard} className="bg-[var(--apple-accent)] text-white font-bold py-4 px-6 rounded-2xl transition-all hover:bg-[var(--apple-accent)]/90 active:scale-95 text-xs min-w-[100px]">
                                {copyButtonText}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={handleExportPdf}
                        className="apple-button w-full py-4 text-sm font-bold shadow-xl shadow-[var(--apple-accent)]/20 flex items-center justify-center gap-2"
                    >
                        <FileSpreadsheet size={18} />
                        Exportar Relatório em PDF
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleShare}
                            className="bg-[var(--apple-card-bg)] text-[var(--apple-text)] border border-[var(--apple-border)] font-bold py-3.5 px-6 rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-white/20 text-xs flex items-center justify-center gap-2"
                        >
                            <Share2 size={16} />
                            Compartilhar
                        </button>
                        <button
                            onClick={handleExportXlsx}
                            className="bg-[var(--apple-card-bg)] text-[var(--apple-text)] border border-[var(--apple-border)] font-bold py-3.5 px-6 rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-white/20 text-xs flex items-center justify-center gap-2"
                        >
                            <Table size={16} />
                            Planilha Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalReportModal;

