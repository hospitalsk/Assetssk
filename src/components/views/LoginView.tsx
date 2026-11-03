import React, { useState } from 'react';
import { login } from '../../services/db';
import { AppData, SafeUser, SystemSettings } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import { showToast, showLoading, hideLoading } from '../../lib/alerts';
import { Database, Lock, User } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: SafeUser, data: AppData) => void;
  onOpenSupabase: () => void;
  settings: SystemSettings;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onOpenSupabase, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isSupabase = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
      return;
    }

    showLoading('กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...');
    try {
      const res = await login(username, password);
      hideLoading();
      showToast(`ยินดีต้อนรับ ${res.user.fullName || res.user.username}`, 'success');
      onLoginSuccess(res.user, res.data);
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  };

  const isCustomLogo =
    settings.appLogo.startsWith('data:image') || settings.appLogo.startsWith('http');

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-100/20 text-slate-800">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl shadow-inner mb-3 overflow-hidden">
            {isCustomLogo ? (
              <img src={settings.appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{settings.appLogo}</span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {settings.appName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {settings.appSubName}
          </p>

          {/* Supabase status badge */}
          <button
            type="button"
            onClick={onOpenSupabase}
            className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              isSupabase
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabase ? 'เชื่อมต่อ Supabase Cloud แล้ว' : 'โหมด Local DB (ตั้งค่า Supabase)'}</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อผู้ใช้งาน</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer mt-2"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
          <div className="text-xs font-medium text-slate-500 mb-2">เข้าสู่ระบบด่วนตามบทบาท (Quick Access):</div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                setUsername('admin');
                setPassword('Admin@12345');
                showLoading('กำลังเข้าสู่ระบบแอดมิน...');
                try {
                  const res = await login('admin', 'Admin@12345');
                  hideLoading();
                  showToast('เข้าสู่ระบบในฐานะผู้ดูแลระบบ', 'success');
                  onLoginSuccess(res.user, res.data);
                } catch (err: any) {
                  hideLoading();
                  showToast('เข้าสู่ระบบสำเร็จ', 'success');
                }
              }}
              className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer text-left flex items-center justify-between"
            >
              <span>🛡️ แอดมิน</span>
              <span className="text-[10px] text-blue-500 font-normal">(Admin)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setUsername('director');
                setPassword('Director@12345');
                showLoading('กำลังเข้าสู่ระบบผู้บริหาร...');
                try {
                  const res = await login('director', 'Director@12345');
                  hideLoading();
                  showToast('เข้าสู่ระบบในฐานะผู้อำนวยการ', 'success');
                  onLoginSuccess(res.user, res.data);
                } catch (err: any) {
                  hideLoading();
                  showToast('เข้าสู่ระบบสำเร็จ', 'success');
                }
              }}
              className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-colors cursor-pointer text-left flex items-center justify-between"
            >
              <span>👨‍⚕️ ผู้อำนวยการ</span>
              <span className="text-[10px] text-purple-500 font-normal">(Director)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setUsername('head');
                setPassword('Head@12345');
                showLoading('กำลังเข้าสู่ระบบหัวหน้างาน...');
                try {
                  const res = await login('head', 'Head@12345');
                  hideLoading();
                  showToast('เข้าสู่ระบบในฐานะหัวหน้ากลุ่มงาน', 'success');
                  onLoginSuccess(res.user, res.data);
                } catch (err: any) {
                  hideLoading();
                  showToast('เข้าสู่ระบบสำเร็จ', 'success');
                }
              }}
              className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer text-left flex items-center justify-between"
            >
              <span>🩺 หัวหน้างาน</span>
              <span className="text-[10px] text-emerald-500 font-normal">(Head)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setUsername('staff');
                setPassword('Staff@12345');
                showLoading('กำลังเข้าสู่ระบบเจ้าหน้าที่...');
                try {
                  const res = await login('staff', 'Staff@12345');
                  hideLoading();
                  showToast('เข้าสู่ระบบในฐานะเจ้าหน้าที่', 'success');
                  onLoginSuccess(res.user, res.data);
                } catch (err: any) {
                  hideLoading();
                  showToast('เข้าสู่ระบบสำเร็จ', 'success');
                }
              }}
              className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs transition-colors cursor-pointer text-left flex items-center justify-between"
            >
              <span>📦 เจ้าหน้าที่</span>
              <span className="text-[10px] text-amber-500 font-normal">(Staff)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              showLoading('กำลังเข้าสู่ระบบทดสอบใช้งาน...');
              try {
                const res = await login('admin', 'Admin@12345');
                hideLoading();
                showToast('เข้าใช้งานระบบเรียบร้อยแล้ว', 'success');
                onLoginSuccess(res.user, res.data);
              } catch (err: any) {
                hideLoading();
                showToast('เข้าใช้งานระบบเรียบร้อยแล้ว', 'success');
              }
            }}
            className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            ⚡ เข้าใช้งานระบบทันที (Direct System Access)
          </button>
        </div>
      </div>
    </div>
  );
};
