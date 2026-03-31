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

type NotificationType = { id: number; message: string; type: 'alert' | 'warning' };
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
    
    // Configurações de E-mail
    const [notificationEmail, setNotificationEmail] = useState('');
    const [emailNotifyType, setEmailNotifyType] = useState<'success' | 'error' | 'all'>('error');

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
                    
                    // Se o usuário atual for um "filho", buscamos as configurações do "pai"
                    if (!isParentFetch && data.role === 'child' && data.parentId) {
                        setUserRole('child');
                        if (unsubRef.current) unsubRef.current(); // Cancela o listener atual
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
                    
                    // Novas preferências
                    if (data.notificationEmail) setNotificationEmail(data.notificationEmail);
                    if (data.emailNotifyType) setEmailNotifyType(data.emailNotifyType);
                    if (data.viewMode) setViewMode(data.viewMode);
                } else if (!snapshot.exists() && !isParentFetch) {
                    setDoc(userRef, { sites: [], isMonitoring: false, monitoringInterval: 60, childUsers: [] }, { merge: true });
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

    // Carregar logs separadamente para cada site selecionado ou quando necessário
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
                viewMode
            }, { merge: true });
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
        }
    }, [effectiveOwnerId, childUsers, notificationEmail, emailNotifyType, viewMode]);

    const handleSetIsMonitoring = async (val: boolean) => {
        lockRef.current = true;
        setIsMonitoring(val);
        isMonitoringRef.current = val; // Atualiza ref imediatamente
        try {
            await saveToFirestore(undefined, undefined, val);
        } finally {
            setTimeout(() => { lockRef.current = false; }, 1500);
        }
    };

    const handleSetMonitoringInterval = async (val: number) => {
        lockRef.current = true;
        setMonitoringInterval(val);
        intervalRefValue.current = val;
        try {
            await saveToFirestore(undefined, val, undefined);
        } finally {
            setTimeout(() => { lockRef.current = false; }, 1500);
        }
    };

    const handleSetViewMode = (mode: 'card' | 'list') => {
        setViewMode(mode);
        saveToFirestore();
    };

    const handleSetEmailSettings = (email: string, type: 'success' | 'error' | 'all') => {
        setNotificationEmail(email);
        setEmailNotifyType(type);
        // Salvamento automático
        setTimeout(() => saveToFirestore(), 100);
    };

    const addChildUser = async (user: any) => {
        if (!effectiveOwnerId || userRole !== 'admin') return;
        try {
            const updatedChildUsers = [...childUsers, { ...user, id: crypto.randomUUID(), createdAt: Date.now() }];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            
            const childUserRef = doc(db, 'users', user.username);
            await setDoc(childUserRef, {
                ...user,
                role: 'child',
                parentId: effectiveOwnerId,
                sites: [],
                isMonitoring: false
            });
        } catch (error) {
            console.error("Erro ao adicionar usuário filho:", error);
            addToastNotification("Falha ao salvar usuário. Verifique sua conexão.", "alert");
        }
    };

    const removeChildUser = async (childId: string) => {
        if (!effectiveOwnerId || userRole !== 'admin') return;
        try {
            const childToRemove = childUsers.find(u => u.id === childId);
            const updatedChildUsers = childUsers.filter(u => u.id !== childId);
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            
            if (childToRemove) {
                await deleteDoc(doc(db, 'users', childToRemove.username));
            }
        } catch (error) {
            console.error("Erro ao remover usuário filho:", error);
            addToastNotification("Falha ao remover usuário.", "alert");
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
            addToastNotification("Todo o histórico foi limpo com sucesso.", "warning");
        } catch (error) {
            console.error("Erro ao limpar todos os logs:", error);
            addToastNotification("Falha ao limpar histórico.", "alert");
        }
    };

    const addToastNotification = useCallback((message: string, type: 'alert' | 'warning' = 'alert') => {
        const newNotification: NotificationType = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleCheckStatus = useCallback(async (siteId: string, url: string) => {
        // Atualizar status localmente primeiro para feedback imediato
        setSites(prev => prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.CHECKING, message: 'Verificando status...' } : s));
        
        try {
            const result = await checkWebsiteStatus(url);
            
            setSites(prev => {
                const siteToCheck = prev.find(s => s.id === siteId);
                if (siteToCheck) {
                    const siteName = siteToCheck.name || url;
                    if (siteToCheck.status === CheckStatus.ONLINE && (result.status === CheckStatus.OFFLINE || result.status === CheckStatus.ERROR)) {
                        const message = `Alerta: O site ${siteName} ficou offline!`;
                        addToastNotification(message, 'alert');
                        sendNotification('Site Offline', { body: siteName });
                    } else if (result.status === CheckStatus.ONLINE && result.latency && result.latency > HIGH_LATENCY_THRESHOLD) {
                        const message = `Atenção: Latência alta em ${siteName} (${result.latency}ms).`;
                        addToastNotification(message, 'warning');
                    }
                }

                const updatedSites = prev.map(s => s.id === siteId ? {
                    ...s,
                    status: result.status,
                    message: result.message,
                    timestamp: new Date().toLocaleString(),
                    latency: result.latency
                } : s);
                
                // Salvar a lista atualizada no Firestore APÓS garantir que incluímos todas as mudanças
                saveToFirestore(updatedSites);
                return updatedSites;
            });
            
            await addLogEntry(siteId, result.status, result.message, result.latency);
        } catch (error) {
            console.error("Erro no handleCheckStatus:", error);
            const errorMessage = "Falha ao verificar.";
            setSites(prev => {
                const updatedSites = prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.ERROR, message: errorMessage, timestamp: new Date().toLocaleString() } : s);
                saveToFirestore(updatedSites);
                return updatedSites;
            });
            await addLogEntry(siteId, CheckStatus.ERROR, errorMessage);
        }
    }, [saveToFirestore, addLogEntry, addToastNotification]);

    const handleAddSite = async () => {
        let url = newSiteUrl.trim();
        const name = newSiteName.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }
        try { new URL(url); } catch (_) { alert("URL inválida."); return; }

        const newSite: StatusResult = {
            id: crypto.randomUUID(),
            url,
            name: name || undefined,
            status: CheckStatus.CHECKING,
            message: 'Aguardando verificação inicial...',
            timestamp: new Date().toLocaleString()
        };
        
        // Usar atualização funcional para garantir persistência correta
        setSites(prev => {
            const updatedSites = [...prev, newSite];
            saveToFirestore(updatedSites);
            return updatedSites;
        });
        
        setNewSiteUrl('');
        setNewSiteName('');
        setIsAddSiteModalOpen(false); // Fecha o modal se estiver aberto
        
        // Iniciar verificação após um pequeno delay para garantir que o Firestore processou o novo site
        setTimeout(() => handleCheckStatus(newSite.id, newSite.url), 500);
    };

    const handleRequestDelete = (id: string) => {
        const site = sites.find(s => s.id === id);
        if (site) {
            setSiteToDelete(site);
            setIsDeleteModalOpen(true);
        }
    };
    
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSiteToDelete(null);
    }

    const handleConfirmDelete = async () => {
        if (!siteToDelete || !username) return;
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

        const logsToDelete = logs[siteToDelete.id] || [];
        setRecentlyDeleted({ site: siteToDelete, logs: logsToDelete });

        const updatedSites = sites.filter(site => site.id !== siteToDelete.id);
        await saveToFirestore(updatedSites);
        
        // Logs permanecem no Firestore para o "Desfazer", mas seriam limpos se não houvesse desfazer
        // Por agora, apenas removemos da lista de sites.

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

    const handleEditSite = (id: string) => setEditingSiteId(id);

    const handleUpdateSite = async (id: string, newUrl: string, newName: string) => {
        let url = newUrl.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        
        const updatedSites = sites.map(s => s.id === id ? { ...s, url, name: newName.trim() || undefined } : s);
        setEditingSiteId(null);
        await saveToFirestore(updatedSites);
        handleCheckStatus(id, url);
    };

    const handleRefreshSite = (id: string) => {
        const site = sites.find(s => s.id === id);
        if (site) handleCheckStatus(id, site.url);
    };

    const handleRefreshAll = useCallback(() => {
        sites.forEach(site => handleCheckStatus(site.id, site.url));
    }, [sites, handleCheckStatus]);

    const handleRequestClearHistory = (id: string) => {
        const site = sites.find(s => s.id === id);
        if (site) {
            setSiteToClearHistory(site);
            setIsClearHistoryModalOpen(true);
        }
    };

    const handleCloseClearHistoryModal = () => {
        setIsClearHistoryModalOpen(false);
        setSiteToClearHistory(null);
    };

    const handleConfirmClearHistory = async () => {
        if (!siteToClearHistory || !username) return;
        
        // Limpar logs no Firestore
        const logsRef = collection(db, 'users', username, 'sites', siteToClearHistory.id, 'logs');
        const snapshot = await getDocs(logsRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        handleCloseClearHistoryModal();
    };

    // Ref para manter a versão mais recente da função de atualização sem reiniciar o intervalo
    const refreshAllRef = useRef(handleRefreshAll);
    useEffect(() => {
        refreshAllRef.current = handleRefreshAll;
    }, [handleRefreshAll]);

    // Loop de Monitoramento Robusto
    useEffect(() => {
        if (!isMonitoring || monitoringInterval <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return;
        }

        // Limpa intervalo existente antes de criar um novo (caso o tempo mude)
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // Executa uma vez imediatamente ao ligar
        refreshAllRef.current();

        intervalRef.current = window.setInterval(() => {
            refreshAllRef.current();
        }, monitoringInterval * 1000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isMonitoring, monitoringInterval]); // Só reinicia se ligar/desligar ou mudar o tempo

    return {
        sites, logs, newSiteUrl, setNewSiteUrl, newSiteName, setNewSiteName, filter, setFilter, sortOrder, setSortOrder,
        editingSiteId, isMonitoring, setIsMonitoring: handleSetIsMonitoring, monitoringInterval, setMonitoringInterval: handleSetMonitoringInterval,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        childUsers, addChildUser, removeChildUser, userRole, userProfile,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite, handleUpdateSite, handleRefreshSite, handleRefreshAll,
        requestClearHistory: handleRequestClearHistory, confirmClearHistory: handleConfirmClearHistory, closeClearHistoryModal: handleCloseClearHistoryModal,
        viewMode, setViewMode: handleSetViewMode, isAddSiteModalOpen, setIsAddSiteModalOpen,
        notificationEmail, emailNotifyType, setNotificationEmail, setEmailNotifyType, saveEmailSettings: handleSetEmailSettings,
        clearAllLogs: handleClearAllLogs
    };
};
