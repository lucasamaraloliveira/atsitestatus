import React, { useState } from 'react';
import { X, FileText, Download, Calendar, BarChart3, Clock } from 'lucide-react';
import { StatusResult, LogEntry } from '@/types';

interface GlobalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
}

const GlobalReportModal: React.FC<GlobalReportModalProps> = ({ isOpen, onClose, sites, logs }) => {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        setIsExporting(true);
        // Simulação de exportação
        await new Promise(r => setTimeout(r, 1500));
        setIsExporting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass apple-card w-full max-w-lg p-8 animate-fade-in-slide-up border-none shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--apple-text-secondary)]"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-[var(--apple-accent)] text-white shadow-lg shadow-[var(--apple-accent)]/20">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[var(--apple-text)]">Relatório Global</h2>
                        <p className="text-sm text-[var(--apple-text-secondary)] tracking-tight">Análise completa da infraestrutura monitorada.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Data Inicial</label>
                            <div className="relative">
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-50" size={16} />
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 pr-12 text-sm font-medium outline-none text-[var(--apple-text)]"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Data Final</label>
                            <div className="relative">
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-50" size={16} />
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 pr-12 text-sm font-medium outline-none text-[var(--apple-text)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-[var(--apple-input-bg)] border border-[var(--apple-border)] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--apple-accent)]">
                                <BarChart3 size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest block">Logs</span>
                                <span className="text-lg font-black text-[var(--apple-text)]">{Object.values(logs).flat().length}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest block">Sites</span>
                            <span className="text-lg font-black text-[var(--apple-text)]">{sites.length}</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-[var(--apple-text-secondary)] text-center font-medium leading-relaxed">
                        O relatório incluirá gráficos de disponibilidade, latência média e histórico de incidentes para todos os sites ativos no período selecionado.
                    </p>

                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full h-14 bg-[var(--apple-text)] text-[var(--apple-bg)] font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isExporting ? <div className="w-5 h-5 border-2 border-[var(--apple-bg)]/30 border-t-[var(--apple-bg)] rounded-full animate-spin"></div> : <><Download size={18} /> Exportar PDF Agora</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalReportModal;
