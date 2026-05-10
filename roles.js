/**
 * roles.js — 動態矩陣權限設定檔 (升級版)
 * ==========================================
 * 此版本改用 Firebase 儲存的 permissions 物件進行精細化管理。
 * 不再使用寫死的 manager / staff，改採 admin 與 custom(自定義) 雙軌制。
 * ==========================================
 */
window.ROLES_CONFIG = {
  roleLabels: {
    admin:   '超級管理員',
    custom:  '專案成員',
    viewer:  '未開通人員' // 剛註冊時的預設狀態
  },
  defaultRole: 'viewer'
};

/* ── 核心對照表：將頁面網址與按鈕前綴，對應到 Firebase 裡的模組 ID ── */
const MODULE_MAP = {
  // 網頁檔名對應
  'index': 'quotes',       // 報價單
  'project': 'projects',   // 專案進度
  'cost': 'costs',         // 成本計算
  'inventory': 'inventory',// 器材庫存
  'contacts': 'contacts',  // 客戶廠商
  
  // 管理員專屬頁面
  'admin': 'admin',
  'admin-roles': 'admin'
};

const PREFIX_MAP = {
  // data-role-section 前綴對應
  'quote': 'quotes',
  'project': 'projects',
  'cost': 'costs',
  'inventory': 'inventory',
  'contacts': 'contacts',
  'admin': 'admin'
};

/* ============================================================
   RoleGuard — 權限守門員
   ============================================================ */
window.RoleGuard = (function () {
  var KEY_ROLE  = 'rg_role';
  var KEY_UID   = 'rg_uid';
  var KEY_NAME  = 'rg_name';
  var KEY_PERMS = 'rg_perms'; // 新增：用來存取矩陣權限

  function getRole()     { return sessionStorage.getItem(KEY_ROLE) || window.ROLES_CONFIG.defaultRole; }
  function getUid()      { return sessionStorage.getItem(KEY_UID)  || ''; }
  function getUsername() { return sessionStorage.getItem(KEY_NAME) || ''; }
  function getPerms()    { 
    try { return JSON.parse(sessionStorage.getItem(KEY_PERMS) || '{}'); } 
    catch(e) { return {}; } 
  }

  // ★ 更新：寫入 Session 時需帶入權限矩陣
  function setSession(uid, role, displayName, permissions) {
    sessionStorage.setItem(KEY_ROLE, role);
    sessionStorage.setItem(KEY_UID,  uid);
    sessionStorage.setItem(KEY_NAME, displayName || '');
    sessionStorage.setItem(KEY_PERMS, JSON.stringify(permissions || {}));
  }

  function clearSession() {
    [KEY_ROLE, KEY_UID, KEY_NAME, KEY_PERMS].forEach(function(k){ sessionStorage.removeItem(k); });
  }

  function currentPage() {
    return (window.location.pathname.split('/').pop() || 'index').replace('.html', '');
  }

  /* 1. 頁面守衛：判斷能不能進入該 HTML */
  function guardPage() {
    var role = getRole();
    if (role === 'admin') return true;

    var page = currentPage();
    var modId = MODULE_MAP[page];
    var perms = getPerms();

    // 尚未開通、或是試圖進入 admin 頁面、或是該模組沒有 view 權限
    if (!modId || modId === 'admin' || !perms[modId] || !perms[modId].view) {
      
      // 尋找他可以去的第一個頁面，找不到就踢回登入頁
      var target = 'login.html';
      for (var key in perms) {
        if (perms[key].view) {
          // 反推頁面名稱
          var destPage = Object.keys(MODULE_MAP).find(k => MODULE_MAP[k] === key && k !== 'admin');
          if (destPage) { target = destPage + '.html'; break; }
        }
      }
      window.location.replace(target);
      return false;
    }
    return true;
  }

  /* 2. 導覽列守衛：隱藏不能去的 Tab */
  function applyNav() {
    var role = getRole();
    var perms = getPerms();

    document.querySelectorAll('.nav-tab[href]').forEach(function(tab){
      var page = tab.getAttribute('href').replace('.html', '');
      var modId = MODULE_MAP[page];
      
      var isAllowed = false;
      if (role === 'admin') {
        isAllowed = true;
      } else if (modId && modId !== 'admin' && perms[modId] && perms[modId].view) {
        isAllowed = true;
      }
      tab.style.display = isAllowed ? '' : 'none';
    });

    var badge = document.getElementById('role-badge');
    if (badge) badge.textContent = window.ROLES_CONFIG.roleLabels[role] || role;
    var nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = getUsername();
  }

  /* 3. 區塊守衛：按鈕與功能隱藏 (data-role-section) */
  function applySection() {
    var role = getRole();
    if (role === 'admin') {
      document.querySelectorAll('[data-role-section]').forEach(el => el.style.display = '');
      return;
    }

    var perms = getPerms();
    document.querySelectorAll('[data-role-section]').forEach(function(el){
      var keys = el.dataset.roleSection.split(',').map(s => s.trim());
      var isAllowed = false;
      
      keys.forEach(function(key) {
        // 解析例如 "quote-delete" -> prefix="quote", action="delete"
        var parts = key.split('-');
        var prefix = parts[0]; 
        var action = parts[1]; 
        
        // 將 add, export 等行為歸類 (新增算 edit)
        if (action === 'add') action = 'edit';
        if (action === 'export') action = 'view'; // 匯出報表允許只有檢視權限的人使用

        var modId = PREFIX_MAP[prefix];
        if (modId && perms[modId] && perms[modId][action]) {
          isAllowed = true;
        }
      });

      el.style.display = isAllowed ? '' : 'none';
    });
  }

  /* 4. 唯讀守衛：如果該頁面只有檢視權限，鎖定所有輸入框與未被標記的按鈕 */
  function applyReadonly() {
    var role = getRole();
    if (role === 'admin') return;

    var page = currentPage();
    var modId = MODULE_MAP[page];
    var perms = getPerms();

    // 如果目前模組沒有 edit 權限
    if (modId && perms[modId] && !perms[modId].edit) {
      document.querySelectorAll('input, textarea, select, [data-action]').forEach(function(el){
        // 避開頂部工具列與搜尋框
        if (el.closest('.topbar') || el.closest('.toolbar') || el.closest('.search-bar')) return;
        el.disabled = true;
        el.style.pointerEvents = 'none';
      });
      // 隱藏可能沒有綁定 data-role-section 的預設操作按鈕
      document.querySelectorAll('.btn').forEach(function(b){
        var txt = b.textContent || '';
        // 保留「登出、返回、搜尋」等無害按鈕
        if (b.closest('.topbar') || b.closest('.search-bar') || txt.includes('登出') || txt.includes('返回')) return;
        b.style.display = 'none';
      });
    }
  }

  function applyAll() {
    applyNav();
    applySection();
    applyReadonly();
  }

  return {
    getRole: getRole, getUid: getUid, getUsername: getUsername, getPerms: getPerms,
    setSession: setSession, clearSession: clearSession,
    currentPage: currentPage,
    guardPage: guardPage,
    applyNav: applyNav, applySection: applySection,
    applyReadonly: applyReadonly, applyAll: applyAll
  };
})();