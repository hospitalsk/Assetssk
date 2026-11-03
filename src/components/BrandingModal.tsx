import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { saveSystemSettings, DEFAULT_SETTINGS } from '../services/db';
import { showToast } from '../lib/alerts';
import { Sparkles, Upload, RotateCcw, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SystemSettings;
  onSave: (newSettings: SystemSettings) => void;
}

const PRESET_LOGOS = ['✚', '🏥', '💊', '🩺', '💉', '🔬', '🛡️', '📋'];

export const BrandingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave
}) => {
  const [appName, setAppName] = useState(currentSettings.appName);
  const [appSubName, setAppSubName] = useState(currentSettings.appSubName);
  const [appLogo, setAppLogo] = useState(currentSettings.appLogo);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      showToast('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAppLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setAppName(DEFAULT_SETTINGS.appName);
    setAppSubName(DEFAULT_SETTINGS.appSubName);
    setAppLogo(DEFAULT_SETTINGS.appLogo);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      showToast('กรุณาระบุชื่อเว็บแอป', 'error');
      return;
    }

    const updated: SystemSettings = {
      appName: appName.trim(),
      appSubName: appSubName.trim(),
      appLogo: appLogo.trim() || '✚'
    };

    saveSystemSettings(updated);
    onSave(updated);
    showToast('บันทึกการตั้งค่าชื่อและโลโก้ระบบเรียบร้อยแล้ว', 'success');
    onClose();
  };

  const isCustomImage =
    appLogo.startsWith('data:image') ||
    appLogo.startsWith('http') ||
    appLogo.startsWith('/') ||
    appLogo.startsWith('./') ||
    appLogo.includes('.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">ตั้งค่าชื่อและโลโก้เว็บแอป</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 p-0.5">
              {isCustomImage ? (
                <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-blue-600">{appLogo}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm tracking-wide truncate">{appName || 'ชื่อระบบ'}</div>
              <div className="text-xs text-slate-400 truncate">{appSubName || 'คำบรรยาย'}</div>
            </div>
          </div>

          {/* App Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อเว็บแอปพลิเคชัน *
            </label>
            <input
              type="text"
              required
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="เช่น ระบบจัดการเวชภัณฑ์และคลังวัสดุ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* App Sub-Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำบรรยาย / หน่วยงาน
            </label>
            <input
              type="text"
              value={appSubName}
              onChange={e => setAppSubName(e.target.value)}
              placeholder="เช่น โรงพยาบาล • Hospital Medical & Inventory"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Logo Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เลือกสัญลักษณ์โลโก้ หรือ อัปโหลดรูปภาพ
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {PRESET_LOGOS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAppLogo(p)}
                  className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-all cursor-pointer ${
                    appLogo === p
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold scale-105'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-slate-700 text-xs font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>{isCustomImage ? 'เปลี่ยนรูปภาพโลโก้' : 'อัปโหลดรูปภาพโลโก้ของโรงพยาบาล (.png, .jpg)'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> คืนค่าเริ่มต้น
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
