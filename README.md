# ระบบบริหารจัดการครุภัณฑ์และคลังวัสดุโรงพยาบาล (Hospital Asset & Inventory Management)

ระบบเว็บแอปพลิเคชันบริหารจัดการครุภัณฑ์ ทะเบียนทรัพย์สิน แจ้งซ่อม คลังวัสดุสิ้นเปลือง ตัดสต็อก และจัดสรรทรัพยากรตามหน่วยงาน พัฒนาด้วย **React 19 + TypeScript + Tailwind CSS + Vite** พร้อมเชื่อมต่อฐานข้อมูล **Supabase (PostgreSQL Cloud)** และสามารถทำงานในโหมดออฟไลน์ (Local Storage) ได้ทันที

---

## 🌟 คุณสมบัติเด่น (Features)

1. **ทะเบียนครุภัณฑ์ (Asset Registry)**
   - บันทึก ค้นหา กรองสถานะ/หน่วยงาน/สถานที่
   - **นำเข้าข้อมูลจากไฟล์ Excel (.xlsx, .xls)** และ **ส่งออกเป็นไฟล์ Excel**
   - บันทึกสภาพครุภัณฑ์ (ปกติ, ชำรุด, เสื่อมสภาพ, รอตรวจสอบ)

2. **จัดสรรทรัพยากรตามหน่วยงาน (Department Resource Allocation)**
   - ตารางเปรียบเทียบทรัพยากรทุกหน่วยงาน (Allocation Matrix)
   - ฟังก์ชัน **"จัดสรร/ย้าย"** เปลี่ยนสถานที่ตั้ง ห้องติดตั้ง และระบุผู้รับผิดชอบดูแล

3. **แจ้งซ่อมและติดตามสถานะงานซ่อม (Repairs Tracking)**
   - บันทึกอาการเสีย มอบหมายช่าง ค่าใช้จ่าย ผลการซ่อม
   - ซิงค์สถานะครุภัณฑ์อัตโนมัติ (กำลังซ่อม ➔ ส่งซ่อม, ซ่อมเสร็จ ➔ ใช้งาน)

4. **คลังวัสดุสิ้นเปลือง & ตัดสต็อก (Inventory & Stock Movement)**
   - บันทึกรับเข้า (In), เบิกจ่าย (Out), ปรับเพิ่ม, ปรับลด
   - ระบบตรวจสอบและป้องกันการเบิกเกินยอดคงเหลือ (Overdraft Safeguard)
   - **นำเข้าข้อมูลวัสดุจากไฟล์ Excel (.xlsx, .xls)** และ **ส่งออกเป็นไฟล์ Excel**

5. **รายงานคลังวัสดุ (Stock Reports)**
   - กรองตามช่วงวันที่ สรุปยอดรับเข้า-เบิกจ่าย และวัสดุถึงจุดสั่งซื้อ
   - **พิมพ์รายงานกระดาษ A4 ผ่าน `@media print` ทันที โดยไม่มีหน้าต่าง `about:blank`**

6. **ศูนย์แจ้งเตือนผู้บริหาร (Executive In-App Notification Center)**
   - กระดิ่งแจ้งเตือนบน Topbar พร้อมตัวเลข Badge แบบเรียลไทม์
   - ป๊อปอัปแจ้งเตือนทันทีเมื่อผู้บริหารเข้าสู่ระบบ หากมีวัสดุวิกฤตหรือครุภัณฑ์รอซ่อม
   - สูตรคำนวณคาดการณ์การใช้วัสดุ (เทียบ 90 วันกับ 30 วัน เผื่อสำรอง 10%)
   - **พิมพ์รายงานสรุปผู้บริหารขนาด A4 ทันที**

7. **การจัดการหน่วยงานและสถานที่ (Departments & Locations)**
   - จัดการโครงสร้างแผนกและสถานที่จัดเก็บ/ติดตั้ง พร้อมระบบป้องกันการลบหากมีข้อมูลใช้งานอยู่

8. **การจัดการผู้ใช้งานและสิทธิ์ (User Administration)**
   - แบ่ง 4 ระดับสิทธิ์: `admin` (ผู้ดูแลระบบ), `director` (ผู้อำนวยการ), `head` (หัวหน้ากลุ่มงาน), `staff` (เจ้าหน้าที่)
   - เข้ารหัสผ่านด้วย SHA-256 + Salt

