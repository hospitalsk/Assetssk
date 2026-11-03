import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppData, Asset, SafeUser } from '../../types';
import { saveAsset, deleteAsset, importAssetsFromExcel } from '../../services/db';
import { showToast, showLoading, hideLoading, showConfirm } from '../../lib/alerts';
import {
  Boxes,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  MapPin,
  Edit,
  Trash2,
  X,
  ArrowLeftRight,
  ShieldAlert
} from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
  onOpenReallocate: (asset: Asset) => void;
}

export const AssetsView: React.FC<Props> = ({
  data,
  user,
  onRefresh,
  onOpenReallocate
}) => {
  const isAdmin = user.role === 'admin';
  const userDept = user.department;
  const isDeptRestricted = !isAdmin && Boolean(userDept);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState(isDeptRestricted ? userDept : '');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset> | null>(null);

  const filtered = data.assets.filter(a => {
    if (isDeptRestricted && a.Department !== userDept) return false;
    if (statusFilter && a.Status !== statusFilter) return false;
    if (deptFilter && a.Department !== deptFilter) return false;
    const term = search.toLowerCase();
    return [a.AssetCode, a.AssetName, a.Brand, a.Model, a.SerialNo, a.Location, a.Responsible]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const handleOpenAdd = () => {
    setEditingAsset({
      AssetCode: '',
      AssetName: '',
      Category: 'เวชภัณฑ์',
      Brand: '',
      Model: '',
      SerialNo: '',
      Department: userDept || (data.departments[0]?.DepartmentName || ''),
      Location: data.locations[0]?.LocationName || '',
      BudgetYear: String(new Date().getFullYear() + 543),
      PurchaseDate: new Date().toISOString().slice(0, 10),
      Price: 0,
      Status: 'ใช้งาน',
      Condition: 'ปกติ',
      Responsible: user.fullName || '',
      Note: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    if (isDeptRestricted && asset.Department !== userDept) {
      showToast('คุณสามารถแก้ไขได้เฉพาะเวชภัณฑ์ของหน่วยงานตนเองเท่านั้น', 'error');
      return;
    }
    setEditingAsset({ ...asset });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!editingAsset.AssetCode?.trim() || !editingAsset.AssetName?.trim()) {
      showToast('กรุณาระบุรหัสและชื่อเวชภัณฑ์', 'error');
      return;
    }

    if (isDeptRestricted) {
      editingAsset.Department = userDept;
    }

    showLoading('กำลังบันทึกข้อมูลเวชภัณฑ์...');
    try {
      await saveAsset(editingAsset);
      hideLoading();
      showToast('บันทึกข้อมูลเวชภัณฑ์เรียบร้อยแล้ว', 'success');
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'บันทึกล้มเหลว', 'error');
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!isAdmin) {
      showToast('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบเวชภัณฑ์ได้', 'error');
      return;
    }

    const ok = await showConfirm(
      'ยืนยันการลบเวชภัณฑ์?',
      `คุณต้องการลบ ${asset.AssetCode} (${asset.AssetName}) ออกจากระบบอย่างถาวรหรือไม่?`,
      'ลบข้อมูล',
      'ยกเลิก',
      'danger'
    );
    if (!ok) return;

    showLoading('กำลังลบข้อมูล...');
    try {
      await deleteAsset(asset.AssetID);
      hideLoading();
      showToast('ลบข้อมูลเวชภัณฑ์เรียบร้อยแล้ว', 'success');
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'ลบล้มเหลว', 'error');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filtered.map(a => ({
      'รหัสเวชภัณฑ์': a.AssetCode,
      'ชื่อเวชภัณฑ์': a.AssetName,
      'ประเภท': a.Category || '',
      'ยี่ห้อ': a.Brand || '',
      'รุ่น': a.Model || '',
      'Serial No': a.SerialNo || '',
      'หน่วยงาน': a.Department || '',
      'สถานที่ตั้ง': a.Location || '',
      'ปีงบประมาณ': a.BudgetYear || '',
      'วันที่ได้มา': a.PurchaseDate || '',
      'ราคาซื้อ (บาท)': a.Price || 0,
      'สถานะ': a.Status || '',
      'สภาพ': a.Condition || '',
      'ผู้รับผิดชอบ': a.Responsible || '',
      'หมายเหตุ': a.Note || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'เวชภัณฑ์');
    XLSX.writeFile(wb, `ทะเบียนเวชภัณฑ์_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ดาวน์โหลดไฟล์ Excel ทะเบียนเวชภัณฑ์เรียบร้อยแล้ว', 'success');
  };

  // Import from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showLoading('กำลังอ่านไฟล์ Excel...');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      hideLoading();
      if (!rows.length) {
        showToast('ไม่พบข้อมูลแถวในชีตแรก', 'error');
        return;
      }

      const ok = await showConfirm(
        'ยืนยันนำเข้าข้อมูลเวชภัณฑ์จาก Excel?',
        `พบข้อมูลทั้งหมด ${rows.length} รายการ ระบบจะอัปเดตรายการที่รหัสตรงกัน และเพิ่มรายการใหม่`,
        'เริ่มนำเข้า',
        'ยกเลิก',
        'question'
      );
      if (!ok) return;

      showLoading('กำลังนำเข้าข้อมูล...');
      const res = await importAssetsFromExcel(rows);
      hideLoading();
      showToast(
        `นำเข้าสำเร็จ! เพิ่มใหม่: ${res.inserted}, ปรับปรุง: ${res.updated}, ข้าม: ${res.skipped}`,
        'success'
      );
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'นำเข้าข้อมูลไม่สำเร็จ', 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ทะเบียนเวชภัณฑ์</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ค้นหา เพิ่ม แก้ไข โอนย้าย และติดตามสถานะเวชภัณฑ์โรงพยาบาล
            {isDeptRestricted && (
              <span className="text-blue-600 font-semibold ml-1">
                (เฉพาะกลุ่มงาน: {userDept})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>นำเข้า Excel</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} hidden />
            </label>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="ส่งออกไฟล์ Excel"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> เพิ่มเวชภัณฑ์
          </button>
        </div>
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
                placeholder="ค้นหารหัส ชื่อ ยี่ห้อ หรือ Serial..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none cursor-pointer"
            >
              <option value="">ทุกสถานะ</option>
              <option value="ใช้งาน">ใช้งาน</option>
              <option value="ว่าง">ว่าง</option>
              <option value="ส่งซ่อม">ส่งซ่อม</option>
              <option value="จำหน่าย">จำหน่าย</option>
            </select>

            {isAdmin ? (
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none cursor-pointer"
              >
                <option value="">ทุกหน่วยงาน</option>
                {data.departments.map(d => (
                  <option key={d.DepartmentID} value={d.DepartmentName}>
                    {d.DepartmentName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700">
                🏢 {userDept || 'หน่วยงานของฉัน'}
              </div>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            พบ {filtered.length} รายการ
          </div>
        </div>

        {/* Assets Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            {isDeptRestricted
              ? `ไม่พบข้อมูลเวชภัณฑ์ในกลุ่มงาน ${userDept}`
              : 'ไม่พบข้อมูลเวชภัณฑ์ที่ค้นหา'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">รหัสเวชภัณฑ์</th>
                  <th className="py-2.5 px-3 font-semibold">ชื่อเวชภัณฑ์</th>
                  <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                  <th className="py-2.5 px-3 font-semibold">สถานที่ตั้ง</th>
                  <th className="py-2.5 px-3 font-semibold">ราคาซื้อ (บาท)</th>
                  <th className="py-2.5 px-3 font-semibold">สภาพ</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                  <th className="py-2.5 px-3 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => (
                  <tr key={a.AssetID} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-slate-900 font-mono">{a.AssetCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{a.AssetName}</div>
                      <div className="text-slate-400 text-[11px]">
                        {[a.Brand, a.Model].filter(Boolean).join(' / ')} {a.SerialNo ? `(SN: ${a.SerialNo})` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{a.Department || '-'}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" /> {a.Location || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {Number(a.Price || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          a.Condition === 'ชำรุด'
                            ? 'bg-rose-50 text-rose-700'
                            : a.Condition === 'เสื่อมสภาพ'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {a.Condition || 'ปกติ'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          a.Status === 'ใช้งาน'
                            ? 'bg-emerald-50 text-emerald-700'
                            : a.Status === 'ส่งซ่อม'
                            ? 'bg-amber-50 text-amber-700'
                            : a.Status === 'จำหน่าย'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-cyan-50 text-cyan-700'
                        }`}
                      >
                        {a.Status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenReallocate(a)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="จัดสรร / ย้ายหน่วยงาน"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(a)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบเวชภัณฑ์"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Asset Modal */}
      {modalOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingAsset.AssetID ? 'แก้ไขข้อมูลเวชภัณฑ์' : 'เพิ่มเวชภัณฑ์ใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสเวชภัณฑ์ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAsset.AssetCode || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, AssetCode: e.target.value })}
                    placeholder="เช่น MED-EQ-67-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อเวชภัณฑ์ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAsset.AssetName || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, AssetName: e.target.value })}
                    placeholder="เช่น เครื่องตรวจสัญญาณชีพ, ปั๊มให้สารละลาย"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทเวชภัณฑ์
                  </label>
                  <input
                    type="text"
                    value={editingAsset.Category || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Category: e.target.value })}
                    placeholder="เช่น เวชภัณฑ์การแพทย์, อุปกรณ์ช่วยชีวิต"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ยี่ห้อ</label>
                  <input
                    type="text"
                    value={editingAsset.Brand || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Brand: e.target.value })}
                    placeholder="เช่น Philips, GE, Mindray"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รุ่น (Model)</label>
                  <input
                    type="text"
                    value={editingAsset.Model || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Model: e.target.value })}
                    placeholder="เช่น uMEC12, HeartStart"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={editingAsset.SerialNo || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, SerialNo: e.target.value })}
                    placeholder="SN ประจำตัวเครื่อง"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยงาน *</label>
                  <select
                    value={editingAsset.Department || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Department: e.target.value })}
                    disabled={isDeptRestricted}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">เลือกหน่วยงาน</option>
                    {data.departments.map(d => (
                      <option key={d.DepartmentID} value={d.DepartmentName}>
                        {d.DepartmentName}
                      </option>
                    ))}
                  </select>
                  {isDeptRestricted && (
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      🔒 ผูกกับกลุ่มงาน {userDept} ของคุณโดยอัตโนมัติ
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่ตั้ง</label>
                  <select
                    value={editingAsset.Location || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">เลือกสถานที่</option>
                    {data.locations.map(l => (
                      <option key={l.LocationID} value={l.LocationName}>
                        {l.LocationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปีงบประมาณ
                  </label>
                  <input
                    type="text"
                    value={editingAsset.BudgetYear || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, BudgetYear: e.target.value })}
                    placeholder="เช่น 2567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่ได้มา
                  </label>
                  <input
                    type="date"
                    value={editingAsset.PurchaseDate ? String(editingAsset.PurchaseDate).slice(0, 10) : ''}
                    onChange={e => setEditingAsset({ ...editingAsset, PurchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาซื้อ (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingAsset.Price ?? ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะ</label>
                  <select
                    value={editingAsset.Status || 'ใช้งาน'}
                    onChange={e => setEditingAsset({ ...editingAsset, Status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ใช้งาน">ใช้งาน</option>
                    <option value="ว่าง">ว่าง</option>
                    <option value="ส่งซ่อม">ส่งซ่อม</option>
                    <option value="จำหน่าย">จำหน่าย</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สภาพเวชภัณฑ์
                  </label>
                  <select
                    value={editingAsset.Condition || 'ปกติ'}
                    onChange={e => setEditingAsset({ ...editingAsset, Condition: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ชำรุด">ชำรุด</option>
                    <option value="เสื่อมสภาพ">เสื่อมสภาพ</option>
                    <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ผู้รับผิดชอบ
                  </label>
                  <input
                    type="text"
                    value={editingAsset.Responsible || ''}
                    onChange={e => setEditingAsset({ ...editingAsset, Responsible: e.target.value })}
                    placeholder="ชื่อผู้ดูแลประจำเครื่อง"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  value={editingAsset.Note || ''}
                  onChange={e => setEditingAsset({ ...editingAsset, Note: e.target.value })}
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม หรือประวัติการซ่อมบำรุง"
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
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
