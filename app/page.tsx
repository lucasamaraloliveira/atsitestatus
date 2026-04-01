"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
import { FileText, Activity, BarChart3, Trash2, Menu, X, LayoutDashboard, PlusCircle, Settings, LogOut } from 'lucide-react';
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
    const [showSplash, setShowSplash] = useState(false);

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
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setShowSplash(false);
    };

    const {
        sites, logs, filter, setFilter, sortOrder, setSortOrder,
        editingSiteId, isMonitoring, setIsMonitoring, monitoringInterval, setMonitoringInterval,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification, addToastNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        childUsers, addChildUser, removeChildUser, userRole, userProfile,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite, handleUpdateSite, handleRefreshSite, handleRefreshAll,
        requestClearHistory, confirmClearHistory, closeClearHistoryModal,
        viewMode, setViewMode, isAddSiteModalOpen, setIsAddSiteModalOpen,
        notificationEmail, emailNotifyType, setNotificationEmail, setEmailNotifyType, saveEmailSettings,
        inactivityTimeout, setInactivityTimeout,
        clearAllLogs
    } = useSiteMonitoring(currentUser);

    // Watchdog de Inatividade
    useEffect(() => {
        if (!currentUser || inactivityTimeout === -1) return;
        let timeoutId: number;
        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                handleLogout();
                addToastNotification("Sessão encerrada por inatividade.", "alert");
            }, inactivityTimeout * 1000);
        };
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [currentUser, inactivityTimeout]);

    // Efeito para timer do Splash
    useEffect(() => {
        if (showSplash) {
            const timer = setTimeout(() => setShowSplash(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSplash]);

    const handleRegister = async (username: string, password: string, name: string): Promise<boolean> => {
        if (!username.trim() || !password.trim()) return false;
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/services/firebase');
            await setDoc(doc(db, 'users', username), { username, password, name, role: 'admin', sites: [], isMonitoring: false, monitoringInterval: 60, childUsers: [], createdAt: Date.now() });
            localStorage.setItem('currentUser', username);
            setCurrentUser(username);
            setShowSplash(true);
            return true;
        } catch (error) {
            console.error("Erro no registro:", error);
            return false;
        }
    };

    const handleLogin = async (username: string, password?: string): Promise<boolean> => {
        if (!username.trim()) return false;
        try {
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/services/firebase');
            const userRef = doc(db, 'users', username);
            const userSnap = await getDoc(userRef);
            if (!password) {
                if (!userSnap.exists()) {
                    await setDoc(userRef, { username, role: 'admin', sites: [], isMonitoring: false, monitoringInterval: 60, childUsers: [], createdAt: Date.now() });
                }
                localStorage.setItem('currentUser', username);
                setCurrentUser(username);
                setShowSplash(true);
                return true;
            }
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.password === password) {
                    localStorage.setItem('currentUser', username);
                    setCurrentUser(username);
                    setShowSplash(true);
                    return true;
                }
            }
            alert("Usuário ou senha incorretos.");
            return false;
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            return false;
        }
    };

    const selectedSite = useMemo(() => {
        if (selectedSiteId) {
            const siteData = sites.find(s => s.id === selectedSiteId);
            if (siteData) return { site: siteData, logs: (logs[selectedSiteId] || []) };
        }
        return null;
    }, [selectedSiteId, sites, logs]);

    const renderActiveView = () => {
        if (selectedSite) {
            return (
                <SiteDetailsPage 
                    site={selectedSite.site} logs={selectedSite.logs} 
                    onBack={() => setSelectedSiteId(null)}
                    onRequestClearHistory={(id) => requestClearHistory(id)}
                />
            );
        }

        switch (activeView) {
            case 'dashboard':
                return (
                    <DashboardPage 
                        sites={sites} logs={logs} filter={filter} setFilter={setFilter} 
                        sortOrder={sortOrder} setSortOrder={setSortOrder} 
                        viewMode={viewMode} setViewMode={setViewMode}
                        editingSiteId={editingSiteId}
                        isMonitoring={isMonitoring} setIsMonitoring={(v) => setIsMonitoring(v)}
                        monitoringInterval={monitoringInterval} setMonitoringInterval={(v) => setMonitoringInterval(v)}
                        setSelectedSiteId={setSelectedSiteId}
                        onOpenGlobalReportModal={() => setIsGlobalReportModalOpen(true)}
                        onOpenAddSiteModal={() => setIsAddSiteModalOpen(true)}
                        handleEditSite={handleEditSite} handleUpdateSiteUrl={(id, u, n) => handleUpdateSite(id, u, n)}
                        handleRefreshSite={handleRefreshSite} handleRequestDelete={handleRequestDelete}
                        handleRefreshAll={handleRefreshAll}
                        currentUser={currentUser!} onLogout={handleLogout}
                        theme={theme} toggleTheme={toggleTheme}
                    />
                );
            case 'settings':
                return (
                    <SettingsView 
                        isMonitoring={isMonitoring} setIsMonitoring={setIsMonitoring}
                        monitoringInterval={monitoringInterval} setMonitoringInterval={setMonitoringInterval}
                        notificationEmail={notificationEmail} emailNotifyType={emailNotifyType}
                        saveEmailSettings={saveEmailSettings} inactivityTimeout={inactivityTimeout}
                        setInactivityTimeout={setInactivityTimeout} childUsers={childUsers}
                        addChildUser={addChildUser} removeChildUser={removeChildUser} userRole={userRole}
                    />
                );
            case 'reports':
                return (
                    <div className="animate-fade-in pb-20">
                        <header className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-4xl font-extrabold tracking-tight">Relatórios</h2>
                                <p className="text-[var(--apple-text-secondary)] font-medium">Análise de dados da infraestrutura.</p>
                            </div>
                            <button onClick={() => setIsGlobalReportModalOpen(true)} className="apple-button h-11 px-6 shadow-lg">Exportar PDF</button>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass apple-card p-8 text-center border-none shadow-xl">
                                <BarChart3 size={40} className="mx-auto mb-4 text-[var(--apple-accent)]" />
                                <h3 className="font-bold text-lg">Performance Máxima</h3>
                                <p className="text-sm text-[var(--apple-text-secondary)] mt-2">Dados otimizados e relatórios consolidados.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'activity':
                const allLogs = Object.values(logs).flat() as LogEntry[];
                return (
                    <div className="animate-fade-in pb-24">
                        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                            <div>
                                <h2 className="text-4xl font-extrabold tracking-tight">Atividade</h2>
                                <p className="text-[var(--apple-text-secondary)] font-medium">Histórico de eventos em tempo real.</p>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-[var(--apple-input-bg)] p-1.5 pl-5 rounded-3xl border border-[var(--apple-border)]">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Tempo Real</span>
                                    <span className="text-xs font-bold">{isMonitoring ? 'Ativo' : 'Pausado'}</span>
                                </div>
                                <button 
                                    onClick={() => setIsMonitoring(!isMonitoring)}
                                    className={`w-12 h-7 rounded-full transition-all relative ${isMonitoring ? 'bg-[#34C759]' : 'bg-gray-200 dark:bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isMonitoring ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                                {allLogs.length > 0 && (
                                    <button onClick={clearAllLogs} className="ml-4 p-2.5 bg-[#FF3B30]/10 text-[#FF3B30] rounded-2xl hover:bg-[#FF3B30]/20 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </header>
                        <div className="glass apple-card p-0 overflow-hidden border-none shadow-2xl">
                            <div className="divide-y divide-[var(--apple-border)]">
                                {allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50).map((log, idx) => (
                                    <div key={idx} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2.5 h-2.5 rounded-full ${log.status === CheckStatus.ONLINE ? 'bg-[#34C759]' : log.status === CheckStatus.CHECKING ? 'bg-[#007AFF]' : log.status === CheckStatus.ERROR ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'}`}></div>
                                            <div>
                                                <span className="font-bold text-sm block tracking-tight">{log.status}</span>
                                                <p className="text-[11px] text-[var(--apple-text-secondary)] font-medium">{log.message}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold opacity-30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (!isMounted) return null;

    if (showSplash) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--apple-bg)] animate-fade-in">
                <div className="p-8 rounded-[2.5rem] glass shadow-2xl animate-pulse-logo">
                    <Activity size={80} className="text-[var(--apple-accent)]" />
                </div>
                <div className="mt-12 w-48 h-1 bg-[var(--apple-input-bg)] rounded-full overflow-hidden border border-[var(--apple-border)]">
                    <div className="h-full bg-gradient-to-r from-[var(--apple-accent)] to-[#AF52DE] animate-loading-bar"></div>
                </div>
            </div>
        );
    }

    if (sharedReportData) return <SharedReportPage data={sharedReportData} />;
    if (!currentUser) return <LoginPage onLogin={handleLogin} onRegister={handleRegister} theme={theme} toggleTheme={toggleTheme} />;

    return (
        <div className="min-h-screen bg-[var(--apple-bg)] flex flex-col md:flex-row transition-all duration-500 overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="hidden md:block">
                <Sidebar 
                    activeView={activeView} setActiveView={(v) => { setActiveView(v); setSelectedSiteId(null); }}
                    onLogout={handleLogout} currentUser={currentUser!} userProfile={userProfile}
                    theme={theme} toggleTheme={toggleTheme} onAddSite={() => setIsAddSiteModalOpen(true)}
                    isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed}
                />
            </div>

            <main className={`flex-1 transition-all duration-300 overflow-y-auto w-full p-6 md:p-12 pb-32 md:pb-12 ${sidebarCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
                {/* Header Mobile Minimalista */}
                <header className="flex md:hidden items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="text-[var(--apple-accent)]" size={24} />
                        <h1 className="text-2xl font-black tracking-tighter text-[var(--apple-text)]">Status</h1>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isMonitoring ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-gray-400/10 text-gray-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-[#34C759] animate-pulse' : 'bg-gray-400'}`}></div>
                        {isMonitoring ? 'Ativo' : 'Offline'}
                    </div>
                </header>

                {renderActiveView()}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 h-20 md:hidden z-[90] flex items-center justify-around px-2 glass-dark border-t border-white/5 pb-5">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
                    { id: 'reports', icon: BarChart3, label: 'Relatórios' },
                    { id: 'add', icon: PlusCircle, label: 'Novo', action: () => setIsAddSiteModalOpen(true) },
                    { id: 'activity', icon: Activity, label: 'Atividade' },
                    { id: 'settings', icon: Settings, label: 'Ajustes' }
                ].map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => {
                            if(item.action) item.action();
                            else { setActiveView(item.id); setSelectedSiteId(null); }
                        }}
                        className={`flex flex-col items-center justify-center transition-all ${activeView === item.id && !item.action ? 'text-[var(--apple-accent)] scale-110' : 'text-white/40'}`}
                    >
                        <item.icon size={item.id === 'add' ? 32 : 24} strokeWidth={activeView === item.id ? 2.5 : 2} className={item.id === 'add' ? 'text-[var(--apple-accent)]' : ''} />
                        <span className="text-[9px] font-black uppercase tracking-tighter mt-1">{item.label}</span>
                    </button>
                ))}
            </nav>

            {notifications.length > 0 && (
                <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
                    {notifications.map(n => <NotificationToast key={n.id} message={n.message} type={n.type} onDismiss={() => removeNotification(n.id)} />)}
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete}
                title="Excluir Site" confirmText="Excluir" confirmVariant="danger"
            >
                Tem certeza que deseja remover {siteToDelete?.name || siteToDelete?.url}? Todos os dados serão perdidos.
            </ConfirmationModal>

            <ConfirmationModal 
                isOpen={isClearHistoryModalOpen} onClose={closeClearHistoryModal} onConfirm={confirmClearHistory}
                title="Limpar Logs" confirmText="Limpar" confirmVariant="danger"
            >
                Deseja apagar os registros de {siteToClearHistory?.name || siteToClearHistory?.url}?
            </ConfirmationModal>

            <GlobalReportModal isOpen={isGlobalReportModalOpen} onClose={() => setIsGlobalReportModalOpen(false)} sites={sites} logs={logs} />
            <AddSiteModal isOpen={isAddSiteModalOpen} onClose={() => setIsAddSiteModalOpen(false)} onAdd={handleAddSite} />
            
            {recentlyDeleted && (
                <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-slide-up">
                    <div className="bg-[#1C1C1E] text-white px-6 py-4 rounded-3xl flex items-center gap-6 shadow-2xl border border-white/10">
                        <span className="text-sm font-bold">Site removido.</span>
                        <button onClick={handleUndoDelete} className="text-[var(--apple-accent)] font-black uppercase text-[10px] tracking-widest">Desfazer</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
