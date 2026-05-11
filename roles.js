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
  defaultRole: 'viewer',

  // ★ 修正：補上 pageAccess，讓登入後能正確跳頁
  // admin 直接進 index；custom/viewer 沒有預設頁面（由 permissions 動態決定）
  pageAccess: {
    admin:  ['index'],
    custom: [],
    viewer: []
  }
};

/* ── 核心對照表：將頁面網址與按鈕前綴，對應到 Firebase 裡的模組 ID ── */
const MODULE_MAP = {
  // 網頁檔名對應
  'index':     'quotes',    // 報價單
  'project':   'projects',  // 專案進度
  'cost':      'costs',     // 成本計算
  'inventory': 'inventory', // 器材庫存
  'contacts':  'contacts',  // 客戶廠商

  // 管理員專屬頁面
  'admin':       'admin',
  'admin-roles': 'admin'
};

const PREFIX_MAP = {
  // data-role-section 前綴對應
  'quote':     'quotes',
  'project':   'projects',
  'cost':      'costs',
  'inventory': 'inventory',
  'contacts':  'contacts',
  'admin':     'admin'
};

/* ============================================================
   RoleGuard — 權限守門員
   ============================================================ */
window.RoleGuard = (function () {
  var KEY_ROLE  = 'rg_role';
  var KEY_UID   = 'rg_uid';
  var KEY_NAME  = 'rg_name';
  var KEY_PERMS = 'rg_perms';

  function getRole()     { return sessionStorage.getItem(KEY_ROLE) || window.ROLES_CONFIG.defaultRole; }
  function getUid()      { return sessionStorage.getItem(KEY_UID)  || ''; }
  function getUsername() { return sessionStorage.getItem(KEY_NAME) || ''; }
  function getPerms()    {
    try { return JSON.parse(sessionStorage.getItem(KEY_PERMS) || '{}'); }
    catch(e) { return {}; }
  }

  function setSession(uid, role, displayName, permissions) {
    sessionStorage.setItem(KEY_ROLE,  role);
    sessionStorage.setItem(KEY_UID,   uid);
    sessionStorage.setItem(KEY_NAME,  displayName || '');
    sessionStorage.setItem(KEY_PERMS, JSON.stringify(permissions || {}));
  }

  function clearSession() {
    [KEY_ROLE, KEY_UID, KEY_NAME, KEY_PERMS].forEach(function(k){ sessionStorage.removeItem(k); });
  }

  function currentPage() {
    return (window.location.pathname.split('/').pop() || 'index').replace('.html', '');
  }

  /* 1. 頁面守衛 */
  function guardPage() {
    var role = getRole();
    // ★ admin 永遠放行
    if (role === 'admin') return true;

    var page  = currentPage();
    var modId = MODULE_MAP[page];
    var perms = getPerms();

    if (!modId || modId === 'admin' || !perms[modId] || !perms[modId].view) {
      var target = 'login.html';
      for (var key in perms) {
        if (perms[key].view) {
          var destPage = Object.keys(MODULE_MAP).find(k => MODULE_MAP[k] === key && k !== 'admin');
          if (destPage) { target = destPage + '.html'; break; }
        }
      }
      window.location.replace(target);
      return false;
    }
    return true;
  }

  /* 2. 導覽列守衛 */
  function applyNav() {
    var role  = getRole();
    var perms = getPerms();

    document.querySelectorAll('.nav-tab[href]').forEach(function(tab){
      var page  = tab.getAttribute('href').replace('.html', '');
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

  /* 3. 區塊守衛 */
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
        var parts  = key.split('-');
        var prefix = parts[0];
        var action = parts[1];

        if (action === 'add')    action = 'edit';
        if (action === 'export') action = 'view';

        var modId = PREFIX_MAP[prefix];
        if (modId && perms[modId] && perms[modId][action]) {
          isAllowed = true;
        }
      });

      el.style.display = isAllowed ? '' : 'none';
    });
  }

  /* 4. 唯讀守衛 */
  function applyReadonly() {
    var role = getRole();
    if (role === 'admin') return;

    var page  = currentPage();
    var modId = MODULE_MAP[page];
    var perms = getPerms();

    if (modId && perms[modId] && !perms[modId].edit) {
      document.querySelectorAll('input, textarea, select, [data-action]').forEach(function(el){
        if (el.closest('.topbar') || el.closest('.toolbar') || el.closest('.search-bar')) return;
        el.disabled = true;
        el.style.pointerEvents = 'none';
      });
      document.querySelectorAll('.btn').forEach(function(b){
        var txt = b.textContent || '';
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
