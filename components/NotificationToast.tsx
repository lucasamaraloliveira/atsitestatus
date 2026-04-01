import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, X, CheckCircle, Info } from 'lucide-react';

interface NotificationToastProps {
    message: string;
    onDismiss: () => void;
    onClick?: () => void;
    type?: 'alert' | 'warning' | 'success' | 'info';
}

const typeConfig = {
    alert: {
        icon: AlertTriangle,
        color: '#FF3B30',
    },
    warning: {
        icon: AlertCircle,
        color: '#FF9500',
    },
    success: {
        icon: CheckCircle,
        color: '#34C759',
    },
    info: {
        icon: Info,
        color: '#007AFF',
    },
};

const NotificationToast: React.FC<NotificationToastProps> = ({ message, onDismiss, onClick, type = 'alert' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detect theme
        setIsDark(document.documentElement.classList.contains('dark'));

        // Animate in
        requestAnimationFrame(() => setIsVisible(true));

        const timerId = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onDismiss, 300);
        }, 4500);

        return () => clearTimeout(timerId);
    }, [onDismiss]);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(onDismiss, 300);
    };

    const handleActionClick = () => {
        if (onClick) {
            onClick();
            handleDismiss();
        }
    };

    const cfg = typeConfig[type];
    const Icon = cfg.icon;
    const color = cfg.color;

    return (
        <div
            onClick={onClick ? handleActionClick : undefined}
            className={`
                max-w-[340px] min-w-[260px]
                rounded-2xl overflow-hidden
                transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${onClick ? 'cursor-pointer hover:brightness-110 active:scale-95' : ''}
                ${isVisible && !isLeaving
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-3 scale-95'
                }
            `}
            style={{
                background: isDark ? '#1C1C1E' : '#FFFFFF',
                border: `1px solid ${color}${isDark ? '4D' : '33'}`,
                boxShadow: isDark
                    ? `0 4px 24px ${color}33, 0 0 0 1px rgba(255,255,255,0.05) inset`
                    : `0 4px 24px ${color}1F, 0 2px 8px rgba(0,0,0,0.06)`,
            }}
            role="alert"
        >
            {/* Accent bar */}
            <div className="h-[3px] w-full" style={{ background: color }} />

            <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <div className="mt-0.5 shrink-0" style={{ color }}>
                    <Icon size={16} strokeWidth={2.5} />
                </div>

                {/* Message */}
                <p
                    className="text-[13px] font-semibold leading-snug flex-1 pr-1"
                    style={{ color: isDark ? '#F5F5F7' : '#1D1D1F' }}
                >
                    {message}
                </p>

                {/* Close */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                    className="shrink-0 p-1 -m-1 rounded-lg transition-colors"
                    style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }}
                    aria-label="Fechar"
                >
                    <X size={14} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default NotificationToast;
