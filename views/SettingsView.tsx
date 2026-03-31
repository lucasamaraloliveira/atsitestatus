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
    Image as ImageIcon
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
    addChildUser: (username: string, password?: string, name?: string) => Promise<void>;
    removeChildUser: (id: string) => void;
    userRole: 'admin' | 'child';
    userProfile: any;
    handleUpdateProfile: (name: string, password?: string, photoUrl?: string) => Promise<void>;
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
    handleUpdateProfile
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
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Frequência</span>
                                        <p className="text-sm font-bold mt-1">Intervalo Global</p>
                                    </div>
                                    <select 
                                        value={monitoringInterval}
                                        onChange={(e) => setMonitoringInterval(Number(e.target.value))}
                                        className="bg-transparent font-black text-[var(--apple-accent)] outline-none cursor-pointer"
                                    >
                                        <option value={30}>30s</option>
                                        <option value={60}>1 min</option>
                                        <option value={300}>5 min</option>
                                        <option value={600}>10 min</option>
                                    </select>
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
                    <div className="max-w-4xl animate-fade-in">
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Equipe</h3>
                                <p className="text-sm text-[var(--apple-text-secondary)]">Gerencie quem tem acesso ao painel.</p>
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

                        {childUsers.length === 0 ? (
                            <div className="glass apple-card p-12 text-center border-none shadow-xl">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--apple-text-secondary)] opacity-30">
                                    <Users size={32} />
                                </div>
                                <h4 className="font-bold text-[var(--apple-text)]">Nenhum membro ainda</h4>
                                <p className="text-sm text-[var(--apple-text-secondary)] mt-2">Sua equipe aparecerá aqui.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {childUsers.map((user) => (
                                    <div key={user.id} className="glass apple-card p-5 flex items-center justify-between border-none shadow-xl group hover:scale-[1.02] transition-all">
                                        <div className="flex items-center gap-4">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt="" className="w-12 h-12 rounded-2xl object-cover border border-[var(--apple-border)]" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-[var(--apple-input-bg)] flex items-center justify-center text-[var(--apple-accent)] font-black text-lg border border-[var(--apple-border)]">
                                                    {user.name?.charAt(0) || user.username.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-bold text-sm block tracking-tight">{user.name || user.username}</span>
                                                <div className="flex items-center gap-2 text-[var(--apple-text-secondary)]">
                                                    <Shield size={10} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Colaborador</span>
                                                </div>
                                            </div>
                                        </div>
                                        {userRole === 'admin' && (
                                            <button 
                                                onClick={() => removeChildUser(user.id)}
                                                className="p-3 bg-[#FF3B30]/10 text-[#FF3B30] rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF3B30]/20"
                                                title="Remover Membro"
                                            >
                                                <UserMinus size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-12 p-8 glass-dark rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-4 text-[var(--apple-accent)] mb-4">
                                <ShieldCheck size={24} />
                                <h4 className="font-black text-sm uppercase tracking-widest">Segurança de Equipe</h4>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed font-medium">
                                Novos membros adicionados terão acesso de visualização e controle básico. Somente administradores podem gerenciar outros membros.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <AddUserModal 
                isOpen={isAddUserModalOpen} 
                onClose={() => setIsAddUserModalOpen(false)} 
                onAdd={(u, p, n) => addChildUser(u, p, n)} 
            />
        </div>
    );
};

export default SettingsView;
