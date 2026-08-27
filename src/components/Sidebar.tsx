import React from 'react';
import { User } from '../types';
import { LayoutDashboard, FileUp, ClipboardCheck, FolderGit2, Sparkles } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'tasks' | 'tracking' | 'documents';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: User;
  badgeCounts: {
    pendingTasks: number;
    pendingSubmissions: number;
    documentsCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
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
      subtitle: 'ประกาศและปฏิทินส่งงาน',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as ActiveTab,
      label: isAdmin ? 'มอบหมายงาน & ประกาศ' : 'ส่งงานวิชาการ',
      subtitle: isAdmin ? 'สร้างงานและจัดการ' : 'อัปโหลดและแก้ไขงาน',
      icon: FileUp,
      badge: !isAdmin && badgeCounts.pendingTasks > 0 ? `${badgeCounts.pendingTasks} ค้าง` : null,
      badgeColor: 'bg-purple-700 text-white',
    },
    {
      id: 'tracking' as ActiveTab,
      label: 'ติดตามการส่งงาน',
      subtitle: isAdmin ? 'ตรวจงานและสถิติ' : 'ตรวจสอบสถานะงาน',
      icon: ClipboardCheck,
      badge: null,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'documents' as ActiveTab,
      label: 'ศูนย์เอกสารวิชาการ',
      subtitle: 'ดาวน์โหลดไฟล์และแบบฟอร์ม',
      icon: FolderGit2,
      badge: badgeCounts.documentsCount > 0 ? `${badgeCounts.documentsCount} ไฟล์` : null,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <aside
      id="academic-desktop-sidebar"
      className="hidden md:flex flex-col justify-between w-64 lg:w-72 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-purple-100/80 p-4 lg:p-5"
    >
      <div className="space-y-5">
        {/* Sidebar Header Category */}
        <div className="px-2 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-purple-950/60 uppercase">
            เมนูหลัก
          </span>
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            {isAdmin ? 'Admin' : 'ครูผู้สอน'}
          </span>
        </div>

        {/* 4 Navigation Buttons */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-desktop-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center justify-between group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-medium'
                    : 'bg-purple-50/40 hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-purple-100/60 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-purple-600 border border-purple-100 shadow-xs'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs lg:text-sm font-bold truncate leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] lg:text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-purple-100' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap flex-shrink-0 ${
                      isActive ? 'bg-white/25 text-white' : item.badgeColor || 'bg-purple-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info Card */}
      <div className="pt-4 border-t border-purple-50">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/60 border border-purple-100/80">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-purple-900 truncate">
              ระบบส่งงานวิชาการ
            </span>
          </div>
          <p className="text-[11px] text-purple-900/70 leading-tight">
            เน้นความรวดเร็ว มินิมอล และตรวจสอบได้ทันที
          </p>
        </div>
      </div>
    </aside>
  );
};
