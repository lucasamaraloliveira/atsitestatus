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
    AlertTriangle
} from 'lucide-react';

interface SettingsViewProps {
    isMonitoring: boolean;
    setIsMonitoring: (val: boolean) => void;
    monitoringInterval: number;
    setMonitoringInterval: (val: number) => void;
    notificationEmail: string;
    emailNotifyType: 'success' | 'error' | 'all';
    saveEmailSettings: (email: string, type: 'success' | 'error' | 'all') => void;
    childUsers: any[];
    addChildUser: (user: any) => void;
    removeChildUser: (id: string) => void;
    userRole: 'admin' | 'child';
}

const SettingsView: React.FC<SettingsViewProps> = ({
    isMonitoring,
    setIsMonitoring,
    monitoringInterval,
    setMonitoringInterval,
    notificationEmail,
    emailNotifyType,
    saveEmailSettings,
    childUsers,
    addChildUser,
    removeChildUser,
    userRole
}) => {
    const [localEmail, setLocalEmail] = useState(notificationEmail);
    const [localType, setLocalType] = useState(emailNotifyType);
    const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'team'>('preferences');

    useEffect(() => {
        setLocalEmail(notificationEmail);
        setLocalType(emailNotifyType);
    }, [notificationEmail, emailNotifyType]);

    const handleSaveEmail = () => {
        saveEmailSettings(localEmail, localType);
    };

    return (
        <div className="animate-fade-in space-y-10 pb-20">
            <header>
                <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Configurações</h2>
                <p className="text-[var(--apple-text-secondary)] font-medium mt-1">Gerencie seu ecossistema de monitoramento.</p>
            </header>

            <div className="flex bg-[var(--apple-input-bg)] p-1.5 rounded-2xl border border-[var(--apple-border)] w-fit mb-4">
                <button 
                    onClick={() => setActiveTab('preferences')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'preferences' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Preferências
                </button>
                <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'notifications' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Notificações
                </button>
                {userRole === 'admin' && (
                    <button 
                        onClick={() => setActiveTab('team')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'team' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                    >
                        Equipe
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {activeTab === 'preferences' && (
                    <section className="glass apple-card p-10 border-none space-y-10 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[var(--apple-accent)]/10 text-[var(--apple-accent)]">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Motor de Monitoramento</h3>
                                <p className="text-sm text-[var(--apple-text-secondary)]">Ajuste como o sistema analisa seus alvos.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-3xl group transition-all hover:bg-white/5">
                                <div>
                                    <p className="font-bold">Status do Monitoramento</p>
                                    <p className="text-[10px] text-[var(--apple-text-secondary)] uppercase font-black tracking-widest mt-1">{isMonitoring ? 'Ativo e processando' : 'Globalmente pausado'}</p>
                                </div>
                                <button 
                                    onClick={() => setIsMonitoring(!isMonitoring)}
                                    className={`w-14 h-7 rounded-full flex items-center transition-all px-1 ${isMonitoring ? 'bg-[#34C759]' : 'bg-gray-300 dark:bg-gray-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all ${isMonitoring ? 'translate-x-[26px]' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="p-6 bg-[var(--apple-input-bg)] rounded-3xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold">Intervalo de Verificação</p>
                                    <span className="text-xs font-black text-[var(--apple-accent)] bg-[var(--apple-accent)]/10 px-3 py-1 rounded-full">{monitoringInterval}s</span>
                                </div>
                                <input 
                                    type="range"
                                    min="10"
                                    max="1800"
                                    step="10"
                                    value={monitoringInterval}
                                    onChange={(e) => setMonitoringInterval(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-[var(--apple-border)] rounded-full appearance-none cursor-pointer accent-[var(--apple-accent)]"
                                />
                                <p className="text-[9px] text-[var(--apple-text-secondary)] font-bold uppercase tracking-widest text-center">Recomendado: 60s para estabilidade</p>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'notifications' && (
                    <section className="glass apple-card p-10 border-none space-y-10 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Alertas e Notificações</h3>
                                <p className="text-sm text-[var(--apple-text-secondary)]">Configurações para recebimento de logs via e-mail.</p>
                            </div>
                        </div>

            <div className="max-w-2xl space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">E-mail para Alertas</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] group-focus-within:opacity-0 transition-opacity duration-300 pointer-events-none">
                                        <Bell size={18} />
                                    </div>
                                    <input 
                                        type="email"
                                        value={localEmail}
                                        onChange={(e) => setLocalEmail(e.target.value)}
                                        placeholder="ex: suporte@suaempresa.com"
                                        className="apple-input w-full pl-14 focus:pl-6 py-4 bg-[var(--apple-input-bg)] border-2 border-transparent focus:border-[var(--apple-accent)]/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Severidade dos Alertas</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'error', label: 'Só Erros', color: '#FF3B30', desc: 'Alertas críticos' },
                                        { id: 'success', label: 'Sucessos', color: '#34C759', desc: 'Confirm. de Uptime' },
                                        { id: 'all', label: 'Todos', color: '#007AFF', desc: 'Log completo' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setLocalType(type.id as any)}
                                            className={`p-5 rounded-2xl text-left transition-all border-2 flex flex-col gap-1 ${localType === type.id ? 'bg-white/10 border-[var(--apple-accent)] shadow-xl' : 'border-transparent bg-[var(--apple-input-bg)] opacity-60 hover:opacity-100'}`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: localType === type.id ? type.color : 'inherit' }}>{type.label}</span>
                                            <span className="text-[9px] font-bold opacity-60">{type.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => {
                                        handleSaveEmail();
                                        const btn = document.getElementById('save-email-btn');
                                        if(btn) {
                                            const originalText = btn.innerHTML;
                                            btn.innerHTML = '✅ Configurações Salvas!';
                                            btn.style.backgroundColor = '#34C759';
                                            btn.style.color = 'white';
                                            setTimeout(() => {
                                                btn.innerHTML = originalText;
                                                btn.style.backgroundColor = '';
                                                btn.style.color = '';
                                            }, 2000);
                                        }
                                    }}
                                    id="save-email-btn"
                                    className="w-full sm:w-fit px-12 bg-[var(--apple-text)] text-[var(--apple-bg)] py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                                >
                                    Salvar Preferências de Alerta
                                </button>
                                <p className="text-[9px] text-[var(--apple-text-secondary)] font-bold italic ml-2">As notificações serão enviadas conforme a severidade escolhida.</p>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'team' && userRole === 'admin' && (
                    <section className="glass apple-card p-10 border-none space-y-10 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[#5856D6]/10 text-[#5856D6]">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Gestão de Equipe</h3>
                                    <p className="text-sm text-[var(--apple-text-secondary)]">Gerencie acessos e permissões de monitoramento.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    const user = prompt("Username do novo membro:");
                                    if(user) addChildUser({ username: user, name: user, password: '123' });
                                }}
                                className="bg-[var(--apple-accent)] text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95"
                            >
                                <UserPlus size={16} />
                                Novo Membro
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {childUsers.map(user => (
                                <div key={user.id} className="p-6 bg-[var(--apple-input-bg)] rounded-3xl border border-[var(--apple-border)] flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5856D6] to-[#AF52DE] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#5856D6]/20">
                                            {user.name?.charAt(0) || user.username.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{user.name || user.username}</p>
                                            <div className="flex items-center gap-1.5">
                                                <Shield size={10} className="text-[#34C759]" />
                                                <span className="text-[9px] font-black uppercase text-[var(--apple-text-secondary)] opacity-60">Acesso Operador</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeChildUser(user.id)}
                                        className="p-2.5 rounded-xl hover:bg-[#FF3B30]/10 text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                    >
                                        <UserMinus size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