9. **ฐานข้อมูล Supabase Cloud & Local Storage Dual Mode**
   - รองรับการเชื่อมต่อกับ Supabase PostgreSQL Cloud ผ่าน API Key
   - มีปุ่ม **"คัดลอก SQL สร้างตาราง"** สำหรับรันใน Supabase SQL Editor
   - มีปุ่ม **"ย้ายข้อมูลทั้งหมดขึ้น Supabase (One-Click Migration)"** ซิงค์ข้อมูลขึ้นคลาวด์ได้ในคลิกเดียว

---

## 🚀 วิธีติดตั้งและรันบนเครื่องคอมพิวเตอร์ / GitHub

### 1. ติดตั้ง Node.js
ตรวจสอบว่าเครื่องของคุณติดตั้ง **Node.js เวอร์ชัน 18 ขึ้นไป** (แนะนำ Node.js 20+)

### 2. โคลน Repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 3. ติดตั้ง Dependencies
```bash
npm install
```

### 4. กำหนดค่า Environment Variables (ถ้าใช้ Supabase)
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```
แล้วกรอกค่า Supabase Project URL และ Anon Key:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```
*(หากยังไม่มี Supabase สามารถเริ่มใช้งานได้ทันที ระบบจะใช้โหมด Local Storage อัตโนมัติ และสามารถไปตั้งค่าในเว็บแอปได้ภายหลัง)*

### 5. สั่งรัน Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### 6. การ Deploy ขึ้น GitHub Pages (เลือกวิธีใดวิธีหนึ่งได้ทันที)

#### วิธีที่ 1: ใช้ GitHub Actions (แนะนำและอัตโนมัติที่สุด)
1. ไปที่ GitHub Repository ของคุณ ➔ **Settings** ➔ เมนูด้านซ้ายเลือก **Pages**
2. ภายใต้หัวข้อ **Build and deployment** ในช่อง **Source** ให้เปลี่ยนจาก "Deploy from a branch" เป็น **"GitHub Actions"**
3. ทุกครั้งที่คุณ Push โค้ดขึ้น branch `main` ระบบ GitHub Actions จะคอมไพล์และ Deploy เว็บให้อัตโนมัติทันที

#### วิธีที่ 2: ใช้โฟลเดอร์ `/docs` (Deploy from a branch)
1. รันคำสั่ง `npm run build:docs` ในเครื่อง (ระบบคอมไพล์ไฟล์สมบูรณ์ไว้ในโฟลเดอร์ `/docs` แล้ว)
2. ไปที่ GitHub Repository ของคุณ ➔ **Settings** ➔ **Pages**
3. ภายใต้หัวข้อ **Build and deployment**:
   - **Source:** เลือก `Deploy from a branch`
   - **Branch:** เลือก `main` และเลือกโฟลเดอร์เป็น `/docs`
   - กด **Save**

*(หมายเหตุ: ลิงก์ GitHub Pages ของคุณจะเป็นรูปแบบ `https://<username>.github.io/<repo-name>/` ให้ใส่เครื่องหมาย `/` ปิดท้ายเสมอ)*

---

## 🔑 บัญชีเริ่มต้นสำหรับเข้าสู่ระบบ (Default Credentials)

- **ชื่อผู้ใช้งาน (Username):** `admin`
- **รหัสผ่าน (Password):** `Admin@12345`

*(หลังเข้าสู่ระบบ แนะนำให้เข้าไปที่เมนู "เปลี่ยนรหัสผ่าน" เพื่อความปลอดภัย)*

---

## 📄 การตั้งค่าฐานข้อมูล Supabase

1. สมัครใช้งานที่ [supabase.com](https://supabase.com) และสร้างโปรเจกต์ใหม่
2. เปิดโปรเจกต์ เข้าไปที่เมนู **SQL Editor**
3. ในเว็บแอป ให้คลิกที่ไอคอน **"ฐานข้อมูล Supabase"** บน Sidebar แล้วกดปุ่ม **"คัดลอก SQL สร้างตาราง"**
4. นำคำสั่ง SQL ไปวางใน Supabase SQL Editor แล้วกด **Run**
5. ไปที่ **Project Settings ➔ API** คัดลอก **Project URL** และ **anon public Key**
6. นำมากรอกในหน้าต่างตั้งค่าของเว็บแอป แล้วกดปุ่ม **"ย้ายข้อมูลทั้งหมดขึ้น Supabase"**
