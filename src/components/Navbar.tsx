import React from 'react';
import { User, SchoolConfig } from '../types';
import { Settings, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { formatThaiDate } from '../utils/storage';

interface NavbarProps {
  currentUser: User;
  schoolConfig: SchoolConfig;
  onOpenSettings: () => void;
  onLogout: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  schoolConfig,
  onOpenSettings,
  onLogout,
  pendingCount = 0,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Left: Brand / School Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 p-0.5 shadow-sm shadow-purple-600/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {schoolConfig.schoolLogo ? (
                <img
                  src={schoolConfig.schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <i className="fa-solid fa-graduation-cap text-white text-base"></i>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                {schoolConfig.schoolName}
              </h1>
              <p className="text-[10px] sm:text-xs text-purple-900/70 font-medium truncate">
                {schoolConfig.departmentName} &bull; {formatThaiDate(todayStr, false)}
              </p>
            </div>
          </div>

          {/* Right: User Role & Actions (Settings & Logout) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* User status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-100 text-xs">
              {currentUser.role === 'admin' ? (
                <span className="font-bold text-purple-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="font-semibold text-purple-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span className="truncate max-w-[90px] sm:max-w-[140px]">{currentUser.name}</span>
                </span>
              )}
            </div>

            {/* Settings button */}
            <button
              id="top-settings-btn"
              onClick={onOpenSettings}
              className="relative p-1.5 sm:p-2 text-purple-700 bg-purple-50/70 border border-purple-200/80 hover:bg-purple-100 hover:text-purple-900 rounded-xl shadow-xs transition-colors"
              title="การตั้งค่า"
              aria-label="การตั้งค่า"
            >
              <Settings className="w-4 h-4 text-purple-600" />
              {currentUser.role === 'admin' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              id="top-logout-btn"
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-rose-600 bg-rose-50/80 border border-rose-200 hover:bg-rose-100 rounded-xl shadow-xs transition-colors"
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
