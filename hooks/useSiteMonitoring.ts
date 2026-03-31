import { useState, useCallback, useEffect, useRef } from 'react';
import { checkWebsiteStatus } from '@/services/geminiService';
import { requestNotificationPermission, sendNotification } from '@/services/notificationService';
import { CheckStatus } from '@/types';
import type { StatusResult, LogEntry } from '@/types';
import { db } from '@/services/firebase';
import { 
    doc, 
    onSnapshot, 
    setDoc, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    deleteDoc,
    writeBatch,
    getDoc
} from 'firebase/firestore';

interface NotificationType {
    id: number;
    message: string;
    type: 'alert' | 'warning' | 'success';
}

const MAX_LOG_ENTRIES_PER_SITE = 100;
const HIGH_LATENCY_THRESHOLD = 1500; 

export const useSiteMonitoring = () => {
    const [username, setUsername] = useState<string | null>(null);
    const [sites, setSites] = useState<StatusResult[]>([]);
    const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
    const [newSiteUrl, setNewSiteUrl] = useState('');
    const [newSiteName, setNewSiteName] = useState('');
    const [activeView, setActiveView] = useState<'dashboard' | 'activity' | 'reports' | 'settings'>('dashboard');
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [monitoringInterval, setMonitoringInterval] = useState(60);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [recentlyDeleted, setRecentlyDeleted] = useState<{ site: StatusResult; logs: LogEntry[]; } | null>(null);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<StatusResult | null>(null);
    const [isGlobalReportModalOpen, setIsGlobalReportModalOpen] = useState(false);
    const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
    const [siteToClearHistory, setSiteToClearHistory] = useState<StatusResult | null>(null);

    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
    
    // Gestão de Equipe (Membros) e Monitor de Atividade
    const [isActivityTrackingEnabled, setIsActivityTrackingEnabled] = useState(true);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [recentlyDeletedUser, setRecentlyDeletedUser] = useState<any | null>(null);
    const userUndoTimeoutRef = useRef<number | null>(null);
    
    // Configurações de E-mail e Segurança
    const [notificationEmail, setNotificationEmail] = useState('');
    const [emailNotifyType, setEmailNotifyType] = useState<'success' | 'error' | 'all'>('error');
    const [inactivityTimeout, setInactivityTimeout] = useState(1800);

    const [childUsers, setChildUsers] = useState<any[]>([]);
    const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
    const [effectiveOwnerId, setEffectiveOwnerId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'child'>('admin');
    const [userProfile, setUserProfile] = useState<any>(null);

    const intervalRef = useRef<number | null>(null);
    const undoTimeoutRef = useRef<number | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);

    // Refs para garantir que as funções assíncronas sempre usem o dado mais recente
    const sitesRef = useRef<StatusResult[]>([]);
    const isMonitoringRef = useRef<boolean>(false);
    const intervalRefValue = useRef<number>(60);
    const lockRef = useRef<boolean>(false);

    useEffect(() => { sitesRef.current = sites; }, [sites]);
    useEffect(() => { isMonitoringRef.current = isMonitoring; }, [isMonitoring]);
    useEffect(() => { intervalRefValue.current = monitoringInterval; }, [monitoringInterval]);

    // Carregar sessão existente
    useEffect(() => {
        const stored = localStorage.getItem('atsite_user');
        if (stored) setUsername(stored);
    }, []);

    const handleLogin = async (usr: string, pwd?: string) => {
        try {
            const userRef = doc(db, 'users', usr);
            const snapshot = await getDoc(userRef);
            if (!snapshot.exists()) return false;
            
            const data = snapshot.data();
            if (pwd && data.password && data.password !== pwd) return false;
            
            localStorage.setItem('atsite_user', usr);
            setUsername(usr);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const handleRegister = async (usr: string, pwd: string, name: string) => {
        try {
            const userRef = doc(db, 'users', usr);
            const snapshot = await getDoc(userRef);
            if (snapshot.exists()) return false;
            
            await setDoc(userRef, { 
                username: usr, 
                password: pwd, 
                name, 
                role: 'admin', 
                createdAt: Date.now(),
                sites: [],
                isMonitoring: false,
                monitoringInterval: 60
            });
            
            localStorage.setItem('atsite_user', usr);
            setUsername(usr);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('atsite_user');
        setUsername(null);
        setActiveView('dashboard');
    }, []);

    const addToastNotification = useCallback((message: string, type: 'alert' | 'warning' | 'success' = 'alert') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Sincronização em tempo real com Firestore
    useEffect(() => {
        if (!username) {
            setSites([]);
            setLogs({});
            setChildUsers([]);
            setEffectiveOwnerId(null);
            setUserRole('admin');
            return;
        }

        const fetchUserData = (targetUser: string, isParentFetch = false): (() => void) => {
            const userRef = doc(db, 'users', targetUser);
            return onSnapshot(userRef, (snapshot) => {
                if (snapshot.exists() && !lockRef.current) {
                    const data = snapshot.data();
                    
                    if (!isParentFetch && data.role === 'child' && data.parentId) {
                        setUserRole('child');
                        if (unsubRef.current) unsubRef.current();
                        unsubRef.current = fetchUserData(data.parentId, true);
                        return;
                    }

                    if (isParentFetch) setUserRole('child');
                    else setUserRole(data.role || 'admin');

                    setUserProfile(data);
                    setSites(data.sites || []);
                    setIsMonitoring(!!data.isMonitoring);
                    setMonitoringInterval(data.monitoringInterval || 60);
                    setChildUsers(data.childUsers || []);
                    setEffectiveOwnerId(targetUser);
                    
                    if (data.notificationEmail) setNotificationEmail(data.notificationEmail);
                    if (data.emailNotifyType) setEmailNotifyType(data.emailNotifyType);
                    if (data.viewMode) setViewMode(data.viewMode);
                    if (data.inactivityTimeout) setInactivityTimeout(data.inactivityTimeout);
                }
            });
        };

        unsubRef.current = fetchUserData(username);
        requestNotificationPermission();
        return () => { if (unsubRef.current) unsubRef.current(); };
    }, [username]);

    // Logs listener
    useEffect(() => {
        if (!effectiveOwnerId || !sites.length) return;
        const unsubscribes = sites.map(site => {
            const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', site.id, 'logs');
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(MAX_LOG_ENTRIES_PER_SITE));
            return onSnapshot(q, (snapshot) => {
                const siteLogs = snapshot.docs.map(doc => doc.data() as LogEntry);
                setLogs(prev => ({ ...prev, [site.id]: siteLogs }));
            });
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, [effectiveOwnerId, sites.length]); 

    const saveToFirestore = useCallback(async (updatedSites?: StatusResult[], updatedInterval?: number, updatedMonitoring?: boolean, updatedChildUsers?: any[]) => {
        if (!effectiveOwnerId) return;
        try {
            const userRef = doc(db, 'users', effectiveOwnerId);
            await setDoc(userRef, { 
                sites: updatedSites ?? sitesRef.current, 
                monitoringInterval: updatedInterval ?? intervalRefValue.current, 
                isMonitoring: updatedMonitoring ?? isMonitoringRef.current,
                childUsers: updatedChildUsers ?? childUsers,
                notificationEmail,
                emailNotifyType,
                viewMode,
                inactivityTimeout,
                isActivityTrackingEnabled
            }, { merge: true });
        } catch (error) {
            console.error(error);
        }
    }, [effectiveOwnerId, childUsers, notificationEmail, emailNotifyType, viewMode, inactivityTimeout, isActivityTrackingEnabled]);

    const handleSetIsMonitoring = async (val: boolean) => {
        lockRef.current = true;
        setIsMonitoring(val);
        isMonitoringRef.current = val;
        try { await saveToFirestore(undefined, undefined, val); } finally { setTimeout(() => { lockRef.current = false; }, 1500); }
    };

    const handleSetMonitoringInterval = async (val: number) => {
        lockRef.current = true;
        setMonitoringInterval(val);
        intervalRefValue.current = val;
        try { await saveToFirestore(undefined, val, undefined); } finally { setTimeout(() => { lockRef.current = false; }, 1500); }
    };

    const handleSetEmailSettings = (email: string, type: 'success' | 'error' | 'all') => {
        setNotificationEmail(email);
        setEmailNotifyType(type);
        setTimeout(() => saveToFirestore(), 100);
    };

    const handleSetInactivityTimeout = (seconds: number) => {
        setInactivityTimeout(seconds);
        setTimeout(() => saveToFirestore(), 100);
    };

    const addChildUser = async (user: string, pass?: string, nm?: string, perms?: any) => {
        if (!effectiveOwnerId || userRole !== 'admin') return;
        try {
            const newUser = { id: crypto.randomUUID(), username: user, password: pass, name: nm, createdAt: Date.now(), role: 'child', parentId: effectiveOwnerId, permissions: perms, lastActivity: null };
            const updatedChildUsers = [...childUsers, newUser];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            await setDoc(doc(db, 'users', user), { ...newUser, sites: [], isMonitoring: false });
            addToastNotification(`Membro adicionado.`, "success");
        } catch (error) {
            console.error(error);
        }
    };

    const logUserActivity = useCallback(async (view: string, action?: string) => {
        if (!username || userRole !== 'child' || !isActivityTrackingEnabled) return;
        try {
            await setDoc(doc(db, 'users', username), { lastActivity: { view, action: action || 'Visualizando', timestamp: Date.now() } }, { merge: true });
        } catch (error) {
            console.error(error);
        }
    }, [username, userRole, isActivityTrackingEnabled]);

    const handleCheckStatus = useCallback(async (siteId: string, url: string) => {
        setSites(prev => prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.CHECKING, message: 'Verificando...' } : s));
        try {
            const result = await checkWebsiteStatus(url);
            setSites(prev => {
                const siteToCheck = prev.find(s => s.id === siteId);
                if (siteToCheck) {
                    const siteName = siteToCheck.name || url;
                    if (siteToCheck.status === CheckStatus.ONLINE && (result.status === CheckStatus.OFFLINE || result.status === CheckStatus.ERROR)) {
                        addToastNotification(`Alerta: O site ${siteName} ficou offline!`, 'alert');
                        sendNotification('Site Offline', { body: siteName });
                    }
                }
                const updatedSites = prev.map(s => s.id === siteId ? { ...s, status: result.status, message: result.message, timestamp: new Date().toLocaleString(), latency: result.latency } : s);
                saveToFirestore(updatedSites);
                return updatedSites;
            });
            if (effectiveOwnerId) {
                const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', siteId, 'logs');
                await addDoc(logsRef, { timestamp: Date.now(), status: result.status, message: result.message, latency: result.latency });
            }
        } catch (error) {
            console.error(error);
            setSites(prev => {
                const updatedSites = prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.ERROR, message: "Falha na verificação.", timestamp: new Date().toLocaleString() } : s);
                saveToFirestore(updatedSites);
                return updatedSites;
            });
        }
    }, [saveToFirestore, addToastNotification, effectiveOwnerId]);

    const handleRefreshAll = useCallback(() => {
        sitesRef.current.forEach(site => handleCheckStatus(site.id, site.url));
    }, [handleCheckStatus]);

    useEffect(() => {
        if (!isMonitoring || monitoringInterval <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleRefreshAll();
        intervalRef.current = window.setInterval(() => handleRefreshAll(), monitoringInterval * 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isMonitoring, monitoringInterval, handleRefreshAll]);

    return {
        sites,
        isMonitoring,
        handleSetIsMonitoring,
        monitoringInterval,
        handleSetMonitoringInterval,
        notificationEmail,
        emailNotifyType,
        setNotificationEmail,
        setEmailNotifyType,
        saveEmailSettings: handleSetEmailSettings,
        inactivityTimeout,
        setInactivityTimeout: (s: number) => { setInactivityTimeout(s); saveToFirestore(undefined, undefined, undefined, undefined); },
        logs,
        checkAllSites: handleRefreshAll,
        activeView,
        setActiveView,
        selectedSiteId,
        setSelectedSiteId,
        recentlyDeleted,
        notifications,
        removeNotification,
        addToastNotification,
        isDeleteModalOpen,
        siteToDelete,
        isGlobalReportModalOpen,
        setIsGlobalReportModalOpen,
        isClearHistoryModalOpen,
        siteToClearHistory,
        childUsers,
        addChildUser,
        removeChildUser: (id: string) => {
            const user = childUsers.find(u => u.id === id);
            if (user) { setUserToDelete(user); setIsDeleteUserModalOpen(true); }
        },
        isDeleteUserModalOpen,
        userToDelete,
        recentlyDeletedUser,
        handleConfirmDeleteUser: async () => {
             if (!userToDelete || !effectiveOwnerId) return;
             setRecentlyDeletedUser(userToDelete);
             const updatedChildUsers = childUsers.filter(u => u.id !== userToDelete.id);
             await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
             await deleteDoc(doc(db, 'users', userToDelete.username));
             setIsDeleteUserModalOpen(false);
             setUserToDelete(null);
             addToastNotification(`Membro removido.`, "warning");
        },
        handleUndoDeleteUser: async () => {
            if (!recentlyDeletedUser || !effectiveOwnerId) return;
            const updatedChildUsers = [...childUsers, recentlyDeletedUser];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            await setDoc(doc(db, 'users', recentlyDeletedUser.username), { ...recentlyDeletedUser, sites: [], isMonitoring: false });
            setRecentlyDeletedUser(null);
            addToastNotification("Membro restaurado.", "success");
        },
        handleCloseDeleteUserModal: () => { setIsDeleteUserModalOpen(false); setUserToDelete(null); },
        userRole,
        userProfile,
        handleUpdateProfile: async (n: string, p?: string, f?: string) => {
            if (!effectiveOwnerId) return;
            const updates: any = { name: n };
            if (p) updates.password = p;
            if (f) updates.photoUrl = f;
            await setDoc(doc(db, 'users', effectiveOwnerId), updates, { merge: true });
            addToastNotification("Perfil atualizado.", "success");
        },
        isActivityTrackingEnabled,
        setIsActivityTrackingEnabled: (val: boolean) => { setIsActivityTrackingEnabled(val); saveToFirestore(); },
        logUserActivity,
        handleAddSite: async (url: string, name: string) => {
            if (!url) return;
            if (!url.startsWith('http')) url = `https://${url}`;
            const newSite: StatusResult = { id: crypto.randomUUID(), url, name, status: CheckStatus.CHECKING, message: 'Aguardando...', timestamp: new Date().toLocaleString() };
            const updatedSites = [...sites, newSite];
            setSites(updatedSites);
            await saveToFirestore(updatedSites);
            setIsAddSiteModalOpen(false);
            handleCheckStatus(newSite.id, newSite.url);
        },
        handleRequestDelete: (id: string) => {
            const site = sites.find(s => s.id === id);
            if (site) { setSiteToDelete(site); setIsDeleteModalOpen(true); }
        },
        handleConfirmDelete: async () => {
            if (!siteToDelete) return;
            const updatedSites = sites.filter(s => s.id !== siteToDelete.id);
            setSites(updatedSites);
            setRecentlyDeleted({ site: siteToDelete, logs: logs[siteToDelete.id] || [] });
            await saveToFirestore(updatedSites);
            setIsDeleteModalOpen(false);
            setSiteToDelete(null);
        },
        handleCloseDeleteModal: () => { setIsDeleteModalOpen(false); setSiteToDelete(null); },
        handleUndoDelete: async () => {
            if (!recentlyDeleted) return;
            const updatedSites = [...sites, recentlyDeleted.site];
            setSites(updatedSites);
            await saveToFirestore(updatedSites);
            setRecentlyDeleted(null);
        },
        handleEditSite: (id: string) => setEditingSiteId(id),
        handleUpdateSite: async (id: string, url: string, name: string) => {
            const updatedSites = sites.map(s => s.id === id ? { ...s, url, name } : s);
            setSites(updatedSites);
            setEditingSiteId(null);
            await saveToFirestore(updatedSites);
            handleCheckStatus(id, url);
        },
        handleRefreshSite: (id: string) => {
            const s = sites.find(x => x.id === id);
            if (s) handleCheckStatus(id, s.url);
        },
        handleRefreshAll: () => handleRefreshAll(),
        requestClearHistory: (id: string) => {
            const s = sites.find(x => x.id === id);
            if (s) { setSiteToClearHistory(s); setIsClearHistoryModalOpen(true); }
        },
        confirmClearHistory: async () => {
            if (!siteToClearHistory || !effectiveOwnerId) return;
            const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', siteToClearHistory.id, 'logs');
            const snapshot = await getDocs(logsRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setIsClearHistoryModalOpen(false);
            setSiteToClearHistory(null);
        },
        closeClearHistoryModal: () => { setIsClearHistoryModalOpen(false); setSiteToClearHistory(null); },
        viewMode,
        setViewMode: (m: 'card' | 'list') => { setViewMode(m); saveToFirestore(undefined, undefined, undefined, undefined); },
        isAddSiteModalOpen,
        setIsAddSiteModalOpen,
        clearAllLogs: async () => {
             if (!effectiveOwnerId) return;
             for (const site of sites) {
                 const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', site.id, 'logs');
                 const snapshot = await getDocs(logsRef);
                 const batch = writeBatch(db);
                 snapshot.docs.forEach(d => batch.delete(d.ref));
                 await batch.commit();
             }
             addToastNotification("Logs limpos.", "warning");
        },
        handleLogin,
        handleRegister,
        handleLogout,
        username
    };
};

export default useSiteMonitoring;
