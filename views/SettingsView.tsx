import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    Mail, 
    Users, 
    UserPlus, 
    UserMinus, 
    Settings as SettingsIcon,
    Shield,
    Bell,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    ShieldCheck,
    Lock,
    User,
    Image as ImageIcon,
    Eye,
    Zap,
    Map
} from 'lucide-react';
import AddUserModal from '../components/AddUserModal';

interface SettingsViewProps {
    isMonitoring: boolean;
    setIsMonitoring: (val: boolean) => void;
    monitoringInterval: number;
    setMonitoringInterval: (val: number) => void;
    notificationEmail: string;
    emailNotifyType: 'success' | 'error' | 'all';
    saveEmailSettings: (email: string, type: 'success' | 'error' | 'all') => void;
    inactivityTimeout: number;
    setInactivityTimeout: (seconds: number) => void;
    childUsers: any[];
    addChildUser: (username: string, password?: string, name?: string, permissions?: any) => Promise<void>;
    removeChildUser: (id: string) => void;
    userRole: 'admin' | 'child';
    userProfile: any;
    handleUpdateProfile: (name: string, password?: string, photoUrl?: string) => Promise<void>;
    isActivityTrackingEnabled: boolean;
    setIsActivityTrackingEnabled: (val: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    isMonitoring,
    setIsMonitoring,
    monitoringInterval,
    setMonitoringInterval,
    notificationEmail,
    emailNotifyType,
    saveEmailSettings,
    inactivityTimeout,
    setInactivityTimeout,
    childUsers,
    addChildUser,
    removeChildUser,
    userRole,
    userProfile,
    handleUpdateProfile,
    isActivityTrackingEnabled,
    setIsActivityTrackingEnabled
}) => {
    const [localEmail, setLocalEmail] = useState(notificationEmail);
    const [localType, setLocalType] = useState(emailNotifyType);
    const [localName, setLocalName] = useState(userProfile?.name || '');
    const [localPassword, setLocalPassword] = useState('');
    const [localPhotoUrl, setLocalPhotoUrl] = useState(userProfile?.photoUrl || '');
    const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'team'>('preferences');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    useEffect(() => {
        setLocalEmail(notificationEmail);
        setLocalType(emailNotifyType);
    }, [notificationEmail, emailNotifyType]);

    const formatTimestamp = (ts: number | null) => {
        if (!ts) return 'Nunca';
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getViewLabel = (view: string) => {
        const views: Record<string, string> = {
            'dashboard': 'Dashboard',
            'activity': 'Atividade',
            'reports': 'Relatórios',
            'settings': 'Ajustes'
        };
        return views[view] || view;
    };

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-12">
                <h2 className="text-4xl font-extrabold tracking-tight mb-2">Ajustes</h2>
                <p className="text-[var(--apple-text-secondary)] font-medium">Configure sua experiência e equipe.</p>
            </header>

            <div className="flex gap-2 p-1.5 bg-[var(--apple-input-bg)] w-fit rounded-2xl mb-12 border border-[var(--apple-border)]">
                {[
                    { id: 'preferences', label: 'Preferências', icon: SettingsIcon },
                    { id: 'notifications', label: 'Notificações', icon: Bell },
                    { id: 'team', label: 'Equipe', icon: Users, hidden: userRole !== 'admin' }
                ].filter(t => !t.hidden).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white shadow-lg text-[var(--apple-accent)]' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {activeTab === 'preferences' && (
                    <div className="max-w-2xl space-y-12 animate-fade-in">
                        {/* Perfil Section */}
                        <div className="space-y-8">
                            <header className="flex items-center gap-3 mb-6">
                                <User className="text-[var(--apple-accent)]" />
                                <h3 className="text-xl font-bold tracking-tight">Seu Perfil</h3>
                            </header>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Seu Nome</label>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={localName}
                                            onChange={(e) => setLocalName(e.target.value)}
                                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 text-sm font-medium outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Nova Senha (Opcional)</label>
                                    <div className="relative group">
                                        <input 
                                            type="password" 
                                            value={localPassword}
                                            onChange={(e) => setLocalPassword(e.target.value)}
                                            placeholder="Min 6 caracteres"
                                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 text-sm font-medium outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">URL da Foto de Perfil</label>
                                <div className="relative group">
                                    <input 
                                        type="url" 
                                        value={localPhotoUrl}
                                        onChange={(e) => setLocalPhotoUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 text-sm font-medium outline-none text-[var(--apple-accent)]"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={() => handleUpdateProfile(localName, localPassword || undefined, localPhotoUrl || undefined)}
                                className="bg-[var(--apple-text)] text-[var(--apple-bg)] px-8 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all"
                            >
                                Salvar Perfil
                            </button>
                        </div>

                        <div className="h-px bg-[var(--apple-border)] w-full opacity-50"></div>

                        <div className="space-y-8">
                            <header className="flex items-center gap-3 mb-6">
                                <Activity className="text-[var(--apple-accent)]" />
                                <h3 className="text-xl font-bold tracking-tight">Monitoramento</h3>
                            </header>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-3xl group transition-all hover:bg-white/5">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Tempo de Inatividade</span>
                                        <p className="text-sm font-bold mt-1">Sessão Segura</p>
                                    </div>
                                    <select 
                                        value={inactivityTimeout}
                                        onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                                        className="bg-transparent font-black text-[var(--apple-accent)] outline-none cursor-pointer"
                                    >
                                        <option value={300}>5 min</option>
                                        <option value={900}>15 min</option>
                                        <option value={1800}>30 min</option>
                                        <option value={3600}>1 hora</option>
                                        <option value={-1}>Nunca</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-3xl group transition-all hover:bg-white/5">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Rastreamento de Equipe</span>
                                        <p className="text-sm font-bold mt-1">Monitor de Atividade</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsActivityTrackingEnabled(!isActivityTrackingEnabled)}
                                        className={`w-10 h-6 rounded-full transition-all relative ${isActivityTrackingEnabled ? 'bg-[#34C759]' : 'bg-gray-200 dark:bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isActivityTrackingEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="max-w-2xl space-y-12 animate-fade-in">
                        <section className="space-y-8">
                            <header className="flex items-center gap-3">
                                <Mail className="text-[var(--apple-accent)]" />
                                <h3 className="text-xl font-bold tracking-tight">Alertas por E-mail</h3>
                            </header>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">E-mail de Destino</label>
                                    <div className="relative group">
                                        <Bell className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] transition-all" size={20} />
                                        <input 
                                            type="email" 
                                            value={localEmail}
                                            onChange={(e) => setLocalEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-14 text-sm font-medium outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">Quando Notificar?</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'error', label: 'Erros' },
                                            { id: 'success', label: 'Sucessos' },
                                            { id: 'all', label: 'Tudo' }
                                        ].map((t) => (
                                            <button 
                                                key={t.id}
                                                onClick={() => setLocalType(t.id as any)}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${localType === t.id ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] hover:bg-white/5'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => saveEmailSettings(localEmail, localType)}
                                    className="bg-[var(--apple-text)] text-[var(--apple-bg)] px-8 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                    Salvar Ajustes
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="max-w-5xl animate-fade-in">
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Controle de Equipe</h3>
                                <p className="text-sm text-[var(--apple-text-secondary)]">Gerencie permissões e monitore acessos em tempo real.</p>
                            </div>
                            {userRole === 'admin' && (
                                <button 
                                    onClick={() => setIsAddUserModalOpen(true)}
                                    className="apple-button h-11 px-6 shadow-lg flex items-center gap-2"
                                >
                                    <UserPlus size={18} />
                                    <span className="text-xs uppercase tracking-widest font-black">Adicionar</span>
                                </button>
                            )}
                        </header>

                        <div className="grid grid-cols-1 gap-6">
                            {childUsers.length === 0 ? (
                                <div className="glass apple-card p-12 text-center border-none shadow-xl">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--apple-text-secondary)] opacity-30">
                                        <Users size={32} />
                                    </div>
                                    <h4 className="font-bold text-[var(--apple-text)]">Nenhum membro ainda</h4>
                                    <p className="text-sm text-[var(--apple-text-secondary)] mt-2">Sua equipe aparecerá aqui.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {childUsers.map((user) => (
                                        <div key={user.id} className="glass apple-card p-6 border-none shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    {user.photoUrl ? (
                                                        <img src={user.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--apple-input-bg)] to-white/5 flex items-center justify-center text-[var(--apple-accent)] font-black text-xl border border-white/5">
                                                            {user.name?.charAt(0) || user.username.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-bold text-base block tracking-tight">{user.name || user.username}</span>
                                                        <div className="flex items-center gap-1.5 text-[var(--apple-text-secondary)] mt-1">
                                                            <Shield size={12} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{user.role || 'Membro'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {userRole === 'admin' && (
                                                    <button 
                                                        onClick={() => removeChildUser(user.id)}
                                                        className="p-2 text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF3B30]/10 rounded-xl"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Monitor de Atividade Vivo */}
                                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Radar de Atividade</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.lastActivity ? 'bg-[#34C759]' : 'bg-gray-500'}`}></div>
                                                        <span className="text-[9px] font-black uppercase text-white/50">{user.lastActivity ? 'Ativo' : 'Offline'}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Map size={12} className="text-[var(--apple-accent)]" />
                                                            <span className="text-[10px] font-bold text-white/70">Menu Atual</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white">{user.lastActivity ? getViewLabel(user.lastActivity.view) : '---'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Zap size={12} className="text-[#FF9500]" />
                                                            <span className="text-[10px] font-bold text-white/70">Última Ação</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white">{user.lastActivity?.action || 'Conectando...'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-[#5AC8FA]" />
                                                            <span className="text-[10px] font-bold text-white/70">Horário</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/40">{formatTimestamp(user.lastActivity?.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Permissions Badge */}
                                            <div className="mt-4 flex gap-2">
                                                {user.permissions?.canEdit && <span title="Pode Editar Sites" className="p-1 px-2 bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] rounded-lg text-[8px] font-black uppercase">Editor</span>}
                                                {user.permissions?.canManageTeam && <span title="Admin de Equipe" className="p-1 px-2 bg-[#FF9500]/10 text-[#FF9500] rounded-lg text-[8px] font-black uppercase">Staff</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-12 p-10 glass-dark rounded-[3rem] border border-white/5 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--apple-accent)]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                            <div className="flex items-center gap-4 text-[var(--apple-accent)] mb-4">
                                <ShieldCheck size={28} />
                                <h4 className="font-black text-base uppercase tracking-widest">Protocolos de Segurança</h4>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed font-medium max-w-2xl">
                                O rastreamento de atividade permite auditar acessos e garantir que a infraestrutura esteja sendo monitorada corretamente. Usuários com perfil 'Viewer' não possuem registro de escrita, apenas telemetria de visualização.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <AddUserModal 
                isOpen={isAddUserModalOpen} 
                onClose={() => setIsAddUserModalOpen(false)} 
                onAdd={(u, p, n, perms) => addChildUser(u, p, n, perms)} 
            />
        </div>
    );
};

export default SettingsView;
