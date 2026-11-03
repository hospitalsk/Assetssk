import React, { useState } from 'react';
import { AppData, Repair, SafeUser } from '../../types';
import { saveRepair } from '../../services/db';
import { showToast, showLoading, hideLoading } from '../../lib/alerts';
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
  initialRepairId?: string;
}

export const RepairsView: React.FC<Props> = ({
  data,
  user,
  onRefresh,
  initialRepairId
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(Boolean(initialRepairId));
  const initialItem = initialRepairId
    ? data.repairs.find(r => r.RepairID === initialRepairId)
    : null;
  const [editingRepair, setEditingRepair] = useState<Partial<Repair> | null>(
    initialItem || null
  );

  const filtered = data.repairs.filter(r => {
    if (statusFilter && r.Status !== statusFilter) return false;
    const term = search.toLowerCase();
    return [r.AssetCode, r.AssetName, r.Problem, r.Reporter, r.Technician]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const isAdmin = user.role === 'admin';

  const handleOpenAdd = () => {
    setEditingRepair({
      AssetID: data.assets[0]?.AssetID || '',
      Problem: '',
      Reporter: user.fullName || '',
      ReportDate: new Date().toISOString().slice(0, 10),
      Status: 'รอดำเนินการ',
      Technician: '',
      RepairDate: '',
      Cost: 0,
      Result: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (repair: Repair) => {
    if (!isAdmin) {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถจัดการปรับปรุงงานซ่อมได้', 'error');
      return;
    }
    setEditingRepair({ ...repair });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair) return;
    if (editingRepair.RepairID && !isAdmin) {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถจัดการปรับปรุงงานซ่อมได้', 'error');
      return;
    }
    if (!editingRepair.AssetID || !editingRepair.Problem?.trim()) {
      showToast('กรุณาเลือกเวชภัณฑ์และระบุอาการเสีย', 'error');
      return;
    }

    showLoading('กำลังบันทึกงานซ่อม...');
    try {
      await saveRepair(editingRepair);
      hideLoading();
      showToast('บันทึกงานซ่อมเรียบร้อยแล้ว', 'success');
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'บันทึกล้มเหลว', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            แจ้งซ่อม / ติดตามซ่อม
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            บันทึกอาการเสีย ติดตามการดำเนินงานของช่าง และบันทึกค่าใช้จ่าย
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> แจ้งซ่อมใหม่
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหารหัสเวชภัณฑ์ หรืออาการเสีย..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none cursor-pointer"
            >
              <option value="">ทุกสถานะ</option>
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="กำลังซ่อม">กำลังซ่อม</option>
              <option value="ซ่อมเสร็จ">ซ่อมเสร็จ</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            พบ {filtered.length} รายการ
          </div>
        </div>

        {/* Repairs Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">ยังไม่มีรายการแจ้งซ่อม</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">วันที่แจ้ง</th>
                  <th className="py-2.5 px-3 font-semibold">รหัส / เวชภัณฑ์</th>
                  <th className="py-2.5 px-3 font-semibold">อาการเสีย</th>
                  <th className="py-2.5 px-3 font-semibold">ผู้แจ้ง</th>
                  <th className="py-2.5 px-3 font-semibold">ช่างผู้ดูแล</th>
                  <th className="py-2.5 px-3 font-semibold">ค่าใช้จ่าย</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                  {isAdmin && <th className="py-2.5 px-3 font-semibold text-right">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.RepairID} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono text-slate-600">{r.ReportDate}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.AssetCode}</div>
                      <div className="text-slate-600 truncate max-w-xs">{r.AssetName}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">{r.Problem}</td>
                    <td className="py-3 px-3 text-slate-600">{r.Reporter}</td>
                    <td className="py-3 px-3 text-slate-600">{r.Technician || '-'}</td>
                    <td className="py-3 px-3 font-mono">
                      {Number(r.Cost || 0) > 0 ? `${Number(r.Cost).toLocaleString()} ฿` : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.Status === 'ซ่อมเสร็จ'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.Status === 'กำลังซ่อม'
                            ? 'bg-amber-50 text-amber-700'
                            : r.Status === 'ยกเลิก'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {r.Status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-colors cursor-pointer"
                        >
                          ปรับปรุงงานซ่อม
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Repair Modal */}
      {modalOpen && editingRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingRepair.RepairID ? 'รายละเอียด / ปรับปรุงงานซ่อม' : 'แจ้งซ่อมเวชภัณฑ์'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกเวชภัณฑ์ *
                </label>
                <select
                  required
                  value={editingRepair.AssetID || ''}
                  onChange={e => setEditingRepair({ ...editingRepair, AssetID: e.target.value })}
                  disabled={Boolean(editingRepair.RepairID)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                >
                  <option value="">เลือกเวชภัณฑ์ที่ต้องการแจ้งซ่อม</option>
                  {data.assets.map(a => (
                    <option key={a.AssetID} value={a.AssetID}>
                      {a.AssetCode} - {a.AssetName} ({a.Department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อาการเสีย / รายละเอียดปัญหา *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingRepair.Problem || ''}
                  onChange={e => setEditingRepair({ ...editingRepair, Problem: e.target.value })}
                  placeholder="ระบุอาการเสีย หรือความผิดปกติที่พบ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ผู้แจ้งซ่อม
                  </label>
                  <input
                    type="text"
                    value={editingRepair.Reporter || ''}
                    onChange={e => setEditingRepair({ ...editingRepair, Reporter: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่แจ้ง
                  </label>
                  <input
                    type="date"
                    value={editingRepair.ReportDate || ''}
                    onChange={e => setEditingRepair({ ...editingRepair, ReportDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะ</label>
                  <select
                    value={editingRepair.Status || 'รอดำเนินการ'}
                    onChange={e => setEditingRepair({ ...editingRepair, Status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="กำลังซ่อม">กำลังซ่อม</option>
                    <option value="ซ่อมเสร็จ">ซ่อมเสร็จ</option>
                    <option value="ยกเลิก">ยกเลิก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ผู้ดำเนินการ / ช่างผู้ดูแล
                  </label>
                  <input
                    type="text"
                    value={editingRepair.Technician || ''}
                    onChange={e => setEditingRepair({ ...editingRepair, Technician: e.target.value })}
                    placeholder="ชื่อช่าง หรือบริษัทซ่อม"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่ซ่อมเสร็จ
                  </label>
                  <input
                    type="date"
                    value={editingRepair.RepairDate ? String(editingRepair.RepairDate).slice(0, 10) : ''}
                    onChange={e => setEditingRepair({ ...editingRepair, RepairDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ค่าใช้จ่ายในการซ่อม (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingRepair.Cost ?? ''}
                    onChange={e => setEditingRepair({ ...editingRepair, Cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผลการซ่อม / หมายเหตุ
                </label>
                <textarea
                  rows={2}
                  value={editingRepair.Result || ''}
                  onChange={e => setEditingRepair({ ...editingRepair, Result: e.target.value })}
                  placeholder="รายละเอียดผลการซ่อม อะไหล่ที่เปลี่ยน..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  บันทึกงานซ่อม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
