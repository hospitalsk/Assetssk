import React from 'react';
import { AppData, SafeUser } from '../../types';
import {
  Boxes,
  CheckCircle2,
  Wrench,
  Package,
  AlertTriangle,
  Building2,
  ArrowRight,
  TrendingDown,
  Layers
} from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
  onNavigate: (page: any) => void;
  onOpenStockModal: (itemId?: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  data,
  user,
  onNavigate,
  onOpenStockModal
}) => {
  const myDept = user.department;
  const myAssets = myDept ? data.assets.filter(a => a.Department === myDept) : [];
  const myInventory = myDept ? data.inventory.filter(i => i.Department === myDept) : [];
  const myLowStock = myInventory.filter(
    i => Number(i.Quantity || 0) <= Number(i.MinQuantity || 0)
  ).length;

  const stats = [
    { label: 'ครุภัณฑ์ทั้งหมด', value: data.total, icon: <Boxes className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50 text-blue-900 border-blue-100' },
    { label: 'พร้อมใช้งาน', value: data.active, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 text-emerald-900 border-emerald-100' },
    { label: 'กำลังส่งซ่อม', value: data.repairing, icon: <Wrench className="w-5 h-5 text-amber-600" />, color: 'bg-amber-50 text-amber-900 border-amber-100' },
    { label: 'ว่างพร้อมจัดสรร', value: data.available, icon: <Layers className="w-5 h-5 text-cyan-600" />, color: 'bg-cyan-50 text-cyan-900 border-cyan-100' },
    { label: 'จำหน่าย / ปลดระวาง', value: data.disposed, icon: <TrendingDown className="w-5 h-5 text-slate-500" />, color: 'bg-slate-50 text-slate-700 border-slate-100' },
    { label: 'รายการวัสดุสิ้นเปลือง', value: data.inventoryCount, icon: <Package className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-50 text-indigo-900 border-indigo-100' },
    { label: 'วัสดุถึงจุดสั่งซื้อ / หมด', value: data.lowStock, icon: <AlertTriangle className="w-5 h-5 text-rose-600" />, color: 'bg-rose-50 text-rose-900 border-rose-100' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ภาพรวมครุภัณฑ์และวัสดุ</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            สรุปสถานะครุภัณฑ์โรงพยาบาล การซ่อมบำรุง และความพร้อมของคลังวัสดุสิ้นเปลือง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('allocation')}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4" /> จัดสรรตามหน่วยงาน
          </button>
          <button
            onClick={() => onNavigate('alerts')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            ศูนย์แจ้งเตือนผู้บริหาร ➔
          </button>
        </div>
      </div>

      {/* User Department Spotlight Card */}
      {myDept && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white border border-blue-100 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
                <Building2 className="w-4 h-4" /> ทรัพยากรประจำหน่วยงานของคุณ
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{myDept}</h3>
            </div>
            <button
              onClick={() => onNavigate('allocation')}
              className="self-start md:self-auto px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              เปิดดูรายการจัดสรรของแผนก <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">ครุภัณฑ์ในแผนก</div>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {myAssets.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">ครุภัณฑ์พร้อมใช้</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {myAssets.filter(a => a.Status === 'ใช้งาน').length} <span className="text-xs font-normal text-slate-400">รายการ</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">รายการวัสดุของแผนก</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {myInventory.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">วัสดุต้องเบิก/สั่งซื้อ</div>
              <div className={`text-xl font-bold mt-1 ${myLowStock > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {myLowStock} <span className="text-xs font-normal text-slate-400">รายการ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border bg-white shadow-xs flex flex-col justify-between ${
              idx === stats.length - 1 && data.lowStock > 0 ? 'border-rose-300 ring-2 ring-rose-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 leading-tight">{s.label}</span>
              <div className="p-1.5 rounded-lg bg-slate-50 shrink-0">{s.icon}</div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-3">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Urgent Stock Alert Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แจ้งเตือนวัสดุคงคลังที่ต้องดำเนินการ ({data.alerts.length} รายการ)
              </h3>
              <p className="text-xs text-slate-500">
                คำนวณจากประวัติการใช้ 90 วันและ 30 วัน เผื่อสำรอง 10%
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            ดูทั้งหมดในศูนย์แจ้งเตือน <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {data.alerts.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            ยอดคงเหลือวัสดุทุกรายการอยู่ในเกณฑ์ปกติ ไม่มีรายการต้องจัดซื้อเร่งด่วน
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">รหัส / รายการวัสดุ</th>
                  <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                  <th className="py-2.5 px-3 font-semibold">ยอดคงเหลือ</th>
                  <th className="py-2.5 px-3 font-semibold">คำแนะนำเบิก/จัดซื้อ</th>
                  <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                  <th className="py-2.5 px-3 font-semibold text-right">การจัดสรร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.alerts.slice(0, 5).map(a => (
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
                    <td className="py-3 px-3">
                      {a.RecommendedQuantity !== null ? (
                        <span className="font-bold text-blue-700">
                          {Number(a.RecommendedQuantity).toLocaleString()} {a.Unit}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {a.Status === 'หมดคลัง' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          หมดคลัง
                        </span>
                      ) : a.Status.includes('ใกล้หมด') ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          ใกล้หมด
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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

      {/* Two Column Grid: Recent Assets & Recent Repairs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-base font-bold text-slate-900">ครุภัณฑ์ที่บันทึกล่าสุด</h3>
            <button
              onClick={() => onNavigate('assets')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              ดูทั้งหมด ➔
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {data.assets.slice(0, 5).map(a => (
              <div key={a.AssetID} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{a.AssetCode}</div>
                  <div className="text-slate-600 truncate max-w-[220px] sm:max-w-xs">{a.AssetName}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {a.Department} • {a.Location || 'ไม่ระบุสถานที่'}
                  </div>
                </div>
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Repairs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-base font-bold text-slate-900">รายการแจ้งซ่อมล่าสุด</h3>
            <button
              onClick={() => onNavigate('repairs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              ดูทั้งหมด ➔
            </button>
          </div>
          {data.repairs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">ยังไม่มีรายการแจ้งซ่อม</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.repairs.slice(0, 5).map(r => (
                <div key={r.RepairID} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{r.AssetCode}</div>
                    <div className="text-slate-600 truncate max-w-[220px] sm:max-w-xs">{r.Problem}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      ผู้แจ้ง: {r.Reporter} • {r.ReportDate}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        r.Status === 'ซ่อมเสร็จ'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.Status === 'กำลังซ่อม'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {r.Status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
