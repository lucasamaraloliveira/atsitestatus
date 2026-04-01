import React, { useEffect, useRef } from 'react';
import { LogEntry } from '@/types';

declare var Chart: any;

interface LatencySparklineProps {
    logs: LogEntry[];
    color?: string;
    height?: number;
}

const LatencySparkline: React.FC<LatencySparklineProps> = ({ logs, color = '#007AFF', height = 40 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !logs.length) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Limpa gráfico anterior se existir
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Prepara os dados (últimos 15 logs para manter o gráfico limpo)
        const displayLogs = [...logs].reverse().slice(-15);
        const dataPoints = displayLogs.map(log => log.latency || 0);
        const labels = displayLogs.map(log => new Date(log.timestamp).toLocaleTimeString());

        // Criar gradiente para a linha
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `${color}33`); // 20% opacity
        gradient.addColorStop(1, `${color}00`); // 0% opacity

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: dataPoints,
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: color,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context: any) => `${context.parsed.y} ms`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { 
                        display: false,
                        beginAtZero: true 
                    }
                },
                layout: {
                    padding: { left: 2, right: 2, top: 4, bottom: 2 }
                }
            }
        });

        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [logs, color, height]);

    return (
        <div style={{ height: `${height}px` }} className="w-full">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default LatencySparkline;
