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

    const intervalRef = useRef<number | null>(null);
    const undoTimeoutRef = useRef<number | null>(null);

    // Sincronização em tempo real com Firestore para Lista de Sites e Configurações
    useEffect(() => {
        if (!username) {
            setSites([]);
            setLogs({});
            return;
        }

        const userRef = doc(db, 'users', username);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setSites(data.sites || []);
                setIsMonitoring(!!data.isMonitoring);
                setMonitoringInterval(data.monitoringInterval || 60);
            } else {
                // Criar documento inicial se não existir
                setDoc(userRef, { sites: [], isMonitoring: false, monitoringInterval: 60 }, { merge: true });
            }
        });

        requestNotificationPermission();
        return () => unsubscribe();
    }, [username]);

    // Carregar logs separadamente para cada site selecionado ou quando necessário
    useEffect(() => {
        if (!username || !sites.length) return;

        const unsubscribes = sites.map(site => {
            const logsRef = collection(db, 'users', username, 'sites', site.id, 'logs');
            const q = query(logsRef, orderBy('timestamp', 'desc'), limit(MAX_LOG_ENTRIES_PER_SITE));
            
            return onSnapshot(q, (snapshot) => {
                const siteLogs = snapshot.docs.map(doc => doc.data() as LogEntry);
                setLogs(prev => ({ ...prev, [site.id]: siteLogs }));
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [username, sites.length]); // Apenas sites.length para evitar loop infinito se sites mudar internamente

    const saveToFirestore = useCallback(async (updatedSites: StatusResult[], updatedInterval?: number, updatedMonitoring?: boolean) => {
        if (!username) return;
        const userRef = doc(db, 'users', username);
        await setDoc(userRef, { 
            sites: updatedSites, 
            monitoringInterval: updatedInterval ?? monitoringInterval, 
            isMonitoring: updatedMonitoring ?? isMonitoring 
        }, { merge: true });
    }, [username, monitoringInterval, isMonitoring]);

    const addLogEntry = useCallback(async (siteId: string, status: CheckStatus, message: string, latency?: number) => {
        if (!username) return;
        const logsRef = collection(db, 'users', username, 'sites', siteId, 'logs');
        await addDoc(logsRef, { timestamp: Date.now(), status, message, latency });
    }, [username]);

    const addToastNotification = useCallback((message: string, type: 'alert' | 'warning' = 'alert') => {
        const newNotification: NotificationType = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleCheckStatus = useCallback(async (siteId: string, url: string) => {
        const siteBeforeCheck = sites.find(s => s.id === siteId);
        // Atualizar status localmente primeiro para feedback imediato (será sobrescrito pelo onSnapshot do Firestore)
        setSites(prev => prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.CHECKING, message: 'Verificando status...' } : s));
        
        try {
            const result = await checkWebsiteStatus(url);
            
            if (siteBeforeCheck) {
                const siteName = siteBeforeCheck.name || url;
                if (siteBeforeCheck.status === CheckStatus.ONLINE && (result.status === CheckStatus.OFFLINE || result.status === CheckStatus.ERROR)) {
                    const message = `Alerta: O site ${siteName} ficou offline!`;
                    addToastNotification(message, 'alert');
                    sendNotification('Site Offline', { body: siteName });
                } else if (result.status === CheckStatus.ONLINE && result.latency && result.latency > HIGH_LATENCY_THRESHOLD) {
                     const message = `Atenção: Latência alta em ${siteName} (${result.latency}ms).`;
                     addToastNotification(message, 'warning');
                }
            }

            const updatedSites = sites.map(s => s.id === siteId ? {
                ...s,
                status: result.status,
                message: result.message,
                timestamp: new Date().toLocaleString(),
                latency: result.latency
            } : s);
            
            await saveToFirestore(updatedSites);
            await addLogEntry(siteId, result.status, result.message, result.latency);
        } catch (error) {
            const errorMessage = "Falha ao verificar. Verifique o console para detalhes.";
            const updatedSites = sites.map(s => s.id === siteId ? { ...s, status: CheckStatus.ERROR, message: errorMessage, timestamp: new Date().toLocaleString() } : s);
            await saveToFirestore(updatedSites);
            await addLogEntry(siteId, CheckStatus.ERROR, errorMessage);
        }
    }, [sites, saveToFirestore, addLogEntry, addToastNotification]);

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
        
        const updatedSites = [...sites, newSite];
        setNewSiteUrl('');
        setNewSiteName('');
        await saveToFirestore(updatedSites);
        handleCheckStatus(newSite.id, newSite.url);
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

    useEffect(() => {
        if (isMonitoring && monitoringInterval > 0) {
            intervalRef.current = window.setInterval(handleRefreshAll, monitoringInterval * 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isMonitoring, monitoringInterval, handleRefreshAll]);

    // Atualizar no Firestore quando mudar localmente (exceto na carga inicial)
    const handleSetIsMonitoring = async (val: boolean) => {
        setIsMonitoring(val);
        await saveToFirestore(sites, monitoringInterval, val);
    };

    const handleSetMonitoringInterval = async (val: number) => {
        setMonitoringInterval(val);
        await saveToFirestore(sites, val, isMonitoring);
    };

    return {
        sites, logs, newSiteUrl, setNewSiteUrl, newSiteName, setNewSiteName, filter, setFilter, sortOrder, setSortOrder,
        editingSiteId, isMonitoring, setIsMonitoring: handleSetIsMonitoring, monitoringInterval, setMonitoringInterval: handleSetMonitoringInterval,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite, handleUpdateSite, handleRefreshSite, handleRefreshAll,
        handleRequestClearHistory, handleConfirmClearHistory, handleCloseClearHistoryModal
    };
};
