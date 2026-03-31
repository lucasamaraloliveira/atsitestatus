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
    onLogout: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
    onAddSite: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentUser, 
    onLogout, 
    theme, 
    toggleTheme, 
    activeView, 
    setActiveView,
    onAddSite
}) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const menuItems = [
        { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
        { id: 'reports', label: 'Relatórios', icon: FileText },
        { id: 'activity', label: 'Atividade', icon: Activity },
        { id: 'settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <aside 
            className={`fixed left-4 top-4 bottom-4 glass border border-[var(--apple-border)] transition-all duration-300 z-40 flex flex-col rounded-3xl shadow-2xl ${isCollapsed ? 'w-24' : 'w-64'}`}
        >
            {/* Header */}
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-fade-in">
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
                <button 
                    onClick={onAddSite}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--apple-accent)] text-white font-bold shadow-lg shadow-[var(--apple-accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all mb-6 ${isCollapsed ? 'flex-col gap-1 py-4' : ''}`}
                >
                    <PlusCircle size={isCollapsed ? 24 : 20} />
                    <span className={isCollapsed ? 'text-[8px] uppercase tracking-[0.05em] font-black' : ''}>Novo Site</span>
                </button>

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
                            {isCollapsed && item.id === 'settings' ? 'Configs...' : item.label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--apple-border)] space-y-2">
                <button 
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-[var(--apple-text-secondary)] hover:bg-[var(--apple-input-bg)] hover:text-[var(--apple-text)] transition-all ${isCollapsed ? 'flex-col gap-1' : ''}`}
                >
                    {theme === 'light' ? <Moon size={isCollapsed ? 24 : 20} /> : <Sun size={isCollapsed ? 24 : 20} />}
                    <span className={`font-semibold ${isCollapsed ? 'text-[7px] uppercase tracking-tighter font-black' : ''}`}>{isCollapsed ? (theme === 'light' ? 'Escuro' : 'Claro') : `Tema ${theme === 'light' ? 'Escuro' : 'Claro'}`}</span>
                </button>

                <div className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--apple-input-bg)] ${isCollapsed ? 'flex-col' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[var(--apple-accent)] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {currentUser.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-grow">
                            <p className="text-xs font-bold text-[var(--apple-text)] truncate">{currentUser}</p>
                            <p className="text-[10px] text-[var(--apple-text-secondary)]">Usuário</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button 
                            onClick={onLogout}
                            className="text-[var(--apple-text-secondary)] hover:text-[#FF3B30] transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
                {isCollapsed && (
                    <button 
                        onClick={onLogout}
                        className="w-full flex flex-col items-center gap-1 p-3 text-[var(--apple-text-secondary)] hover:text-[#FF3B30] transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="text-[7px] uppercase tracking-tighter font-black">Sair</span>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;

