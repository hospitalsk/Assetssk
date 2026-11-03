import React, { useState } from 'react';
import { AppData, SafeUser } from '../../types';
import { FileSpreadsheet, Printer, Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  data: AppData;
  user: SafeUser;
}

export const StockReportsView: React.FC<Props> = ({ data, user }) => {
  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(today);

  // Filter transactions by date range
  const filteredTx = data.stockTransactions.filter(t => {
    const d = (t.Timestamp || '').slice(0, 10);
    return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  });

  const incomingTx = filteredTx.filter(t => t.TransactionType === 'รับเข้า' || t.TransactionType === 'ปรับเพิ่ม');
  const outgoingTx = filteredTx.filter(t => t.TransactionType === 'เบิกจ่าย' || t.TransactionType === 'ปรับลด');

  const incomingQty = incomingTx.reduce((sum, t) => sum + Number(t.Quantity || 0), 0);
  const outgoingQty = outgoingTx.reduce((sum, t) => sum + Number(t.Quantity || 0), 0);
  const totalItemQty = data.inventory.reduce((sum, i) => sum + Number(i.Quantity || 0), 0);
  const lowStockItems = data.inventory.filter(
    i => Number(i.MinQuantity || 0) > 0 && Number(i.Quantity || 0) <= Number(i.MinQuantity || 0)
  );

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              รายงานคลังวัสดุ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              รายงานยอดคงเหลือ รายการรับเข้า-เบิกจ่าย และวัสดุถึงจุดสั่งซื้อ
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Printer className="w-4 h-4" /> พิมพ์รายงาน (A4)
          </button>
        </div>

        {/* Date Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" /> ช่วงวันที่:
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">ตั้งแต่</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">ถึง</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">รายการวัสดุทั้งหมด</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{data.inventory.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">ยอดคงเหลือรวมในคลัง</div>
            <div className="text-2xl font-bold text-blue-900 mt-2">{totalItemQty.toLocaleString()}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">รับเข้าในช่วงที่เลือก</div>
            <div className="text-2xl font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <ArrowDownRight className="w-5 h-5" /> +{incomingQty.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500">เบิกจ่ายในช่วงที่เลือก</div>
            <div className="text-2xl font-bold text-amber-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-5 h-5" /> -{outgoingQty.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-xs font-medium text-slate-500">วัสดุถึงจุดสั่งซื้อ</div>
            <div
              className={`text-2xl font-bold mt-2 ${
                lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {lowStockItems.length}
            </div>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
            รายการวัสดุคงเหลือต่ำ / ถึงจุดสั่งซื้อ ({lowStockItems.length} รายการ)
          </h3>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              ยอดคงเหลือทุกรายการอยู่ในเกณฑ์ปกติ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3 font-semibold">รหัสวัสดุ</th>
                    <th className="py-2.5 px-3 font-semibold">ชื่อวัสดุ</th>
                    <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                    <th className="py-2.5 px-3 font-semibold">ยอดคงเหลือ</th>
                    <th className="py-2.5 px-3 font-semibold">จุดสั่งซื้อขั้นต่ำ</th>
                    <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map(i => (
                    <tr key={i.ItemID} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">{i.ItemCode}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{i.ItemName}</td>
                      <td className="py-3 px-3 text-slate-600">{i.Department || 'ส่วนกลาง'}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-rose-600 font-mono">
                          {Number(i.Quantity || 0).toLocaleString()} {i.Unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {Number(i.MinQuantity || 0).toLocaleString()} {i.Unit}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {Number(i.Quantity || 0) <= 0 ? 'หมดคลัง' : 'ถึงจุดสั่งซื้อ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Transactions Log */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
            ประวัติการเคลื่อนไหวสต็อกในช่วงวันที่เลือก ({filteredTx.length} รายการ)
          </h3>
          {filteredTx.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              ไม่พบรายการเคลื่อนไหวสต็อกในช่วงวันที่เลือก
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                    <th className="py-2.5 px-3 font-semibold">วัน-เวลา</th>
                    <th className="py-2.5 px-3 font-semibold">รหัสวัสดุ</th>
                    <th className="py-2.5 px-3 font-semibold">ชื่อวัสดุ</th>
                    <th className="py-2.5 px-3 font-semibold">ประเภท</th>
                    <th className="py-2.5 px-3 font-semibold">จำนวน</th>
                    <th className="py-2.5 px-3 font-semibold">หน่วยงาน</th>
                    <th className="py-2.5 px-3 font-semibold">เลขที่เอกสาร</th>
                    <th className="py-2.5 px-3 font-semibold">ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTx.map(t => (
                    <tr key={t.TransactionID} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {t.Timestamp ? new Date(t.Timestamp).toLocaleDateString('th-TH') : ''}{' '}
                        <span className="text-[10px] text-slate-400">
                          {t.Timestamp ? new Date(t.Timestamp).toLocaleTimeString('th-TH') : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">{t.ItemCode}</td>
                      <td className="py-3 px-3 text-slate-800">{t.ItemName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.TransactionType === 'รับเข้า'
                              ? 'bg-emerald-50 text-emerald-700'
                              : t.TransactionType === 'เบิกจ่าย'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {t.TransactionType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold font-mono">
                        {Number(t.Quantity).toLocaleString()} {t.Unit}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{t.Department || '-'}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{t.ReferenceNo || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{t.Username}</td>
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
            รายงานสรุปคลังวัสดุสิ้นเปลืองโรงพยาบาล
          </h1>
          <div style={{ fontSize: '9pt', color: '#444' }}>
            ช่วงวันที่: <b>{fromDate}</b> ถึง <b>{toDate}</b> | วันที่พิมพ์:{' '}
            {new Date().toLocaleDateString('th-TH')} | ผู้จัดทำ: {user.fullName} ({user.department || 'ส่วนกลาง'})
          </div>
        </div>

        {/* Print Summary Stats Grid */}
        <table style={{ width: '100%', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ width: '33.33%', padding: '6px 8px' }}>
                <div style={{ fontSize: '8pt', color: '#555' }}>รายการวัสดุทั้งหมด</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{data.inventory.length} รายการ</div>
              </td>
              <td style={{ width: '33.33%', padding: '6px 8px' }}>
                <div style={{ fontSize: '8pt', color: '#555' }}>ยอดคงเหลือรวมในคลัง</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{totalItemQty.toLocaleString()} หน่วย</div>
              </td>
              <td style={{ width: '33.33%', padding: '6px 8px' }}>
                <div style={{ fontSize: '8pt', color: '#555' }}>วัสดุถึงจุดสั่งซื้อ</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#b91c1c' }}>
                  {lowStockItems.length} รายการ
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '8pt', color: '#555' }}>ยอดรับเข้าในช่วงที่เลือก</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#15803d' }}>
                  +{incomingQty.toLocaleString()}
                </div>
              </td>
              <td style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '8pt', color: '#555' }}>ยอดเบิกจ่ายในช่วงที่เลือก</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#b45309' }}>
                  -{outgoingQty.toLocaleString()}
                </div>
              </td>
              <td style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '8pt', color: '#555' }}>จำนวนรายการเคลื่อนไหว</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{filteredTx.length} รายการ</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: Low Stock Items */}
        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '14px 0 6px', borderBottom: '1px solid #94a3b8', paddingBottom: '3px' }}>
          1. รายการวัสดุคงเหลือต่ำกว่าเกณฑ์ / ถึงจุดสั่งซื้อ ({lowStockItems.length} รายการ)
        </h2>
        {lowStockItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '8.5pt', color: '#666' }}>
            ยอดคงเหลือวัสดุทุกรายการอยู่ในเกณฑ์ปกติ
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>รหัส</th>
                <th style={{ width: '40%' }}>ชื่อวัสดุ</th>
                <th style={{ width: '18%' }}>หน่วยงาน</th>
                <th style={{ width: '12%' }}>ยอดคงเหลือ</th>
                <th style={{ width: '15%' }}>จุดสั่งซื้อ</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map(i => (
                <tr key={i.ItemID}>
                  <td style={{ fontFamily: 'monospace' }}>{i.ItemCode}</td>
                  <td><b>{i.ItemName}</b></td>
                  <td>{i.Department || 'ส่วนกลาง'}</td>
                  <td>
                    <b style={{ color: Number(i.Quantity || 0) <= 0 ? '#b91c1c' : '#111' }}>
                      {Number(i.Quantity || 0).toLocaleString()} {i.Unit}
                    </b>
                  </td>
                  <td>{Number(i.MinQuantity || 0).toLocaleString()} {i.Unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Section 2: Stock Transactions */}
        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '14px 0 6px', borderBottom: '1px solid #94a3b8', paddingBottom: '3px' }}>
          2. ประวัติการเคลื่อนไหวสต็อก (รับเข้า - เบิกจ่าย) ({filteredTx.length} รายการ)
        </h2>
        {filteredTx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '8.5pt', color: '#666' }}>
            ไม่พบรายการเคลื่อนไหวสต็อกในช่วงวันที่เลือก
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '12%' }}>วัน-เวลา</th>
                <th style={{ width: '14%' }}>รหัสวัสดุ</th>
                <th style={{ width: '32%' }}>ชื่อวัสดุ</th>
                <th style={{ width: '10%' }}>ประเภท</th>
                <th style={{ width: '12%' }}>จำนวน</th>
                <th style={{ width: '10%' }}>เลขที่เอกสาร</th>
                <th style={{ width: '10%' }}>ผู้ทำรายการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map(t => (
                <tr key={t.TransactionID}>
                  <td style={{ fontSize: '7.5pt' }}>
                    {t.Timestamp ? new Date(t.Timestamp).toLocaleDateString('th-TH') : ''}
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{t.ItemCode}</td>
                  <td>{t.ItemName}</td>
                  <td><b>{t.TransactionType}</b></td>
                  <td><b>{Number(t.Quantity).toLocaleString()} {t.Unit}</b></td>
                  <td>{t.ReferenceNo || '-'}</td>
                  <td>{t.Username}</td>
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
            <div style={{ fontSize: '8pt', color: '#555' }}>ผู้จัดทำรายงาน</div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div>ลงชื่อ............................................................</div>
            <div style={{ marginTop: '4px' }}>(............................................................)</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>หัวหน้ากลุ่มงาน / ผู้ตรวจรับ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
