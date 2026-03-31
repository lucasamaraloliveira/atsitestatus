import React, { useState, useMemo } from 'react';
import { CheckStatus, StatusResult, LogEntry } from '@/types';
import StatusIcon from '@/components/StatusIcon';
import StatusHistoryChart from '@/components/StatusHistoryChart';

type HistoryPoint = { timestamp: Date; status: CheckStatus; latency?: number };

const StatusCard: React.FC<{
  site: StatusResult;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onUpdate: (id: string, newUrl: string, newName: string) => void;
  onViewDetails: (id: string) => void;
  isEditing: boolean;
  logs: LogEntry[];
}> = ({ site, onRefresh, onDelete, onEdit, onUpdate, onViewDetails, isEditing, logs }) => {
    const [editingUrl, setEditingUrl] = useState(site.url);
    const [editingName, setEditingName] = useState(site.name || '');

    const history: HistoryPoint[] = useMemo(() => {
        return logs.slice(-30).map(log => ({ timestamp: new Date(log.timestamp), status: log.status, latency: log.latency }));
    }, [logs]);

    const getStatusColor = (status: CheckStatus) => {
        if (status === CheckStatus.ONLINE) return 'text-[#34C759]';
        if (status === CheckStatus.OFFLINE) return 'text-[#FF3B30]';
        if (status === CheckStatus.ERROR) return 'text-[#FF9500]';
        return 'text-[#8E8E93]';
    };

    const HIGH_LATENCY_THRESHOLD = 1500;
    const isHighLatency = site.status === CheckStatus.ONLINE && site.latency !== undefined && site.latency > HIGH_LATENCY_THRESHOLD;

    return (
        <div className="glass apple-card p-8 flex flex-col border-none group">
            <div>
                <div className="flex items-start justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="transform transition-transform group-hover:scale-110 duration-300">
                            <StatusIcon status={site.status} />
                        </div>
                        {isEditing ? (
                            <div className="flex-grow space-y-3">
                                <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="Nome do Site" className="apple-input w-full text-lg font-bold" />
                                <input type="text" value={editingUrl} onChange={(e) => setEditingUrl(e.target.value)} className="apple-input w-full text-xs font-medium" />
                            </div>
                        ) : (
                             <div className="min-w-0">
                                <h3 className={`text-xl font-bold truncate tracking-tight ${getStatusColor(site.status)}`}>{site.name || site.url}</h3>
                                {site.name && <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[var(--apple-text-secondary)] hover:text-[var(--apple-accent)] transition-colors truncate block mt-1">{site.url}</a>}
                             </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {isEditing ? (
                            <>
                                <button onClick={() => onUpdate(site.id, editingUrl, editingName)} className="p-2 hover:bg-[#34C759]/10 rounded-full transition-colors text-[#34C759]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                                <button onClick={() => onEdit('')} className="p-2 hover:bg-[var(--apple-input-bg)] rounded-full transition-colors text-[var(--apple-text-secondary)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => onRefresh(site.id)} className="p-2 hover:bg-[var(--apple-accent)]/10 rounded-full transition-colors text-[var(--apple-accent)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.414 1.414A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm10 8a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.899-2.186l1.414-1.414A5.002 5.002 0 0014.001 13H11a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                                <button onClick={() => { onEdit(site.id); setEditingName(site.name || ''); setEditingUrl(site.url); }} className="p-2 hover:bg-[#FF9500]/10 rounded-full transition-colors text-[#FF9500]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                <button onClick={() => onDelete(site.id)} className="p-2 hover:bg-[#FF3B30]/10 rounded-full transition-colors text-[#FF3B30]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                            </>
                        )}
                    </div>
                </div>
                <div className="text-sm font-medium text-[var(--apple-text)] opacity-80 mb-3 line-clamp-2 min-h-[2.5rem]">{site.message}</div>
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <div className="text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-1">Última Verificação</div>
                        <div className="text-xs font-semibold text-[var(--apple-text)] opacity-60">{site.timestamp}</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest mb-1">Latência</div>
                        <div className={`text-sm font-bold ${isHighLatency ? 'text-[#FF9500]' : 'text-[var(--apple-accent)]'}`}>
                            {site.latency !== undefined ? `${site.latency}ms` : 'N/A'}
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--apple-border)] flex justify-between items-center">
                    <button onClick={() => onViewDetails(site.id)} className="text-[var(--apple-accent)] hover:opacity-80 font-bold text-sm transition-colors">Ver Detalhes</button>
                    {isHighLatency && <span className="text-[10px] bg-[#FF9500]/10 text-[#FF9500] px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Latência Alta</span>}
                </div>
            </div>
            <div className="flex-grow mt-6 h-24">
                <StatusHistoryChart history={history} />
            </div>
        </div>
    );
};

export default StatusCard;

