import React from 'react';
import { User } from '../types';
import { LayoutDashboard, FileUp, ClipboardCheck, FolderGit2, Sparkles, X } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'tasks' | 'tracking' | 'documents';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: User;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
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
  isMobileOpen,
  onCloseMobile,
  badgeCounts,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'หน้าหลัก',
      subtitle: isAdmin ? 'ภาพรวมและสถิติวิชาการ' : 'รายการงานและปฏิทินส่งงาน',
      icon: LayoutDashboard,
      badge: null,
      glowClass: 'btn-glow-purple',
      activeColor: 'bg-purple-600 text-white shadow-md',
      inactiveHover: 'hover:bg-purple-50 hover:text-purple-700',
    },
    {
      id: 'tasks' as ActiveTab,
      label: 'มอบหมายงาน & ส่งงาน',
      subtitle: isAdmin ? 'มอบหมายงาน & ประกาศ' : 'รายการงาน & ส่งงาน',
      icon: FileUp,
      badge: !isAdmin && badgeCounts.pendingTasks > 0 ? `${badgeCounts.pendingTasks} งานค้าง` : null,
      badgeColor: 'bg-rose-500 text-white',
      glowClass: 'btn-glow-purple',
      activeColor: 'bg-purple-600 text-white shadow-md',
      inactiveHover: 'hover:bg-purple-50 hover:text-purple-700',
    },
    {
      id: 'tracking' as ActiveTab,
      label: 'ติดตามงาน',
      subtitle: isAdmin ? 'ติดตามสถานะการส่งงาน' : 'สถานะส่งงานของครู',
      icon: ClipboardCheck,
      badge: null,
      badgeColor: 'bg-amber-500 text-white',
      glowClass: 'btn-glow-emerald',
      activeColor: 'bg-emerald-600 text-white shadow-md',
      inactiveHover: 'hover:bg-emerald-50 hover:text-emerald-700',
    },
    {
      id: 'documents' as ActiveTab,
      label: 'ศูนย์เอกสาร',
      subtitle: 'เอกสารตัวอย่าง & คำสั่ง',
      icon: FolderGit2,
      badge: badgeCounts.documentsCount > 0 ? `${badgeCounts.documentsCount} ไฟล์` : null,
      badgeColor: 'bg-slate-200 text-slate-700',
      glowClass: 'btn-glow-amber',
      activeColor: 'bg-amber-500 text-white shadow-md',
      inactiveHover: 'hover:bg-amber-50 hover:text-amber-700',
    },
  ];

  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="academic-main-sidebar"
        className={`fixed lg:sticky top-0 lg:top-18 left-0 z-50 lg:z-10 h-screen lg:h-[calc(100vh-4.5rem)] w-72 sm:w-80 bg-white border-r border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                วิ
              </span>
              <span className="font-bold text-slate-800 text-base">เมนูระบบวิชาการ</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Title */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                เมนูการทำงานหลัก
              </span>
              <span className="text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {isAdmin ? 'โหมด Admin' : 'โหมด สมาชิก'}
              </span>
            </div>

            {/* Big Prominent Left Navigation Buttons (No text wrap, text fills line) */}
            <nav className="space-y-2.5">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between group ${
                      isActive
                        ? `${item.activeColor} ${item.glowClass} scale-[1.01]`
                        : `bg-slate-50/70 border border-slate-200/60 text-slate-700 ${item.inactiveHover} hover:border-slate-300 hover:scale-[1.008]`
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-purple-600 border border-slate-200/80 shadow-xs'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      {/* Text full in one line with nowrap */}
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold whitespace-nowrap leading-snug">
                          {item.label}
                        </span>
                        <span
                          className={`text-[11px] whitespace-nowrap font-normal ${
                            isActive ? 'text-white/80' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Badge if present */}
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap flex-shrink-0 ${
                          isActive ? 'bg-white/30 text-white' : item.badgeColor
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
        </div>

        {/* Bottom System Info Card */}
        <div className="pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/40 border border-slate-200/70">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                ระบบจัดการงานวิชาการ
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              อัปโหลดไฟล์สะดวกรวดเร็ว ตรวจสอบความคืบหน้าได้แบบเรียลไทม์
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
