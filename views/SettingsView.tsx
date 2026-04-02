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
    ChevronDown,
    Calendar,
    TrendingUp,
    FileText as FileIcon,
    Clock,
    LayoutDashboard,
    Repeat,
    BarChart,
    Edit2,
    Check,
    X,
    Search,
    Volume2,
    VolumeX,
    Play,
    Zap,
    AlertTriangle,
    CheckCircle2,
    LogOut
} from 'lucide-react';
import AddTeamMemberModal from '@/components/AddTeamMemberModal';
import { AudioSettings } from '@/types';

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
    addChildUser: (user: any) => void;
    removeChildUser: (id: string) => void;
    updateChildUser: (id: string, data: any) => void;
    userRole: 'admin' | 'child';
    onLogout?: () => void;
    isDeleteChildModalOpen: boolean;
    setIsDeleteChildModalOpen: (val: boolean) => void;
    audioSettings: AudioSettings;
    saveAudioSettings: (settings: AudioSettings) => void;
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
    updateChildUser,
    userRole,
    onLogout,
    isDeleteChildModalOpen,
    setIsDeleteChildModalOpen,
    audioSettings,
    saveAudioSettings
}) => {
    const [localEmail, setLocalEmail] = useState(notificationEmail);
    const [localType, setLocalType] = useState(emailNotifyType);
    const [activeTab, setActiveTab] = useState<'preferences' | 'team'>('preferences');
    const [editingChildId, setEditingChildId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPass, setEditPass] = useState('');
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isSoundSelectorOpen, setIsSoundSelectorOpen] = useState(false);

    const soundOptions = [
        { id: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', label: 'Ping Soft (Padrão)' },
        { id: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', label: 'Ding Metálico' },
        { id: 'https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3', label: 'Alerta de Atenção' },
        { id: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3', label: 'Erro Crítico (Urgente)' },
        { id: 'https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3', label: 'Modern Digital' }
    ];

    useEffect(() => {
        setLocalEmail(notificationEmail);
        setLocalType(emailNotifyType);
    }, [notificationEmail, emailNotifyType]);

    const handleSaveEmail = () => {
        saveEmailSettings(localEmail, localType);
    };

    const handleStartEdit = (user: any) => {
        setEditingChildId(user.id);
        setEditName(user.name || user.username);
        setEditPass(user.password || '123');
    };

    const handleSaveEdit = () => {
        if (!editingChildId) return;
        updateChildUser(editingChildId, { name: editName, password: editPass });
        setEditingChildId(null);
    };

    return (
        <div className="animate-fade-in space-y-10 pb-20">
            <header>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Configurações</h2>
                <p className="text-[var(--apple-text-secondary)] font-medium mt-1">Gerencie seu ecossistema de monitoramento.</p>
            </header>

            <div className="flex bg-[var(--apple-input-bg)] p-1.5 rounded-2xl border border-[var(--apple-border)] w-fit mb-10 gap-1 overflow-hidden">
                <button 
                    onClick={() => { setActiveTab('preferences'); setEditingChildId(null); }}
                    className={`px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'preferences' ? 'bg-[var(--apple-card-bg)] text(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    Preferências
                </button>
                {userRole === 'admin' && (
                    <button 
                        onClick={() => { setActiveTab('team'); setEditingChildId(null); }}
                        className={`px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'team' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                    >
                        Equipe
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {activeTab === 'preferences' && (
                    <div className="space-y-8 animate-fade-in">
                        <section className="glass apple-card p-6 md:p-10 border-none space-y-10 group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] transition-transform group-hover:scale-110">
                                    <Activity size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">Motor de Monitoramento</h3>
                                    <p className="text-sm text-[var(--apple-text-secondary)] font-medium">Ajuste como o sistema analisa seus alvos.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-3xl group transition-all hover:bg-white/5 border border-[var(--apple-border)]">
                                    <div>
                                        <p className="font-bold">Status do Monitoramento</p>
                                        <p className="text-[10px] text-[var(--apple-text-secondary)] uppercase font-black tracking-widest mt-1">{isMonitoring ? 'Ativo e processando' : 'Globalmente pausado'}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsMonitoring(!isMonitoring)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none ${isMonitoring ? 'bg-[#34C759] shadow-[0_0_20px_#34C759]/30' : 'bg-gray-300 dark:bg-gray-700 shadow-inner'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMonitoring ? 'translate-x-6 shadow-md' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="p-6 bg-[var(--apple-input-bg)] rounded-3xl space-y-4 border border-[var(--apple-border)]">
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

                        {/* E-mail de Alerta (Migrado das Notificações) */}
                        <section className="glass apple-card p-6 md:p-10 border-none space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-white/5 text-[var(--apple-accent)] transition-transform">
                                    <Mail size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">E-mail para Alertas</h3>
                                    <p className="text-sm text-[var(--apple-text-secondary)] font-medium">Defina onde receber avisos críticos imediatos.</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-end max-w-3xl">
                                <div className="flex-1 space-y-3 w-full">
                                    <label className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest ml-1">Endereço de E-mail</label>
                                    <div className="relative group">
                                        <Bell size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--apple-text-secondary)] opacity-50" />
                                        <input 
                                            type="email" 
                                            value={localEmail}
                                            onChange={(e) => setLocalEmail(e.target.value)}
                                            placeholder="exemplo@dominio.com"
                                            className="w-full bg-[var(--apple-input-bg)] border border-[var(--apple-border)] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-[var(--apple-accent)]/10 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveEmail}
                                    className="bg-[var(--apple-text)] text-[var(--apple-bg)] px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10"
                                >
                                    Salvar
                                </button>
                            </div>
                        </section>

                        {/* Alertas Sonoros Section */}
                        <section className="glass apple-card p-6 md:p-10 border-none space-y-10 relative group">
                            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--apple-accent)]/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-[var(--apple-accent)]/10"></div>
                            </div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] rounded-2xl transition-transform group-hover:scale-110">
                                        <Volume2 size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-[var(--apple-text)]">Alertas Sonoros</h3>
                                        <p className="text-[var(--apple-text-secondary)] text-sm font-medium">Receba avisos auditivos em tempo real.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => saveAudioSettings({ ...audioSettings, enabled: !audioSettings.enabled })}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none ${audioSettings.enabled ? 'bg-[var(--apple-accent)] shadow-[0_0_20px_var(--apple-accent)]/30' : 'bg-gray-300 dark:bg-gray-700 shadow-inner'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${audioSettings.enabled ? 'translate-x-6 shadow-md' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-500 ${audioSettings.enabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1 flex items-center gap-2">
                                        <Zap size={12} className="text-[var(--apple-accent)]" /> GATILHOS DE SOM
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'offline', label: 'Site Offline', icon: <X size={12} /> },
                                            { id: 'online', label: 'Site Online', icon: <Check size={12} /> },
                                            { id: 'error', label: 'Erro Crítico', icon: <AlertTriangle size={12} /> },
                                        ].map((trigger) => (
                                            <button
                                                key={trigger.id}
                                                onClick={() => {
                                                    const currentTriggers = Array.isArray(audioSettings.triggers) ? audioSettings.triggers : [];
                                                    const newTriggers = currentTriggers.includes(trigger.id as any)
                                                        ? currentTriggers.filter(t => t !== trigger.id)
                                                        : [...currentTriggers, trigger.id as any];
                                                    saveAudioSettings({ ...audioSettings, triggers: newTriggers as any[] });
                                                }}
                                                className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2.5 transition-all border ${audioSettings.triggers?.includes(trigger.id as any) ? 'bg-[var(--apple-accent)]/10 border-[var(--apple-accent)] text-[var(--apple-accent)] shadow-sm' : 'bg-transparent border-[var(--apple-border)] text-[var(--apple-text-secondary)] opacity-50 hover:opacity-100'}`}
                                            >
                                                {trigger.icon}
                                                {trigger.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--apple-text-secondary)] ml-1">TOM DE NOTIFICAÇÃO</h4>
                                    <div className="flex items-center gap-3 relative">
                                        <div className="relative flex-1 group">
                                            {/* Custom Dropdown Trigger */}
                                            <button 
                                                onClick={() => setIsSoundSelectorOpen(!isSoundSelectorOpen)}
                                                className="w-full bg-[var(--apple-input-bg)] dark:bg-white/5 backdrop-blur-xl border border-[var(--apple-border)] rounded-2xl py-4 pl-6 pr-12 text-sm font-extrabold text-left transition-all duration-300 outline-none text-[var(--apple-text)] cursor-pointer hover:bg-white/10 shadow-sm flex items-center justify-between"
                                            >
                                                <span>{soundOptions.find(o => o.id === audioSettings.selectedSound)?.label || 'Selecionar Som'}</span>
                                                <ChevronDown size={16} strokeWidth={3} className={`text-[var(--apple-text-secondary)] transition-transform duration-500 ${isSoundSelectorOpen ? 'rotate-180 text-[var(--apple-accent)]' : ''}`} />
                                            </button>

                                            {/* Custom Dropdown Menu */}
                                            {isSoundSelectorOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[1000]" onClick={() => setIsSoundSelectorOpen(false)}></div>
                                                    <div className="absolute bottom-full left-0 right-0 mb-3 glass border border-[var(--apple-border)] rounded-[2rem] p-3 shadow-2xl z-[1010] animate-in fade-in zoom-in duration-300 origin-bottom overflow-hidden">
                                                        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                                                            {soundOptions.map((opt) => (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => {
                                                                        saveAudioSettings({ ...audioSettings, selectedSound: opt.id });
                                                                        setIsSoundSelectorOpen(false);
                                                                    }}
                                                                    className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-xs font-bold transition-all ${audioSettings.selectedSound === opt.id ? 'bg-[var(--apple-accent)] text-white shadow-lg' : 'text-[var(--apple-text)] hover:bg-white/10'}`}
                                                                >
                                                                    {opt.label}
                                                                    {audioSettings.selectedSound === opt.id && <Check size={14} strokeWidth={4} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const audio = new Audio(audioSettings.selectedSound);
                                                audio.volume = 0.5;
                                                audio.play().catch(e => console.warn("Interação necessária para tocar som."));
                                            }}
                                            className="p-4 bg-[var(--apple-accent)] text-white rounded-2xl shadow-lg shadow-[var(--apple-accent)]/20 hover:shadow-[var(--apple-accent)]/40 active:scale-90 transition-all duration-300 group/play"
                                            title="Testar Som"
                                        >
                                            <Play size={20} fill="currentColor" className="group-hover/play:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}


                {activeTab === 'team' && userRole === 'admin' && (
                    <section className="glass apple-card p-6 md:p-10 border-none space-y-10 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[#5856D6]/10 text-[#5856D6]">
                                    <Users size={24} />
                                </div>
                                <div className="">
                                    <h3 className="text-xl font-bold">Gestão de Equipe</h3>
                                    <p className="text-sm text-[var(--apple-text-secondary)]">Gerencie acessos e permissões de monitoramento.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="bg-[var(--apple-accent)] text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--apple-accent)]/20"
                            >
                                <UserPlus size={16} />
                                Novo Membro
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {childUsers.map(user => (
                                <div key={user.id} className={`p-6 rounded-[2rem] border transition-all duration-300 ${editingChildId === user.id ? 'bg-[var(--apple-card-bg)] border-[var(--apple-accent)] shadow-2xl scale-[1.02]' : 'bg-[var(--apple-input-bg)] border-[var(--apple-border)] group'}`}>
                                    {editingChildId === user.id ? (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Edit2 size={12} className="text-[var(--apple-accent)]" />
                                                <span className="text-[10px] font-black uppercase text-[var(--apple-accent)] tracking-widest">Editando Membro</span>
                                            </div>
                                            <div className="space-y-3">
                                                <input 
                                                    type="text" 
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    placeholder="Nome do operador"
                                                    className="w-full bg-[var(--apple-bg)] border border-[var(--apple-border)] rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--apple-accent)]"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={editPass}
                                                    onChange={e => setEditPass(e.target.value)}
                                                    placeholder="Nova senha"
                                                    className="w-full bg-[var(--apple-bg)] border border-[var(--apple-border)] rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--apple-accent)]"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={handleSaveEdit} className="bg-[var(--apple-accent)] text-white flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Check size={14} /> Salvar</button>
                                                <button onClick={() => setEditingChildId(null)} className="bg-[var(--apple-input-bg)] text-[var(--apple-text-secondary)] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5856D6] to-[#AF52DE] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#5856D6]/20">
                                                        {user.name?.charAt(0) || user.username.charAt(0)}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#34C759] border-2 border-[var(--apple-input-bg)] rounded-full"></div>
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-sm tracking-tight text-[var(--apple-text)]">{user.name || user.username}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        {user.profile === 'viewer' ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Search size={10} className="text-[var(--apple-text-secondary)] opacity-50" />
                                                                <span className="text-[9px] font-black uppercase text-[var(--apple-text-secondary)] opacity-50 tracking-tighter">Visualização</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <Shield size={10} className="text-[#34C759]" />
                                                                <span className="text-[9px] font-black uppercase text-[var(--apple-text-secondary)] opacity-50 tracking-tighter">Analista de Monit.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => handleStartEdit(user)}
                                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => removeChildUser(user.id)}
                                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-[#FF3B30]/10 text-[#FF3B30] transition-all"
                                                >
                                                    <UserMinus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
            <AddTeamMemberModal 
                isOpen={isAddMemberModalOpen} 
                onClose={() => setIsAddMemberModalOpen(false)} 
                onAdd={addChildUser} 
            />
        </div>
    );
};

export default SettingsView;
