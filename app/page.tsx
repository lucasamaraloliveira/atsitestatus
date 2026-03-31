"use client";

import React, { useEffect, useState } from 'react';
import { useSiteMonitoring } from '@/hooks/useSiteMonitoring';
import DashboardPage from '@/views/DashboardPage';
import SiteDetailsPage from '@/views/SiteDetailsPage';
import NotificationToast from '@/components/NotificationToast';
import ConfirmationModal from '@/components/ConfirmationModal';
import GlobalReportModal from '@/components/GlobalReportModal';
import LoginPage from '@/views/LoginPage';
import SharedReportPage from '@/views/SharedReportPage';
import Sidebar from '@/components/Sidebar';
import { FileText } from 'lucide-react';
import { StatusResult, LogEntry } from '@/types';

interface SharedReportData {
    sites: StatusResult[];
    logs: Record<string, LogEntry[]>;
    startDate: string;
    endDate: string;
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [sharedReportData, setSharedReportData] = useState<SharedReportData | null>(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedUser = localStorage.getItem('currentUser');
        const savedTheme = localStorage.getItem('theme');
        const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

        if (savedUser) setCurrentUser(savedUser);
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
        
        setSidebarCollapsed(savedCollapsed);
    }, []);

    useEffect(() => {
        const checkSidebar = () => {
            setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
        };
        window.addEventListener('storage', checkSidebar);
        const interval = setInterval(checkSidebar, 500); // Polling as fallback for same-window changes
        return () => {
            window.removeEventListener('storage', checkSidebar);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#report=')) {
                try {
                    const encodedData = hash.substring(8);
                    const decodedJson = atob(encodedData);
                    const data = JSON.parse(decodedJson);
                    if (data && data.sites && data.logs) {
                        setSharedReportData(data);
                    }
                } catch (error) {
                    console.error("Falha ao analisar dados do relatório compartilhado:", error);
                    window.location.hash = ''; 
                }
            } else {
                setSharedReportData(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Executar na carga inicial

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const {
        sites,
        logs,
        newSiteUrl,
        setNewSiteUrl,
        newSiteName,
        setNewSiteName,
        filter,
        setFilter,
        sortOrder,
        setSortOrder,
        editingSiteId,
        isMonitoring,
        setIsMonitoring,
        monitoringInterval,
        setMonitoringInterval,
        selectedSiteId,
        setSelectedSiteId,
        recentlyDeleted,
        notifications,
        removeNotification,
        isDeleteModalOpen,
        siteToDelete,
        isGlobalReportModalOpen,
        setIsGlobalReportModalOpen,
        isClearHistoryModalOpen,
        siteToClearHistory,
        handleAddSite,
        handleRequestDelete,
        handleConfirmDelete,
        handleCloseDeleteModal,
        handleUndoDelete,
        handleEditSite,
        handleUpdateSite,
        handleRefreshSite,
        handleRefreshAll,
        handleRequestClearHistory,
        handleConfirmClearHistory,
        handleCloseClearHistoryModal
    } = useSiteMonitoring(currentUser);

    const handleLogin = (username: string) => {
        if (username.trim()) {
            localStorage.setItem('currentUser', username.trim());
            setCurrentUser(username.trim());
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

    const selectedSite = React.useMemo(() => {
        if (selectedSiteId) {
            const siteData = sites.find(s => s.id === selectedSiteId);
            if (siteData) {
                const siteLogs = (logs[selectedSiteId] || []).sort((a, b) => b.timestamp - a.timestamp);
                return { site: siteData, logs: siteLogs };
            }
        }
        return null;
    }, [sites, logs, selectedSiteId]);

    // Evitar renderização até que o componente esteja montado no cliente para prevenir erros de hidratação
    if (!isMounted) {
        return <div className="min-h-screen bg-[var(--apple-bg)]"></div>;
    }

    if (sharedReportData) {
        return <SharedReportPage data={sharedReportData} />;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
    }

    const renderActiveView = () => {
        if (selectedSiteId && selectedSite) {
            return (
                <SiteDetailsPage 
                    site={selectedSite.site} 
                    logs={selectedSite.logs} 
                    onBack={() => setSelectedSiteId(null)} 
                    onRequestClearHistory={handleRequestClearHistory}
                />
            );
        }

        switch (activeView) {
            case 'dashboard':
                return (
                    <DashboardPage
                        sites={sites}
                        logs={logs}
                        newSiteUrl={newSiteUrl}
                        setNewSiteUrl={setNewSiteUrl}
                        newSiteName={newSiteName}
                        setNewSiteName={setNewSiteName}
                        filter={filter}
                        setFilter={setFilter}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        editingSiteId={editingSiteId}
                        isMonitoring={isMonitoring}
                        setIsMonitoring={setIsMonitoring}
                        monitoringInterval={monitoringInterval}
                        setMonitoringInterval={setMonitoringInterval}
                        setSelectedSiteId={setSelectedSiteId}
                        onOpenGlobalReportModal={() => setIsGlobalReportModalOpen(true)}
                        handleAddSite={handleAddSite}
                        handleEditSite={handleEditSite}
                        handleUpdateSiteUrl={handleUpdateSite}
                        handleRefreshSite={handleRefreshSite}
                        handleRequestDelete={handleRequestDelete}
                        handleRefreshAll={handleRefreshAll}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        theme={theme}
                        toggleTheme={toggleTheme}
                    />
                );
            case 'reports':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold mb-6">Relatórios</h2>
                        <div className="glass apple-card p-8 text-center">
                            <FileText size={48} className="mx-auto mb-4 text-[var(--apple-text-secondary)]" />
                            <p className="text-[var(--apple-text-secondary)]">Seus relatórios detalhados aparecerão aqui em breve.</p>
                            <button 
                                onClick={() => setIsGlobalReportModalOpen(true)}
                                className="apple-button mt-6"
                            >
                                Gerar Relatório Global
                            </button>
                        </div>
                    </div>
                );
            case 'activity':
                const allLogs = Object.values(logs).flat() as LogEntry[];
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold mb-6">Atividade Recente</h2>
                        <div className="glass apple-card p-8">
                            <p className="text-[var(--apple-text-secondary)]">Histórico de alertas e eventos de monitoramento.</p>
                            <div className="mt-6 space-y-4">
                                {allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).map((log, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="font-semibold">{log.status}</span>
                                        </div>
                                        <span className="text-xs text-[var(--apple-text-secondary)]">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                ))}
                                {allLogs.length === 0 && (
                                    <p className="text-center text-sm italic py-4">Nenhuma atividade registrada ainda.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold mb-6">Configurações</h2>
                        <div className="glass apple-card p-8 space-y-8">
                            <div>
                                <h3 className="text-lg font-bold mb-4">Preferências de Monitoramento</h3>
                                <div className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-xl">
                                    <span>Intervalo Padrão de Monitoramento</span>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={monitoringInterval} 
                                            onChange={(e) => setMonitoringInterval(parseInt(e.target.value) || 10)}
                                            className="bg-transparent text-right font-black text-xl text-[var(--apple-accent)] w-16 focus:outline-none"
                                            min="5"
                                        />
                                        <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest bg-[var(--apple-border)] px-2 py-1 rounded-md">seg</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-4">Aparência</h3>
                                <button 
                                    onClick={toggleTheme}
                                    className="w-full flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-xl hover:bg-[var(--apple-border)] transition-colors"
                                >
                                    <span>Tema Atual</span>
                                    <span className="font-bold capitalize">{theme === 'light' ? 'Claro' : 'Escuro'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--apple-bg)] text-[var(--apple-text)] transition-colors duration-500">
            <Sidebar 
                currentUser={currentUser}
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
                activeView={activeView}
                setActiveView={(view) => {
                    setActiveView(view);
                    setSelectedSiteId(null);
                }}
                onAddSite={() => {
                    setActiveView('dashboard');
                    setSelectedSiteId(null);
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                }}
            />

            <main className={`transition-all duration-300 p-4 md:p-8 ${sidebarCollapsed ? 'ml-24 md:ml-28' : 'ml-64 md:ml-72'}`}>
                <div className="max-w-7xl mx-auto">
                    {renderActiveView()}
                </div>
            </main>
            
            <div aria-live="assertive" className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 w-full max-w-sm">
                {recentlyDeleted && (
                    <div className="bg-gray-700 text-white py-3 px-5 rounded-lg shadow-xl flex items-center gap-4 animate-fade-in-slide-up">
                        <p>Site "<span className="font-semibold max-w-[200px] inline-block truncate">{recentlyDeleted.site.name || recentlyDeleted.site.url}</span>" excluído.</p>
                        <button 
                            onClick={handleUndoDelete}
                            className="font-bold text-cyan-400 hover:text-cyan-300 underline flex-shrink-0"
                        >
                            Desfazer
                        </button>
                    </div>
                )}
                {notifications.map(notification => (
                    <NotificationToast
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        onDismiss={() => removeNotification(notification.id)}
                    />
                ))}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                confirmText="Excluir"
                confirmVariant="danger"
            >
                <p>Tem certeza de que deseja excluir o site:</p>
                <p className="font-bold my-2 bg-gray-700 p-2 rounded break-all">{siteToDelete?.name || siteToDelete?.url}</p>
                <p>Todo o histórico de monitoramento será removido, mas você poderá desfazer esta ação por alguns segundos.</p>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isClearHistoryModalOpen}
                onClose={handleCloseClearHistoryModal}
                onConfirm={handleConfirmClearHistory}
                title="Confirmar Limpeza de Histórico"
                confirmText="Limpar Histórico"
                confirmVariant="danger"
            >
                <p>Tem certeza de que deseja limpar todo o histórico do site:</p>
                <p className="font-bold my-2 bg-gray-700 p-2 rounded break-all">{siteToClearHistory?.name || siteToClearHistory?.url}</p>
                <p>Esta ação não pode ser desfeita.</p>
            </ConfirmationModal>

            <GlobalReportModal
                isOpen={isGlobalReportModalOpen}
                onClose={() => setIsGlobalReportModalOpen(false)}
                sites={sites}
                logs={logs}
            />
        </div>
    );
};

export default App;
