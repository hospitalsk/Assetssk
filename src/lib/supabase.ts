import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'hospital_asset_supabase_url';
const STORAGE_KEY_KEY = 'hospital_asset_supabase_anon_key';

// Read from environment variables or stored settings
const getEnvUrl = (): string => (import.meta.env.VITE_SUPABASE_URL || '').trim();
const getEnvKey = (): string => (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const getSavedUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
};

const getSavedKey = (): string => {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
};

const DEFAULT_SUPABASE_URL = 'https://vnayfqyftzthhkfcynor.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_ORx5VICPphCfz3HhOoSBjQ_w7edNBYu';

export const getSupabaseConfig = () => {
  const envUrl = getEnvUrl();
  const envKey = getEnvKey();
  const savedUrl = getSavedUrl();
  const savedKey = getSavedKey();

  const url = savedUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = savedKey || envKey || DEFAULT_SUPABASE_KEY;
  const isEnv = Boolean(envUrl && envKey && !savedUrl && !savedKey);
  const isConfigured = Boolean(
    url && anonKey && !url.includes('placeholder') && url.startsWith('http')
  );

  return { url, anonKey, isConfigured, isEnv, savedUrl, savedKey };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

// Initialize Supabase Client
const config = getSupabaseConfig();
export let supabase: SupabaseClient = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const updateSupabaseClient = (url: string, anonKey: string) => {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (cleanUrl && cleanKey) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    supabase = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    const fallback = getSupabaseConfig();
    supabase = createClient(fallback.url, fallback.anonKey);
  }
  return supabase;
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  const fallback = getSupabaseConfig();
  supabase = createClient(fallback.url, fallback.anonKey);
};

// SQL Schema for Supabase Migration
export const SUPABASE_SCHEMA_SQL = `-- สคริปต์สร้างตารางสำหรับ Supabase (Hospital Asset & Inventory Management)
-- คัดลอกไปวางที่ Supabase SQL Editor แล้วกด Run ได้ทันที

-- 1. ตารางหน่วยงาน (departments)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id TEXT UNIQUE NOT NULL,
  department_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางสถานที่ตั้ง (locations)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT UNIQUE NOT NULL,
  location_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางผู้ใช้งาน (users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางครุภัณฑ์ (assets)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT UNIQUE NOT NULL,
  asset_code TEXT UNIQUE NOT NULL,
  asset_name TEXT NOT NULL,
  category TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  serial_no TEXT DEFAULT '',
  department TEXT DEFAULT '',
  location TEXT DEFAULT '',
  budget_year TEXT DEFAULT '',
  purchase_date DATE,
  price NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'ใช้งาน',
  condition TEXT DEFAULT 'ปกติ',
  responsible TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางงานซ่อม (repairs)
CREATE TABLE IF NOT EXISTS public.repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id TEXT UNIQUE NOT NULL,
  asset_id TEXT NOT NULL,
  asset_code TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  problem TEXT NOT NULL,
  reporter TEXT DEFAULT '',
  status TEXT DEFAULT 'รอดำเนินการ',
  technician TEXT DEFAULT '',
  repair_date DATE,
  cost NUMERIC(15,2) DEFAULT 0,
  result TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางคลังวัสดุ (inventory_items)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT UNIQUE NOT NULL,
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT NOT NULL,
  department TEXT DEFAULT '',
  quantity NUMERIC(15,2) DEFAULT 0,
  min_quantity NUMERIC(15,2) DEFAULT 0,
  unit_price NUMERIC(15,2) DEFAULT 0,
  location TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ตารางประวัติเคลื่อนไหวสต็อก (stock_transactions)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  item_id TEXT NOT NULL,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  unit TEXT NOT NULL,
  department TEXT DEFAULT '',
  reference_no TEXT DEFAULT '',
  note TEXT DEFAULT '',
  username TEXT NOT NULL
);

-- 8. ตารางประวัติการใช้งาน (activity_logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id TEXT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT DEFAULT ''
);

-- เปิด Row Level Security (RLS) และอนุญาตให้เข้าถึงตามต้องการ
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับเข้าถึงข้อมูลผ่าน anon key
DO $$
BEGIN
  CREATE POLICY "Allow public read access" ON public.departments FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.departments FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.locations FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.locations FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.users FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.assets FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.assets FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.repairs FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.repairs FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.inventory_items FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.inventory_items FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.stock_transactions FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.stock_transactions FOR ALL USING (true);
  CREATE POLICY "Allow public read access" ON public.activity_logs FOR SELECT USING (true);
  CREATE POLICY "Allow public write access" ON public.activity_logs FOR ALL USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`;
