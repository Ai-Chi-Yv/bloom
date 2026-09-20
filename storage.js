// ===== storage.js - 账号隔离的本地存储 =====
const ISOLATED_KEYS = new Set([
  'cart', 'favorites', 'dailyPeriodRecords', 'diary', 'periodSettings',
  'feedbacks', 'fav_messages', 'ai_pending_question', 'ai_prefill_product_id',
  'healthDataSyncedV1'
]);

function _extractUserId() {
  try {
    const token = localStorage.getItem('token') || '';
    const p = JSON.parse(localStorage.getItem('userProfile') || 'null') || {};
    if (p.userId) return String(p.userId);
    if (token && token.indexOf('.') > 0) {
      try {
        const parts = token.split('.');
        if (parts[1]) {
          const pad = parts[1] + '==='.slice((3 - parts[1].length % 3) % 3);
          const payload = JSON.parse(decodeURIComponent(escape(atob(pad))));
          if (payload.userId || payload.sub) return String(payload.userId || payload.sub);
        }
      } catch (e) {}
    }
    if (token && token.indexOf('wx_local_') === 0) {
      let localId = localStorage.getItem('local_user_id');
      if (!localId) { localId = 'local_' + Date.now(); localStorage.setItem('local_user_id', localId); }
      return localId;
    }
  } catch (e) {}
  let mc = localStorage.getItem('machine_code');
  if (!mc) { mc = 'mc_' + (Date.now() % 100000000) + '_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('machine_code', mc); }
  return 'anon_' + mc.slice(0, 8);
}

function scopedKey(baseKey) {
  if (!ISOLATED_KEYS.has(baseKey)) return baseKey;
  return 'u_' + _extractUserId() + ':' + baseKey;
}

const Storage = {
  get(key, fallback) {
    try {
      const val = localStorage.getItem(scopedKey(key));
      if (val === null) return fallback;
      try { return JSON.parse(val); } catch (e) { return val; }
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(scopedKey(key), typeof value === 'string' ? value : JSON.stringify(value)); } catch (e) {}
  },
  remove(key) {
    try { localStorage.removeItem(scopedKey(key)); } catch (e) {}
  },
  getCurrentUserId() { return _extractUserId(); },
  clearCurrentUserIsolated() {
    const uid = _extractUserId();
    const prefix = 'u_' + uid + ':';
    Object.keys(localStorage).forEach(k => { if (k.indexOf(prefix) === 0) localStorage.removeItem(k); });
  },
  fullLogout() {
    this.clearCurrentUserIsolated();
    ['token','userProfile','local_user_id'].forEach(k => localStorage.removeItem(k));
  }
};

window.Storage = Storage;
