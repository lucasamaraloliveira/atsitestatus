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
import ReportsView from '@/views/ReportsView';
import Sidebar from '@/components/Sidebar';
import { FileText, Activity, BarChart3, Trash2, Menu, X, LayoutDashboard, PlusCircle, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { StatusResult, LogEntry, CheckStatus } from '@/types';
import AddSiteModal from '@/components/AddSiteModal';
import EditSiteModal from '@/components/EditSiteModal';

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

    useEffect(() => {
        if (currentUser) {
            setActiveView('dashboard');
        }
    }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setShowSplash(false);
        setActiveView('dashboard');
    };

    const {
        sites, logs, filter, setFilter, sortOrder, setSortOrder,
        editingSiteId, isMonitoring, setIsMonitoring, monitoringInterval, setMonitoringInterval,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification, addToastNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        childUsers, addChildUser, removeChildUser, updateChildUser, userRole, userProfile,
        isDeleteChildModalOpen, childToDelete, confirmDeleteChild, undoDeleteChild, setIsDeleteChildModalOpen,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite, handleUpdateSite, handleRefreshSite, handleRefreshAll,
        requestClearHistory, confirmClearHistory, closeClearHistoryModal,
        viewMode, setViewMode, isAddSiteModalOpen, setIsAddSiteModalOpen,
        notificationEmail, emailNotifyType, setNotificationEmail, setEmailNotifyType, saveEmailSettings,
        inactivityTimeout, setInactivityTimeout,
        clearAllLogs,
        parentName,
        audioSettings,
        saveAudioSettings,
        weeklyReportsEnabled,
        setWeeklyReportsEnabled
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

    // Detecção de Relatório Compartilhado
    useEffect(() => {
        const checkHash = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#report=')) {
                try {
                    const encodedData = hash.replace('#report=', '');
                    const jsonString = atob(encodedData);
                    const data = JSON.parse(jsonString);
                    setSharedReportData(data);
                } catch (e) {
                    console.error("Erro ao decodificar relatório:", e);
                }
            } else {
                setSharedReportData(null);
            }
        };

        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

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
        if (!username.trim() || username.trim().toLowerCase() === 'root') {
            if (username.trim().toLowerCase() === 'root') alert("Este nome de usuário é reservado e não pode ser utilizado.");
            return false;
        }
        try {
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/services/firebase');
            const userRef = doc(db, 'users', username);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (!password || userData.password === password) {
                    localStorage.setItem('currentUser', username);
                    setCurrentUser(username);
                    setShowSplash(true);
                    return true;
                }
            } else if (!password) {
                // Registro automático apenas para novos admins via Google (sem senha)
                await setDoc(userRef, { username, role: 'admin', sites: [], isMonitoring: false, monitoringInterval: 60, childUsers: [], createdAt: Date.now() });
                localStorage.setItem('currentUser', username);
                setCurrentUser(username);
                setShowSplash(true);
                return true;
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
                        handleEditSite={handleEditSite} handleUpdateSiteUrl={(id, u, n, k) => handleUpdateSite(id, u, n, k)}
                        handleRefreshSite={handleRefreshSite} handleRequestDelete={handleRequestDelete}
                        handleRefreshAll={handleRefreshAll}
                        currentUser={currentUser!}
                        onLogout={handleLogout}
                        userProfile={userProfile}
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
                        addChildUser={addChildUser} removeChildUser={removeChildUser} 
                        updateChildUser={updateChildUser} userRole={userRole}
                        onLogout={handleLogout}
                        isDeleteChildModalOpen={isDeleteChildModalOpen}
                        setIsDeleteChildModalOpen={setIsDeleteChildModalOpen}
                        audioSettings={audioSettings}
                        saveAudioSettings={saveAudioSettings}
                    />
                );
            case 'reports':
                return (
                    <ReportsView
                        sites={sites}
                        logs={logs}
                        onExportReport={() => setIsGlobalReportModalOpen(true)}
                        notificationEmail={notificationEmail}
                        weeklyReportsEnabled={weeklyReportsEnabled}
                        setWeeklyReportsEnabled={setWeeklyReportsEnabled}
                    />
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
                    parentName={parentName}
                />
            </div>

            <main className={`flex-1 transition-all duration-300 overflow-y-auto p-6 md:p-12 pb-32 md:pb-12 ${sidebarCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
                {/* Header Mobile Minimalista */}
                <header className="flex md:hidden items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="text-[var(--apple-accent)]" size={24} />
                        <h1 className="text-2xl font-black tracking-tighter text-[var(--apple-text)]">Status</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isMonitoring ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-gray-400/10 text-gray-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-[#34C759] animate-pulse' : 'bg-gray-400'}`}></div>
                            {isMonitoring ? 'Ativo' : 'Offline'}
                        </div>
                        <button onClick={handleLogout} className="p-2.5 bg-[#FF3B30]/10 text-[#FF3B30] rounded-2xl active:scale-90 transition-all">
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {renderActiveView()}
            </main>

            {/* Floating Theme Toggle - Mobile Only */}
            <button 
                onClick={toggleTheme}
                className="fixed bottom-24 right-5 w-12 h-12 md:hidden z-[100] flex items-center justify-center glass rounded-2xl border border-[var(--apple-border)] shadow-2xl active:scale-95 transition-all duration-300 group"
                aria-label="Alternar Tema"
            >
                <div className="relative w-6 h-6 flex items-center justify-center">
                    {theme === 'dark' ? (
                        <Sun size={20} className="text-[#FFDB5E] animate-in zoom-in duration-300" strokeWidth={2.5} />
                    ) : (
                        <Moon size={20} className="text-[#5856D6] animate-in zoom-in duration-300" strokeWidth={2.5} />
                    )}
                </div>
                {/* Subtle highlight effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-active:opacity-100 transition-opacity"></div>
            </button>

            <nav className="fixed bottom-0 left-0 right-0 h-20 md:hidden z-[90] flex items-center justify-around px-2 glass border-t border-[var(--apple-border)] pb-6 pt-2">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
                    { id: 'reports', icon: BarChart3, label: 'Relatórios' },
                    { id: 'add', icon: PlusCircle, label: 'Novo', action: () => setIsAddSiteModalOpen(true) },
                    { id: 'settings', icon: Settings, label: 'Ajustes' }
                ].filter(item => !(item.id === 'add' && userProfile?.profile === 'viewer')).map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => {
                            if(item.action) item.action();
                            else { setActiveView(item.id); setSelectedSiteId(null); }
                        }}
                        className={`flex flex-col items-center justify-center transition-all ${activeView === item.id && !item.action ? 'text-[var(--apple-accent)] scale-110' : 'text-[var(--apple-text-secondary)] opacity-60'}`}
                    >
                        <item.icon size={item.id === 'add' ? 32 : 24} strokeWidth={activeView === item.id ? 2.5 : 2} className={item.id === 'add' ? 'text-[var(--apple-accent)]' : ''} />
                        <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${activeView === item.id && !item.action ? 'text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)]'}`}>{item.label}</span>
                    </button>
                ))}
            </nav>

            {notifications.length > 0 && (
                <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
                    {notifications.map(n => (
                        <NotificationToast 
                            key={n.id} 
                            message={n.message} 
                            type={n.type} 
                            onDismiss={() => removeNotification(n.id)} 
                            onClick={n.message.includes('desfazer') ? (n.message.includes('operador') ? undoDeleteChild : handleUndoDelete) : undefined}
                        />
                    ))}
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete}
                title="Excluir Site" confirmText="Excluir" confirmVariant="danger"
            >
                Tem certeza que deseja remover {siteToDelete?.name || siteToDelete?.url}? Todos os dados serão perdidos.
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isDeleteChildModalOpen}
                onClose={() => setIsDeleteChildModalOpen(false)}
                onConfirm={confirmDeleteChild}
                title="Remover Membro"
                confirmText="Remover"
                confirmVariant="danger"
            >
                Tem certeza que deseja remover o operador <strong>{childToDelete?.name || childToDelete?.username}</strong>? O acesso será revogado imediatamente.
            </ConfirmationModal>

            <ConfirmationModal 
                isOpen={isClearHistoryModalOpen} onClose={closeClearHistoryModal} onConfirm={confirmClearHistory}
                title="Limpar Logs" confirmText="Limpar" confirmVariant="danger"
            >
                Deseja apagar os registros de {siteToClearHistory?.name || siteToClearHistory?.url}?
            </ConfirmationModal>

            <GlobalReportModal isOpen={isGlobalReportModalOpen} onClose={() => setIsGlobalReportModalOpen(false)} sites={sites} logs={logs} />
            <AddSiteModal isOpen={isAddSiteModalOpen} onClose={() => setIsAddSiteModalOpen(false)} onAdd={(u, n, k) => handleAddSite(u, n, k)} />
            <EditSiteModal 
                isOpen={!!editingSiteId} 
                onClose={() => handleEditSite(null as any)} 
                onUpdate={handleUpdateSite} 
                site={sites.find(s => s.id === editingSiteId) || null} 
            />
            
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
