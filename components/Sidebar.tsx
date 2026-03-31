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
    UserCircle,
    Shield
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
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                            activeView === item.id 
                                ? 'bg-[var(--apple-input-bg)] text-[var(--apple-accent)]' 
                                : 'text-[var(--apple-text-secondary)] hover:bg-[var(--apple-input-bg)] hover:text-[var(--apple-text)]'
                        } ${isCollapsed ? 'flex-col gap-1 py-4 border-none items-center justify-center' : ''}`}
                    >
                        <item.icon size={isCollapsed ? 24 : 20} />
                        {!isCollapsed && <span className="text-sm font-medium tracking-tight">{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-[var(--apple-border)]">
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 p-2">
                        {userProfile?.photoUrl ? (
                            <img src={userProfile.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] flex items-center justify-center">
                                <UserCircle size={20} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-[var(--apple-text)]">{userProfile?.name || 'Admin'}</p>
                            <span className="text-[10px] text-[var(--apple-text-secondary)] uppercase tracking-widest font-black">{userRole}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <UserCircle size={24} className="text-[var(--apple-text-secondary)]" />
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
