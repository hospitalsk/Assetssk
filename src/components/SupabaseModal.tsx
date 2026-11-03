import React, { useState } from 'react';
import {
  getSupabaseConfig,
  updateSupabaseClient,
  clearSupabaseConfig,
  SUPABASE_SCHEMA_SQL,
  supabase
} from '../lib/supabase';
import { migrateLocalToSupabase } from '../services/db';
import { showToast, showLoading, hideLoading, showConfirm } from '../lib/alerts';
import { Database, CheckCircle2, AlertCircle, Copy, Check, UploadCloud, RefreshCw, X, FileCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupabaseModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.savedUrl || currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.savedKey || currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('กรุณากรอกทั้ง Supabase URL และ Anon Key', 'error');
      return;
    }
    updateSupabaseClient(url.trim(), anonKey.trim());
    showToast('บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว', 'success');
    setTestResult(null);
    onSuccess();
  };

  const handleClear = async () => {
    const ok = await showConfirm(
      'ยกเลิกการเชื่อมต่อ Supabase?',
      'ระบบจะกลับมาทำงานในโหมดจัดเก็บข้อมูล Local Storage ชั่วคราว',
      'ยกเลิกการเชื่อมต่อ',
      'ปิดหน้าต่าง',
      'question'
    );
    if (!ok) return;
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    showToast('ล้างการเชื่อมต่อ Supabase แล้ว', 'info');
    onSuccess();
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('กรุณากรอกทั้ง Supabase URL และ Anon Key ก่อนทดสอบ', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      updateSupabaseClient(url.trim(), anonKey.trim());
      // Test querying assets or departments table
      const { data, error } = await supabase.from('departments').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.message.includes('relation "public.departments" does not exist') || error.code === '42P01') {
          setTestResult({
            ok: true,
            message: 'เชื่อมต่อกับ Supabase ได้สำเร็จ! (ยังไม่พบตารางในฐานข้อมูล โปรดรันสคริปต์ SQL สร้างตารางด้านล่าง)'
          });
        } else {
          setTestResult({
            ok: false,
            message: `การเชื่อมต่อล้มเหลว: ${error.message}`
          });
        }
      } else {
        setTestResult({
          ok: true,
          message: 'เชื่อมต่อและตรวจสอบฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!'
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `ข้อผิดพลาด: ${err?.message || 'ไม่สามารถติดต่อ Supabase ได้'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    showToast('คัดลอกสคริปต์ SQL สำหรับสร้างตารางใน Supabase แล้ว', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleMigrate = async () => {
    const ok = await showConfirm(
      'ย้ายข้อมูลทั้งหมดขึ้น Supabase?',
      'ระบบจะนำข้อมูลครุภัณฑ์, วัสดุ, ประวัติซ่อม, สต็อก, หน่วยงาน และผู้ใช้ทั้งหมด ซิงค์ขึ้นตารางใน Supabase',
      'เริ่มย้ายข้อมูล',
      'ยกเลิก',
      'question'
    );
    if (!ok) return;

    showLoading('กำลังย้ายข้อมูลทั้งหมดขึ้น Supabase...');
    try {
      const res = await migrateLocalToSupabase();
      hideLoading();
      showToast(res.message, 'success');
      onSuccess();
    } catch (err: any) {
      hideLoading();
      showToast(err.message || 'เกิดข้อผิดพลาดในการย้ายข้อมูล', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 text-slate-800 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">การตั้งค่าฐานข้อมูล Supabase</h3>
              <p className="text-xs text-slate-500">ย้ายและเชื่อมต่อฐานข้อมูล PostgreSQL บน Supabase Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between mb-5 ${
            currentConfig.isConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {currentConfig.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="text-sm font-semibold">
                {currentConfig.isConfigured ? 'เชื่อมต่อกับ Supabase แล้ว' : 'กำลังใช้งานโหมด Local Storage (ออฟไลน์)'}
              </div>
              <div className="text-xs opacity-90">
                {currentConfig.isConfigured
                  ? `URL: ${currentConfig.url}`
                  : 'ข้อมูลถูกบันทึกในเบราว์เซอร์ กรุณาระบุข้อมูลเชื่อมต่อเพื่อซิงค์ข้อมูลกับคลาวด์'}
              </div>
            </div>
          </div>
          {currentConfig.isConfigured && (
            <button
              onClick={handleClear}
              className="text-xs text-rose-600 hover:underline font-medium ml-2 shrink-0 cursor-pointer"
            >
              ยกเลิกการเชื่อมต่อ
            </button>
          )}
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Project URL *
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">หาได้จากเมนู Project Settings → API ใน Supabase Dashboard</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Anon Public API Key *
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">
              ใช้ Anon / Public Key เพื่อความปลอดภัย (ระบบรองรับ RLS ป้องกันสิทธิ์)
            </p>
          </div>
        </div>

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
              testResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <div>{testResult.message}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
            </button>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL สร้างตาราง'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>
            <button
              type="button"
              onClick={handleMigrate}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              ย้ายข้อมูลทั้งหมดขึ้น Supabase
            </button>
          </div>
        </div>

        {/* SQL Schema Preview Accordion */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            {showSql ? 'ซ่อนคำสั่ง SQL สำหรับ Supabase' : 'แสดงคำสั่ง SQL สำหรับรันใน Supabase SQL Editor'}
          </button>
          {showSql && (
            <div className="mt-2 relative">
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] overflow-x-auto max-h-56 leading-relaxed font-mono">
                {SUPABASE_SCHEMA_SQL}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> คัดลอก
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
