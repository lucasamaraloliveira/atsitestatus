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
import SettingsView from '@/views/SettingsView';
import Sidebar from '@/components/Sidebar';
import { FileText, Activity } from 'lucide-react';
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
        childUsers,
        addChildUser,
        removeChildUser,
        userRole,
        userProfile,
        handleAddSite,
        handleRequestDelete,
        handleConfirmDelete,
        handleCloseDeleteModal,
        handleUndoDelete,
        handleEditSite,
        handleUpdateSite,
        handleRefreshSite,
        handleRefreshAll,
        requestClearHistory,
        confirmClearHistory,
        closeClearHistoryModal
    } = useSiteMonitoring(currentUser);

    const handleLogin = async (username: string, password?: string): Promise<boolean> => {
        if (!username.trim()) return false;
        
        try {
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/services/firebase');
            const userRef = doc(db, 'users', username);
            const userSnap = await getDoc(userRef);

            if (!password) {
                // Login via Google
                if (!userSnap.exists()) {
                    await setDoc(userRef, { 
                        username, 
                        role: 'admin', 
                        sites: [], 
                        isMonitoring: false, 
                        monitoringInterval: 60,
                        childUsers: [],
                        createdAt: Date.now()
                    });
                }
                localStorage.setItem('currentUser', username);
                setCurrentUser(username);
                return true;
            }

            // Login manual com senha
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.password === password) {
                    localStorage.setItem('currentUser', username);
                    setCurrentUser(username);
                    return true;
                }
            }
            
            alert("Usuário ou senha incorretos.");
            return false;
        } catch (error) {
            console.error("Erro ao autenticar (Offline?):", error);
            alert("Erro ao conectar ao banco de dados. Verifique sua conexão ou tente novamente.");
            return false;
        }
    };

    const handleRegister = async (username: string, password: string, name: string): Promise<boolean> => {
        try {
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/services/firebase');
            const userRef = doc(db, 'users', username);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                alert("Este usuário já existe. Escolha outro username.");
                return false;
            }
            
            await setDoc(userRef, {
                username,
                name,
                password,
                role: 'admin',
                sites: [],
                isMonitoring: false,
                monitoringInterval: 60,
                childUsers: [],
                createdAt: Date.now()
            });
            
            localStorage.setItem('currentUser', username);
            setCurrentUser(username);
            return true;
        } catch (error) {
            console.error("Erro ao registrar (Offline?):", error);
            alert("Erro ao conectar ao banco de dados para registro.");
            return false;
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
        return <LoginPage onLogin={handleLogin} onRegister={handleRegister} theme={theme} toggleTheme={toggleTheme} />;
    }

    const renderActiveView = () => {
        if (selectedSiteId && selectedSite) {
            return (
                <SiteDetailsPage 
                    site={selectedSite.site} 
                    logs={selectedSite.logs} 
                    onBack={() => setSelectedSiteId(null)} 
                    onRequestClearHistory={requestClearHistory}
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
                        <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight mb-8">Relatórios</h2>
                        <div className="glass apple-card p-12 text-center border-none">
                            <FileText size={64} className="mx-auto mb-6 text-[var(--apple-accent)]/80" />
                            <h3 className="text-xl font-bold mb-3">Histórico de Performance</h3>
                            <p className="text-[var(--apple-text-secondary)] text-sm max-w-sm mx-auto">Visualize o desempenho detalhado de sua infraestrutura digital e identifique gargalos em tempo real.</p>
                            <button 
                                onClick={() => setIsGlobalReportModalOpen(true)}
                                className="apple-button mt-8 h-12 px-8 shadow-xl shadow-[var(--apple-accent)]/20"
                            >
                                Gerar Relatório PDF
                            </button>
                        </div>
                    </div>
                );
            case 'activity':
                const allLogs = Object.values(logs).flat() as LogEntry[];
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight mb-8">Atividade Recente</h2>
                        <div className="glass apple-card p-8 border-none">
                            <p className="text-sm font-medium text-[var(--apple-text-secondary)] mb-8">Monitoramento em tempo real de alertas e eventos.</p>
                            <div className="space-y-3">
                                {allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15).map((log, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl hover:bg-[var(--apple-border)]/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${log.status === 'Online' ? 'bg-[#34C759] shadow-lg shadow-[#34C759]/40' : 'bg-[#FF3B30] shadow-lg shadow-[#FF3B30]/40'}`}></div>
                                            <div>
                                                <span className="font-bold text-sm block">{log.status}</span>
                                                <p className="text-[11px] text-[var(--apple-text-secondary)]">{log.message}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--apple-text-secondary)] tracking-widest bg-[var(--apple-border)]/20 px-3 py-1 rounded-full uppercase">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                                {allLogs.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-[var(--apple-input-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Activity size={24} className="text-[var(--apple-text-secondary)]" />
                                        </div>
                                        <p className="text-sm font-medium text-[var(--apple-text-secondary)]">Nenhuma atividade registrada.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <SettingsView 
                        isMonitoring={isMonitoring}
                        setIsMonitoring={setIsMonitoring}
                        monitoringInterval={monitoringInterval}
                        setMonitoringInterval={setMonitoringInterval}
                        childUsers={childUsers}
                        addChildUser={addChildUser}
                        removeChildUser={removeChildUser}
                        userRole={userRole}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--apple-bg)] text-[var(--apple-text)] transition-colors duration-500">
            <Sidebar 
                currentUser={currentUser}
                userProfile={userProfile}
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
                    <div className="glass apple-card py-4 px-6 shadow-2xl flex items-center justify-between gap-6 animate-fade-in-slide-up border border-[var(--apple-border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse"></div>
                            <p className="text-sm font-medium text-[var(--apple-text)]">
                                Site "<span className="font-bold truncate max-w-[150px] inline-block align-bottom">{recentlyDeleted.site.name || recentlyDeleted.site.url}</span>" removido.
                            </p>
                        </div>
                        <button 
                            onClick={handleUndoDelete}
                            className="text-sm font-bold text-[var(--apple-accent)] hover:underline active:scale-95 transition-all flex-shrink-0"
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
                <p className="text-sm font-medium">Tem certeza de que deseja excluir o site:</p>
                <p className="font-bold my-3 bg-[var(--apple-input-bg)] p-4 rounded-2xl break-all border border-[var(--apple-border)] text-xs text-[var(--apple-accent)]">{siteToDelete?.name || siteToDelete?.url}</p>
                <p className="text-[11px] text-[var(--apple-text-secondary)] leading-relaxed">Todo o histórico de monitoramento será removido, mas você poderá desfazer esta ação por alguns segundos.</p>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isClearHistoryModalOpen}
                onClose={closeClearHistoryModal}
                onConfirm={confirmClearHistory}
                title="Confirmar Limpeza de Histórico"
                confirmText="Limpar Histórico"
                confirmVariant="danger"
            >
                <p className="text-sm font-medium">Tem certeza de que deseja limpar todo o histórico do site:</p>
                <p className="font-bold my-3 bg-[var(--apple-input-bg)] p-4 rounded-2xl break-all border border-[var(--apple-border)] text-xs text-[var(--apple-accent)]">{siteToClearHistory?.name || siteToClearHistory?.url}</p>
                <p className="text-[11px] text-[var(--apple-text-secondary)] leading-relaxed">Esta ação não pode ser desfeita e todos os logs antigos serão apagados permanentemente.</p>
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
