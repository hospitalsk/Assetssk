import React from 'react';
import { AppData } from '../../types';
import { History, Clock, User, Activity } from 'lucide-react';

interface Props {
  data: AppData;
}

export const LogsView: React.FC<Props> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          ประวัติการใช้งานระบบ (Audit Logs)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          บันทึกกิจกรรมล่าสุด 100 รายการ เพื่อความโปร่งใสและตรวจสอบย้อนหลัง
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        {data.logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">ยังไม่มีประวัติการใช้งาน</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">วัน-เวลา</th>
                  <th className="py-2.5 px-3 font-semibold">ผู้ใช้งาน</th>
                  <th className="py-2.5 px-3 font-semibold">กิจกรรม (Action)</th>
                  <th className="py-2.5 px-3 font-semibold">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map(l => (
                  <tr key={l.LogID} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 text-slate-600 font-mono whitespace-nowrap">
                      {l.Timestamp ? new Date(l.Timestamp).toLocaleDateString('th-TH') : ''}{' '}
                      <span className="text-[11px] text-slate-400">
                        {l.Timestamp ? new Date(l.Timestamp).toLocaleTimeString('th-TH') : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 font-mono">{l.Username}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {l.Action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{l.Detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
