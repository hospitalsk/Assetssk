import React, { useState } from 'react';
import { changePassword } from '../../services/db';
import { showToast, showLoading, hideLoading } from '../../lib/alerts';
import { KeyRound, ShieldCheck } from 'lucide-react';

export const PasswordView: React.FC = () => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }
    if (newPass.length < 8) {
      showToast('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'error');
      return;
    }

    showLoading('กำลังเปลี่ยนรหัสผ่าน...');
    try {
      await changePassword(oldPass, newPass);
      hideLoading();
      showToast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว มีผลใช้งานทันที', 'success');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          เปลี่ยนรหัสผ่าน
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          แนะนำให้ใช้รหัสผ่านที่ปลอดภัยอย่างน้อย 8 ตัวอักษร และไม่ซ้ำกับระบบอื่น
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่านเดิม *
            </label>
            <input
              type="password"
              required
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร) *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ยืนยันรหัสผ่านใหม่ *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
            >
              บันทึกรหัสผ่านใหม่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
