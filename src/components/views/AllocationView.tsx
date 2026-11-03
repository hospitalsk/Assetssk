import React, { useState } from 'react';
import { AppData, Asset, SafeUser } from '../../types';
import { reallocateAsset } from '../../services/db';
import { showToast, showLoading, hideLoading } from '../../lib/alerts';
import {
  Building2,
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  Package,
  AlertTriangle,
  Search,
  MapPin,
  X
} from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
  onOpenAssetModal: (asset?: Partial<Asset>) => void;
  onOpenInventoryModal: (itemId?: string, presetDept?: string) => void;
  onOpenStockModal: (itemId?: string, presetDept?: string) => void;
}

export const AllocationView: React.FC<Props> = ({
  data,
  user,
  onRefresh,
  onOpenAssetModal,
  onOpenInventoryModal,
  onOpenStockModal
}) => {
  const depts = data.departments || [];
  const defaultDept = user.department || (depts.length > 0 ? depts[0].DepartmentName : '__ALL__');
  const [selectedDept, setSelectedDept] = useState<string>(defaultDept);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatus, setAssetStatus] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Reallocate Modal State
  const [reallocAsset, setReallocAsset] = useState<Asset | null>(null);
  const [targetDept, setTargetDept] = useState('');
  const [targetLoc, setTargetLoc] = useState('');
  const [targetResp, setTargetResp] = useState('');
  const [allocNote, setAllocNote] = useState('');

  const isAll = selectedDept === '__ALL__';
  const deptAssets = isAll ? data.assets : data.assets.filter(a => a.Department === selectedDept);
  const deptItems = isAll ? data.inventory : data.inventory.filter(i => i.Department === selectedDept);
  const deptPrice = deptAssets.reduce((sum, a) => sum + (Number(a.Price) || 0), 0);
  const lowItems = deptItems.filter(i => Number(i.Quantity || 0) <= Number(i.MinQuantity || 0));

  const filteredAssets = deptAssets.filter(a => {
    if (assetStatus && a.Status !== assetStatus) return false;
    const term = assetSearch.toLowerCase();
    return [a.AssetCode, a.AssetName, a.Brand, a.Model, a.SerialNo, a.Location, a.Responsible]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const filteredItems = deptItems.filter(i => {
    const term = itemSearch.toLowerCase();
    return [i.ItemCode, i.ItemName, i.Category, i.Location]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const openReallocModal = (asset: Asset) => {
    setReallocAsset(asset);
    setTargetDept(asset.Department || (depts[0]?.DepartmentName || ''));
    setTargetLoc(asset.Location || (data.locations[0]?.LocationName || ''));
    setTargetResp(asset.Responsible || '');
    setAllocNote('');
  };

  const handleSaveReallocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reallocAsset) return;
    if (!targetDept) {
      showToast('กรุณาเลือกหน่วยงานปลายทาง', 'error');
      return;
    }

    showLoading('กำลังบันทึกการจัดสรร...');
    try {
      await reallocateAsset({
        AssetID: reallocAsset.AssetID,
        Department: targetDept,
        Location: targetLoc,
        Responsible: targetResp,
        Note: allocNote
      });
      hideLoading();
      showToast('จัดสรรและย้ายสถานที่ครุภัณฑ์เรียบร้อยแล้ว', 'success');
      setReallocAsset(null);
      onRefresh();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'บันทึกล้มเหลว', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Department Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            จัดสรรทรัพยากรตามหน่วยงาน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ตรวจสอบจำนวนวัสดุและครุภัณฑ์ประจำแต่ละแผนก เพื่อวางแผนจัดสรร บันทึกผู้รับผิดชอบ และเบิกจ่ายใช้งาน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">เลือกหน่วยงาน:</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="__ALL__">📊 ภาพรวมเปรียบเทียบทุกหน่วยงาน</option>
              {depts.map(d => (
                <option key={d.DepartmentID} value={d.DepartmentName}>
                  🏢 {d.DepartmentName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            ↻ รีเฟรช
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">หน่วยงานที่เลือก</div>
          <div className="text-lg sm:text-xl font-bold text-blue-900 truncate mt-1">
            {isAll ? 'ทุกหน่วยงาน' : selectedDept}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAll ? 'ภาพรวมทั้งโรงพยาบาล' : user.department === selectedDept ? '(หน่วยงานของคุณ)' : ''}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">ครุภัณฑ์ในแผนก</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {deptAssets.length.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">มูลค่ารวม {deptPrice.toLocaleString()} ฿</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">พร้อมใช้ / ส่งซ่อม</div>
          <div className="text-lg sm:text-xl font-bold mt-1">
            <span className="text-emerald-600">
              {deptAssets.filter(a => a.Status === 'ใช้งาน').length}
            </span>{' '}
            /{' '}
            <span className="text-amber-600">
              {deptAssets.filter(a => a.Status === 'ส่งซ่อม').length}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ว่างพร้อมจัดสรร: {deptAssets.filter(a => a.Status === 'ว่าง').length} รายการ
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">รายการวัสดุสิ้นเปลือง</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {deptItems.length.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            คงเหลือรวม{' '}
            {deptItems.reduce((s, i) => s + (Number(i.Quantity) || 0), 0).toLocaleString()} หน่วย
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500">วัสดุถึงจุดสั่งซื้อ</div>
          <div className={`text-lg sm:text-xl font-bold mt-1 ${lowItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {lowItems.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lowItems.length > 0 ? 'ต้องการจัดสรร/เบิกเพิ่ม' : 'สต็อกอยู่ในเกณฑ์ปกติ'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isAll ? (
        /* Comparison Matrix */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">
              ตารางเปรียบเทียบการจัดสรรทรัพยากรทุกหน่วยงาน
            </h3>
            <span className="text-xs text-slate-400">คลิก "ดูการจัดสรร" เพื่อเข้าสู่แผนกนั้นๆ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                  <th className="py-2.5 px-3 font-semibold">ครุภัณฑ์ทั้งหมด</th>
                  <th className="py-2.5 px-3 font-semibold">พร้อมใช้</th>
                  <th className="py-2.5 px-3 font-semibold">ส่งซ่อม</th>
                  <th className="py-2.5 px-3 font-semibold">มูลค่ารวม (บาท)</th>
                  <th className="py-2.5 px-3 font-semibold">รายการวัสดุ</th>
                  <th className="py-2.5 px-3 font-semibold">วัสดุใกล้หมด</th>
                  <th className="py-2.5 px-3 font-semibold text-right">การจัดสรร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.departmentStats.map(d => (
                  <tr key={d.departmentId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-slate-900">🏢 {d.departmentName}</td>
                    <td className="py-3 px-3 font-semibold">{d.assetCount} รายการ</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">{d.activeAssets}</td>
                    <td className="py-3 px-3 text-amber-600 font-bold">{d.repairingAssets}</td>
                    <td className="py-3 px-3 font-mono">{d.totalAssetPrice.toLocaleString()} ฿</td>
                    <td className="py-3 px-3">
                      {d.inventoryCount} รายการ ({d.totalItemQty.toLocaleString()} หน่วย)
                    </td>
                    <td className="py-3 px-3">
                      {d.lowStockItems > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {d.lowStockItems} รายการ
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">ปกติ</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedDept(d.departmentName)}
                        className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        ดูการจัดสรร ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Selected Department Asset & Inventory Tables */
        <div className="space-y-6">
          {/* Section 1: Department Assets */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ▣ ครุภัณฑ์ของแผนก {selectedDept} ({deptAssets.length} รายการ)
                </h3>
                <p className="text-xs text-slate-400">
                  คลิก "จัดสรร/ย้าย" เพื่อย้ายห้อง ติดตั้งใหม่ หรือโอนผู้รับผิดชอบ
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={e => setAssetSearch(e.target.value)}
                    placeholder="ค้นหาครุภัณฑ์..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={assetStatus}
                  onChange={e => setAssetStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="ใช้งาน">ใช้งาน</option>
                  <option value="ว่าง">ว่าง</option>
                  <option value="ส่งซ่อม">ส่งซ่อม</option>
                  <option value="จำหน่าย">จำหน่าย</option>
                </select>
                <button
                  onClick={() => onOpenAssetModal({ Department: selectedDept })}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  ＋ เพิ่มครุภัณฑ์ในแผนกนี้
                </button>
              </div>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">ไม่พบข้อมูลครุภัณฑ์ในแผนกนี้</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                      <th className="py-2.5 px-3 font-semibold">รหัสครุภัณฑ์</th>
                      <th className="py-2.5 px-3 font-semibold">ชื่อครุภัณฑ์ / ยี่ห้อ-รุ่น</th>
                      <th className="py-2.5 px-3 font-semibold">สถานที่ตั้ง / ห้อง</th>
                      <th className="py-2.5 px-3 font-semibold">ผู้รับผิดชอบ</th>
                      <th className="py-2.5 px-3 font-semibold">สภาพ</th>
                      <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                      <th className="py-2.5 px-3 font-semibold text-right">การจัดสรร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssets.map(a => (
                      <tr key={a.AssetID} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-900">{a.AssetCode}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{a.AssetName}</div>
                          <div className="text-slate-400 text-[11px]">
                            {[a.Brand, a.Model].filter(Boolean).join(' / ')}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                            <MapPin className="w-3 h-3" /> {a.Location || 'ไม่ระบุ'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{a.Responsible || '-'}</td>
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
                              onClick={() => openReallocModal(a)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer"
                            >
                              จัดสรร/ย้าย
                            </button>
                            <button
                              onClick={() => onOpenAssetModal(a)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                            >
                              แก้ไข
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Department Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ▤ วัสดุคงคลังของแผนก {selectedDept} ({deptItems.length} รายการ)
                </h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบยอดคงเหลือ และเบิกจ่ายเพื่อการจัดสรรในหน่วยงาน
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    placeholder="ค้นหาวัสดุ..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => onOpenStockModal('', selectedDept)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  ＋ ทำรายการเบิกจ่ายของแผนกนี้
                </button>
                <button
                  onClick={() => onOpenInventoryModal('', selectedDept)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  ＋ เพิ่มรายการวัสดุ
                </button>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">ไม่พบรายการวัสดุในแผนกนี้</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                      <th className="py-2.5 px-3 font-semibold">รหัสวัสดุ</th>
                      <th className="py-2.5 px-3 font-semibold">ชื่อวัสดุ / หมวดหมู่</th>
                      <th className="py-2.5 px-3 font-semibold">สถานที่จัดเก็บ</th>
                      <th className="py-2.5 px-3 font-semibold">คงเหลือ</th>
                      <th className="py-2.5 px-3 font-semibold">ขั้นต่ำ</th>
                      <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                      <th className="py-2.5 px-3 font-semibold text-right">การจัดสรร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map(i => {
                      const low = Number(i.Quantity || 0) <= Number(i.MinQuantity || 0);
                      return (
                        <tr key={i.ItemID} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-bold text-slate-900">{i.ItemCode}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{i.ItemName}</div>
                            <div className="text-slate-400 text-[11px]">{i.Category || '-'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">📍 {i.Location || '-'}</td>
                          <td className="py-3 px-3">
                            <span className={`font-bold ${low ? 'text-rose-600' : 'text-slate-900'}`}>
                              {Number(i.Quantity).toLocaleString()} {i.Unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {Number(i.MinQuantity).toLocaleString()} {i.Unit}
                          </td>
                          <td className="py-3 px-3">
                            {low ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
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
                                onClick={() => onOpenStockModal(i.ItemID, selectedDept)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer"
                              >
                                เบิกจ่าย
                              </button>
                              <button
                                onClick={() => onOpenInventoryModal(i.ItemID)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                              >
                                แก้ไข
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
        </div>
      )}

      {/* Reallocate Modal */}
      {reallocAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">จัดสรรครุภัณฑ์</h3>
              </div>
              <button
                onClick={() => setReallocAsset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReallocation} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="text-slate-400">ครุภัณฑ์ที่เลือก:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {reallocAsset.AssetCode} : {reallocAsset.AssetName}
                </div>
                <div className="text-slate-500 mt-0.5">
                  {[reallocAsset.Brand, reallocAsset.Model].filter(Boolean).join(' / ')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยงานที่จัดสรร *
                </label>
                <select
                  value={targetDept}
                  onChange={e => setTargetDept(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {depts.map(d => (
                    <option key={d.DepartmentID} value={d.DepartmentName}>
                      {d.DepartmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานที่จัดเก็บ / ห้อง *
                </label>
                <select
                  value={targetLoc}
                  onChange={e => setTargetLoc(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {data.locations.map(l => (
                    <option key={l.LocationID} value={l.LocationName}>
                      {l.LocationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผู้รับผิดชอบดูแล
                </label>
                <input
                  type="text"
                  value={targetResp}
                  onChange={e => setTargetResp(e.target.value)}
                  placeholder="ชื่อ-นามสกุล ผู้รับผิดชอบประจำเครื่อง"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกเหตุผลหรือรายละเอียดการจัดสรร
                </label>
                <textarea
                  value={allocNote}
                  onChange={e => setAllocNote(e.target.value)}
                  rows={2}
                  placeholder="เช่น ย้ายเข้าใช้งานห้องตรวจ 2 ตามคำร้องขอ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReallocAsset(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกการจัดสรร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
