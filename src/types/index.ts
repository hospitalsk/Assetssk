export interface Asset {
  AssetID: string;
  AssetCode: string;
  AssetName: string;
  Category?: string;
  Brand?: string;
  Model?: string;
  SerialNo?: string;
  Department?: string;
  Location?: string;
  BudgetYear?: string;
  PurchaseDate?: string;
  Price?: number | string;
  Status?: 'ใช้งาน' | 'ว่าง' | 'ส่งซ่อม' | 'จำหน่าย';
  Condition?: 'ปกติ' | 'ชำรุด' | 'เสื่อมสภาพ' | 'รอตรวจสอบ';
  Responsible?: string;
  Note?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface User {
  UserID: string;
  Username: string;
  PasswordHash: string;
  Salt: string;
  FullName: string;
  Role: 'admin' | 'director' | 'head' | 'staff';
  Department?: string;
  Active: boolean;
  CreatedAt?: string;
}

export interface SafeUser {
  userId: string;
  username: string;
  fullName: string;
  role: 'admin' | 'director' | 'head' | 'staff';
  department: string;
}

export interface Repair {
  RepairID: string;
  AssetID: string;
  AssetCode: string;
  AssetName: string;
  ReportDate: string;
  Problem: string;
  Reporter: string;
  Status: 'รอดำเนินการ' | 'กำลังซ่อม' | 'ซ่อมเสร็จ' | 'ยกเลิก';
  Technician?: string;
  RepairDate?: string;
  Cost?: number | string;
  Result?: string;
  UpdatedAt?: string;
}

export interface Department {
  DepartmentID: string;
  DepartmentName: string;
  CreatedAt?: string;
}

export interface Location {
  LocationID: string;
  LocationName: string;
  CreatedAt?: string;
}

export interface InventoryItem {
  ItemID: string;
  ItemCode: string;
  ItemName: string;
  Category?: string;
  Unit: string;
  Department?: string;
  Quantity: number;
  MinQuantity: number;
  UnitPrice?: number;
  Location?: string;
  Note?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface StockTransaction {
  TransactionID: string;
  Timestamp: string;
  ItemID: string;
  ItemCode: string;
  ItemName: string;
  TransactionType: 'รับเข้า' | 'เบิกจ่าย' | 'ปรับเพิ่ม' | 'ปรับลด';
  Quantity: number;
  Unit: string;
  Department?: string;
  ReferenceNo?: string;
  Note?: string;
  Username: string;
}

export interface ActivityLog {
  LogID: string;
  Timestamp: string;
  Username: string;
  Action: string;
  Detail: string;
}

export interface StockAlert {
  ItemID: string;
  ItemCode: string;
  ItemName: string;
  Department: string;
  Unit: string;
  Quantity: number;
  MinQuantity: number;
  UsedLast90Days: number;
  UsedLast30Days: number;
  ForecastMonthly: number | null;
  RecommendedQuantity: number | null;
  Status: string;
  HasHistory: boolean;
}

export interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  assetCount: number;
  activeAssets: number;
  repairingAssets: number;
  availableAssets: number;
  disposedAssets: number;
  damagedAssets: number;
  totalAssetPrice: number;
  inventoryCount: number;
  totalItemQty: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface ExecutiveAlertsSummary {
  totalCount: number;
  stockAlertsCount: number;
  pendingRepairsCount: number;
  damagedAssetsCount: number;
  pendingRepairs: Repair[];
  damagedAssets: Asset[];
}

export interface AppData {
  total: number;
  active: number;
  repairing: number;
  available: number;
  disposed: number;
  inventoryCount: number;
  lowStock: number;
  assets: Asset[];
  repairs: Repair[];
  inventory: InventoryItem[];
  stockTransactions: StockTransaction[];
  departments: Department[];
  locations: Location[];
  users: Array<{
    userId: string;
    username: string;
    fullName: string;
    role: string;
    department?: string;
    active: boolean;
  }>;
  logs: ActivityLog[];
  alerts: StockAlert[];
  departmentStats: DepartmentSummary[];
  executiveAlerts: ExecutiveAlertsSummary;
}

export interface SystemSettings {
  appName: string;
  appSubName: string;
  appLogo: string;
}
