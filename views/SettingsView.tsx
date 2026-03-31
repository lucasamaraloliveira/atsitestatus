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
    X, 
    FileText, 
    Download, 
    Clock
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
    const [localName, setLocalName] = useState(userProfile?.name || '');
    const [localPassword, setLocalPassword] = useState('');
    const [localPhotoUrl, setLocalPhotoUrl] = useState(userProfile?.photoUrl || '');
    const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'team'>('preferences');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    useEffect(() => {
        setLocalEmail(notificationEmail);
        setLocalName(userProfile?.name || '');
        setLocalPhotoUrl(userProfile?.photoUrl || '');
    }, [notificationEmail, userProfile]);

    const handleSaveEmail = () => {
        saveEmailSettings(localEmail, emailNotifyType);
    };

    return (
        <div className="animate-fade-in pb-24">
            <header className="mb-10">
                <h2 className="text-4xl font-extrabold tracking-tight">Ajustes</h2>
                <p className="text-[var(--apple-text-secondary)] font-medium">Controle sua conta e equipe de monitoramento.</p>
            </header>

            <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                    { id: 'preferences', label: 'Preferências', icon: SettingsIcon },
                    { id: 'notifications', label: 'Notificações', icon: Bell },
                    { id: 'team', label: 'Equipe', icon: Users, hidden: userRole !== 'admin' }
                ].filter(tab => !tab.hidden).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black whitespace-nowrap uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                                ? 'bg-[var(--apple-text)] text-[var(--apple-bg)] shadow-lg' 
                                : 'bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] hover:bg-white/5 opacity-60 hover:opacity-100'
                        }`}
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
                                <Shield className="text-[var(--apple-accent)]" />
                                <h3 className="text-xl font-bold tracking-tight">Seu Perfil</h3>
                            </header>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Seu Nome</label>
                                    <input 
                                        type="text" 
                                        value={localName}
                                        onChange={(e) => setLocalName(e.target.value)}
                                        className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 text-sm font-medium outline-none text-[var(--apple-text)] focus:ring-4 focus:ring-[var(--apple-accent)]/10 transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Nova Senha (Opcional)</label>
                                    <input 
                                        type="password" 
                                        value={localPassword}
                                        onChange={(e) => setLocalPassword(e.target.value)}
                                        placeholder="Mín 6 caracteres"
                                        className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 text-sm font-medium outline-none text-[var(--apple-text)]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">URL da Foto de Perfil</label>
                                <input 
                                    type="url" 
                                    value={localPhotoUrl}
                                    onChange={(e) => setLocalPhotoUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 px-6 text-sm font-medium outline-none text-[var(--apple-accent)]"
                                />
                            </div>

                            <button 
                                onClick={() => {
                                    handleUpdateProfile(localName, localPassword || undefined, localPhotoUrl || undefined);
                                    setLocalPassword('');
                                }}
                                className="bg-[var(--apple-text)] text-[var(--apple-bg)] px-10 h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-black/10"
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
                            
                            <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-[2rem] border border-[var(--apple-border)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--apple-accent)]">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest block">Intervalo</span>
                                        <span className="text-lg font-black">{monitoringInterval} seg</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {[30, 60, 120].map((int) => (
                                        <button
                                            key={int}
                                            onClick={() => setMonitoringInterval(int)}
                                            className={`w-12 h-12 rounded-xl text-xs font-black transition-all border-2 ${monitoringInterval === int ? 'bg-[var(--apple-accent)] text-white border-transparent' : 'border-transparent bg-white/5 text-[var(--apple-text-secondary)] hover:bg-white/10'}`}
                                        >
                                            {int === 120 ? '2m' : int + 's'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="max-w-2xl space-y-10 animate-fade-in">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">E-mail para Alertas</label>
                            <div className="relative group">
                                <Bell size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-40" />
                                <input 
                                    type="email" 
                                    value={localEmail}
                                    onChange={(e) => setLocalEmail(e.target.value)}
                                    placeholder="suporte@empresa.com"
                                    className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-[1.5rem] py-5 px-7 text-sm font-medium outline-none focus:ring-4 focus:ring-[var(--apple-accent)]/10 transition-all pr-16"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Auto-Logout (Por Inatividade)</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { val: 300, lbl: '5 Min' },
                                    { val: 900, lbl: '15 Min' },
                                    { val: 1800, lbl: '30 Min' },
                                    { val: 3600, lbl: '1 Hora' },
                                    { val: -1, lbl: 'Nunca' }
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => setInactivityTimeout(opt.val)}
                                        className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${inactivityTimeout === opt.val ? 'bg-[var(--apple-accent)] text-white border-transparent shadow-[var(--apple-accent)]/20 shadow-xl' : 'bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] border-transparent hover:bg-white/10'}`}
                                    >
                                        {opt.lbl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveEmail}
                            className="w-full h-14 bg-[var(--apple-text)] text-[var(--apple-bg)] rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                        >
                            Salvar Configurações de Alerta
                        </button>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="max-w-4xl space-y-10 animate-fade-in">
                        <header className="flex justify-between items-end">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Equipe</h3>
                                <p className="text-sm text-[var(--apple-text-secondary)]">Organize os membros que acessam este painel.</p>
                            </div>
                            <button 
                                onClick={() => setIsAddUserModalOpen(true)}
                                className="apple-button h-12 px-8 flex items-center gap-2 shadow-lg shadow-[var(--apple-accent)]/20 transition-all hover:scale-[1.03]"
                            >
                                <UserPlus size={18} />
                                <span className="text-[10px] uppercase font-black tracking-widest">Novo Membro</span>
                            </button>
                        </header>

                        {childUsers.length === 0 ? (
                            <div className="p-20 glass apple-card text-center border-none shadow-xl">
                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white/20">
                                    <Users size={40} />
                                </div>
                                <h4 className="font-bold text-xl">Nenhum integrante ainda</h4>
                                <p className="text-sm text-[var(--apple-text-secondary)] mt-2">Os membros da sua equipe aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {childUsers.map((user) => (
                                    <div key={user.id} className="glass apple-card p-6 flex items-center justify-between border-none shadow-xl group transition-all hover:scale-[1.01]">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--apple-accent)]/10 to-transparent flex items-center justify-center text-[var(--apple-accent)] font-black text-xl border border-[var(--apple-accent)]/10">
                                                {user.photoUrl ? <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" /> : (user.name?.charAt(0) || user.username.charAt(0))}
                                            </div>
                                            <div>
                                                <span className="font-bold text-lg block leading-tight">{user.name || user.username}</span>
                                                <div className="flex items-center gap-2 text-[var(--apple-text-secondary)] mt-1">
                                                    <ShieldCheck size={12} className="text-[#34C759]" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Colaborador</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeChildUser(user.id)}
                                            className="p-3 bg-[#FF3B30]/10 text-[#FF3B30] rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF3B30]/20"
                                            title="Remover"
                                        >
                                            <UserMinus size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-8 glass-dark rounded-[2.5rem] border border-white/5 mt-10">
                            <div className="flex items-center gap-4 text-[#34C759] mb-4">
                                <ShieldCheck size={28} />
                                <h4 className="font-black text-xs uppercase tracking-widest">Segunraça de Infraestrutura</h4>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed font-medium">
                                Membros têm acesso apenas à visualização dos alvos designados. A exclusão definitiva de qualquer dado de monitoramento permanece exclusiva da conta administrativa principal.
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
