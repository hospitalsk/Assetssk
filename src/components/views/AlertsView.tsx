import React, { useState } from 'react';
import { AppData, SafeUser } from '../../types';
import {
  Bell,
  Printer,
  RefreshCw,
  Package,
  Wrench,
  AlertTriangle,
  Building2
} from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onRefresh: () => void;
  onOpenStockModal: (itemId?: string) => void;
  onOpenRepairModal: (repairId?: string) => void;
  onOpenAssetModal: (asset?: any) => void;
  onSelectDepartment: (deptName: string) => void;
}

export const AlertsView: React.FC<Props> = ({
  data,
  user,
  onRefresh,
  onOpenStockModal,
  onOpenRepairModal,
  onOpenAssetModal,
  onSelectDepartment
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'repair' | 'damaged' | 'matrix'>('stock');

  const alerts = data.alerts || [];
  const repairs = data.repairs || [];
  const pendingRepairs = repairs.filter(r => r.Status === 'รอดำเนินการ' || r.Status === 'กำลังซ่อม');
  const damagedAssets = (data.assets || []).filter(
    a => a.Condition === 'ชำรุด' || a.Condition === 'เสื่อมสภาพ' || a.Condition === 'รอตรวจสอบ'
  );
  const deptStats = data.departmentStats || [];

  const handlePrint = () => {
    // Direct in-page A4 print triggering without popup or about:blank
    window.print();
  };

  return (
    <div>
      {/* 1. SCREEN VIEW (Hidden on @media print) */}
      <div className="screen-only space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-rose-600" /> ศูนย์แจ้งเตือนผู้บริหาร (In-App Alerts)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ระบบแจ้งเตือนแบบเรียลไทม์ภายในเว็บแอป สำหรับผู้บริหารและหัวหน้ากลุ่มงาน เพื่อการตัดสินใจและจัดสรรทันที
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> รีเฟรชข้อมูล
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> พิมพ์รายงานผู้บริหาร (A4)
            </button>
          </div>
        </div>

        {/* Top 4 Interactive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setActiveTab('stock')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200'
                : 'bg-white border-slate-200/80 hover:border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>วัสดุหมดคลัง / วิกฤต</span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                !
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{alerts.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">รายการที่ต้องเตรียมสั่งซื้อ/เบิก</div>
          </button>

          <button
            onClick={() => setActiveTab('repair')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'repair'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
                : 'bg-white border-slate-200/80 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>ครุภัณฑ์รอดำเนินการซ่อม</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">{pendingRepairs.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">งานซ่อมที่ยังไม่แล้วเสร็จ</div>
          </button>

          <button
            onClick={() => setActiveTab('damaged')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'damaged'
                ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-200'
                : 'bg-white border-slate-200/80 hover:border-orange-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>ครุภัณฑ์ชำรุด / เสื่อมสภาพ</span>
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{damagedAssets.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">รอจำหน่ายหรือส่งซ่อมบำรุง</div>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-200'
                : 'bg-white border-slate-200/80 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>หน่วยงานที่มีการแจ้งเตือน</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {deptStats.filter(d => d.lowStockItems > 0 || d.repairingAssets > 0).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">จากทั้งหมด {data.departments.length} แผนก</div>
          </button>
        </div>

        {/* Main Tab Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          {/* Tab Buttons */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'stock' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" /> วัสดุถึงจุดสั่งซื้อ / หมดคลัง ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('repair')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'repair' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4" /> ครุภัณฑ์ค้างซ่อม ({pendingRepairs.length})
            </button>
            <button
              onClick={() => setActiveTab('damaged')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'damaged' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> ครุภัณฑ์ชำรุด/เสื่อมสภาพ ({damagedAssets.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'matrix' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" /> สรุปความต้องการแยกรายแผนก
            </button>
          </div>

          {/* Tab 1: Stock Alerts */}
          {activeTab === 'stock' && (
            <div>
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed mb-4">
                💡 <b>หลักคำนวณคาดการณ์:</b> คำนวณจากยอดเบิก 90 วันล่าสุดเทียบกับ 30 วันล่าสุด เผื่อสำรอง 10%
                และหักยอดคงเหลือ เพื่อให้ผู้บริหารจัดสรรงบประมาณได้อย่างแม่นยำ
              </div>

              {alerts.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  ไม่มีรายการแจ้งเตือนตามเกณฑ์ปัจจุบัน (ทุกรายการอยู่ในเกณฑ์ปกติ)
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                        <th className="py-2.5 px-3 font-semibold">รหัส / รายการวัสดุ</th>
                        <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                        <th className="py-2.5 px-3 font-semibold">ยอดคงเหลือ</th>
                        <th className="py-2.5 px-3 font-semibold">ใช้ 30 วัน</th>
                        <th className="py-2.5 px-3 font-semibold">ใช้ 90 วัน</th>
                        <th className="py-2.5 px-3 font-semibold">คำแนะนำเบิก/จัดซื้อ</th>
                        <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                        <th className="py-2.5 px-3 font-semibold text-right">การจัดสรร</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {alerts.map(a => (
                        <tr key={a.ItemID} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{a.ItemCode}</div>
                            <div className="text-slate-600">{a.ItemName}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{a.Department}</td>
                          <td className="py-3 px-3">
                            <span className={`font-bold ${a.Quantity <= 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                              {Number(a.Quantity).toLocaleString()} {a.Unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {Number(a.UsedLast30Days).toLocaleString()} {a.Unit}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {Number(a.UsedLast90Days).toLocaleString()} {a.Unit}
                          </td>
                          <td className="py-3 px-3">
                            {a.RecommendedQuantity !== null ? (
                              <span className="font-bold text-blue-700">
                                {Number(a.RecommendedQuantity).toLocaleString()} {a.Unit}
                              </span>
                            ) : (
                              <span className="text-slate-400">ไม่มีข้อมูลประวัติ</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {a.Status === 'หมดคลัง' ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                หมดคลัง
                              </span>
                            ) : a.Status.includes('ใกล้หมด') ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                ใกล้หมด
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                ควรเตรียมเบิก
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onOpenStockModal(a.ItemID)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-colors cursor-pointer"
                            >
                              ＋ เบิก/รับเข้า
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Pending Repairs */}
          {activeTab === 'repair' && (
            <div>
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed mb-4">
                ⚒️ แสดงรายการแจ้งซ่อมครุภัณฑ์ที่ยังไม่เสร็จสิ้น เพื่อให้ผู้บริหารติดตามผู้รับผิดชอบหรือช่างดำเนินการ
              </div>

              {pendingRepairs.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">ไม่มีงานซ่อมคั่งค้าง</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                        <th className="py-2.5 px-3 font-semibold">วันที่แจ้ง</th>
                        <th className="py-2.5 px-3 font-semibold">รหัส / ครุภัณฑ์</th>
                        <th className="py-2.5 px-3 font-semibold">อาการเสีย</th>
                        <th className="py-2.5 px-3 font-semibold">ผู้แจ้ง</th>
                        <th className="py-2.5 px-3 font-semibold">ช่างผู้ดูแล</th>
                        <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                        <th className="py-2.5 px-3 font-semibold text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingRepairs.map(r => (
                        <tr key={r.RepairID} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 text-slate-600 font-mono">{r.ReportDate}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{r.AssetCode}</div>
                            <div className="text-slate-600">{r.AssetName}</div>
                          </td>
                          <td className="py-3 px-3 max-w-xs">{r.Problem}</td>
                          <td className="py-3 px-3 text-slate-600">{r.Reporter}</td>
                          <td className="py-3 px-3 text-slate-600">{r.Technician || '-'}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                r.Status === 'กำลังซ่อม'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {r.Status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onOpenRepairModal(r.RepairID)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-colors cursor-pointer"
                            >
                              ปรับปรุงงานซ่อม
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Damaged Assets */}
          {activeTab === 'damaged' && (
            <div>
              <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-200 text-orange-900 text-xs leading-relaxed mb-4">
                ⚠️ ครุภัณฑ์ที่ระบุสภาพชำรุดหรือเสื่อมสภาพ จำเป็นต้องพิจารณาจัดสรรใหม่ ส่งซ่อม หรือแทงจำหน่าย
              </div>

              {damagedAssets.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  ไม่มีครุภัณฑ์ที่มีสภาพชำรุดหรือเสื่อมสภาพ
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                        <th className="py-2.5 px-3 font-semibold">รหัสครุภัณฑ์</th>
                        <th className="py-2.5 px-3 font-semibold">ชื่อครุภัณฑ์</th>
                        <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                        <th className="py-2.5 px-3 font-semibold">สถานที่</th>
                        <th className="py-2.5 px-3 font-semibold">สภาพ</th>
                        <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                        <th className="py-2.5 px-3 font-semibold text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {damagedAssets.map(a => (
                        <tr key={a.AssetID} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-bold text-slate-900">{a.AssetCode}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{a.AssetName}</td>
                          <td className="py-3 px-3 text-slate-600">{a.Department}</td>
                          <td className="py-3 px-3 text-slate-600">📍 {a.Location || '-'}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {a.Condition}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              {a.Status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onOpenAssetModal(a)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-colors cursor-pointer"
                            >
                              แก้ไข / จำหน่าย
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Department Matrix */}
          {activeTab === 'matrix' && (
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
                  {deptStats.map(d => (
                    <tr key={d.departmentId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-900">🏢 {d.departmentName}</td>
                      <td className="py-3 px-3 font-semibold">{d.assetCount} รายการ</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">{d.activeAssets}</td>
                      <td className="py-3 px-3 text-amber-600 font-bold">{d.repairingAssets}</td>
                      <td className="py-3 px-3 font-mono">{d.totalAssetPrice.toLocaleString()} ฿</td>
                      <td className="py-3 px-3">{d.inventoryCount} รายการ</td>
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
                          onClick={() => onSelectDepartment(d.departmentName)}
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
          )}
        </div>
      </div>

      {/* 2. DEDICATED PRINT VIEW (Only visible during @media print, perfect A4 size) */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '18pt', fontWeight: 'bold' }}>
            รายงานสรุปการแจ้งเตือนผู้บริหาร (Executive Notification Summary)
          </h1>
          <div style={{ fontSize: '9pt', color: '#444' }}>
            โรงพยาบาล • พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')} | ผู้จัดพิมพ์: {user.fullName} ({user.department || 'ส่วนกลาง'})
          </div>
        </div>

        {/* Section 1: Stock Alerts */}
        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '14px 0 6px', borderBottom: '1px solid #94a3b8', paddingBottom: '3px' }}>
          1. รายการวัสดุถึงจุดสั่งซื้อ / หมดคลัง ({alerts.length} รายการ)
        </h2>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '8.5pt', color: '#666' }}>
            ไม่มีรายการแจ้งเตือนวัสดุตามเกณฑ์
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>รหัส</th>
                <th style={{ width: '35%' }}>ชื่อวัสดุ</th>
                <th style={{ width: '18%' }}>หน่วยงาน</th>
                <th style={{ width: '12%' }}>คงเหลือ</th>
                <th style={{ width: '10%' }}>แนะนำเบิก</th>
                <th style={{ width: '10%' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.ItemID}>
                  <td style={{ fontFamily: 'monospace' }}>{a.ItemCode}</td>
                  <td><b>{a.ItemName}</b></td>
                  <td>{a.Department}</td>
                  <td>
                    <b style={{ color: Number(a.Quantity || 0) <= 0 ? '#b91c1c' : '#111' }}>
                      {Number(a.Quantity).toLocaleString()} {a.Unit}
                    </b>
                  </td>
                  <td>
                    {a.RecommendedQuantity ? `${Number(a.RecommendedQuantity).toLocaleString()} ${a.Unit}` : '-'}
                  </td>
                  <td>{a.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section 2: Pending Repairs */}
        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '14px 0 6px', borderBottom: '1px solid #94a3b8', paddingBottom: '3px' }}>
          2. งานซ่อมครุภัณฑ์รอดำเนินการ / กำลังซ่อม ({pendingRepairs.length} รายการ)
        </h2>
        {pendingRepairs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '8.5pt', color: '#666' }}>
            ไม่มีงานซ่อมครุภัณฑ์คั่งค้าง
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '12%' }}>วันที่แจ้ง</th>
                <th style={{ width: '16%' }}>รหัสครุภัณฑ์</th>
                <th style={{ width: '28%' }}>ชื่อครุภัณฑ์</th>
                <th style={{ width: '26%' }}>อาการเสีย</th>
                <th style={{ width: '10%' }}>ผู้แจ้ง</th>
                <th style={{ width: '8%' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {pendingRepairs.map(r => (
                <tr key={r.RepairID}>
                  <td style={{ fontSize: '7.5pt' }}>{r.ReportDate}</td>
                  <td style={{ fontFamily: 'monospace' }}>{r.AssetCode}</td>
                  <td>{r.AssetName}</td>
                  <td>{r.Problem}</td>
                  <td>{r.Reporter}</td>
                  <td><b>{r.Status}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section 3: Damaged Assets */}
        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '14px 0 6px', borderBottom: '1px solid #94a3b8', paddingBottom: '3px' }}>
          3. ครุภัณฑ์สภาพชำรุด / เสื่อมสภาพ ({damagedAssets.length} รายการ)
        </h2>
        {damagedAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '8.5pt', color: '#666' }}>
            ไม่มีครุภัณฑ์สภาพชำรุดหรือเสื่อมสภาพ
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '18%' }}>รหัสครุภัณฑ์</th>
                <th style={{ width: '38%' }}>ชื่อครุภัณฑ์</th>
                <th style={{ width: '18%' }}>หน่วยงาน</th>
                <th style={{ width: '14%' }}>สถานที่</th>
                <th style={{ width: '12%' }}>สภาพ</th>
              </tr>
            </thead>
            <tbody>
              {damagedAssets.map(a => (
                <tr key={a.AssetID}>
                  <td style={{ fontFamily: 'monospace' }}>{a.AssetCode}</td>
                  <td>{a.AssetName}</td>
                  <td>{a.Department}</td>
                  <td>{a.Location || '-'}</td>
                  <td><b style={{ color: '#b91c1c' }}>{a.Condition}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Signature Line Footer */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div>ลงชื่อ............................................................</div>
            <div style={{ marginTop: '4px' }}>({user.fullName})</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>ผู้รายงาน</div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div>ลงชื่อ............................................................</div>
            <div style={{ marginTop: '4px' }}>(............................................................)</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>ผู้อำนวยการ / ผู้บริหารรับทราบ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
