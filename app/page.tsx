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
import { FileText, Activity, BarChart3, Trash2 } from 'lucide-react';
import { StatusResult, LogEntry, CheckStatus } from '@/types';
import AddSiteModal from '@/components/AddSiteModal';

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
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        const savedUser = localStorage.getItem('currentUser');
        const savedTheme = localStorage.getItem('theme');
        const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

        if (savedUser) setCurrentUser(savedUser);
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
        
        setSidebarCollapsed(savedCollapsed);

        // Oculta splash após 3 segundos (tempo para o boot visual)
        const timer = setTimeout(() => setShowSplash(false), 3000);
        return () => clearTimeout(timer);
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
        closeClearHistoryModal,
        viewMode,
        setViewMode,
        isAddSiteModalOpen,
        setIsAddSiteModalOpen,
        notificationEmail,
        emailNotifyType,
        saveEmailSettings,
        clearAllLogs
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

    if (showSplash) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center splash-screen animate-fade-in overflow-hidden">
                <div className="relative">
                    <div className="p-8 rounded-[2.5rem] glass shadow-2xl relative z-10 animate-pulse-logo">
                        <Activity size={80} className="text-[var(--apple-accent)]" strokeWidth={2.5} />
                    </div>
                    <div className="absolute -inset-4 bg-[var(--apple-accent)]/20 blur-3xl rounded-full opacity-50 z-0 animate-pulse"></div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6">
                    <div className="w-48 h-1 bg-[var(--apple-input-bg)] rounded-full overflow-hidden border border-[var(--apple-border)]">
                        <div className="h-full bg-gradient-to-r from-[var(--apple-accent)] to-[#AF52DE] animate-loading-bar"></div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--apple-text)] opacity-40">ATSiteStatus</p>
                        <p className="text-[9px] font-bold text-[var(--apple-text-secondary)]">Sincronizando infraestrutura...</p>
                    </div>
                </div>
            </div>
        );
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
                        filter={filter}
                        setFilter={setFilter}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        editingSiteId={editingSiteId}
                        isMonitoring={isMonitoring}
                        setIsMonitoring={setIsMonitoring}
                        monitoringInterval={monitoringInterval}
                        setMonitoringInterval={setMonitoringInterval}
                        setSelectedSiteId={setSelectedSiteId}
                        onOpenGlobalReportModal={() => setIsGlobalReportModalOpen(true)}
                        onOpenAddSiteModal={() => setIsAddSiteModalOpen(true)}
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
                const siteStats = sites.map(site => {
                    const siteLogs = logs[site.id] || [];
                    const onlineCount = siteLogs.filter(l => l.status === CheckStatus.ONLINE).length;
                    const uptime = siteLogs.length > 0 ? (onlineCount / siteLogs.length) * 100 : 100;
                    const avgLatency = siteLogs.length > 0 ? siteLogs.reduce((acc, curr) => acc + (curr.latency || 0), 0) / siteLogs.length : 0;
                    return { ...site, uptime, avgLatency, failureCount: siteLogs.length - onlineCount };
                });

                return (
                    <div className="animate-fade-in space-y-8 pb-10">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Relatórios Analíticos</h2>
                                <p className="text-[var(--apple-text-secondary)] font-medium mt-1">Extração de dados e métricas de disponibilidade.</p>
                            </div>
                            <button 
                                onClick={() => setIsGlobalReportModalOpen(true)}
                                className="apple-button h-12 px-8 shadow-xl shadow-[var(--apple-accent)]/20"
                            >
                                Exportar PDF Completo
                            </button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass apple-card p-6 border-none">
                                <p className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest mb-2">Uptime Médio Global</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black text-[#34C759]">
                                        {(siteStats.reduce((acc, curr) => acc + curr.uptime, 0) / (siteStats.length || 1)).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="glass apple-card p-6 border-none">
                                <p className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest mb-2">Latência Média</p>
                                <div className="flex items-end gap-2 text-2xl font-black text-[var(--apple-accent)]">
                                    <span>{(siteStats.reduce((acc, curr) => acc + curr.avgLatency, 0) / (siteStats.length || 1)).toFixed(0)} ms</span>
                                </div>
                            </div>
                            <div className="glass apple-card p-6 border-none text-[#FF3B30]">
                                <p className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest mb-2">Falhas no Período</p>
                                <div className="flex items-end gap-2 text-3xl font-black">
                                    <span>{siteStats.reduce((acc, curr) => acc + curr.failureCount, 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass apple-card overflow-hidden border-none">
                            <div className="px-8 py-6 border-b border-[var(--apple-border)] flex items-center justify-between bg-white/5">
                                <h3 className="font-bold flex items-center gap-2"><BarChart3 size={18} className="text-[var(--apple-accent)]" /> Desempenho por Domínio</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] text-[10px] font-black uppercase tracking-widest">
                                            <th className="px-8 py-4">Site</th>
                                            <th className="px-8 py-4">Uptime (%)</th>
                                            <th className="px-8 py-4">Latência (Média)</th>
                                            <th className="px-8 py-4">Status Atual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--apple-border)]">
                                        {siteStats.map(stat => (
                                            <tr key={stat.id} className="hover:bg-[var(--apple-input-bg)] transition-colors">
                                                <td className="px-8 py-4 font-bold text-sm">{stat.name || stat.url}</td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <div className={`h-full ${stat.uptime > 99 ? 'bg-[#34C759]' : stat.uptime > 95 ? 'bg-yellow-500' : 'bg-[#FF3B30]'}`} style={{ width: `${stat.uptime}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-bold">{stat.uptime.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-xs font-medium">{stat.avgLatency.toFixed(0)} ms</td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${stat.status === CheckStatus.ONLINE ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                                                        {stat.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'activity':
                const allLogs = Object.values(logs).flat() as LogEntry[];
                return (
                    <div className="animate-fade-in pb-10">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Atividade Recente</h2>
                                <p className="text-[var(--apple-text-secondary)] font-medium mt-1">Histórico completo de logs e alertas.</p>
                            </div>
                            {allLogs.length > 0 && (
                                <button 
                                    onClick={clearAllLogs}
                                    className="px-4 py-2 bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-bold rounded-xl hover:bg-[#FF3B30] hover:text-white transition-all flex items-center gap-2 border border-[#FF3B30]/20 active:scale-95"
                                >
                                    <Trash2 size={14} />
                                    Limpar Todo Histórico
                                </button>
                            )}
                        </header>
                        
                        <div className="glass apple-card p-8 border-none shadow-xl">
                            <div className="space-y-3">
                                {allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50).map((log, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl hover:bg-[var(--apple-border)]/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${log.status === CheckStatus.ONLINE ? 'bg-[#34C759] shadow-lg shadow-[#34C759]/40' : 'bg-[#FF3B30] shadow-lg shadow-[#FF3B30]/40'} group-hover:scale-125 transition-transform`}></div>
                                            <div>
                                                <span className="font-bold text-sm block">{log.status}</span>
                                                <p className="text-[11px] text-[var(--apple-text-secondary)]">{log.message}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-[var(--apple-text-secondary)] tracking-widest bg-[var(--apple-border)]/20 px-3 py-1 rounded-full uppercase">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            <p className="text-[9px] text-[var(--apple-text-secondary)] mt-1 font-bold">{new Date(log.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {allLogs.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-[var(--apple-input-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Activity size={32} className="text-[var(--apple-text-secondary)] opacity-30" />
                                        </div>
                                        <h3 className="font-bold text-[var(--apple-text)]">Nada por aqui ainda</h3>
                                        <p className="text-sm font-medium text-[var(--apple-text-secondary)] mt-1">Os eventos aparecerão assim que o monitoramento começar.</p>
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
                        notificationEmail={notificationEmail}
                        emailNotifyType={emailNotifyType}
                        saveEmailSettings={saveEmailSettings}
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
                    setIsAddSiteModalOpen(true);
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

            <AddSiteModal
                isOpen={isAddSiteModalOpen}
                onClose={() => setIsAddSiteModalOpen(false)}
                onAdd={handleAddSite}
            />
        </div>
    );
};

export default App;
