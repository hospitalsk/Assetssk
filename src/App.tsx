import React, { useEffect, useState } from 'react';
import { AppData, SafeUser, SystemSettings } from './types';
import { getCurrentUser, getAppData, logout, getSystemSettings } from './services/db';
import { Header } from './components/Header';
import { Sidebar, PageId } from './components/Sidebar';
import { NotificationModal } from './components/NotificationModal';
import { SupabaseModal } from './components/SupabaseModal';
import { BrandingModal } from './components/BrandingModal';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { AllocationView } from './components/views/AllocationView';
import { AlertsView } from './components/views/AlertsView';
import { AssetsView } from './components/views/AssetsView';
import { RepairsView } from './components/views/RepairsView';
import { InventoryView } from './components/views/InventoryView';
import { StockReportsView } from './components/views/StockReportsView';
import { DepartmentsView } from './components/views/DepartmentsView';
import { UsersView } from './components/views/UsersView';
import { LogsView } from './components/views/LogsView';
import { PasswordView } from './components/views/PasswordView';
import { showConfirm, showToast } from './lib/alerts';

export default function App() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [branding, setBranding] = useState<SystemSettings>(() => getSystemSettings());

  // Cross-view shortcuts
  const [stockModalItemId, setStockModalItemId] = useState<string | undefined>();
  const [stockModalPresetDept, setStockModalPresetDept] = useState<string | undefined>();
  const [repairModalId, setRepairModalId] = useState<string | undefined>();

  const loadData = async (activeUser?: SafeUser | null) => {
    try {
      const u = activeUser !== undefined ? activeUser : getCurrentUser();
      setUser(u);
      if (u) {
        const appData = await getAppData(u);
        setData(appData);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNavigate = (page: PageId) => {
    // Role guard: staff cannot access alerts or departments
    if (user?.role === 'staff' && (page === 'alerts' || page === 'departments')) {
      showToast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'warning');
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(page);
  };

  const handleLoginSuccess = (loggedInUser: SafeUser, initialData: AppData) => {
    setUser(loggedInUser);
    setData(initialData);
    setCurrentPage('dashboard');

    // Executive notification check upon login (staff does not receive executive alert popup)
    const isExec = ['admin', 'director', 'head'].includes(loggedInUser.role);
    if (isExec) {
      const stockCount = initialData.alerts.length;
      const repairCount = initialData.repairs.filter(
        r => r.Status === 'รอดำเนินการ' || r.Status === 'กำลังซ่อม'
      ).length;
      const totalAlerts = stockCount + repairCount;

      if (totalAlerts > 0) {
        setTimeout(async () => {
          const ok = await showConfirm(
            '🔔 แจ้งเตือนผู้บริหาร',
            `พบรายการที่ต้องติดตามและพิจารณาภายในระบบ ${totalAlerts} รายการ (วัสดุใกล้หมด/หมดคลัง ${stockCount} รายการ, เวชภัณฑ์รอดำเนินการซ่อม ${repairCount} รายการ)`,
            'เปิดดูการแจ้งเตือน',
            'รับทราบ',
            'warning'
          );
          if (ok) setCurrentPage('alerts');
        }, 500);
      }
    }
  };

  const handleLogout = async () => {
    const ok = await showConfirm(
      'ยืนยันออกจากระบบ?',
      `คุณต้องการออกจากระบบ ${branding.appName || 'Hospital Asset'} หรือไม่?`,
      'ออกจากระบบ',
      'ยกเลิก',
      'question'
    );
    if (ok) {
      logout();
      setUser(null);
      setData(null);
      showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-semibold tracking-wide">กำลังเริ่มต้นระบบ...</div>
        </div>
      </div>
    );
  }

  if (!user || !data) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenSupabase={() => setSupabaseModalOpen(true)}
          settings={branding}
        />
        <SupabaseModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
          onSuccess={() => {
            setSupabaseModalOpen(false);
            loadData();
          }}
        />
        <NotificationModal />
      </>
    );
  }

  const pageTitles: Record<PageId, string> = {
    dashboard: 'ภาพรวมระบบ',
    allocation: 'จัดสรรตามหน่วยงาน',
    assets: 'ทะเบียนเวชภัณฑ์',
    repairs: 'แจ้งซ่อม / ติดตามซ่อม',
    inventory: 'คลังวัสดุ / ตัดสต็อก',
    stockReports: 'รายงานคลังวัสดุ',
    alerts: 'แจ้งเตือนผู้บริหาร',
    departments: 'หน่วยงาน / สถานที่',
    users: 'ผู้ใช้งานและสิทธิ์',
    logs: 'ประวัติการใช้งาน',
    password: 'เปลี่ยนรหัสผ่าน'
  };

  const alertBadgeCount =
    (data.alerts?.length || 0) +
    data.repairs.filter(r => r.Status === 'รอดำเนินการ' || r.Status === 'กำลังซ่อม').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        alertCount={alertBadgeCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSupabase={() => setSupabaseModalOpen(true)}
        settings={branding}
        onOpenBranding={() => setBrandingModalOpen(true)}
      />

      {/* Main Content Wrap */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          title={pageTitles[currentPage] || branding.appName || 'ระบบบริหารจัดการเวชภัณฑ์'}
          alertCount={alertBadgeCount}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNavigateAlerts={() => handleNavigate('alerts')}
          onOpenSupabase={() => setSupabaseModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              data={data}
              user={user}
              onNavigate={handleNavigate}
              onOpenStockModal={itemId => {
                setStockModalItemId(itemId);
                setCurrentPage('inventory');
              }}
            />
          )}

          {currentPage === 'allocation' && (
            <AllocationView
              data={data}
              user={user}
              onRefresh={() => loadData(user)}
              onOpenAssetModal={() => setCurrentPage('assets')}
              onOpenInventoryModal={(itemId, presetDept) => {
                setStockModalPresetDept(presetDept);
                setCurrentPage('inventory');
              }}
              onOpenStockModal={(itemId, presetDept) => {
                setStockModalItemId(itemId);
                setStockModalPresetDept(presetDept);
                setCurrentPage('inventory');
              }}
            />
          )}

          {currentPage === 'alerts' && user.role !== 'staff' && (
            <AlertsView
              data={data}
              user={user}
              onRefresh={() => loadData(user)}
              onOpenStockModal={itemId => {
                setStockModalItemId(itemId);
                setCurrentPage('inventory');
              }}
              onOpenRepairModal={repairId => {
                setRepairModalId(repairId);
                setCurrentPage('repairs');
              }}
              onOpenAssetModal={() => setCurrentPage('assets')}
              onSelectDepartment={() => setCurrentPage('allocation')}
            />
          )}

          {currentPage === 'assets' && (
            <AssetsView
              data={data}
              user={user}
              onRefresh={() => loadData(user)}
              onOpenReallocate={() => setCurrentPage('allocation')}
            />
          )}

          {currentPage === 'repairs' && (
            <RepairsView
              data={data}
              user={user}
              onRefresh={() => {
                setRepairModalId(undefined);
                loadData(user);
              }}
              initialRepairId={repairModalId}
            />
          )}

          {currentPage === 'inventory' && (
            <InventoryView
              data={data}
              user={user}
              onRefresh={() => {
                setStockModalItemId(undefined);
                setStockModalPresetDept(undefined);
                loadData(user);
              }}
              initialItemId={stockModalItemId}
              initialPresetDept={stockModalPresetDept}
            />
          )}

          {currentPage === 'stockReports' && (
            <StockReportsView data={data} user={user} />
          )}

          {currentPage === 'departments' && user.role !== 'staff' && (
            <DepartmentsView
              data={data}
              user={user}
              onRefresh={() => loadData(user)}
            />
          )}

          {currentPage === 'users' && user.role === 'admin' && (
            <UsersView
              data={data}
              user={user}
              onRefresh={() => loadData(user)}
            />
          )}

          {currentPage === 'logs' && user.role === 'admin' && <LogsView data={data} />}

          {currentPage === 'password' && <PasswordView />}
        </main>
      </div>

      {/* Global Modals */}
      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onSuccess={() => {
          setSupabaseModalOpen(false);
          loadData(user);
        }}
      />
      {user.role === 'admin' && (
        <BrandingModal
          isOpen={brandingModalOpen}
          onClose={() => setBrandingModalOpen(false)}
          currentSettings={branding}
          onSave={newBranding => setBranding(newBranding)}
        />
      )}
      <NotificationModal />
    </div>
  );
}
