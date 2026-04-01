import { useState, useCallback, useEffect, useRef } from 'react';
import { checkWebsiteStatus } from '@/services/geminiService';
import { requestNotificationPermission, sendNotification } from '@/services/notificationService';
import { CheckStatus } from '@/types';
import type { StatusResult, LogEntry, AudioSettings } from '@/types';
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

type NotificationType = { id: number; message: string; type: 'alert' | 'warning' | 'success' | 'info' };
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

    // Configurações de E-mail e Segurança
    const [notificationEmail, setNotificationEmail] = useState('');
    const [emailNotifyType, setEmailNotifyType] = useState<'success' | 'error' | 'all'>('error');
    const [inactivityTimeout, setInactivityTimeout] = useState(1800); // 30 minutos padrão

    const [childUsers, setChildUsers] = useState<any[]>([]);
    const [effectiveOwnerId, setEffectiveOwnerId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'child'>('admin');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [parentName, setParentName] = useState<string | null>(null);
    const [audioSettings, setAudioSettings] = useState<AudioSettings>({
        enabled: true,
        triggers: ['offline', 'error'],
        selectedSound: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
    });

    const intervalRef = useRef<number | null>(null);
    const undoTimeoutRef = useRef<number | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);

    // Refs para garantir que as funções assíncronas sempre usem o dado mais recente
    const sitesRef = useRef<StatusResult[]>([]);
    const isMonitoringRef = useRef<boolean>(false);
    const intervalRefValue = useRef<number>(60);
    const lockRef = useRef<boolean>(false);
    const isCheckingRef = useRef<boolean>(false); // Trava para evitar múltiplos ciclos simultâneos

    useEffect(() => { sitesRef.current = sites; }, [sites]);
    useEffect(() => { isMonitoringRef.current = isMonitoring; }, [isMonitoring]);
    useEffect(() => { intervalRefValue.current = monitoringInterval; }, [monitoringInterval]);

    const addToastNotification = useCallback((message: string, type: 'alert' | 'warning' | 'success' | 'info' = 'alert') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setNotifications(prev => [...prev, { id, message, type }]);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const playNotificationSound = useCallback(() => {
        if (!audioSettings.enabled || typeof window === 'undefined') return;
        const audio = new Audio(audioSettings.selectedSound);
        audio.volume = 0.5;
        audio.play().catch(err => {
            console.warn("Aviso: Alerta sonoro impedido pelo navegador ou fonte inválida.", err.message);
        });
    }, [audioSettings]);

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

                    let finalEffectiveId = targetUser;

                    if (!isParentFetch && data.role === 'child' && data.parentId) {
                        setUserRole('child');
                        setUserProfile(data);
                        if (unsubRef.current) unsubRef.current();
                        unsubRef.current = fetchUserData(data.parentId, true);
                        return;
                    }

                    if (isParentFetch) {
                        setUserRole('child');
                        setParentName(data.name || data.username);
                    } else {
                        setUserRole(data.role || 'admin');
                        setUserProfile(data);
                        setParentName(null);
                    }

                    // CARREGAMENTO DE ESTADOS (Independente se é pai ou filho buscando do pai)
                    setIsMonitoring(!!data.isMonitoring);
                    setMonitoringInterval(data.monitoringInterval || 60);

                    if (!isParentFetch) {
                        if (data.notificationEmail) setNotificationEmail(data.notificationEmail);
                        if (data.emailNotifyType) setEmailNotifyType(data.emailNotifyType);
                        if (data.viewMode) setViewMode(data.viewMode);
                        if (data.inactivityTimeout) setInactivityTimeout(data.inactivityTimeout);
                        if (data.audioSettings) setAudioSettings(data.audioSettings);
                    } else {
                        // Se for busca do pai (filho lendo do pai), sincroniza emails do alerta
                        if (data.notificationEmail) setNotificationEmail(data.notificationEmail);
                        if (data.emailNotifyType) setEmailNotifyType(data.emailNotifyType);
                    }

                    if (isParentFetch || data.role !== 'child') {
                        setSites(data.sites || []);
                        setChildUsers(data.childUsers || []);
                        setEffectiveOwnerId(targetUser);
                    }

                } else if (!snapshot.exists() && !isParentFetch) {
                    setEffectiveOwnerId(targetUser);
                    setUserRole('admin');
                    // A criação do documento é feita pelo App.tsx ou Dashboard, não aqui para evitar sobrescritas
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

    const cleanData = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(cleanData);
        if (obj !== null && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, cleanData(v)])
            );
        }
        return obj;
    };

    const saveToFirestore = useCallback(async (
        updatedSites?: StatusResult[],
        updatedInterval?: number,
        updatedMonitoring?: boolean,
        updatedChildUsers?: any[],
        updatedViewMode?: 'card' | 'list'
    ) => {
        if (!username || !effectiveOwnerId) return;

        try {
            const batch = writeBatch(db);

            // 1. DADOS INDIVIDUAIS (Salva no próprio documento do usuário logado)
            const selfRef = doc(db, 'users', username);
            const personalData: any = cleanData({
                viewMode: updatedViewMode ?? viewMode,
                inactivityTimeout,
                audioSettings // Agora salvando configurações de áudio pessoais
            });
            batch.set(selfRef, personalData, { merge: true });

            // 2. DADOS COMPARTILHADOS (Ativo, Intervalo, E-mail, Equipe e Sites)
            // Salva no documento do Administrador (effectiveOwnerId)
            const ownerRef = doc(db, 'users', effectiveOwnerId);
            const sharedData: any = cleanData({
                monitoringInterval: updatedInterval ?? intervalRefValue.current,
                isMonitoring: updatedMonitoring ?? isMonitoringRef.current,
                notificationEmail,
                emailNotifyType
            });

            if (updatedSites) sharedData.sites = cleanData(updatedSites);
            if (updatedChildUsers) sharedData.childUsers = cleanData(updatedChildUsers);

            batch.set(ownerRef, sharedData, { merge: true });

            await batch.commit();
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
        }
    }, [username, effectiveOwnerId, childUsers, notificationEmail, emailNotifyType, viewMode, inactivityTimeout]);

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
        lockRef.current = true;
        setViewMode(mode);
        saveToFirestore(undefined, undefined, undefined, undefined, mode)
            .finally(() => {
                setTimeout(() => { lockRef.current = false; }, 1000);
            });
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

    const [recentlyDeletedChild, setRecentlyDeletedChild] = useState<any | null>(null);
    const [isDeleteChildModalOpen, setIsDeleteChildModalOpen] = useState(false);
    const [childToDelete, setChildToDelete] = useState<any | null>(null);

    const addChildUser = async (user: any) => {
        if (!effectiveOwnerId || userRole !== 'admin') return;
        try {
            const updatedChildUsers = [...childUsers, { ...user, id: crypto.randomUUID(), createdAt: Date.now() }];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            const childUserRef = doc(db, 'users', user.username);
            await setDoc(childUserRef, { ...user, role: 'child', parentId: effectiveOwnerId }, { merge: true });
            addToastNotification(`Operador ${user.name || user.username} adicionado.`, "warning");
        } catch (error) {
            console.error("Erro ao adicionar usuário filho:", error);
            addToastNotification("Falha ao salvar usuário.", "alert");
        }
    };

    const updateChildUser = async (childId: string, updatedData: any) => {
        if (!effectiveOwnerId || userRole !== 'admin') return;
        try {
            const childToUpdate = childUsers.find(u => u.id === childId);
            if (!childToUpdate) return;
            const updatedChildUsers = childUsers.map(u => u.id === childId ? { ...u, ...updatedData } : u);
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            const childUserRef = doc(db, 'users', childToUpdate.username);
            await setDoc(childUserRef, { ...updatedData, role: 'child', parentId: effectiveOwnerId }, { merge: true });
            addToastNotification("Dados do membro atualizados.", "warning");
        } catch (error) {
            console.error("Erro ao atualizar usuário filho:", error);
            addToastNotification("Falha ao atualizar membro.", "alert");
        }
    };

    const handleRequestDeleteChild = (childId: string) => {
        const child = childUsers.find(u => u.id === childId);
        if (child) {
            setChildToDelete(child);
            setIsDeleteChildModalOpen(true);
        }
    };

    const handleConfirmDeleteChild = async () => {
        if (!childToDelete || !effectiveOwnerId) return;
        try {
            const updatedChildUsers = childUsers.filter(u => u.id !== childToDelete.id);
            setRecentlyDeletedChild(childToDelete);
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);

            // Opcional: deletar o documento individual do usuário filho (pode ser mantido ou deletado)
            // Se deletar, o undo fica mais complexo, mas por padrão vamos deletar para manter a integridade.
            await deleteDoc(doc(db, 'users', childToDelete.username));

            setIsDeleteChildModalOpen(false);
            setChildToDelete(null);
            addToastNotification(`O operador removido. Clique aqui para desfazer`, "warning");
        } catch (error) {
            console.error("Erro ao remover membro:", error);
            addToastNotification("Erro ao remover membro.", "alert");
        }
    };

    const handleUndoDeleteChild = async () => {
        if (!recentlyDeletedChild || !effectiveOwnerId) return;
        try {
            const updatedChildUsers = [...childUsers, recentlyDeletedChild];
            await saveToFirestore(sites, monitoringInterval, isMonitoring, updatedChildUsers);
            const childUserRef = doc(db, 'users', recentlyDeletedChild.username);
            await setDoc(childUserRef, { ...recentlyDeletedChild, role: 'child', parentId: effectiveOwnerId }, { merge: true });

            setRecentlyDeletedChild(null);
            addToastNotification("Membro restaurado com sucesso.", "warning");
        } catch (error) {
            console.error("Erro ao desfazer remoção:", error);
            addToastNotification("Falha ao restaurar membro.", "alert");
        }
    };

    const removeChildUser = async (childId: string) => {
        handleRequestDeleteChild(childId);
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

    const sendEmailNotification = useCallback(async (siteName: string, url: string, status: string, message: string, latency?: number) => {
        if (!notificationEmail || !emailNotifyType) return;

        // Regras de envio baseadas na configuração do usuário
        const shouldSend =
            (emailNotifyType === 'all') ||
            (emailNotifyType === 'error' && (status === 'offline' || status === 'error')) ||
            (emailNotifyType === 'success' && status === 'online');

        if (!shouldSend) return;

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: notificationEmail,
                    siteName,
                    url,
                    status,
                    message,
                    latency,
                    timestamp: new Date().toLocaleString()
                })
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("❌ Erro no Servidor de E-mail:", data.error || "Erro desconhecido");
            } else {
                console.log("✅ Alerta de e-mail enviado com sucesso!");
            }
        } catch (error) {
            console.error("❌ Falha crítica ao tentar disparar o e-mail:", error);
        }
    }, [notificationEmail, emailNotifyType]);

    const handleCheckStatus = useCallback(async (siteId: string, url: string) => {
        setSites(prev => prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.CHECKING, message: 'Verificando...' } : s));
        try {
            const siteToProbe = sitesRef.current.find(s => s.id === siteId);
            const result = await checkWebsiteStatus(url, siteToProbe?.keyword);

            let finalUpdatedSites: StatusResult[] = [];

            setSites(prev => {
                const siteToCheck = prev.find(s => s.id === siteId);
                if (siteToCheck) {
                    const siteName = siteToCheck.name || url;

                    if (siteToCheck.status !== result.status && siteToCheck.status !== CheckStatus.CHECKING) {
                        if (result.status === CheckStatus.OFFLINE || result.status === CheckStatus.ERROR) {
                            addToastNotification(`Alerta: O site ${siteName} ficou offline!`, 'alert');
                            if (audioSettings.triggers.includes('offline') || audioSettings.triggers.includes('error')) playNotificationSound();
                            sendNotification('Site Offline', { body: siteName });
                            sendEmailNotification(siteName, url, result.status, result.message, result.latency);
                        } else if (result.status === CheckStatus.ONLINE) {
                            addToastNotification(`Sucesso: O site ${siteName} está online.`, 'success');
                            if (audioSettings.triggers.includes('online')) playNotificationSound();
                            sendEmailNotification(siteName, url, result.status, result.message, result.latency);
                        }
                    } else if (result.status === CheckStatus.ONLINE && result.latency && result.latency > HIGH_LATENCY_THRESHOLD) {
                        addToastNotification(`Atenção: Latência alta em ${siteName} (${result.latency}ms).`, 'warning');
                        if (emailNotifyType === 'all') {
                            sendEmailNotification(siteName, url, 'latência alta', result.message, result.latency);
                        }
                    }
                }
                const updatedSites = prev.map(s => s.id === siteId ? { 
                    ...s, 
                    status: result.status, 
                    message: result.message, 
                    timestamp: new Date().toLocaleString(), 
                    latency: result.latency,
                    sslExpiryDate: result.sslExpiryDate,
                    sslDaysRemaining: result.sslDaysRemaining
                } : s);
                finalUpdatedSites = updatedSites;
                return updatedSites;
            });

            if (finalUpdatedSites.length > 0) {
                await saveToFirestore(finalUpdatedSites);
            }
            await addLogEntry(siteId, result.status, result.message, result.latency);
        } catch (error) {
            console.error("Erro:", error);
            setSites(prev => {
                const updatedSites = prev.map(s => s.id === siteId ? { ...s, status: CheckStatus.ERROR, message: "Falha na verificação.", timestamp: new Date().toLocaleString() } : s);
                return updatedSites;
            });
        }
    }, [saveToFirestore, addLogEntry, addToastNotification, sendEmailNotification, emailNotifyType, audioSettings, playNotificationSound, sendNotification]);

    const handleAddSite = async (urlParam?: string, nameParam?: string, keywordParam?: string) => {
        let url = (urlParam || newSiteUrl).trim();
        const name = (nameParam || newSiteName).trim();
        const keyword = (keywordParam || "").trim();

        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        try { new URL(url); } catch (_) { alert("URL inválida."); return; }

        const newSite: StatusResult = {
            id: crypto.randomUUID(),
            url,
            name: name || undefined,
            keyword: keyword || undefined,
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
        addToastNotification(`Site "${name || url}" adicionado com sucesso.`, "success");
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
        addToastNotification(`Site "${siteToDelete.name || siteToDelete.url}" removido.`, "alert");
        undoTimeoutRef.current = window.setTimeout(() => setRecentlyDeleted(null), 7000);
        handleCloseDeleteModal();
    };

    const handleUndoDelete = async () => {
        if (!recentlyDeleted) return;
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        const updatedSites = [...sites, recentlyDeleted.site].sort((a, b) => a.url.localeCompare(b.url));
        await saveToFirestore(updatedSites);
        addToastNotification(`Monitoramento de "${recentlyDeleted.site.name || recentlyDeleted.site.url}" restaurado.`, "success");
        setRecentlyDeleted(null);
    };

    const handleUpdateSite = async (id: string, urlParam: string, nameParam: string, keywordParam: string) => {
        let url = urlParam.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
        const updatedSites = sites.map(s => s.id === id ? { 
            ...s, 
            url, 
            name: nameParam.trim() || undefined, 
            keyword: keywordParam.trim() || undefined
        } : s);
        setEditingSiteId(null);
        await saveToFirestore(updatedSites);
        addToastNotification(`Site "${nameParam || url}" atualizado com sucesso.`, "info");
        handleCheckStatus(id, url);
    };

    const handleConfirmClearHistory = async () => {
        if (!siteToClearHistory || !effectiveOwnerId) return;
        try {
            const logsRef = collection(db, 'users', effectiveOwnerId, 'sites', siteToClearHistory.id, 'logs');
            const snapshot = await getDocs(logsRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();

            // Limpa o estado local imediatamente para feedback visual
            setLogs(prev => ({ ...prev, [siteToClearHistory.id]: [] }));

            addToastNotification(`Histórico de ${siteToClearHistory.name || siteToClearHistory.url} limpo com sucesso.`, "alert");
            setIsClearHistoryModalOpen(false);
            setSiteToClearHistory(null);
        } catch (error) {
            console.error("Erro ao limpar histórico:", error);
            addToastNotification("Falha ao limpar histórico.", "alert");
        }
    };

    const handleSaveAudioSettings = async (settings: AudioSettings) => {
        if (!username) return;
        setAudioSettings(settings);
        const userRef = doc(db, 'users', username);
        await setDoc(userRef, { audioSettings: settings }, { merge: true });
    };

    const handleRefreshAll = useCallback(async () => {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;
        try {
            const currentSites = sitesRef.current;
            for (const site of currentSites) {
                await handleCheckStatus(site.id, site.url);
            }
        } finally {
            isCheckingRef.current = false;
        }
    }, [handleCheckStatus]);

    const refreshAllRef = useRef(handleRefreshAll);
    useEffect(() => { refreshAllRef.current = handleRefreshAll; }, [handleRefreshAll]);

    useEffect(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!isMonitoring || monitoringInterval <= 0) return;

        // Primeira execução imediata
        refreshAllRef.current();

        const id = window.setInterval(() => {
            refreshAllRef.current();
        }, monitoringInterval * 1000);

        intervalRef.current = id;

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isMonitoring, monitoringInterval]);

    return {
        sites, logs, newSiteUrl, setNewSiteUrl, newSiteName, setNewSiteName, filter, setFilter, sortOrder, setSortOrder,
        editingSiteId, isMonitoring, setIsMonitoring: handleSetIsMonitoring, monitoringInterval, setMonitoringInterval: handleSetMonitoringInterval,
        selectedSiteId, setSelectedSiteId, recentlyDeleted, notifications, removeNotification, addToastNotification,
        isDeleteModalOpen, siteToDelete, isGlobalReportModalOpen, setIsGlobalReportModalOpen,
        isClearHistoryModalOpen, siteToClearHistory,
        childUsers, addChildUser, removeChildUser, updateChildUser, userRole, userProfile,
        isDeleteChildModalOpen, childToDelete, confirmDeleteChild: handleConfirmDeleteChild, undoDeleteChild: handleUndoDeleteChild, setIsDeleteChildModalOpen,
        handleAddSite, handleRequestDelete, handleConfirmDelete,
        handleCloseDeleteModal, handleUndoDelete, handleEditSite: (id: string) => setEditingSiteId(id), handleUpdateSite, handleRefreshSite: (id: string) => { const s = sites.find(x => x.id === id); if (s) handleCheckStatus(id, s.url); }, handleRefreshAll,
        requestClearHistory: (id: string) => { const s = sites.find(x => x.id === id); if (s) { setSiteToClearHistory(s); setIsClearHistoryModalOpen(true); } }, confirmClearHistory: handleConfirmClearHistory, closeClearHistoryModal: () => { setIsClearHistoryModalOpen(false); setSiteToClearHistory(null); },
        viewMode, setViewMode: handleSetViewMode, isAddSiteModalOpen, setIsAddSiteModalOpen,
        notificationEmail, emailNotifyType, setNotificationEmail, setEmailNotifyType, saveEmailSettings: handleSetEmailSettings,
        inactivityTimeout, setInactivityTimeout: handleSetInactivityTimeout,
        clearAllLogs: handleClearAllLogs,
        parentName,
        audioSettings,
        saveAudioSettings: handleSaveAudioSettings
    };
};
