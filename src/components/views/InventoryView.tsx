import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppData, InventoryItem, SafeUser } from '../../types';
import { saveInventoryItem, postStockTransaction, importInventoryFromExcel } from '../../services/db';
import { showToast, showLoading, hideLoading, showConfirm } from '../../lib/alerts';
import {
  Package,
  Plus,
  Search,
  ArrowUpDown,
  AlertTriangle,
  MapPin,
  Edit,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
  initialItemId?: string;
  initialPresetDept?: string;
}

export const InventoryView: React.FC<Props> = ({
  data,
  user,
  onRefresh,
  initialItemId,
  initialPresetDept
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState(user.department || initialPresetDept || '');

  // Item Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);

  // Stock Transaction Modal
  const [stockModalOpen, setStockModalOpen] = useState(Boolean(initialItemId));
  const [txItemId, setTxItemId] = useState(initialItemId || (data.inventory[0]?.ItemID || ''));
  const [txType, setTxType] = useState<'เบิกจ่าย' | 'รับเข้า' | 'ปรับเพิ่ม' | 'ปรับลด'>('เบิกจ่าย');
  const [txQty, setTxQty] = useState<number | ''>('');
  const [txDept, setTxDept] = useState(user.department || initialPresetDept || '');
  const [txRef, setTxRef] = useState('');
  const [txNote, setTxNote] = useState('');

  const isAdmin = user.role === 'admin';
  const isDeptRestricted = !isAdmin && Boolean(user.department);
  const userDept = user.department || '';

  // Non-admin with a department can only access items of their department
  const accessibleInventory = isDeptRestricted
    ? data.inventory.filter(i => (i.Department || '').trim() === userDept.trim())
    : data.inventory;

  const filtered = accessibleInventory.filter(i => {
    if (!isDeptRestricted && deptFilter && i.Department !== deptFilter) return false;
    const term = search.toLowerCase();
    return [i.ItemCode, i.ItemName, i.Category, i.Department, i.Location]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const handleOpenAddItem = () => {
    setEditingItem({
      ItemCode: '',
      ItemName: '',
      Category: 'วัสดุการแพทย์สิ้นเปลือง',
      Unit: 'กล่อง',
      Department: isDeptRestricted ? userDept : (user.department || initialPresetDept || ''),
      MinQuantity: 10,
      UnitPrice: 0,
      Location: data.locations[0]?.LocationName || '',
      Note: ''
    });
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    if (isDeptRestricted && (item.Department || '').trim() !== userDept.trim()) {
      showToast(`สามารถแก้ไขได้เฉพาะวัสดุของหน่วยงาน ${userDept} เท่านั้น`, 'error');
      return;
    }
    setEditingItem({ ...item });
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.ItemCode?.trim() || !editingItem.ItemName?.trim() || !editingItem.Unit?.trim()) {
      showToast('กรุณาระบุรหัส ชื่อวัสดุ และหน่วยนับ', 'error');
      return;
    }

    if (isDeptRestricted) {
      editingItem.Department = userDept;
    }

    showLoading('กำลังบันทึกข้อมูลวัสดุ...');
    try {
      await saveInventoryItem(editingItem);
      hideLoading();
      showToast('บันทึกข้อมูลวัสดุเรียบร้อยแล้ว', 'success');
      setItemModalOpen(false);
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'บันทึกล้มเหลว', 'error');
    }
  };

  const handleOpenStockTx = (itemId?: string, deptPreset?: string) => {
    if (itemId) setTxItemId(itemId);
    else if (accessibleInventory.length > 0) setTxItemId(accessibleInventory[0].ItemID);
    if (isDeptRestricted) {
      setTxDept(userDept);
    } else if (deptPreset) {
      setTxDept(deptPreset);
    }
    setTxQty('');
    setTxRef('');
    setTxNote('');
    setStockModalOpen(true);
  };

  const handleSaveStockTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(txQty);
    if (!txItemId || !Number.isFinite(qty) || qty <= 0) {
      showToast('กรุณาระบุวัสดุและจำนวนที่มากกว่า 0', 'error');
      return;
    }

    showLoading('กำลังบันทึกการเคลื่อนไหวสต็อก...');
    try {
      await postStockTransaction({
        ItemID: txItemId,
        TransactionType: txType,
        Quantity: qty,
        Department: txDept,
        ReferenceNo: txRef,
        Note: txNote
      });
      hideLoading();
      showToast(`บันทึกรายการ${txType}สำเร็จ`, 'success');
      setStockModalOpen(false);
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'ทำรายการไม่สำเร็จ', 'error');
    }
  };

  // Export Inventory to Excel
  const handleExportExcel = () => {
    const exportData = filtered.map(i => ({
      'รหัสวัสดุ': i.ItemCode,
      'ชื่อวัสดุ': i.ItemName,
      'หมวดหมู่': i.Category || '',
      'หน่วยนับ': i.Unit,
      'หน่วยงาน': i.Department || 'ส่วนกลาง',
      'สถานที่จัดเก็บ': i.Location || '',
      'จำนวนคงเหลือ': Number(i.Quantity || 0),
      'จุดสั่งซื้อขั้นต่ำ': Number(i.MinQuantity || 0),
      'ราคาต่อหน่วย (บาท)': Number(i.UnitPrice || 0),
      'มูลค่ารวม (บาท)': Number(i.Quantity || 0) * Number(i.UnitPrice || 0),
      'สถานะ': Number(i.Quantity || 0) <= Number(i.MinQuantity || 0) ? 'ถึงจุดสั่งซื้อ' : 'ปกติ',
      'หมายเหตุ': i.Note || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'คลังวัสดุ');
    XLSX.writeFile(wb, `ทะเบียนคลังวัสดุ_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ดาวน์โหลดไฟล์ Excel คลังวัสดุเรียบร้อยแล้ว', 'success');
  };

  // Import Inventory from Excel
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
        'ยืนยันนำเข้าข้อมูลวัสดุจาก Excel?',
        `พบข้อมูลทั้งหมด ${rows.length} รายการ ระบบจะอัปเดตข้อมูลวัสดุที่มีรหัสตรงกัน และเพิ่มรายการใหม่`,
        'เริ่มนำเข้า',
        'ยกเลิก',
        'question'
      );
      if (!ok) return;

      showLoading('กำลังนำเข้าข้อมูลวัสดุ...');
      const res = await importInventoryFromExcel(rows);
      hideLoading();
      showToast(
        `นำเข้าวัสดุสำเร็จ! เพิ่มใหม่: ${res.inserted}, ปรับปรุง: ${res.updated}, ข้าม: ${res.skipped}`,
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            คลังวัสดุ / ตัดสต็อก
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการวัสดุสิ้นเปลือง นำเข้า/ส่งออก Excel บันทึกรับเข้า เบิกจ่าย และตรวจสอบยอดคงเหลือ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <label className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>นำเข้า Excel</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} hidden />
            </label>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="ส่งออกไฟล์ Excel"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={() => handleOpenStockTx()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-blue-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4 text-blue-600" /> รับเข้า / เบิกจ่าย
          </button>

          <button
            onClick={handleOpenAddItem}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> เพิ่มวัสดุเข้าคลัง
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">
            {isDeptRestricted ? `วัสดุในหน่วยงาน (${userDept})` : 'รายการวัสดุทั้งหมด'}
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{accessibleInventory.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">วัสดุถึงจุดสั่งซื้อ / วิกฤต</div>
          <div
            className={`text-2xl font-bold mt-2 ${
              accessibleInventory.filter(i => Number(i.Quantity || 0) <= Number(i.MinQuantity || 0)).length > 0
                ? 'text-rose-600'
                : 'text-slate-900'
            }`}
          >
            {accessibleInventory.filter(i => Number(i.Quantity || 0) <= Number(i.MinQuantity || 0)).length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-slate-500">ประวัติการเคลื่อนไหวสต็อก</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {isDeptRestricted
              ? data.stockTransactions.filter(t => (t.Department || '').trim() === userDept.trim()).length
              : data.stockTransactions.length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหารหัส หรือชื่อวัสดุ..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {isDeptRestricted ? (
              <span className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/70 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                เฉพาะหน่วยงาน: {userDept}
              </span>
            ) : (
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
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            พบ {filtered.length} จากทั้งหมด {accessibleInventory.length} รายการ
          </div>
        </div>

        {/* Inventory Items Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">ยังไม่มีรายการวัสดุในคลัง</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">รหัสวัสดุ</th>
                  <th className="py-2.5 px-3 font-semibold">ชื่อวัสดุ / หมวดหมู่</th>
                  <th className="py-2.5 px-3 font-semibold">หน่วยนับ</th>
                  <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                  <th className="py-2.5 px-3 font-semibold">สถานที่</th>
                  <th className="py-2.5 px-3 font-semibold">ยอดคงเหลือ</th>
                  <th className="py-2.5 px-3 font-semibold">ขั้นต่ำ</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                  <th className="py-2.5 px-3 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(i => {
                  const low = Number(i.Quantity || 0) <= Number(i.MinQuantity || 0);
                  return (
                    <tr key={i.ItemID} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">{i.ItemCode}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{i.ItemName}</div>
                        <div className="text-slate-400 text-[11px]">{i.Category || '-'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{i.Unit}</td>
                      <td className="py-3 px-3 text-slate-600">{i.Department || 'ส่วนกลาง'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" /> {i.Location || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold font-mono ${low ? 'text-rose-600' : 'text-slate-900'}`}>
                          {Number(i.Quantity || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {Number(i.MinQuantity || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        {low ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ถึงจุดสั่งซื้อ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenStockTx(i.ItemID, i.Department)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer"
                          >
                            รับเข้า/เบิก
                          </button>
                          <button
                            onClick={() => handleOpenEditItem(i)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Inventory Item Modal */}
      {itemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem.ItemID ? 'แก้ไขข้อมูลวัสดุ' : 'เพิ่มวัสดุเข้าคลัง'}
              </h3>
              <button
                onClick={() => setItemModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสวัสดุ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.ItemCode || ''}
                    onChange={e => setEditingItem({ ...editingItem, ItemCode: e.target.value })}
                    placeholder="เช่น MED-MAT-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อวัสดุ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.ItemName || ''}
                    onChange={e => setEditingItem({ ...editingItem, ItemName: e.target.value })}
                    placeholder="เช่น กระบอกฉีดยา 10 ml"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมวดหมู่วัสดุ
                  </label>
                  <input
                    type="text"
                    value={editingItem.Category || ''}
                    onChange={e => setEditingItem({ ...editingItem, Category: e.target.value })}
                    placeholder="เช่น วัสดุการแพทย์สิ้นเปลือง, เวชภัณฑ์"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หน่วยนับ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.Unit || ''}
                    onChange={e => setEditingItem({ ...editingItem, Unit: e.target.value })}
                    placeholder="เช่น กล่อง, ชิ้น, ขวด, รีม"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หน่วยงานที่รับผิดชอบ {isDeptRestricted && '(ล็อคตามสิทธิ์หน่วยงาน)'}
                  </label>
                  <select
                    disabled={isDeptRestricted}
                    value={isDeptRestricted ? userDept : (editingItem.Department || '')}
                    onChange={e => setEditingItem({ ...editingItem, Department: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDeptRestricted ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">ส่วนกลาง / ไม่ระบุ</option>
                    {data.departments.map(d => (
                      <option key={d.DepartmentID} value={d.DepartmentName}>
                        {d.DepartmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนขั้นต่ำ (จุดสั่งซื้อ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.MinQuantity ?? ''}
                    onChange={e => setEditingItem({ ...editingItem, MinQuantity: parseFloat(e.target.value) || 0 })}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาต่อหน่วย (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingItem.UnitPrice ?? ''}
                    onChange={e => setEditingItem({ ...editingItem, UnitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สถานที่จัดเก็บ
                  </label>
                  <select
                    value={editingItem.Location || ''}
                    onChange={e => setEditingItem({ ...editingItem, Location: e.target.value })}
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  value={editingItem.Note || ''}
                  onChange={e => setEditingItem({ ...editingItem, Note: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                💡 การเพิ่มหรือแก้ไขข้อมูลวัสดุจะไม่เปลี่ยนยอดคงเหลือโดยตรง ให้ใช้เมนู "รับเข้า/เบิกจ่าย" เพื่อบันทึกประวัติการเคลื่อนไหว
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูลวัสดุ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">ทำรายการรับเข้า / เบิกจ่ายสต็อก</h3>
              <button
                onClick={() => setStockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockTx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกรายการวัสดุ *
                </label>
                <select
                  required
                  value={txItemId}
                  onChange={e => setTxItemId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">เลือกวัสดุ</option>
                  {accessibleInventory.map(i => (
                    <option key={i.ItemID} value={i.ItemID}>
                      {i.ItemCode} - {i.ItemName} [{i.Department || 'ส่วนกลาง'}] (คงเหลือ: {Number(i.Quantity || 0).toLocaleString()} {i.Unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทรายการ *
                  </label>
                  <select
                    value={txType}
                    onChange={e => setTxType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="เบิกจ่าย">เบิกจ่าย (Out)</option>
                    <option value="รับเข้า">รับเข้า (In)</option>
                    <option value="ปรับเพิ่ม">ปรับเพิ่ม</option>
                    <option value="ปรับลด">ปรับลด</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวน *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={txQty}
                    onChange={e => setTxQty(parseFloat(e.target.value) || '')}
                    placeholder="ระบุจำนวน"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หน่วยงานผู้เบิก / ทำรายการ {isDeptRestricted && '(ล็อคตามสิทธิ์)'}
                  </label>
                  <select
                    disabled={isDeptRestricted}
                    value={isDeptRestricted ? userDept : txDept}
                    onChange={e => setTxDept(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDeptRestricted ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">ส่วนกลาง / ไม่ระบุ</option>
                    {data.departments.map(d => (
                      <option key={d.DepartmentID} value={d.DepartmentName}>
                        {d.DepartmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขที่เอกสาร / ใบเบิก
                  </label>
                  <input
                    type="text"
                    value={txRef}
                    onChange={e => setTxRef(e.target.value)}
                    placeholder="เช่น REQ-67/101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / วัตถุประสงค์
                </label>
                <textarea
                  rows={2}
                  value={txNote}
                  onChange={e => setTxNote(e.target.value)}
                  placeholder="เช่น เบิกใช้สำหรับหอผู้ป่วยฉุกเฉิน..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-slate-600 text-xs">
                🔒 ระบบจะตรวจสอบยอดคงเหลือ และบันทึกผู้ทำรายการ วันเวลา โดยไม่อนุญาตให้เบิกเกินยอดคงเหลือ
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  ยืนยันทำรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
