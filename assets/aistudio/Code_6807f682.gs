/**
 * ระบบบริหารจัดการครุภัณฑ์โรงพยาบาล
 * Google Apps Script + Google Sheets
 *
 * วิธีติดตั้ง:
 * 1) สร้าง Apps Script project และสร้างไฟล์ Code.gs กับ Index.html
 * 2) วางโค้ดแต่ละไฟล์ให้ตรงกัน
 * 3) เลือกฟังก์ชัน setupSystem แล้วกด Run และอนุญาตสิทธิ์
 * 4) Deploy > New deployment > Web app
 *    Execute as: Me | Who has access: ตามนโยบายหน่วยงาน
 *
 * บัญชีเริ่มต้น: admin / Admin@12345
 * เข้าระบบแล้วให้สร้างบัญชีผู้ใช้ส่วนบุคคลและเปลี่ยนรหัสผ่านเริ่มต้นทันที
 */

const APP = {
  NAME: 'ระบบบริหารจัดการครุภัณฑ์โรงพยาบาล',
  SESSION_SECONDS: 21600,
  SHEETS: {
    ASSETS: 'Assets',
    USERS: 'Users',
    REPAIRS: 'Repairs',
    DEPARTMENTS: 'Departments',
    LOGS: 'ActivityLogs',
    INVENTORY: 'InventoryItems',
    STOCK: 'StockTransactions'
  }
};

var REQUEST_ROWS_CACHE = {};

const HEADERS = {
  Assets: ['AssetID','AssetCode','AssetName','Category','Brand','Model','SerialNo','Department','Location','BudgetYear','PurchaseDate','Price','Status','Condition','Responsible','Note','CreatedAt','UpdatedAt'],
  Users: ['UserID','Username','PasswordHash','Salt','FullName','Role','Department','Active','CreatedAt'],
  Repairs: ['RepairID','AssetID','AssetCode','AssetName','ReportDate','Problem','Reporter','Status','Technician','RepairDate','Cost','Result','UpdatedAt'],
  Departments: ['DepartmentID','DepartmentName','CreatedAt'],
  Locations: ['LocationID','LocationName','CreatedAt'],
  ActivityLogs: ['LogID','Timestamp','Username','Action','Detail'],
  InventoryItems: ['ItemID','ItemCode','ItemName','Category','Unit','Department','Quantity','MinQuantity','UnitPrice','Location','Note','CreatedAt','UpdatedAt'],
  StockTransactions: ['TransactionID','Timestamp','ItemID','ItemCode','ItemName','TransactionType','Quantity','Unit','Department','ReferenceNo','Note','Username']
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP.NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('กรุณาเปิด Apps Script จาก Google Sheets หรือกำหนด Spreadsheet ID ในโค้ด');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ensureSchema_(ss);
  REQUEST_ROWS_CACHE = {};

  const userSheet = ss.getSheetByName(APP.SHEETS.USERS);
  if (userSheet.getLastRow() < 2) {
    const salt = Utilities.getUuid();
    userSheet.appendRow([
      Utilities.getUuid(), 'admin', hashPassword_('Admin@12345', salt), salt,
      'ผู้ดูแลระบบ', 'admin', '', true, new Date()
    ]);
  }

  const deptSheet = ss.getSheetByName(APP.SHEETS.DEPARTMENTS);
  if (deptSheet.getLastRow() < 2) {
    const defaults = ['งานบริหารทั่วไป','กลุ่มงานการพยาบาล','กลุ่มงานบริการด้านปฐมภูมิและองค์รวม','กลุ่มงานเทคนิคการแพทย์','กลุ่มงานเภสัชกรรม','กลุ่มงานทันตกรรม','กลุ่มงานรังสีวิทยา','กลุ่มงานแพทย์'];
    const rows = defaults.map(n => [Utilities.getUuid(), n, new Date()]);
    deptSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  if (sheet_('Locations').getLastRow() < 2) { const defaults = ['คลังพัสดุกลาง','อาคารผู้ป่วยนอก','อาคารผู้ป่วยใน','ห้องฉุกเฉิน','ห้องยา','ห้องปฏิบัติการ']; sheet_('Locations').getRange(2,1,defaults.length,3).setValues(defaults.map(n=>[Utilities.getUuid(),n,new Date()])); }
  REQUEST_ROWS_CACHE = {};
  return 'ตรวจสอบและสร้างชีต/หัวตารางเรียบร้อยแล้ว';
}

/** สร้างชีตและหัวตารางให้ครบ โดยรักษาข้อมูลเดิมและจัดคอลัมน์ตาม schema */
function ensureSchema_(ss) {
  Object.keys(HEADERS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const expected = HEADERS[name];
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    if (lastRow === 0 || lastCol === 0) {
      sh.getRange(1, 1, 1, expected.length).setValues([expected]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, expected.length).setFontWeight('bold').setBackground('#e8f1ff');
      return;
    }

    const oldHeader = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(v => String(v).trim());
    const hasKnownHeader = oldHeader.some(h => expected.indexOf(h) >= 0);
    if (!hasKnownHeader) {
      // ชีตมีข้อมูลแต่ไม่มีหัวตาราง: แทรกแถวใหม่ด้านบน ไม่เขียนทับข้อมูลเดิม
      sh.insertRowBefore(1);
      sh.getRange(1, 1, 1, expected.length).setValues([expected]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, expected.length).setFontWeight('bold').setBackground('#e8f1ff');
      return;
    }

    const extras = oldHeader.filter(h => h && expected.indexOf(h) < 0);
    const finalHeader = expected.concat(extras);
    const needsReorder = finalHeader.length !== oldHeader.length || finalHeader.some((h, i) => oldHeader[i] !== h);
    if (needsReorder) {
      const oldData = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
      const oldIndex = {};
      oldHeader.forEach((h, i) => { if (h && oldIndex[h] === undefined) oldIndex[h] = i; });
      const migrated = oldData.map(row => finalHeader.map(h => oldIndex[h] === undefined ? '' : row[oldIndex[h]]));
      sh.clearContents();
      sh.getRange(1, 1, 1, finalHeader.length).setValues([finalHeader]);
      if (migrated.length) sh.getRange(2, 1, migrated.length, finalHeader.length).setValues(migrated);
    }
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, finalHeader.length).setFontWeight('bold').setBackground('#e8f1ff');
  });
  CacheService.getScriptCache().put('schema_ok_' + ss.getId(), '1', 21600);
}

