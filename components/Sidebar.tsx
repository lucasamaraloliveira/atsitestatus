import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    FileText, 
    Settings, 
    ChevronLeft, 
    ChevronRight, 
    LogOut, 
    Moon, 
    Sun,
    PlusCircle,
    Activity
} from 'lucide-react';

interface SidebarProps {
    currentUser: string;
    userProfile: any;
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
    onAddSite: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentUser, 
    userProfile,
    onLogout, 
    theme, 
    toggleTheme, 
    activeView, 
    setActiveView,
    onAddSite,
    isCollapsed,
    setIsCollapsed
}) => {
    const [isUserTrayOpen, setIsUserTrayOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const menuItems = [
        { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
        { id: 'reports', label: 'Relatórios', icon: FileText },
        { id: 'activity', label: 'Atividade', icon: Activity },
    ];

    return (
        <aside 
            className={`fixed left-4 top-4 bottom-4 glass border border-[var(--apple-border)] transition-all duration-300 z-40 flex flex-col rounded-3xl shadow-2xl ${isCollapsed ? 'w-24' : 'w-64'}`}
        >
            {/* Header */}
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-fade-in text-nowrap">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#0071E3]/20">AT</div>
                        <span className="font-bold text-[var(--apple-text)] tracking-tight">ATSiteStatus</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] flex items-center justify-center text-white font-black text-sm">AT</div>
                )}
            </div>

            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-[var(--apple-card-bg)] border border-[var(--apple-border)] flex items-center justify-center text-[var(--apple-text-secondary)] hover:text-[var(--apple-accent)] shadow-sm transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Navigation */}
            <nav className="flex-grow px-3 mt-4 space-y-2 overflow-y-auto no-scrollbar">
                <div className="mb-4 px-2">
                    <button 
                        onClick={onAddSite}
                        className={`w-full flex items-center justify-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#0071E3] to-[#00A2FF] text-white font-bold shadow-lg shadow-[#0071E3]/20 hover:scale-[1.03] active:scale-[0.97] transition-all group ${isCollapsed ? 'p-3' : 'px-4'}`}
                        title="Adicionar Novo Site"
                    >
                        <PlusCircle size={22} className="shrink-0 transition-transform group-hover:rotate-90" />
                        {!isCollapsed && <span className="text-sm tracking-tight">Novo Site</span>}
                    </button>
                </div>

                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            activeView === item.id 
                                ? 'bg-[var(--apple-input-bg)] text-[var(--apple-accent)]' 
                                : 'text-[var(--apple-text-secondary)] hover:bg-[var(--apple-input-bg)] hover:text-[var(--apple-text)]'
                        } ${isCollapsed ? 'flex-col gap-1 py-4' : ''}`}
                    >
                        <item.icon size={isCollapsed ? 24 : 20} />
                        <span className={`font-semibold ${isCollapsed ? 'text-[8px] uppercase tracking-[0.05em] font-black' : ''}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--apple-border)] relative">
                {/* User Tray Popover */}
                {isUserTrayOpen && (
                    <div className={`absolute bottom-full mb-2 glass border border-[var(--apple-border)] rounded-2xl shadow-2xl p-2 animate-fade-in-slide-up z-50 overflow-hidden ${isCollapsed ? 'w-56 left-0' : 'left-4 right-4'}`}>
                        <button 
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--apple-text-secondary)] hover:bg-[var(--apple-input-bg)] hover:text-[var(--apple-text)] transition-all"
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            <span className="text-sm font-semibold">Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
                        </button>
                        
                        <button 
                            onClick={() => {
                                setActiveView('settings');
                                setIsUserTrayOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--apple-text-secondary)] hover:bg-[var(--apple-input-bg)] hover:text-[var(--apple-text)] transition-all"
                        >
                            <Settings size={18} />
                            <span className="text-sm font-semibold">Configurações</span>
                        </button>

                        <div className="my-1 border-t border-[var(--apple-border)]"></div>

                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all font-bold"
                        >
                            <LogOut size={18} />
                            <span className="text-sm">Sair</span>
                        </button>
                    </div>
                )}

                <button 
                    onClick={() => setIsUserTrayOpen(!isUserTrayOpen)}
                    className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all ${isUserTrayOpen ? 'bg-[var(--apple-input-bg)]' : 'hover:bg-[var(--apple-input-bg)]'} ${isCollapsed ? 'flex-col' : ''}`}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0071E3] to-[#5AC8FA] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-[#0071E3]/20">
                        {(userProfile?.name || currentUser).charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-grow text-left">
                            <p className="text-xs font-bold text-[var(--apple-text)] truncate">{userProfile?.name || currentUser}</p>
                            <p className="text-[10px] text-[var(--apple-text-secondary)] font-medium">
                                {userProfile?.role === 'admin' ? 'Conta Administrativa' : 'Acesso Restrito'}
                            </p>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
