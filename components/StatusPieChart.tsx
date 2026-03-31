import React, { useEffect, useRef } from 'react';
import { CheckStatus } from '@/types';

declare var Chart: any;

const statusConfig = {
    [CheckStatus.ONLINE]: { label: 'Online', color: '#34C759' },
    [CheckStatus.OFFLINE]: { label: 'Offline', color: '#FF3B30' },
    [CheckStatus.CHECKING]: { label: 'Verificando', color: '#0071E3' },
    [CheckStatus.ERROR]: { label: 'Erro', color: '#FF9500' }
};

const StatusPieChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const labels = Object.keys(data);
        const chartData = labels.map(label => data[label]);
        const backgroundColors = labels.map(label => statusConfig[label as CheckStatus]?.color || '#8E8E93');

        chartInstanceRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => statusConfig[label as CheckStatus]?.label || label),
                datasets: [{
                    data: chartData,
                    backgroundColor: backgroundColors,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleColor: '#1D1D1F',
                        bodyColor: '#1D1D1F',
                        padding: 12,
                        cornerRadius: 12,
                        displayColors: true,
                        usePointStyle: true,
                        boxPadding: 6,
                        bodyFont: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                },
                cutout: '75%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });

    }, [data]);

    return <div className="relative w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} aria-label="Gráfico de pizza com a distribuição de status dos sites"></canvas>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">Status</span>
            <span className="text-2xl font-black text-[var(--apple-text)]">{(Object.values(data) as number[]).reduce((a, b) => a + b, 0)}</span>
        </div>
    </div>;
};

export default StatusPieChart;

