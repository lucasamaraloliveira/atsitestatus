import React, { useMemo, useState, useEffect } from 'react';
import type { StatusResult, LogEntry } from '@/types';
import { CheckStatus } from '@/types';
import StatusPieChart from '@/components/StatusPieChart';
import { requestNotificationPermission, getNotificationPermission } from '@/services/notificationService';

const StatCard: React.FC<{ title: string; value: string | number; description: string; }> = ({ title, value, description }) => (
    <div className="glass apple-card p-6 flex-1 min-w-[180px] text-left">
        <div className="text-xs font-semibold text-[var(--apple-text-secondary)] uppercase tracking-wider mb-1">{title}</div>
        <div className="text-3xl font-bold text-[var(--apple-text)] tracking-tight">{value}</div>
        <div className="text-xs text-[var(--apple-text-secondary)] mt-2 font-medium">{description}</div>
    </div>
);

const DashboardHeader: React.FC<{ sites: StatusResult[], logs: Record<string, LogEntry[]> }> = ({ sites, logs }) => {
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());

    const stats = useMemo(() => {
        const totalSites = sites.length;
        if (totalSites === 0) return { uptime: '100%', offlineCount: 0, mostUnstable: 'N/A', statusCounts: {} };

        const onlineSites = sites.filter(s => s.status === CheckStatus.ONLINE).length;
        const offlineCount = sites.filter(s => s.status === CheckStatus.OFFLINE || s.status === CheckStatus.ERROR).length;
        const uptime = totalSites > 0 ? ((onlineSites / totalSites) * 100).toFixed(1) + '%' : '100%';

        const statusCounts = sites.reduce((acc, site) => {
            acc[site.status] = (acc[site.status] || 0) + 1;
            return acc;
        }, {} as Record<CheckStatus, number>);

        let mostUnstable = 'N/A';
        let maxChanges = 0;
        
        Object.keys(logs).forEach(siteId => {
            const siteLogs = logs[siteId] || [];
            let changes = 0;
            for (let i = 0; i < siteLogs.length - 1; i++) {
                if (siteLogs[i].status !== siteLogs[i+1].status && siteLogs[i+1].status === CheckStatus.ONLINE) {
                    changes++;
                }
            }
            if (changes > maxChanges) {
                maxChanges = changes;
                mostUnstable = sites.find(s => s.id === siteId)?.url || 'N/A';
            }
        });

        return { uptime, offlineCount, mostUnstable, statusCounts };
    }, [sites, logs]);

    const handleRequestPermission = async () => {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
    };

    return (
        <div className="mb-10 p-8 glass apple-card flex flex-col lg:flex-row gap-8 items-center border-none">
            <div className="flex flex-wrap gap-6 justify-start flex-grow w-full">
                <StatCard title="Uptime Geral" value={stats.uptime} description="Saúde da rede" />
                <StatCard title="Sites Offline" value={stats.offlineCount} description="Incidentes ativos" />
                <StatCard title="Mais Instável" value={stats.mostUnstable} description="Alerta de estabilidade" />
            </div>
            <div className="w-full lg:w-1/4 flex flex-col items-center gap-4">
                <div className="h-44 w-44">
                    <StatusPieChart data={stats.statusCounts} />
                </div>
                 {notificationPermission !== 'granted' && (
                    <button onClick={handleRequestPermission} className="apple-button text-sm w-full">
                        {notificationPermission === 'denied' ? 'Notificações Bloqueadas' : 'Ativar Notificações'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardHeader;

