import React from 'react';
import { User } from '../types';
import { LayoutDashboard, FileUp, ClipboardCheck, FolderGit2 } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: User;
  badgeCounts: {
    pendingTasks: number;
    pendingSubmissions: number;
    documentsCount: number;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  badgeCounts,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'หน้าหลัก',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as ActiveTab,
      label: isAdmin ? 'มอบงาน' : 'ส่งงาน',
      icon: FileUp,
      badge: !isAdmin && badgeCounts.pendingTasks > 0 ? badgeCounts.pendingTasks : null,
      badgeColor: 'bg-purple-700 text-white',
    },
    {
      id: 'tracking' as ActiveTab,
      label: 'ติดตาม',
      icon: ClipboardCheck,
      badge: null,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'documents' as ActiveTab,
      label: 'เอกสาร',
      icon: FolderGit2,
      badge: badgeCounts.documentsCount > 0 ? badgeCounts.documentsCount : null,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-[0_-4px_20px_rgba(107,33,168,0.08)] transition-all pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[68px] transition-all duration-150 ${
                isActive
                  ? 'text-purple-700 bg-purple-100/70 font-bold scale-105'
                  : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50/50 font-medium'
              }`}
              title={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-purple-700' : 'text-slate-500'}`} />
                {item.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                      item.badgeColor || 'bg-purple-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-purple-700 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
