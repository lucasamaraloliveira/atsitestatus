import React, { useEffect, useRef } from 'react';
import { CheckStatus } from '@/types';

declare var Chart: any;

type HistoryPoint = { timestamp: Date; status: CheckStatus; latency?: number };

const StatusHistoryChart: React.FC<{ history: HistoryPoint[]; instanceRef?: React.RefObject<any> }> = ({ history, instanceRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const internalInstanceRef = useRef<any>(null);
    const chartInstanceRef = instanceRef || internalInstanceRef;

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        const gridColor = 'rgba(255, 255, 255, 0.05)';
        const textColor = 'rgba(255, 255, 255, 0.5)';
        const statusColor = '#007AFF'; // Azul Apple vibrante para consistência
        const latencyColor = 'rgba(251, 191, 36, 0.7)';

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.map(h => h.timestamp),
                datasets: [{
                    label: 'Status',
                    data: history.map(h => h.status === CheckStatus.ONLINE ? 1 : (h.status === CheckStatus.OFFLINE || h.status === CheckStatus.ERROR ? 0 : 0.5)),
                    borderColor: statusColor,
                    backgroundColor: 'rgba(0, 122, 255, 0.15)',
                    fill: true,
                    stepped: true,
                    pointRadius: 2,
                    yAxisID: 'yStatus',
                }, {
                    label: 'Latência (ms)',
                    data: history.map(h => h.latency),
                    borderColor: latencyColor,
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: 2,
                    yAxisID: 'yLatency',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (ctx: any) => history[ctx[0].dataIndex].timestamp.toLocaleString(),
                            label: (ctx: any) => {
                                const point = history[ctx.dataIndex];
                                if (ctx.dataset.label === 'Status') {
                                    return `Status: ${point.status}`;
                                }
                                return `Latência: ${point.latency ?? 'N/A'} ms`;
                            },
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { tooltipFormat: 'DD/MM/YYYY HH:mm:ss', displayFormats: { hour: 'HH:mm' } },
                        ticks: { color: textColor, maxRotation: 0, autoSkip: true },
                        grid: { color: gridColor }
                    },
                    yStatus: {
                        position: 'left',
                        beginAtZero: true,
                        max: 1.2,
                        min: -0.2,
                        ticks: {
                            color: textColor,
                            stepSize: 1,
                            callback: (v: any) => (v === 1 ? 'Online' : v === 0 ? 'Offline' : '')
                        },
                        grid: { color: gridColor }
                    },
                    yLatency: {
                        position: 'right',
                        beginAtZero: true,
                        ticks: { color: latencyColor, callback: (v: any) => `${v}ms` },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });

    }, [history, chartInstanceRef]);

    return <div className="h-full"><canvas ref={canvasRef} aria-label="Gráfico de histórico de status e latência do site"></canvas></div>;
};

export default StatusHistoryChart;

