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
    Activity,
    BarChart3,
    Shield,
    UserCircle
} from 'lucide-react';

interface SidebarProps {
    activeView: string;
    setActiveView: (view: any) => void;
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
    userRole: "admin" | "child";
    userProfile: any;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeView, 
    setActiveView,
    isCollapsed,
    setIsCollapsed,
    userRole,
    userProfile
}) => {
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const menuItems = [
        { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
        { id: 'reports', label: 'Relatórios', icon: BarChart3 },
        { id: 'activity', label: 'Atividade', icon: Activity },
        { id: 'settings', label: 'Ajustes', icon: Settings },
    ];

    return (
        <aside 
            className={`fixed left-4 top-4 bottom-4 glass border border-[var(--apple-border)] transition-all duration-300 z-40 flex flex-col rounded-[2.5rem] shadow-2xl ${isCollapsed ? 'w-24' : 'w-64'}`}
        >
            {/* Header */}
            <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-fade-in text-nowrap">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#007AFF]/20">AT</div>
                        <span className="font-black text-lg text-[var(--apple-text)] tracking-tighter italic uppercase">SiteStatus</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#007AFF]/20 animate-pulse-slow">AT</div>
                )}
            </div>

            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 w-7 h-7 rounded-full bg-[var(--apple-card-bg)] border border-[var(--apple-border)] flex items-center justify-center text-[var(--apple-text-secondary)] hover:text-[var(--apple-accent)] shadow-md transition-all z-50 hover:scale-110 active:scale-90"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Navigation */}
            <nav className="flex-grow px-4 mt-6 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group ${
                            activeView === item.id 
                                ? 'bg-[var(--apple-accent)] text-white shadow-[0_8px_20px_-4px_rgba(0,122,255,0.4)]' 
                                : 'text-[var(--apple-text-secondary)] hover:bg-[var(--apple-input-bg)] hover:text-[var(--apple-text)]'
                        } ${isCollapsed ? 'justify-center py-5' : ''}`}
                    >
                        <item.icon size={isCollapsed ? 28 : 22} className={`shrink-0 ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`} />
                        {!isCollapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 mt-auto">
                {!isCollapsed ? (
                    <div className="p-4 glass-dark rounded-[2rem] border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-all">
                        {userProfile?.photoUrl ? (
                            <img src={userProfile.photoUrl} alt="Perfil" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] flex items-center justify-center border border-white/5">
                                <UserCircle size={24} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-black truncate text-white uppercase tracking-tight">{userProfile?.name || 'Admin'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Shield size={10} className="text-[#FF9500]" />
                                <span className="text-[9px] font-black uppercase text-[#FF9500] tracking-widest">{userRole}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--apple-text-secondary)]">
                            <UserCircle size={28} />
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
