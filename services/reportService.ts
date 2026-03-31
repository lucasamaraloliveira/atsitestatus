import { CheckStatus, LogEntry, StatusResult } from '@/types';

declare var jspdf: any;
declare var XLSX: any;

interface SiteStats {
    id: string;
    displayName: string;
    uptime: number;
    incidents: number;
    avgLatency: number;
}

export interface GlobalStats {
    globalAvgUptime: number;
    totalIncidents: number;
    globalAvgLatency: number;
    siteStats: SiteStats[];
    filteredLogs: (LogEntry & { url: string, displayName: string })[];
}

export const calculateGlobalStats = (sites: StatusResult[], logs: Record<string, LogEntry[]>, startDate: string, endDate: string): GlobalStats => {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) : Date.now();
    
    let allFilteredLogs: (LogEntry & { url: string; displayName: string })[] = [];
    const siteStats: SiteStats[] = [];
    
    const filteredSites = sites.filter(site => (logs[site.id] || []).some(log => log.timestamp >= start && log.timestamp <= end));

    for (const site of filteredSites) {
        const siteLogs = (logs[site.id] || []).filter(log => log.timestamp >= start && log.timestamp <= end);
        if (siteLogs.length === 0) continue;

        const displayName = site.name || site.url;
        allFilteredLogs.push(...siteLogs.map(log => ({ ...log, url: site.url, displayName })));

        const onlineChecks = siteLogs.filter(log => log.status === CheckStatus.ONLINE).length;
        const uptime = (onlineChecks / siteLogs.length) * 100;

        let incidents = 0;
        for (let i = 0; i < siteLogs.length - 1; i++) {
            if (siteLogs[i].status !== CheckStatus.ONLINE && siteLogs[i+1].status === CheckStatus.ONLINE) {
                incidents++;
            }
        }
        if (siteLogs.length > 0 && siteLogs[siteLogs.length - 1].status !== CheckStatus.ONLINE) {
            incidents++;
        }

        const latencies = siteLogs.map(log => log.latency).filter((l): l is number => l !== undefined);
        const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

        siteStats.push({ id: site.id, displayName, uptime, incidents, avgLatency });
    }

    const totalUptime = siteStats.reduce((acc, s) => acc + s.uptime, 0);
    const globalAvgUptime = siteStats.length > 0 ? totalUptime / siteStats.length : 100;

    const totalIncidents = siteStats.reduce((acc, s) => acc + s.incidents, 0);

    const allLatencies = allFilteredLogs.map(log => log.latency).filter((l): l is number => l !== undefined);
    const globalAvgLatency = allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0;
    
    return {
        globalAvgUptime,
        totalIncidents,
        globalAvgLatency,
        siteStats,
        filteredLogs: allFilteredLogs.sort((a,b) => b.timestamp - a.timestamp)
    };
};

export const generateGlobalPdfReport = (sites: StatusResult[], logs: Record<string, LogEntry[]>, startDate: string, endDate: string) => {
    const stats = calculateGlobalStats(sites, logs, startDate, endDate);
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const period = startDate || endDate ? `Período: ${startDate || 'Início'} a ${endDate || 'Fim'}` : 'Todo o Período';

    doc.text('Relatório de Performance Global', 14, 22);
    doc.setFontSize(12);
    doc.text(period, 14, 30);

    doc.autoTable({
        startY: 40,
        head: [['Indicador Global', 'Valor']],
        body: [
            ['Uptime Médio', `${stats.globalAvgUptime.toFixed(2)}%`],
            ['Total de Incidentes', stats.totalIncidents.toString()],
            ['Latência Média', `${stats.globalAvgLatency.toFixed(0)} ms`],
        ],
        theme: 'grid'
    });

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Site', 'Uptime (%)', 'Incidentes', 'Latência Média (ms)']],
        body: stats.siteStats
          .sort((a,b) => b.incidents - a.incidents)
          .map(s => [s.displayName, s.uptime.toFixed(2), s.incidents, s.avgLatency.toFixed(0)]),
        theme: 'striped'
    });
    
    if (stats.filteredLogs.length > 0) {
      doc.addPage();
      doc.text('Logs Consolidados', 14, 22);
      doc.autoTable({
          startY: 30,
          head: [['Timestamp', 'Site', 'Status', 'Latência (ms)', 'Mensagem']],
          body: stats.filteredLogs.map(log => [new Date(log.timestamp).toLocaleString(), log.displayName, log.status, log.latency ?? 'N/A', log.message]),
      });
    }

    doc.save('relatorio-global.pdf');
};

export const generateGlobalXlsxReport = (sites: StatusResult[], logs: Record<string, LogEntry[]>, startDate: string, endDate: string) => {
    const stats = calculateGlobalStats(sites, logs, startDate, endDate);
    const summaryData = [
        { Indicador: 'Uptime Médio Global (%)', Valor: stats.globalAvgUptime.toFixed(2) },
        { Indicador: 'Total de Incidentes', Valor: stats.totalIncidents },
        { Indicador: 'Latência Média Global (ms)', Valor: stats.globalAvgLatency.toFixed(0) },
        {}, // Empty row for spacing
        { Indicador: 'Site', 'Uptime (%)': 'Uptime (%)', 'Incidentes': 'Incidentes', 'Latência Média (ms)': 'Latência Média (ms)' },
        ...stats.siteStats
            .sort((a, b) => b.incidents - a.incidents)
            .map(s => ({
                Indicador: s.displayName,
                'Uptime (%)': s.uptime.toFixed(2),
                'Incidentes': s.incidents,
                'Latência Média (ms)': s.avgLatency.toFixed(0)
            }))
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
    const logsSheet = XLSX.utils.json_to_sheet(stats.filteredLogs.map(log => ({
        Timestamp: new Date(log.timestamp).toLocaleString(),
        Site: log.displayName,
        Status: log.status,
        'Latência (ms)': log.latency ?? 'N/A',
        Mensagem: log.message
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
    XLSX.utils.book_append_sheet(workbook, logsSheet, "Logs Detalhados");
    XLSX.writeFile(workbook, 'relatorio-global.xlsx');
};
