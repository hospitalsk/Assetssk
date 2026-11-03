import React, { useState } from 'react';
import { AppData, SafeUser } from '../../types';
import { addDepartment, deleteDepartment, addLocation, deleteLocation } from '../../services/db';
import { showToast, showLoading, hideLoading, showConfirm } from '../../lib/alerts';
import { Building2, MapPin, Plus, Trash2 } from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
}

export const DepartmentsView: React.FC<Props> = ({ data, user, onRefresh }) => {
  const [deptName, setDeptName] = useState('');
  const [locName, setLocName] = useState('');
  const isAdmin = user.role === 'admin';

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    showLoading('กำลังเพิ่มหน่วยงาน...');
    try {
      await addDepartment(deptName.trim());
      hideLoading();
      showToast('เพิ่มหน่วยงานเรียบร้อยแล้ว', 'success');
      setDeptName('');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'เพิ่มหน่วยงานไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    const ok = await showConfirm(
      'ยืนยันการลบหน่วยงาน?',
      `คุณต้องการลบหน่วยงาน "${name}" หรือไม่? โปรดตรวจสอบว่าไม่มีครุภัณฑ์หรือวัสดุผูกกับหน่วยงานนี้`,
      'ลบหน่วยงาน',
      'ยกเลิก',
      'danger'
    );
    if (!ok) return;

    showLoading('กำลังลบหน่วยงาน...');
    try {
      await deleteDepartment(id);
      hideLoading();
      showToast('ลบหน่วยงานเรียบร้อยแล้ว', 'success');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'ลบล้มเหลว', 'error');
    }
  };

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    showLoading('กำลังเพิ่มสถานที่...');
    try {
      await addLocation(locName.trim());
      hideLoading();
      showToast('เพิ่มสถานที่เรียบร้อยแล้ว', 'success');
      setLocName('');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'เพิ่มสถานที่ไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteLoc = async (id: string, name: string) => {
    const ok = await showConfirm(
      'ยืนยันการลบสถานที่?',
      `คุณต้องการลบสถานที่ "${name}" หรือไม่? โปรดตรวจสอบว่าไม่มีครุภัณฑ์ติดตั้งอยู่ที่นี่`,
      'ลบสถานที่',
      'ยกเลิก',
      'danger'
    );
    if (!ok) return;

    showLoading('กำลังลบสถานที่...');
    try {
      await deleteLocation(id);
      hideLoading();
      showToast('ลบสถานที่เรียบร้อยแล้ว', 'success');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'ลบล้มเหลว', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          หน่วยงาน / สถานที่
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          จัดการรายชื่อกลุ่มงาน ฝ่าย แผนก และสถานที่จัดเก็บ/ติดตั้งครุภัณฑ์
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              หน่วยงาน / กลุ่มงาน ({data.departments.length})
            </h3>
          </div>

          {isAdmin && (
            <form onSubmit={handleAddDept} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                placeholder="ชื่อกลุ่มงาน หรือฝ่ายใหม่..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </form>
          )}

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold w-12">#</th>
                  <th className="py-2.5 px-3 font-semibold">ชื่อหน่วยงาน</th>
                  {isAdmin && <th className="py-2.5 px-3 font-semibold text-right w-16">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.departments.map((d, i) => (
                  <tr key={d.DepartmentID} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{d.DepartmentName}</td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteDept(d.DepartmentID, d.DepartmentName)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="ลบหน่วยงาน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Locations Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              สถานที่ตั้ง / อาคาร / ห้อง ({data.locations.length})
            </h3>
          </div>

          {isAdmin && (
            <form onSubmit={handleAddLoc} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                value={locName}
                onChange={e => setLocName(e.target.value)}
                placeholder="ชื่ออาคาร หรือห้องจัดเก็บใหม่..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </form>
          )}

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold w-12">#</th>
                  <th className="py-2.5 px-3 font-semibold">ชื่อสถานที่</th>
                  {isAdmin && <th className="py-2.5 px-3 font-semibold text-right w-16">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.locations.map((l, i) => (
                  <tr key={l.LocationID} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{l.LocationName}</td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteLoc(l.LocationID, l.LocationName)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="ลบสถานที่"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
