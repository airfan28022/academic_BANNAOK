import React from 'react';
import { User, SchoolConfig } from '../types';
import { Settings, LogOut, ShieldCheck, UserCheck, Menu } from 'lucide-react';
import { formatThaiDate } from '../utils/storage';

interface NavbarProps {
  currentUser: User;
  schoolConfig: SchoolConfig;
  onOpenSettings: () => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  schoolConfig,
  onOpenSettings,
  onLogout,
  onToggleMobileMenu,
  pendingCount = 0,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Left: Mobile Toggle & Brand / School Info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              id="mobile-sidebar-toggle-btn"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* School Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                {schoolConfig.schoolLogo ? (
                  <img
                    src={schoolConfig.schoolLogo}
                    alt="School Logo"
                    className="w-full h-full object-cover rounded-[14px]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <i className="fa-solid fa-graduation-cap text-white text-xl"></i>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight line-clamp-1">
                    {schoolConfig.schoolName}
                  </h1>
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    ปีการศึกษา {schoolConfig.academicYear} / เทอม {schoolConfig.term}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {schoolConfig.departmentName} &bull; วันนี้ {formatThaiDate(todayStr, true)}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Small Action Buttons (Settings, User Badge, Logout) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* User Profile Chip */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center border border-purple-200 flex-shrink-0">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-bold text-purple-700">
                    {currentUser.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1">
                  {currentUser.role === 'admin' ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-purple-700">
                      <ShieldCheck className="w-3 h-3 text-purple-600" /> ผู้ดูแลระบบ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700">
                      <UserCheck className="w-3 h-3 text-emerald-600" /> ครูผู้สอน / สมาชิก
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Small Settings Button */}
            <button
              id="top-settings-btn"
              onClick={onOpenSettings}
              className="relative p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 shadow-sm transition-all duration-200 flex items-center gap-1.5"
              title="การตั้งค่าระบบ"
            >
              <Settings className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">ตั้งค่า</span>
              {currentUser.role === 'admin' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Small Logout Button */}
            <button
              id="top-logout-btn"
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-xl text-rose-600 bg-rose-50/70 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 shadow-sm transition-all duration-200 flex items-center gap-1.5"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
