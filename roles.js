/**
 * roles.js — 職等權限設定檔
 * ==========================================
 * 修改此檔案自定義每個職等的權限。
 * 與所有 HTML 頁面放在同一目錄。
 *
 * 內建職等：
 *   admin    超級管理員
 *   manager  部門主管
 *   staff    一般員工
 *   viewer   唯讀人員
 *
 * 新增職等：在 roleLabels / pageAccess / sectionAccess 各自加一行即可。
 * ==========================================
 */
window.ROLES_CONFIG = {

  /* ── 職等顯示名稱 ── */
  roleLabels: {
    admin:   '超級管理員',
    manager: '部門主管',
    staff:   '一般員工',
    viewer:  '唯讀人員',
  },

  /**
   * 各職等可進入的頁面（檔名不含 .html）
   * 不在清單內 → 直接訪問被踢回第一個允許頁面
   */
  pageAccess: {
    admin:   ['index', 'project', 'cost', 'inventory', 'contacts', 'admin-roles'],
    manager: ['index', 'project', 'cost', 'inventory', 'contacts'],
    staff:   ['index', 'project', 'inventory'],
    viewer:  ['index', 'project'],
  },

  /**
   * 功能區塊可見的職等
   * 用法：在 HTML 元素加  data-role-section="quote-delete"
   * 只有該清單內的職等才看得到這個元素。
   */
  sectionAccess: {
    'quote-edit':        ['admin', 'manager', 'staff'],
    'quote-export':      ['admin', 'manager'],
    'quote-delete':      ['admin'],

    'project-add':       ['admin', 'manager'],
    'project-edit':      ['admin', 'manager', 'staff'],
    'project-delete':    ['admin'],

    'cost-view':         ['admin', 'manager'],
    'cost-edit':         ['admin', 'manager'],

    'inventory-add':     ['admin', 'manager', 'staff'],
    'inventory-edit':    ['admin', 'manager', 'staff'],
    'inventory-delete':  ['admin'],

    'contacts-view':     ['admin', 'manager'],
    'contacts-edit':     ['admin', 'manager'],
    'contacts-delete':   ['admin'],

    'admin-panel':       ['admin'],
  },

  /** 這些職等的使用者，所有帶 data-action 的按鈕與輸入框自動 disabled */
  readonlyRoles: ['viewer'],

  /** 新帳號尚未設定職等時的預設值 */
  defaultRole: 'viewer',
};

/* ============================================================
   RoleGuard — 掛在 window.RoleGuard
   ============================================================ */
window.RoleGuard = (function () {
  var KEY_ROLE = 'rg_role';
  var KEY_UID  = 'rg_uid';
  var KEY_NAME = 'rg_name';

  function getRole()     { return sessionStorage.getItem(KEY_ROLE) || ROLES_CONFIG.defaultRole; }
  function getUid()      { return sessionStorage.getItem(KEY_UID)  || ''; }
  function getUsername() { return sessionStorage.getItem(KEY_NAME) || ''; }

  function setSession(uid, role, displayName) {
    sessionStorage.setItem(KEY_ROLE, role);
    sessionStorage.setItem(KEY_UID,  uid);
    sessionStorage.setItem(KEY_NAME, displayName || '');
  }

  function clearSession() {
    [KEY_ROLE, KEY_UID, KEY_NAME].forEach(function(k){ sessionStorage.removeItem(k); });
  }

  function currentPage() {
    return (window.location.pathname.split('/').pop() || 'index').replace('.html', '');
  }

  function guardPage() {
    var role    = getRole();
    var page    = currentPage();
    var allowed = ROLES_CONFIG.pageAccess[role] || [];
    if (allowed.indexOf(page) === -1) {
      var dest = allowed.length ? allowed[0] + '.html' : 'login.html';
      window.location.replace(dest);
      return false;
    }
    return true;
  }

  function applyNav() {
    var role    = getRole();
    var allowed = ROLES_CONFIG.pageAccess[role] || [];
    document.querySelectorAll('.nav-tab[href]').forEach(function(tab){
      var page = tab.getAttribute('href').replace('.html', '');
      tab.style.display = (allowed.indexOf(page) !== -1) ? '' : 'none';
    });
    var badge = document.getElementById('role-badge');
    if (badge) badge.textContent = ROLES_CONFIG.roleLabels[role] || role;
    var nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = getUsername();
  }

  function applySection() {
    var role = getRole();
    document.querySelectorAll('[data-role-section]').forEach(function(el){
      var allowed = el.dataset.roleSection.split(',').map(function(s){ return s.trim(); });
      el.style.display = (allowed.indexOf(role) !== -1) ? '' : 'none';
    });
  }

  function applyReadonly() {
    var role = getRole();
    if (ROLES_CONFIG.readonlyRoles.indexOf(role) === -1) return;
    document.querySelectorAll('input, textarea, select, [data-action]').forEach(function(el){
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.title = '您的職等為唯讀，無法編輯';
    });
    document.querySelectorAll('.btn').forEach(function(b){
      b.style.opacity = '0.4';
      b.style.pointerEvents = 'none';
    });
  }

  function applyAll() {
    applyNav();
    applySection();
    applyReadonly();
  }

  function can(section) {
    var allowed = ROLES_CONFIG.sectionAccess[section] || [];
    return allowed.indexOf(getRole()) !== -1;
  }

  function roleLabel() {
    return ROLES_CONFIG.roleLabels[getRole()] || getRole();
  }

  return {
    getRole: getRole, getUid: getUid, getUsername: getUsername,
    setSession: setSession, clearSession: clearSession,
    currentPage: currentPage,
    guardPage: guardPage,
    applyNav: applyNav, applySection: applySection,
    applyReadonly: applyReadonly, applyAll: applyAll,
    can: can, roleLabel: roleLabel,
  };
})();
