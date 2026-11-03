import React from 'react';
import { SafeUser, SystemSettings } from '../types';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Boxes,
  Wrench,
  Package,
  FileSpreadsheet,
  Bell,
  Building2,
  Users,
  History,
  KeyRound,
  Database,
  X,
  Palette
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'allocation'
  | 'assets'
  | 'repairs'
  | 'inventory'
  | 'stockReports'
  | 'alerts'
  | 'departments'
  | 'users'
  | 'logs'
  | 'password';

interface Props {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  user: SafeUser;
  alertCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenSupabase: () => void;
  settings?: SystemSettings;
  onOpenBranding?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentPage,
  onNavigate,
  user,
  alertCount,
  isOpen,
  onClose,
  onOpenSupabase,
  settings,
  onOpenBranding
}) => {
  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'staff';

  const navItem = (id: PageId, label: string, icon: React.ReactNode, badge?: number) => {
    const active = currentPage === id;
    return (
      <button
        key={id}
        onClick={() => {
          onNavigate(id);
          onClose();
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`${active ? 'text-white' : 'text-slate-400'}`}>{icon}</span>
          <span>{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              active ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const isImageLogo =
    settings?.appLogo &&
    (settings.appLogo.startsWith('data:image') ||
      settings.appLogo.startsWith('http://') ||
      settings.appLogo.startsWith('https://'));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImageLogo ? (
              <img
                src={settings?.appLogo}
                alt="Logo"
                className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {settings?.appLogo || '✚'}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm tracking-wide text-white truncate">
                {settings?.appName || 'HOSPITAL ASSET'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {settings?.appSubName || 'ระบบเวชภัณฑ์ & คลังวัสดุ'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-6">
          {/* Main Menus */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              เมนูหลัก
            </div>
            <div className="space-y-1">
              {navItem('dashboard', 'ภาพรวมระบบ', <LayoutDashboard className="w-4 h-4" />)}
              {navItem('allocation', 'จัดสรรตามหน่วยงาน', <ArrowLeftRight className="w-4 h-4" />)}
              {/* Renamed from ครุภัณฑ์ to เวชภัณฑ์ */}
              {navItem('assets', 'ทะเบียนเวชภัณฑ์', <Boxes className="w-4 h-4" />)}
              {navItem('repairs', 'แจ้งซ่อม / ติดตามซ่อม', <Wrench className="w-4 h-4" />)}
              {navItem('inventory', 'คลังวัสดุ / ตัดสต็อก', <Package className="w-4 h-4" />)}
              {navItem('stockReports', 'รายงานคลังวัสดุ', <FileSpreadsheet className="w-4 h-4" />)}
              {/* Executive alerts hidden for staff */}
              {!isStaff && navItem('alerts', 'แจ้งเตือนผู้บริหาร', <Bell className="w-4 h-4" />, alertCount)}
              {/* Department/Locations hidden for staff */}
              {!isStaff && navItem('departments', 'หน่วยงาน / สถานที่', <Building2 className="w-4 h-4" />)}
            </div>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                การจัดการระบบ
              </div>
              <div className="space-y-1">
                {navItem('users', 'ผู้ใช้งานและสิทธิ์', <Users className="w-4 h-4" />)}
                {navItem('logs', 'ประวัติการใช้งาน', <History className="w-4 h-4" />)}
                {onOpenBranding && (
                  <button
                    onClick={() => {
                      onOpenBranding();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-purple-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-purple-400" />
                      <span>ตั้งค่าชื่อและโลโก้</span>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Database & Account */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              ฐานข้อมูล & บัญชี
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenSupabase();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>ฐานข้อมูล Supabase</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                  Cloud
                </span>
              </button>
              {navItem('password', 'เปลี่ยนรหัสผ่าน', <KeyRound className="w-4 h-4" />)}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="text-xs font-semibold text-white truncate">{user.fullName}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
            <span>{user.username}</span>
            <span className="capitalize text-[10px] text-blue-400">{user.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
