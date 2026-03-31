import React, { useEffect } from 'react';

interface NotificationToastProps {
    message: string;
    onDismiss: () => void;
    type?: 'alert' | 'warning';
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, onDismiss, type = 'alert' }) => {
    useEffect(() => {
        const timerId = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timerId);
    }, [onDismiss]);

    const config = {
        alert: {
            iconColor: 'text-[#FF3B30]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
        warning: {
            iconColor: 'text-[#FF9500]',
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
    };

    const currentConfig = config[type];

    return (
        <div className="glass apple-card p-5 flex items-center gap-4 animate-fade-in-slide-up border-none shadow-2xl" role="alert">
            <div className={currentConfig.iconColor}>
                {currentConfig.icon}
            </div>
            <span className="flex-grow text-sm font-bold text-[var(--apple-text)]">{message}</span>
            <button onClick={onDismiss} className="ml-2 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-[var(--apple-text-secondary)]" aria-label="Fechar notificação">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default NotificationToast;