function getDb_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('ยังไม่ได้ตั้งค่าฐานข้อมูล กรุณารัน setupSystem()');
  const cache = CacheService.getScriptCache();
  const schemaKey = 'schema_ok_' + ss.getId();
  if (cache.get(schemaKey) !== '1') ensureSchema_(ss);
  return ss;
}
function sheet_(name) {
  const sh = getDb_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบชีต ' + name + ' กรุณารัน setupSystem()');
  return sh;
}
function rows_(name) {
  if (Object.prototype.hasOwnProperty.call(REQUEST_ROWS_CACHE, name)) return REQUEST_ROWS_CACHE[name];
  const sh = sheet_(name);
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return (REQUEST_ROWS_CACHE[name] = []);
  // อ่านเฉพาะช่วงที่มีข้อมูลจริง แทน getDataRange() ที่อาจครอบคลุมเซลล์ format เกินจำเป็น
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(v => String(v).trim());
  const result = values.slice(1).filter(r => r.some(v => v !== '' && v !== null)).map(r => {
    const o = {};
    headers.forEach((h, i) => { if (h) o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
  REQUEST_ROWS_CACHE[name] = result;
  return result;
}
function invalidateRowsCache_() { REQUEST_ROWS_CACHE = {}; }

function hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + String(password), Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function safeUser_(u) {
  return {userId:u.UserID, username:u.Username, fullName:u.FullName, role:u.Role, department:u.Department || ''};
}
function login(username, password) {
  username = String(username || '').trim();
  password = String(password || '');
  if (!username || !password) throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
  const user = rows_('Users').find(u => String(u.Username).toLowerCase() === username.toLowerCase() && String(u.Active) !== 'false');
  if (!user || hashPassword_(password, user.Salt) !== user.PasswordHash) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(safeUser_(user)), APP.SESSION_SECONDS);
  log_ (user.Username, 'LOGIN', 'เข้าสู่ระบบ');
  return {token, user:safeUser_(user), data:getAppData(token).data};
}
function auth_(token) {
  if (!token) throw new Error('กรุณาเข้าสู่ระบบใหม่');
  const raw = CacheService.getScriptCache().get('sess_' + token);
  if (!raw) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  return JSON.parse(raw);
}
function logout(token) {
  const u = auth_(token);
  CacheService.getScriptCache().remove('sess_' + token);
  log_(u.username, 'LOGOUT', 'ออกจากระบบ');
  return true;
}
function changePassword(token, oldPass, newPass) {
  const u = auth_(token);
  if (String(newPass || '').length < 8) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
  const sh = sheet_('Users'), data = sh.getDataRange().getValues(), h = data[0];
  const ix = Object.fromEntries(h.map((x,i)=>[x,i]));
  const row = data.findIndex((r,i)=>i>0 && r[ix.Username] === u.username);
  if (row < 1) throw new Error('ไม่พบผู้ใช้');
  if (hashPassword_(oldPass, data[row][ix.Salt]) !== data[row][ix.PasswordHash]) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  const salt = Utilities.getUuid();
  sh.getRange(row+1,ix.Salt+1).setValue(salt);
  sh.getRange(row+1,ix.PasswordHash+1).setValue(hashPassword_(newPass,salt));
  log_(u.username,'CHANGE_PASSWORD','เปลี่ยนรหัสผ่าน');
  return true;
}
function requireAdmin_(u) { if (u.role !== 'admin') throw new Error('ไม่มีสิทธิ์ดำเนินการ (เฉพาะผู้ดูแลระบบ)'); }
function log_(username, action, detail) {
  sheet_('ActivityLogs').appendRow([Utilities.getUuid(), new Date(), username, action, detail]);
  invalidateRowsCache_();
}
function getDashboardData_(user) {
  const assets = rows_('Assets');
  const repairs = rows_('Repairs');
  const inventory = rows_('InventoryItems');
  const active = assets.filter(a => a.Status === 'ใช้งาน').length;
  return {
    total:assets.length, active, repairing:assets.filter(a=>a.Status==='ส่งซ่อม').length,
    available:assets.filter(a=>a.Status==='ว่าง').length,
    disposed:assets.filter(a=>a.Status==='จำหน่าย').length,
    inventoryCount:inventory.length, lowStock:inventory.filter(i=>Number(i.MinQuantity||0)>0 && Number(i.Quantity||0)<=Number(i.MinQuantity||0)).length,
    alerts:getStockAlerts_(user),
    assets:assets.slice().reverse().slice(0,8),
    repairs:repairs.slice().reverse().slice(0,6),
    departments:rows_('Departments')
  };
}
function getAppData(token) {
  const u = auth_(token);
  const data = getDashboardData_(u);
  data.assets = rows_('Assets').reverse();
  data.repairs = rows_('Repairs').reverse();
  data.departments = rows_('Departments');
  data.locations = rows_('Locations');
  data.inventory = rows_('InventoryItems').reverse();
  data.stockTransactions = rows_('StockTransactions').reverse().slice(0,500);
  data.alerts = getStockAlerts_(u);
  data.users = u.role === 'admin' ? rows_('Users').map(x=>({userId:x.UserID,username:x.Username,fullName:x.FullName,role:x.Role,department:x.Department,active:x.Active})) : [];
  data.logs = u.role === 'admin' ? rows_('ActivityLogs').reverse().slice(0,100) : [];
  data.departmentStats = getDepartmentSummary_(data.assets, data.inventory, data.departments);
  data.executiveAlerts = getExecutiveAlertsSummary_(u, data.assets, data.repairs, data.inventory, data.alerts);
  return {user:u, data};
}
function saveAsset(token, asset) {
  const u = auth_(token); asset = asset || {};
  if (!asset.AssetCode || !asset.AssetName) throw new Error('กรุณาระบุรหัสและชื่อครุภัณฑ์');
  const sh = sheet_('Assets'), all = rows_('Assets');
  const duplicate = all.find(a => a.AssetCode === String(asset.AssetCode).trim() && a.AssetID !== asset.AssetID);
  if (duplicate) throw new Error('รหัสครุภัณฑ์นี้มีอยู่แล้ว');
  const now = new Date();
  const fields = HEADERS.Assets;
  const values = fields.map(k => {
    if (k === 'AssetID') return asset.AssetID || Utilities.getUuid();
    if (k === 'CreatedAt') return asset.CreatedAt || now;
    if (k === 'UpdatedAt') return now;
    return asset[k] === undefined ? '' : asset[k];
  });
  const found = all.findIndex(a=>a.AssetID===asset.AssetID);
  if (found >= 0) sh.getRange(found+2,1,1,fields.length).setValues([values]);
  else sh.appendRow(values);
  log_(u.username, found>=0?'UPDATE_ASSET':'CREATE_ASSET', asset.AssetCode);
  return getAppData(token);
}
function deleteAsset(token, assetId) {
  const u=auth_(token); requireAdmin_(u);
  const sh=sheet_('Assets'), all=rows_('Assets'), i=all.findIndex(a=>a.AssetID===assetId);
  if(i<0) throw new Error('ไม่พบครุภัณฑ์');
  sh.deleteRow(i+2); log_(u.username,'DELETE_ASSET',assetId);
  return getAppData(token);
}
function saveRepair(token, item) {
  const u=auth_(token); item=item||{};
  if(!item.AssetID || !item.Problem) throw new Error('กรุณาเลือกครุภัณฑ์และระบุอาการเสีย');
  const asset=rows_('Assets').find(a=>a.AssetID===item.AssetID);
  if(!asset) throw new Error('ไม่พบครุภัณฑ์ที่เลือก');
  const sh=sheet_('Repairs'), all=rows_('Repairs'), now=new Date();
  const id=item.RepairID || Utilities.getUuid();
  const vals=HEADERS.Repairs.map(k=>{
    const map={AssetID:asset.AssetID,AssetCode:asset.AssetCode,AssetName:asset.AssetName,ReportDate:item.ReportDate||now,Reporter:item.Reporter||u.fullName,Status:item.Status||'รอดำเนินการ',UpdatedAt:now};
    return k==='RepairID'?id:(map[k]!==undefined?map[k]:(item[k]===undefined?'':item[k]));
  });
  const idx=all.findIndex(x=>x.RepairID===id);
  if(idx>=0) sh.getRange(idx+2,1,1,vals.length).setValues([vals]); else sh.appendRow(vals);
  if(item.Status==='กำลังซ่อม') updateAssetStatus_(asset.AssetID,'ส่งซ่อม');
  else if(item.Status==='ซ่อมเสร็จ') updateAssetStatus_(asset.AssetID,'ใช้งาน');
  log_(u.username,'SAVE_REPAIR',asset.AssetCode+' '+item.Status);
  return getAppData(token);
}
function updateAssetStatus_(id,status) {
  const sh=sheet_('Assets'), all=rows_('Assets'), i=all.findIndex(a=>a.AssetID===id);
  if(i>=0) { const col=HEADERS.Assets.indexOf('Status')+1; sh.getRange(i+2,col).setValue(status); sh.getRange(i+2,HEADERS.Assets.indexOf('UpdatedAt')+1).setValue(new Date()); }
}
function addDepartment(token,name) {
  const u=auth_(token); requireAdmin_(u); name=String(name||'').trim();
  if(!name) throw new Error('กรุณาระบุชื่อหน่วยงาน');
  if(rows_('Departments').some(d=>d.DepartmentName===name)) throw new Error('มีหน่วยงานนี้แล้ว');
  sheet_('Departments').appendRow([Utilities.getUuid(),name,new Date()]); invalidateRowsCache_();
  log_(u.username,'ADD_DEPARTMENT',name); return getAppData(token);
}

function deleteDepartment(token, id) {
  const u=auth_(token); requireAdmin_(u);
  const sh=sheet_('Departments'), all=rows_('Departments'), i=all.findIndex(x=>x.DepartmentID===id);
  if(i<0) throw new Error('ไม่พบหน่วยงาน');
  const name=all[i].DepartmentName;
  const used=rows_('Assets').some(x=>x.Department===name) || rows_('InventoryItems').some(x=>x.Department===name) || rows_('Users').some(x=>x.Department===name);
  if(used) throw new Error('ไม่สามารถลบได้ เนื่องจากมีข้อมูลใช้งานหน่วยงานนี้อยู่');
  sh.deleteRow(i+2); invalidateRowsCache_('Departments'); log_(u.username,'DELETE_DEPARTMENT',name); return getAppData(token);
}
function addLocation(token, name) {
  const u=auth_(token); requireAdmin_(u); name=String(name||'').trim();
  if(!name) throw new Error('กรุณาระบุชื่อสถานที่');
  if(rows_('Locations').some(x=>x.LocationName.toLowerCase()===name.toLowerCase())) throw new Error('มีสถานที่นี้แล้ว');
  sheet_('Locations').appendRow([Utilities.getUuid(),name,new Date()]); invalidateRowsCache_('Locations'); log_(u.username,'ADD_LOCATION',name); return getAppData(token);
}
function deleteLocation(token, id) {
  const u=auth_(token); requireAdmin_(u);
  const sh=sheet_('Locations'), all=rows_('Locations'), i=all.findIndex(x=>x.LocationID===id);
  if(i<0) throw new Error('ไม่พบสถานที่');
  const name=all[i].LocationName;
  if(rows_('Assets').some(x=>x.Location===name) || rows_('InventoryItems').some(x=>x.Location===name)) throw new Error('ไม่สามารถลบได้ เนื่องจากมีครุภัณฑ์หรือวัสดุใช้สถานที่นี้อยู่');
  sh.deleteRow(i+2); invalidateRowsCache_('Locations'); log_(u.username,'DELETE_LOCATION',name); return getAppData(token);
}
function importAssetsFromExcel(token, records) {
  const u=auth_(token); requireAdmin_(u);
  if(!Array.isArray(records) || !records.length) throw new Error('ไม่พบข้อมูลในไฟล์ Excel');
  if(records.length>2000) throw new Error('นำเข้าได้ไม่เกิน 2,000 รายการต่อครั้ง');
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh=sheet_('Assets'), all=rows_('Assets'), map={};
    all.forEach((a,i)=>map[String(a.AssetCode).trim().toLowerCase()]=i);
    const fields=HEADERS.Assets, now=new Date(), toAppend=[], toUpdate=[];
    let inserted=0, updated=0, skipped=0;
    const seen={};
    records.forEach(r=>{
      const code=String(r.AssetCode||r['รหัสครุภัณฑ์']||r['รหัส']||'').trim();
      const name=String(r.AssetName||r['ชื่อครุภัณฑ์']||r['ชื่อรายการ']||'').trim();
      if(!code||!name){skipped++;return;}
      const key=code.toLowerCase();
      if(seen[key]){skipped++;return;} seen[key]=true;
      const found=map[key];
      const old=found===undefined?null:all[found];
      const obj={...r,AssetCode:code,AssetName:name};
      const vals=fields.map(k=> k==='AssetID'?(old?old.AssetID:Utilities.getUuid()):k==='CreatedAt'?(old?old.CreatedAt:now):k==='UpdatedAt'?now:(obj[k]!==undefined?obj[k]:(old?old[k]||'':'')));
      if(old){toUpdate.push({row:found+2,values:vals});updated++;}
      else{toAppend.push(vals);map[key]=all.length+toAppend.length-1;inserted++;}
    });
    toUpdate.forEach(x=>sh.getRange(x.row,1,1,fields.length).setValues([x.values]));
    if(toAppend.length) sh.getRange(sh.getLastRow()+1,1,toAppend.length,fields.length).setValues(toAppend);
    invalidateRowsCache_('Assets'); log_(u.username,'IMPORT_ASSETS_EXCEL',`เพิ่ม ${inserted}, ปรับปรุง ${updated}, ข้าม ${skipped}`);
    return {inserted,updated,skipped,data:getAppData(token)};
  } finally {lock.releaseLock();}
}

function addUser(token, user) {
  const u=auth_(token); requireAdmin_(u); user=user||{};
  if(!user.username||!user.password||!user.fullName) throw new Error('กรุณากรอกชื่อผู้ใช้ รหัสผ่าน และชื่อ-นามสกุล');
  if(String(user.password).length<8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  if(rows_('Users').some(x=>String(x.Username).toLowerCase()===String(user.username).toLowerCase())) throw new Error('ชื่อผู้ใช้นี้มีแล้ว');
  const salt=Utilities.getUuid();
  const allowedRoles = ['admin','director','head','staff'];
  const role = allowedRoles.includes(user.role) ? user.role : 'staff';
  sheet_('Users').appendRow([Utilities.getUuid(),String(user.username).trim(),hashPassword_(user.password,salt),salt,user.fullName,role,user.department||'',true,new Date()]);
  log_(u.username,'ADD_USER',user.username); return getAppData(token);
}
function setUserActive(token,userId,active) {
  const u=auth_(token); requireAdmin_(u);
  const sh=sheet_('Users'), all=rows_('Users'), i=all.findIndex(x=>x.UserID===userId);
  if(i<0) throw new Error('ไม่พบผู้ใช้');
  if(all[i].Username===u.username && !active) throw new Error('ไม่สามารถปิดใช้งานบัญชีตนเองได้');
  sh.getRange(i+2,8).setValue(!!active);
  log_(u.username,'SET_USER_ACTIVE',all[i].Username+' '+active);
  return getAppData(token);
}


/* ---------------- คลังวัสดุและระบบตัดสต็อก ---------------- */
function saveInventoryItem(token, item) {
  const u = auth_(token); item = item || {};
  if (!item.ItemCode || !item.ItemName || !item.Unit) throw new Error('กรุณาระบุรหัส ชื่อวัสดุ และหน่วยนับ');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = sheet_('InventoryItems'), all = rows_('InventoryItems');
    const duplicate = all.find(x => String(x.ItemCode).toLowerCase() === String(item.ItemCode).trim().toLowerCase() && x.ItemID !== item.ItemID);
    if (duplicate) throw new Error('รหัสวัสดุนี้มีอยู่แล้ว');
    const now = new Date(), fields = HEADERS.InventoryItems;
    const found = all.findIndex(x => x.ItemID === item.ItemID);
    // จำนวนคงเหลือปรับผ่านรายการรับเข้า/ปรับยอดเท่านั้น เพื่อรักษาประวัติสต็อก
    const existingQty = found >= 0 ? Number(all[found].Quantity || 0) : 0;
    const values = fields.map(k => {
      if (k === 'ItemID') return item.ItemID || Utilities.getUuid();
      if (k === 'Quantity') return existingQty;
      if (k === 'CreatedAt') return found >= 0 ? all[found].CreatedAt : now;
      if (k === 'UpdatedAt') return now;
      return item[k] === undefined ? (found >= 0 ? all[found][k] : '') : item[k];
    });
    if (found >= 0) sh.getRange(found + 2, 1, 1, fields.length).setValues([values]);
    else sh.appendRow(values);
    log_(u.username, found >= 0 ? 'UPDATE_INVENTORY_ITEM' : 'CREATE_INVENTORY_ITEM', item.ItemCode);
  } finally { lock.releaseLock(); }
  return getAppData(token);
}

function postStockTransaction(token, tx) {
  const u = auth_(token); tx = tx || {};
  const qty = Number(tx.Quantity);
  if (!tx.ItemID || !['รับเข้า','เบิกจ่าย','ปรับเพิ่ม','ปรับลด'].includes(tx.TransactionType) || !Number.isFinite(qty) || qty <= 0) {
    throw new Error('กรุณาระบุวัสดุ ประเภทรายการ และจำนวนที่มากกว่า 0');
  }
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const items = rows_('InventoryItems'), idx = items.findIndex(x => x.ItemID === tx.ItemID);
    if (idx < 0) throw new Error('ไม่พบรายการวัสดุ');
    const item = items[idx], current = Number(item.Quantity || 0);
    const isOut = tx.TransactionType === 'เบิกจ่าย' || tx.TransactionType === 'ปรับลด';
    if (isOut && qty > current) throw new Error('จำนวนคงเหลือไม่เพียงพอ (คงเหลือ ' + current + ' ' + item.Unit + ')');
    const next = isOut ? current - qty : current + qty;
    const itemSheet = sheet_('InventoryItems');
    const qtyCol = HEADERS.InventoryItems.indexOf('Quantity') + 1;
    const updateCol = HEADERS.InventoryItems.indexOf('UpdatedAt') + 1;
    itemSheet.getRange(idx + 2, qtyCol).setValue(next);
    itemSheet.getRange(idx + 2, updateCol).setValue(new Date());
    sheet_('StockTransactions').appendRow([
      Utilities.getUuid(), new Date(), item.ItemID, item.ItemCode, item.ItemName,
      tx.TransactionType, qty, item.Unit, tx.Department || u.department || '',
      tx.ReferenceNo || '', tx.Note || '', u.username
    ]);
    log_(u.username, 'STOCK_' + tx.TransactionType, item.ItemCode + ' จำนวน ' + qty + ' ' + item.Unit);
  } finally { lock.releaseLock(); }
  return getAppData(token);
}

/**
 * วิเคราะห์วัสดุจากประวัติการเบิก/ปรับลด 90 วันล่าสุด
 * ใช้ค่าที่สูงกว่าระหว่างยอดใช้เฉลี่ย 90 วันต่อเดือน กับยอดใช้ 30 วันล่าสุดคูณ 3
 * แล้วเผื่อสำรอง 10% และหักยอดคงเหลือปัจจุบัน
 * ผู้มีสิทธิ์ head เห็นเฉพาะหน่วยงานตนเอง; director/admin เห็นทุกหน่วยงาน
 */
function getStockAlerts_(user) {
  const items = rows_('InventoryItems');
  const txs = rows_('StockTransactions');
  const now = new Date();
  const cutoff90 = new Date(now.getTime() - 90 * 86400000);
  const cutoff30 = new Date(now.getTime() - 30 * 86400000);
  const grouped = {};
  txs.forEach(t => {
    if (t.TransactionType !== 'เบิกจ่าย' && t.TransactionType !== 'ปรับลด') return;
    const dt = new Date(t.Timestamp);
    if (dt < cutoff90) return;
    (grouped[t.ItemID] = grouped[t.ItemID] || []).push({ qty:Number(t.Quantity || 0), date:dt });
  });
  const visible = items.filter(item => {
    if (user && (user.role || user.Role) === 'head') return String(item.Department || '') === String(user.department || user.Department || '');
    return true;
  });
  return visible.map(item => {
    const history = grouped[item.ItemID] || [];
    const recent90 = history;
    const recent30 = history.filter(t => t.date >= cutoff30);
    const used90 = recent90.reduce((n,t)=>n+t.qty,0);
    const used30 = recent30.reduce((n,t)=>n+t.qty,0);
    const hasHistory = recent90.length > 0;
    const avg90Monthly = used90 / 3;
    const recentMonthly = used30;
    const forecastMonthly = hasHistory ? Math.max(avg90Monthly, recentMonthly) : null;
    const reserveTarget = forecastMonthly === null ? null : Math.ceil(forecastMonthly * 1.10);
    const current = Number(item.Quantity || 0);
    const recommended = reserveTarget === null ? null : Math.max(0, reserveTarget - current);
    let status = 'ปกติ';
    if (current <= 0) status = 'หมดคลัง';
    else if (Number(item.MinQuantity || 0) > 0 && current <= Number(item.MinQuantity || 0)) status = 'ใกล้หมด';
    else if (recommended > 0) status = 'ควรเตรียมเบิก';
    if (!hasHistory && current > 0 && Number(item.MinQuantity || 0) > 0 && current <= Number(item.MinQuantity || 0)) status = 'ใกล้หมด / ไม่มีประวัติ';
    return {
      ItemID:item.ItemID, ItemCode:item.ItemCode, ItemName:item.ItemName,
      Department:item.Department || 'ไม่ระบุหน่วยงาน', Unit:item.Unit,
      Quantity:current, MinQuantity:Number(item.MinQuantity||0),
      UsedLast90Days:used90, UsedLast30Days:used30,
      ForecastMonthly:forecastMonthly, RecommendedQuantity:recommended,
      Status:status, HasHistory:hasHistory
    };
  }).filter(x => x.Status !== 'ปกติ' || (x.RecommendedQuantity !== null && x.RecommendedQuantity > 0));
}

function getStockAlerts(token) {
  const u = auth_(token);
  return getStockAlerts_(u);
}

function getStockReport(token, fromDate, toDate) {
  const user = auth_(token);
  const items = rows_('InventoryItems');
  const transactions = rows_('StockTransactions').filter(t => {
    const d = String(t.Timestamp || '').slice(0, 10);
    return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  });
  const incoming = transactions.filter(t => t.TransactionType === 'รับเข้า' || t.TransactionType === 'ปรับเพิ่ม');
  const outgoing = transactions.filter(t => t.TransactionType === 'เบิกจ่าย' || t.TransactionType === 'ปรับลด');
  const sum = arr => arr.reduce((n, x) => n + Number(x.Quantity || 0), 0);
  return {
    itemCount: items.length,
    totalQuantity: items.reduce((n, x) => n + Number(x.Quantity || 0), 0),
    lowStock: items.filter(x => Number(x.MinQuantity || 0) > 0 && Number(x.Quantity || 0) <= Number(x.MinQuantity || 0)),
    alerts: getStockAlerts_(user),
    incomingQuantity: sum(incoming),
    outgoingQuantity: sum(outgoing),
    incomingCount: incoming.length,
    outgoingCount: outgoing.length,
    transactions: transactions.reverse(),
    items: items
  };
}

/**
 * สรุปจำนวนครุภัณฑ์และวัสดุแยกตามแต่ละแผนก เพื่อการจัดสรร
 */
function getDepartmentSummary_(assets, inventory, departments) {
  departments = departments || rows_('Departments');
  assets = assets || rows_('Assets');
  inventory = inventory || rows_('InventoryItems');

  return departments.map(d => {
    const name = String(d.DepartmentName || '').trim();
    const deptAssets = assets.filter(a => String(a.Department || '').trim() === name);
    const deptItems = inventory.filter(i => String(i.Department || '').trim() === name);

    const activeAssets = deptAssets.filter(a => a.Status === 'ใช้งาน').length;
    const repairingAssets = deptAssets.filter(a => a.Status === 'ส่งซ่อม').length;
    const availableAssets = deptAssets.filter(a => a.Status === 'ว่าง').length;
    const disposedAssets = deptAssets.filter(a => a.Status === 'จำหน่าย').length;
    const damagedAssets = deptAssets.filter(a => a.Condition === 'ชำรุด' || a.Condition === 'เสื่อมสภาพ' || a.Condition === 'รอตรวจสอบ').length;
    const totalAssetPrice = deptAssets.reduce((sum, a) => sum + (Number(a.Price) || 0), 0);

    const lowStockItems = deptItems.filter(i => Number(i.MinQuantity || 0) > 0 && Number(i.Quantity || 0) <= Number(i.MinQuantity || 0)).length;
    const outOfStockItems = deptItems.filter(i => Number(i.Quantity || 0) <= 0).length;
    const totalItemQty = deptItems.reduce((sum, i) => sum + (Number(i.Quantity) || 0), 0);

    return {
      departmentId: d.DepartmentID,
      departmentName: name,
      assetCount: deptAssets.length,
      activeAssets,
      repairingAssets,
      availableAssets,
      disposedAssets,
      damagedAssets,
      totalAssetPrice,
      inventoryCount: deptItems.length,
      totalItemQty,
      lowStockItems,
      outOfStockItems
    };
  });
}

/**
 * รวบรวมรายการแจ้งเตือนสำหรับผู้บริหารภายในเว็บแอป
 */
function getExecutiveAlertsSummary_(user, assets, repairs, inventory, stockAlerts) {
  assets = assets || rows_('Assets');
  repairs = repairs || rows_('Repairs');
  inventory = inventory || rows_('InventoryItems');
  stockAlerts = stockAlerts || getStockAlerts_(user);

  const isHead = user && (user.role || user.Role) === 'head';
  const userDept = String((user && (user.department || user.Department)) || '').trim();

  // งานซ่อมที่ยังรอดำเนินการหรือกำลังซ่อม
  const pendingRepairs = repairs.filter(r => {
    const status = String(r.Status || '');
    if (status !== 'รอดำเนินการ' && status !== 'กำลังซ่อม') return false;
    if (isHead && userDept) {
      const a = assets.find(x => x.AssetID === r.AssetID || x.AssetCode === r.AssetCode);
      if (a && String(a.Department || '').trim() !== userDept) return false;
    }
    return true;
  });

  // ครุภัณฑ์ที่สภาพชำรุด / เสื่อมสภาพ
  const damagedAssets = assets.filter(a => {
    const cond = String(a.Condition || '');
    if (cond !== 'ชำรุด' && cond !== 'เสื่อมสภาพ' && cond !== 'รอตรวจสอบ') return false;
    if (isHead && userDept && String(a.Department || '').trim() !== userDept) return false;
    return true;
  });

  const totalCount = (stockAlerts || []).length + pendingRepairs.length + damagedAssets.length;

  return {
    totalCount,
    stockAlertsCount: (stockAlerts || []).length,
    pendingRepairsCount: pendingRepairs.length,
    damagedAssetsCount: damagedAssets.length,
    pendingRepairs: pendingRepairs.slice(0, 50),
    damagedAssets: damagedAssets.slice(0, 50)
  };
}

/**
 * จัดสรรครุภัณฑ์ (ย้ายแผนก / สถานที่ / ผู้รับผิดชอบ)
 */
function reallocateAsset(token, payload) {
  const u = auth_(token);
  payload = payload || {};
  const assetId = payload.AssetID;
  if (!assetId) throw new Error('กรุณาระบุรหัสครุภัณฑ์');
  const sh = sheet_('Assets'), all = rows_('Assets');
  const idx = all.findIndex(a => a.AssetID === assetId);
  if (idx < 0) throw new Error('ไม่พบครุภัณฑ์ที่ระบุ');

  const old = all[idx];
  const fields = HEADERS.Assets;
  const targetDept = payload.Department !== undefined && payload.Department !== '' ? String(payload.Department).trim() : old.Department;
  const targetLoc = payload.Location !== undefined && payload.Location !== '' ? String(payload.Location).trim() : old.Location;
  const targetResp = payload.Responsible !== undefined ? String(payload.Responsible).trim() : old.Responsible;
  const newNote = payload.Note ? String(payload.Note).trim() : '';
  const combinedNote = newNote ? (old.Note ? old.Note + ' | จัดสรร: ' + newNote : 'จัดสรร: ' + newNote) : old.Note;

  const deptCol = fields.indexOf('Department') + 1;
  const locCol = fields.indexOf('Location') + 1;
  const respCol = fields.indexOf('Responsible') + 1;
  const noteCol = fields.indexOf('Note') + 1;
  const updateCol = fields.indexOf('UpdatedAt') + 1;

  if (targetDept) sh.getRange(idx + 2, deptCol).setValue(targetDept);
  if (targetLoc) sh.getRange(idx + 2, locCol).setValue(targetLoc);
  if (targetResp) sh.getRange(idx + 2, respCol).setValue(targetResp);
  if (combinedNote) sh.getRange(idx + 2, noteCol).setValue(combinedNote);
  sh.getRange(idx + 2, updateCol).setValue(new Date());

  invalidateRowsCache_('Assets');
  log_(u.username, 'REALLOCATE_ASSET', `${old.AssetCode} จัดสรรไป: แผนก ${targetDept} (${targetLoc}) ผู้รับผิดชอบ: ${targetResp}`);
  return getAppData(token);
}
