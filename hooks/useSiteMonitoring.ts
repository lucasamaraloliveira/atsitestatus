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
    writeBatch
} from 'firebase/firestore';

interface NotificationType {
    id: number;
    message: string;
    type: 'alert' | 'warning' | 'success';
}

const MAX_LOG_ENTRIES_PER_SITE = 100;
const HIGH_LATENCY_THRESHOLD = 1500; 

export const useSiteMonitoring = (username: string | null) => {
    const [sites, setSites] = useState<StatusResult[]>([]);
    const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
    const [newSiteUrl, setNewSiteUrl] = useState('');
    const [newSiteName, setNewSiteName] = useState('');
    const [filter, setFilter] = useState<CheckStatus | 'ALL'>('ALL');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
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
    
    // Gestão de Equipe (Membros)
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [recentlyDeletedUser, setRecentlyDeletedUser] = useState<any | null>(null);
    const userUndoTimeoutRef = useRef<number | null>(null);
    
    // Configurações de E-mail e Segurança
    const [notificationEmail, setNotificationEmail] = useState('');
    const [emailNotifyType, setEmailNotifyType] = useState<'success' | 'error' | 'all'>('error');
    const [inactivityTimeout, setInactivityTimeout] = useState(1800); // 30 minutos padrão

    const [childUsers, setChildUsers] = useState<any[]>([]);
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

    const addToastNotification = useCallback((message: string, type: 'alert' | 'warning' | 'success' = 'alert') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Sincronização em tempo real com Firestore para Lista de Sites e Configurações
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
                } else if (!snapshot.exists() && !isParentFetch) {
                    setDoc(userRef, { sites: [], isMonitoring: false, monitoringInterval: 60, childUsers: [], inactivityTimeout: 1800 }, { merge: true });
                    setEffectiveOwnerId(targetUser);
                    setUserRole('admin');
                    setUserProfile({ username: targetUser, role: 'admin' });
                }
            }, (error) => {
                console.error("Erro no onSnapshot do usuário:", error);
            });
        };

        unsubRef.current = fetchUserData(username);
        requestNotificationPermission();
        return () => {
            if (unsubRef.current) unsubRef.current();
        };
    }, [username]);

    // Carregar logs separadamente
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
                inactivityTimeout
            }, { merge: true });
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
        }
    }, [effectiveOwnerId, childUsers, notificationEmail, emailNotifyType, viewMode, inactivityTimeout]);

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

    const handleSetViewMode = (mode: 'card' | 'list') => {
        setViewMode(mode);
        saveToFirestore();
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

    const addChildUser = async (username: string, password?: string, name?: string) => {
        if (!effectiveOwnerId || userRole !== 'admin') return;
        try {
            const newUser = { id: crypto.randomUUID(), username, password, name, createdAt: Date.now(), role: 'child', parentId: effectiveOwnerId };
            const updatedChildUsers = [...childUsers, newUser];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            const childUserRef = doc(db, 'users', username);
            await setDoc(childUserRef, { ...newUser, sites: [], isMonitoring: false });
            addToastNotification(`Membro ${name || username} adicionado.`, "success");
        } catch (error) {
            console.error("Erro ao adicionar usuário filho:", error);
            addToastNotification("Falha ao salvar usuário.", "alert");
        }
    };

    const handleRequestDeleteUser = (childId: string) => {
        const user = childUsers.find(u => u.id === childId);
        if (user) {
            setUserToDelete(user);
            setIsDeleteUserModalOpen(true);
        }
    };

    const handleConfirmDeleteUser = async () => {
        if (!userToDelete || !effectiveOwnerId) return;
        try {
            setRecentlyDeletedUser(userToDelete);
            const updatedChildUsers = childUsers.filter(u => u.id !== userToDelete.id);
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            await deleteDoc(doc(db, 'users', userToDelete.username));
            
            setIsDeleteUserModalOpen(false);
            setUserToDelete(null);
            
            if (userUndoTimeoutRef.current) clearTimeout(userUndoTimeoutRef.current);
            userUndoTimeoutRef.current = window.setTimeout(() => setRecentlyDeletedUser(null), 7000);
            
            addToastNotification(`Membro ${userToDelete.name || userToDelete.username} removido.`, "warning");
        } catch (error) {
            console.error("Erro ao remover usuário filho:", error);
            addToastNotification("Falha ao remover usuário.", "alert");
        }
    };

    const handleUndoDeleteUser = async () => {
        if (!recentlyDeletedUser || !effectiveOwnerId) return;
        if (userUndoTimeoutRef.current) clearTimeout(userUndoTimeoutRef.current);
        
        try {
            const updatedChildUsers = [...childUsers, recentlyDeletedUser];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            const childUserRef = doc(db, 'users', recentlyDeletedUser.username);
            await setDoc(childUserRef, { ...recentlyDeletedUser, sites: [], isMonitoring: false });
            
            setRecentlyDeletedUser(null);
            addToastNotification("Membro restaurado.", "success");
        } catch (error) {
            console.error("Erro ao desfazer remoção:", error);
        }
    };

    const handleUpdateProfile = async (name: string, password?: string, photoUrl?: string) => {
        if (!effectiveOwnerId) return;
        try {
            const userRef = doc(db, 'users', effectiveOwnerId);
            const updates: any = { name };
            if (password) updates.password = password;
            if (photoUrl) updates.photoUrl = photoUrl;
            
            await setDoc(userRef, updates, { merge: true });
            
            // Se for admin, atualizar também o registro na lista de childUsers para consistência (opcional dependendo do design)
            addToastNotification("Perfil atualizado com sucesso.", "success");
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            addToastNotification("Falha ao atualizar perfil.", "alert");
        }
    };

    const addLogEntry = useCallback(async (siteId: string, status: CheckStatus, message: string, latency?: number) => {
        if (!effectiveOwnerId) return;
        try {
            const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', siteId, 'logs');
            await addDoc(logsRef, { timestamp: Date.now(), status, message, latency });
        } catch (error) {
            console.error("Erro ao adicionar log:", error);
        }
    }, [effectiveOwnerId]);

    const handleClearAllLogs = async () => {
        if (!effectiveOwnerId || !sites.length) return;
        try {
            for (const site of sites) {
                const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', site.id, 'logs');
                const snapshot = await getDocs(logsRef);
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
            addToastNotification("Todo o histórico foi limpo.", "warning");
        } catch (error) {
            console.error("Erro ao limpar:", error);
            addToastNotification("Falha ao limpar histórico.", "alert");
        }
    };

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
                    } else if (result.status === CheckStatus.ONLINE && result.latency && result.latency > HIGH_LATENCY_THRESHOLD) {
                        addToastNotification(`Atenção: Latência alta em ${siteName} (${result.latency}ms).`, 'warning');
                    }
                }
                const updatedSites = prev.map(s => s.id === siteId ? { ...s, status: result.status, message: result.message, timestamp: new Date().toLocaleString(), latency: result.latency } : s);
                saveToFirestore(updatedSites);
                return updatedSites;
            });
            await addLogEntry(siteId, result.status, result.message, result.latency);
        } catch (error) {
            console.error("Erro:", error);
            setSites(prev => {
                const updatedSites = prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.ERROR, message: "Falha na verificação.", timestamp: new Date().toLocaleString() } : s);
                saveToFirestore(updatedSites);
                return updatedSites;
            });
        }
    }, [saveToFirestore, addLogEntry, addToastNotification]);

    const handleAddSite = async () => {
        let url = newSiteUrl.trim();
        const name = newSiteName.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        try { new URL(url); } catch (_) { alert("URL inválida."); return; }

        const newSite: StatusResult = {
            id: crypto.randomUUID(),
            url,
            name: name || undefined,
            status: CheckStatus.CHECKING,
            message: 'Aguardando verificação...',
            timestamp: new Date().toLocaleString()
        };
        
        setSites(prev => {
            const updatedSites = [...prev, newSite];
            saveToFirestore(updatedSites);
            return updatedSites;
        });
        
        setNewSiteUrl('');
        setNewSiteName('');
        setIsAddSiteModalOpen(false);
        setTimeout(() => handleCheckStatus(newSite.id, newSite.url), 500);
    };

    const handleRequestDelete = (id: string) => {
        const site = sites.find(s => s.id === id);
        if (site) { setSiteToDelete(site); setIsDeleteModalOpen(true); }
    };
    
    const handleCloseDeleteModal = () => { setIsDeleteModalOpen(false); setSiteToDelete(null); }

    const handleConfirmDelete = async () => {
        if (!siteToDelete || !username) return;
        const logsToDelete = logs[siteToDelete.id] || [];
        setRecentlyDeleted({ site: siteToDelete, logs: logsToDelete });
        const updatedSites = sites.filter(site => site.id !== siteToDelete.id);
        await saveToFirestore(updatedSites);
        undoTimeoutRef.current = window.setTimeout(() => setRecentlyDeleted(null), 7000);
        handleCloseDeleteModal();
    };

    const handleUndoDelete = async () => {
        if (!recentlyDeleted) return;
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        const updatedSites = [...sites, recentlyDeleted.site].sort((a, b) => a.url.localeCompare(b.url));
        await saveToFirestore(updatedSites);
        setRecentlyDeleted(null);
    };

    const handleUpdateSite = async (id: string, newUrl: string, newName: string) => {
        let url = newUrl.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        const updatedSites = sites.map(s => s.id === id ? { ...s, url, name: newName.trim() || undefined } : s);
        setEditingSiteId(null);
        await saveToFirestore(updatedSites);
        handleCheckStatus(id, url);
    };

    const handleConfirmClearHistory = async () => {
        if (!siteToClearHistory || !username) return;
        const logsRef = collection(db, 'users', username, 'sites', siteToClearHistory.id, 'logs');
        const snapshot = await getDocs(logsRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        setIsClearHistoryModalOpen(false);
        setSiteToClearHistory(null);
    };

    const handleRefreshAll = useCallback(() => {
        sites.forEach(site => handleCheckStatus(site.id, site.url));
    }, [sites, handleCheckStatus]);

    const refreshAllRef = useRef(handleRefreshAll);
    useEffect(() => { refreshAllRef.current = handleRefreshAll; }, [handleRefreshAll]);

    useEffect(() => {
        if (!isMonitoring || monitoringInterval <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        refreshAllRef.current();
        intervalRef.current = window.setInterval(() => { refreshAllRef.current(); }, monitoringInterval * 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isMonitoring, monitoringInterval]);

    return {
        sites, logs, newSiteUrl, setNewSiteUrl, newSiteName, setNewSiteName, filter, setFilter, sortOrder, setSortOrder,
        editingSiteId, isMonitoring, setIsMonitoring: handleSetIsMonitoring, monitoringInterval, setMonitoringInterval: handleSetMonitoringInterval,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification, addToastNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        childUsers, addChildUser, removeChildUser: handleRequestDeleteUser, 
        isDeleteUserModalOpen, userToDelete, recentlyDeletedUser, handleConfirmDeleteUser, handleUndoDeleteUser, handleCloseDeleteUserModal: () => { setIsDeleteUserModalOpen(false); setUserToDelete(null); },
        userRole, userProfile, handleUpdateProfile,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite: (id: string) => setEditingSiteId(id), handleUpdateSite, handleRefreshSite: (id: string) => { const s = sites.find(x => x.id === id); if(s) handleCheckStatus(id, s.url); }, handleRefreshAll,
        requestClearHistory: (id: string) => { const s = sites.find(x => x.id === id); if(s) { setSiteToClearHistory(s); setIsClearHistoryModalOpen(true); } }, confirmClearHistory: handleConfirmClearHistory, closeClearHistoryModal: () => { setIsClearHistoryModalOpen(false); setSiteToClearHistory(null); },
        viewMode, setViewMode: handleSetViewMode, isAddSiteModalOpen, setIsAddSiteModalOpen,
        notificationEmail, emailNotifyType, setNotificationEmail, setEmailNotifyType, saveEmailSettings: handleSetEmailSettings,
        inactivityTimeout, setInactivityTimeout: handleSetInactivityTimeout,
        clearAllLogs: handleClearAllLogs
    };
};
