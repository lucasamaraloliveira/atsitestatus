import React, { useState } from 'react';
import { 
    Users, 
    Settings as SettingsIcon, 
    Shield, 
    Key, 
    UserPlus, 
    Trash2, 
    CheckCircle2, 
    XCircle 
} from 'lucide-react';

interface SettingsViewProps {
    isMonitoring: boolean;
    setIsMonitoring: (val: boolean) => void;
    monitoringInterval: number;
    setMonitoringInterval: (val: number) => void;
    childUsers: any[];
    addChildUser: (user: any) => Promise<void>;
    removeChildUser: (id: string) => Promise<void>;
    userRole: 'admin' | 'child';
}

const SettingsView: React.FC<SettingsViewProps> = ({
    isMonitoring,
    setIsMonitoring,
    monitoringInterval,
    setMonitoringInterval,
    childUsers,
    addChildUser,
    removeChildUser,
    userRole
}) => {
    const [activeTab, setActiveTab] = useState<'preferences' | 'users' | 'security'>(userRole === 'admin' ? 'preferences' : 'security');
    
    // Form state for child user
    const [newChildName, setNewChildName] = useState('');
    const [newChildUsername, setNewChildUsername] = useState('');
    const [newChildPassword, setNewChildPassword] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);

    const handleCreateChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChildUsername || !newChildPassword) return;
        
        await addChildUser({
            name: newChildName,
            username: newChildUsername,
            password: newChildPassword,
            permissions: ['view'], // Default
            canEdit: false,
            canDelete: false
        });
        
        setNewChildName('');
        setNewChildUsername('');
        setNewChildPassword('');
        setIsAddingUser(false);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <header className="mb-10">
                <h2 className="text-4xl font-extrabold text-[var(--apple-text)] tracking-tight">Configurações</h2>
                <p className="text-[var(--apple-text-secondary)] mt-2 font-medium">Gerencie sua conta, usuários e preferências de monitoramento.</p>
            </header>

            <div className="flex gap-2 mb-8 bg-[var(--apple-input-bg)] p-1.5 rounded-2xl w-fit">
                {userRole === 'admin' && (
                    <button 
                        onClick={() => setActiveTab('preferences')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'preferences' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                    >
                        <SettingsIcon size={16} />
                        Preferências
                    </button>
                )}
                {userRole === 'admin' && (
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                    >
                        <Users size={16} />
                        Usuários Filhos
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-[var(--apple-card-bg)] text-[var(--apple-accent)] shadow-sm' : 'text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]'}`}
                >
                    <Shield size={16} />
                    Segurança
                </button>
            </div>

            <div className="space-y-6">
                {activeTab === 'preferences' && userRole === 'admin' && (
                    <div className="glass apple-card p-8 animate-fade-in">
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                            <SettingsIcon className="text-[var(--apple-accent)]" /> 
                            Preferências do Sistema
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-2xl">
                                <div>
                                    <h4 className="font-bold text-[var(--apple-text)]">Monitoramento Automático</h4>
                                    <p className="text-xs text-[var(--apple-text-secondary)]">Verifica sites periodicamente em segundo plano.</p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isMonitoring} onChange={(e) => setIsMonitoring(e.target.checked)} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#34C759]"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-[var(--apple-input-bg)] rounded-2xl">
                                <div>
                                    <h4 className="font-bold text-[var(--apple-text)]">Intervalo de Verificação</h4>
                                    <p className="text-xs text-[var(--apple-text-secondary)]">Tempo de espera entre cada análise (mín. 5s).</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        value={monitoringInterval} 
                                        onChange={(e) => setMonitoringInterval(parseInt(e.target.value) || 5)}
                                        className="bg-[var(--apple-card-bg)] border border-[var(--apple-border)] rounded-xl px-4 py-2 w-20 text-center font-bold text-[var(--apple-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent)]/20"
                                        min="5"
                                    />
                                    <span className="text-[10px] font-black uppercase text-[var(--apple-text-secondary)] tracking-widest">seg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && userRole === 'admin' && (
                    <div className="glass apple-card p-8 animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="text-[var(--apple-accent)]" /> 
                                Gerenciar Usuários
                            </h3>
                            <button 
                                onClick={() => setIsAddingUser(!isAddingUser)}
                                className="apple-button h-10 px-4 text-xs flex items-center gap-2"
                            >
                                <UserPlus size={14} />
                                Novo Usuário
                            </button>
                        </div>

                        {isAddingUser && (
                            <form onSubmit={handleCreateChild} className="mb-8 p-6 bg-[var(--apple-input-bg)] rounded-2xl border border-[var(--apple-accent)]/20 animate-fade-in-slide-up">
                                <h4 className="font-bold mb-4 text-sm">Cadastrar Novo Acesso</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input 
                                        type="text" 
                                        placeholder="Nome Completo" 
                                        value={newChildName}
                                        onChange={(e) => setNewChildName(e.target.value)}
                                        className="apple-input bg-[var(--apple-card-bg)]"
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Username / E-mail" 
                                        value={newChildUsername}
                                        onChange={(e) => setNewChildUsername(e.target.value)}
                                        className="apple-input bg-[var(--apple-card-bg)]"
                                        required
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Senha de Acesso" 
                                        value={newChildPassword}
                                        onChange={(e) => setNewChildPassword(e.target.value)}
                                        className="apple-input bg-[var(--apple-card-bg)]"
                                        required
                                    />
                                    <div className="flex items-center gap-3 px-4 py-2 border border-[var(--apple-border)] rounded-xl bg-[var(--apple-card-bg)]">
                                        <Shield size={16} className="text-[var(--apple-text-secondary)]" />
                                        <span className="text-xs font-medium text-[var(--apple-text-secondary)]">Acesso: Apenas Visualização</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingUser(false)}
                                        className="px-4 py-2 text-xs font-bold text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="apple-button h-9 px-6 text-xs"
                                    >
                                        Criar Usuário
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3">
                            {childUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-[var(--apple-input-bg)] rounded-2xl hover:bg-[var(--apple-border)]/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--apple-accent)]/10 flex items-center justify-center text-[var(--apple-accent)] font-bold">
                                            {user.name?.charAt(0) || user.username?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{user.name || user.username}</p>
                                            <p className="text-[10px] text-[var(--apple-text-secondary)] font-medium uppercase tracking-widest">{user.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <div className="flex items-center gap-1.5 justify-end">
                                               <CheckCircle2 size={12} className="text-[#34C759]" />
                                               <span className="text-[10px] font-bold text-[var(--apple-text)]">Permissão de Visualização</span>
                                            </div>
                                            <p className="text-[9px] text-[var(--apple-text-secondary)]">Sincronizado via Parent Account</p>
                                        </div>
                                        <button 
                                            onClick={() => removeChildUser(user.id)}
                                            className="p-2 text-[var(--apple-text-secondary)] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-all"
                                            title="Remover acesso"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {childUsers.length === 0 && !isAddingUser && (
                                <div className="text-center py-12 border-2 border-dashed border-[var(--apple-border)] rounded-3xl">
                                    <Users size={40} className="mx-auto mb-4 text-[var(--apple-text-secondary)]/30" />
                                    <p className="text-sm font-medium text-[var(--apple-text-secondary)]">Nenhum usuário filho cadastrado.</p>
                                    <p className="text-xs text-[var(--apple-text-secondary)]">Crie acessos adicionais para que outros possam ver seus sites.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="glass apple-card p-8 animate-fade-in">
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                            <Key className="text-[var(--apple-accent)]" /> 
                            Segurança da Conta
                        </h3>

                        <div className="space-y-4">
                            <div className="p-6 bg-[var(--apple-input-bg)] rounded-2xl space-y-4">
                                <h4 className="font-bold text-sm">Trocar Senha</h4>
                                <p className="text-xs text-[var(--apple-text-secondary)]">Mantenha sua conta protegida alterando sua senha regularmente.</p>
                                
                                {userRole === 'admin' ? (
                                    <div className="p-4 bg-[var(--apple-card-bg)] rounded-xl border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                        Logado via Google. A senha deve ser alterada nas configurações da sua Conta Google.
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <input type="password" placeholder="Nova Senha" className="apple-input w-full bg-[var(--apple-card-bg)]" />
                                        <button className="apple-button w-full h-11 text-xs">Atualizar Senha</button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6 bg-[var(--apple-input-bg)] rounded-2xl">
                                <h4 className="font-bold text-sm mb-2 text-[#FF3B30]">Zona de Perigo</h4>
                                <button className="text-xs font-bold text-[#FF3B30] hover:underline">Sair de todos os dispositivos</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
