import React, { useState } from 'react';
import { AppData, SafeUser } from '../../types';
import { addUser, setUserActive } from '../../services/db';
import { showToast, showLoading, hideLoading, showConfirm } from '../../lib/alerts';
import { Users, Plus, Shield, CheckCircle2, XCircle, X } from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
}

export const UsersView: React.FC<Props> = ({ data, user, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'director' | 'head' | 'staff'>('staff');
  const [department, setDepartment] = useState('');

  const roleNames: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ (Admin)',
    director: 'ผู้อำนวยการ (Director)',
    head: 'หัวหน้ากลุ่มงาน (Head)',
    staff: 'เจ้าหน้าที่ (Staff)'
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !password) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
      return;
    }

    showLoading('กำลังสร้างบัญชีผู้ใช้...');
    try {
      await addUser({
        username: username.trim(),
        fullName: fullName.trim(),
        password,
        role,
        department
      });
      hideLoading();
      showToast('สร้างบัญชีผู้ใช้ใหม่เรียบร้อยแล้ว', 'success');
      setModalOpen(false);
      setUsername('');
      setFullName('');
      setPassword('');
      setDepartment('');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'สร้างบัญชีไม่สำเร็จ', 'error');
    }
  };

  const handleToggleActive = async (targetUser: any) => {
    const nextState = !targetUser.active;
    const ok = await showConfirm(
      nextState ? 'เปิดใช้งานบัญชีผู้ใช้?' : 'ปิดใช้งานบัญชีผู้ใช้?',
      nextState
        ? `ผู้ใช้ "${targetUser.username}" จะสามารถเข้าสู่ระบบได้ตามปกติ`
        : `ผู้ใช้ "${targetUser.username}" จะไม่สามารถเข้าสู่ระบบได้ชั่วคราว`,
      nextState ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
      'ยกเลิก',
      nextState ? 'question' : 'warning'
    );
    if (!ok) return;

    showLoading('กำลังปรับปรุงสถานะ...');
    try {
      await setUserActive(targetUser.userId, nextState);
      hideLoading();
      showToast('ปรับสถานะผู้ใช้เรียบร้อยแล้ว', 'success');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'ปรับปรุงไม่สำเร็จ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ผู้ใช้งานและสิทธิ์การเข้าถึง
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการบัญชีผู้ใช้งาน และกำหนดบทบาทสิทธิ์ (เฉพาะผู้ดูแลระบบ)
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> เพิ่มผู้ใช้งานใหม่
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                <th className="py-2.5 px-3 font-semibold">ชื่อผู้ใช้</th>
                <th className="py-2.5 px-3 font-semibold">ชื่อ-นามสกุล</th>
                <th className="py-2.5 px-3 font-semibold">สิทธิ์ (Role)</th>
                <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                <th className="py-2.5 px-3 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.users.map(u => (
                <tr key={u.userId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900 font-mono">{u.username}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{u.fullName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                      {roleNames[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{u.department || 'ไม่ระบุ / ส่วนกลาง'}</td>
                  <td className="py-3 px-3">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> ปิดใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={u.username === user.username}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        u.active
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อผู้ใช้ (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="เช่น somchai.p"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="เช่น นพ. สมชาย พัฒนากร"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password@123"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สิทธิ์การเข้าถึง (Role)
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="staff">เจ้าหน้าที่ (Staff)</option>
                  <option value="head">หัวหน้ากลุ่มงาน (Head)</option>
                  <option value="director">ผู้อำนวยการ (Director)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยงานที่สังกัด
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">ไม่ระบุ / ส่วนกลาง</option>
                  {data.departments.map(d => (
                    <option key={d.DepartmentID} value={d.DepartmentName}>
                      {d.DepartmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  สร้างบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
