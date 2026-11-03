import React from 'react';
import { SafeUser } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { Bell, Menu, Database, LogOut } from 'lucide-react';

interface Props {
  user: SafeUser;
  title: string;
  alertCount: number;
  onOpenSidebar: () => void;
  onNavigateAlerts: () => void;
  onOpenSupabase: () => void;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({
  user,
  title,
  alertCount,
  onOpenSidebar,
  onNavigateAlerts,
  onOpenSupabase,
  onLogout
}) => {
  const isSupabase = isSupabaseConfigured();

  const roleNames: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    director: 'ผู้อำนวยการ',
    head: 'หัวหน้ากลุ่มงาน',
    staff: 'เจ้าหน้าที่'
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Supabase Connection Status Pill */}
        <button
          onClick={onOpenSupabase}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            isSupabase
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          }`}
          title="คลิกเพื่อจัดการเชื่อมต่อฐานข้อมูล Supabase"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isSupabase ? 'Supabase: เชื่อมต่อแล้ว' : 'Supabase: ออฟไลน์'}</span>
          <span className="w-2 h-2 rounded-full animate-pulse md:hidden" style={{ backgroundColor: isSupabase ? '#10b981' : '#f59e0b' }} />
        </button>

        {/* Executive In-App Notification Bell (Hidden for Staff) */}
        {user.role !== 'staff' && (
          <button
            onClick={onNavigateAlerts}
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
            title="ศูนย์แจ้งเตือนผู้บริหาร"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                {alertCount}
              </span>
            )}
          </button>
        )}

        {/* User Info Avatar & Chips */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs">
            {user.fullName ? user.fullName.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 max-w-[130px] truncate">{user.fullName}</span>
              {user.department && (
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-medium border border-blue-100 max-w-[100px] truncate">
                  {user.department}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {roleNames[user.role] || user.role}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
          title="ออกจากระบบ"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">ออก</span>
        </button>
      </div>
    </header>
  );
};
