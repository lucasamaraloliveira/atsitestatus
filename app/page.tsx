"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Activity, 
    LayoutDashboard, 
    Settings as SettingsIcon, 
    BarChart3, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    TrendingUp, 
    Trash2,
    RefreshCw,
    Plus,
    User,
    LogOut,
    Eye,
    Zap,
    Map
} from 'lucide-react';
import useSiteMonitoring from '../hooks/useSiteMonitoring';
import DashboardPage from '../views/DashboardPage';
import SettingsView from '../views/SettingsView';
import ReportsPage from '../views/ReportsPage';
import SiteDetailsPage from '../views/SiteDetailsPage';
import SharedReportPage from '../views/SharedReportPage';
import Sidebar from '../components/Sidebar';
import AddSiteModal from '../components/AddSiteModal';
import GlobalReportModal from '../components/GlobalReportModal';
import NotificationToast from '../components/NotificationToast';
import LoginPage from '../views/LoginPage';

export default function App() {
    const { 
        sites, isMonitoring, handleSetIsMonitoring, monitoringInterval, handleSetMonitoringInterval,
        notificationEmail, emailNotifyType, saveEmailSettings,
        inactivityTimeout, setInactivityTimeout,
        logs, checkAllSites, activeView, setActiveView,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification, addToastNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        childUsers, addChildUser, removeChildUser, 
        isDeleteUserModalOpen, userToDelete, recentlyDeletedUser, handleConfirmDeleteUser, handleUndoDeleteUser, handleCloseDeleteUserModal,
        userRole, userProfile, handleUpdateProfile,
        isActivityTrackingEnabled, setIsActivityTrackingEnabled,
        logUserActivity,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite, handleUpdateSite, handleRefreshSite, handleRefreshAll,
        requestClearHistory, confirmClearHistory, closeClearHistoryModal,
        handleLogin, handleRegister, handleLogout, username, clearAllLogs,
        isAddSiteModalOpen, setIsAddSiteModalOpen
    } = useSiteMonitoring();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [filter, setFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
    const [sharedReportData, setSharedReportData] = useState<any | null>(null);
    const [isBooting, setIsBooting] = useState(true);

    // Booting logic to prevent flicker
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsBooting(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    // Activity Tracking Trigger
    useEffect(() => {
        if (activeView && logUserActivity && !isBooting) {
            logUserActivity(activeView);
        }
    }, [activeView, logUserActivity, isBooting]);

    // Shared Report Hash Handling
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#report=')) {
                try {
                    const encodedData = hash.replace('#report=', '');
                    const jsonString = atob(encodedData);
                    const data = JSON.parse(jsonString);
                    
                    if (data.expiresAt && Date.now() > data.expiresAt) {
                        alert("Este link de relatório expirou e não está mais disponível.");
                        window.location.hash = '';
                        return;
                    }
                    
                    setSharedReportData(data);
                } catch (error) {
                    console.error("Erro ao carregar relatório compartilhado:", error);
                }
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const selectedSite = useMemo(() => {
        if (selectedSiteId) {
            const siteData = sites.find(s => s.id === selectedSiteId);
            if (siteData) return { site: siteData, logs: (logs[selectedSiteId] || []) };
        }
        return null;
    }, [selectedSiteId, sites, logs]);

    const renderActiveView = () => {
        if (sharedReportData) {
            return <SharedReportPage data={sharedReportData} />;
        }

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
                        sites={sites} logs={logs} filter={filter as any} setFilter={setFilter} 
                        sortOrder={sortOrder} setSortOrder={setSortOrder} 
                        viewMode={viewMode} setViewMode={setViewMode}
                        editingSiteId={editingSiteId}
                        isMonitoring={isMonitoring} setIsMonitoring={(v) => handleSetIsMonitoring(v)}
                        monitoringInterval={monitoringInterval} setMonitoringInterval={(v) => handleSetMonitoringInterval(v)}
                        setSelectedSiteId={setSelectedSiteId}
                        onOpenGlobalReportModal={() => setIsGlobalReportModalOpen(true)}
                        onOpenAddSiteModal={() => setIsAddSiteModalOpen(true)}
                        handleEditSite={handleEditSite} handleUpdateSiteUrl={(id, u, n) => handleUpdateSite(id, u, n)}
                        handleRefreshSite={handleRefreshSite} handleRequestDelete={handleRequestDelete}
                        handleRefreshAll={handleRefreshAll}
                        currentUser={username || ''} onLogout={handleLogout}
                        theme="dark" toggleTheme={() => {}}
                    />
                );
            case 'settings':
                return (
                    <SettingsView 
                        isMonitoring={isMonitoring} setIsMonitoring={handleSetIsMonitoring}
                        monitoringInterval={monitoringInterval} setMonitoringInterval={handleSetMonitoringInterval}
                        notificationEmail={notificationEmail} emailNotifyType={emailNotifyType}
                        saveEmailSettings={saveEmailSettings} inactivityTimeout={inactivityTimeout}
                        setInactivityTimeout={setInactivityTimeout} childUsers={childUsers}
                        addChildUser={addChildUser} removeChildUser={removeChildUser} userRole={userRole}
                        userProfile={userProfile} handleUpdateProfile={handleUpdateProfile}
                        isActivityTrackingEnabled={isActivityTrackingEnabled}
                        setIsActivityTrackingEnabled={setIsActivityTrackingEnabled}
                    />
                );
            case 'reports':
                return <ReportsPage sites={sites} logs={logs} onOpenGlobalReportModal={() => setIsGlobalReportModalOpen(true)} />;
            case 'activity':
                const allLogs = Object.values(logs).flat() as any[];
                return (
                    <div className="animate-fade-in pb-24">
                        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                            <div>
                                <h2 className="text-4xl font-extrabold tracking-tight">Atividade</h2>
                                <p className="text-[var(--apple-text-secondary)] font-medium mt-2">Histórico de eventos em tempo real.</p>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-[var(--apple-input-bg)] p-1.5 pl-5 rounded-3xl border border-[var(--apple-border)]">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Tempo Real</span>
                                    <span className="text-xs font-bold">{isMonitoring ? 'Ativo' : 'Pausado'}</span>
                                </div>
                                <button 
                                    onClick={() => handleSetIsMonitoring(!isMonitoring)}
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
                        <div className="glass apple-card p-0 border-none shadow-2xl overflow-hidden">
                            <div className="max-h-[70vh] overflow-y-auto">
                                {allLogs.length === 0 ? (
                                    <div className="p-20 text-center text-[var(--apple-text-secondary)]">Nenhuma atividade registrada ainda.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-[var(--apple-bg)] z-10">
                                            <tr className="border-b border-[var(--apple-border)]">
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Timestamp</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Status</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Ação</th>
                                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Latência</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--apple-border)]">
                                            {allLogs.sort((a,b) => b.timestamp - a.timestamp).map((log, i) => (
                                                <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                                                    <td className="p-6 text-sm font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="p-6">
                                                        <span className={`p-1.5 px-3 rounded-lg text-[10px] font-bold uppercase ${log.status === 'ONLINE' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-sm font-bold tracking-tight">{log.message}</td>
                                                    <td className="p-6 text-sm font-bold text-[var(--apple-accent)]">{log.latency ? `${log.latency}ms` : '---'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isBooting) {
        return (
            <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-[500] animate-fade-in">
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-[var(--apple-accent)] rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(0,122,255,0.4)]">
                        <Activity className="text-white" size={48} />
                    </div>
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">ATSiteStatus</h1>
                <p className="text-[var(--apple-text-secondary)] mt-4 font-bold text-xs uppercase tracking-widest animate-pulse">Iniciando Monitor...</p>
            </div>
        );
    }

    if (!username) return <LoginPage onLogin={handleLogin} onRegister={handleRegister} theme="dark" toggleTheme={() => {}} />;

    return (
        <div className="flex min-h-screen bg-[var(--apple-bg)] text-[var(--apple-text)]">
            {!sharedReportData && (
                <Sidebar 
                    activeView={activeView} 
                    setActiveView={setActiveView as any} 
                    isCollapsed={isSidebarCollapsed} 
                    setIsCollapsed={setIsSidebarCollapsed} 
                    userRole={userRole}
                    userProfile={userProfile}
                />
            )}
            
            <main className={`flex-1 transition-all duration-300 p-6 md:p-12 overflow-x-hidden ${isSidebarCollapsed || sharedReportData ? 'md:ml-20' : 'md:ml-[280px]'}`}>
                {renderActiveView()}
            </main>

            {/* Modals & Notifications */}
            <AddSiteModal isOpen={isAddSiteModalOpen} onClose={() => setIsAddSiteModalOpen(false)} onAdd={(u, n) => handleAddSite(u, n)} />
            <GlobalReportModal isOpen={isGlobalReportModalOpen} onClose={() => setIsGlobalReportModalOpen(false)} sites={sites} logs={logs} />
            
            <div className="fixed top-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
                {notifications.map(n => <NotificationToast key={n.id} message={n.message} type={n.type} onDismiss={() => removeNotification(n.id)} />)}
            </div>

            {/* Mobile Bottom Tab Bar */}
            {!sharedReportData && (
                <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 glass-dark rounded-[2.5rem] border border-white/5 flex items-center justify-around px-4 z-[100] shadow-2xl">
                    <button onClick={() => setActiveView('dashboard')} className={`p-4 rounded-3xl transition-all ${activeView === 'dashboard' ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'text-white/40'}`}>
                        <LayoutDashboard size={24} />
                    </button>
                    <button onClick={() => setActiveView('activity')} className={`p-4 rounded-3xl transition-all ${activeView === 'activity' ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'text-white/40'}`}>
                        <Activity size={24} />
                    </button>
                    <button onClick={() => setActiveView('reports')} className={`p-4 rounded-3xl transition-all ${activeView === 'reports' ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'text-white/40'}`}>
                        <BarChart3 size={24} />
                    </button>
                    <button onClick={() => setActiveView('settings')} className={`p-4 rounded-3xl transition-all ${activeView === 'settings' ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'text-white/40'}`}>
                        <SettingsIcon size={24} />
                    </button>
                </div>
            )}
        </div>
    );
}
