// ===== api.js - 网络请求层 =====
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api';

let _token = localStorage.getItem('token') || '';

const Api = {
  setToken(t) { _token = t; if(t) localStorage.setItem('token', t); else localStorage.removeItem('token'); },
  getToken() { return _token; },
  getHost() { return API_BASE; },
  async request(path, options = {}) {
    const url = API_BASE + path;
    const headers = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = 'Bearer ' + _token;
    try {
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.data ? JSON.stringify(options.data) : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { Api.setToken(''); localStorage.removeItem('userProfile'); }
      if (res.status >= 200 && res.status < 300) return data;
      throw { code: res.status, message: data.message || '请求失败' };
    } catch (err) {
      throw { code: -1, message: err.message || '网络错误' };
    }
  },
  // 用户
  login(data) { return this.request('/users/login', { method:'POST', data }); },
  devLogin(data) { return this.request('/users/dev-login', { method:'POST', data }); },
  logout() { return this.request('/users/logout', { method:'POST' }); },
  getProfile() { return this.request('/users/profile'); },
  // 经期
  getPeriodSettings() { return this.request('/period/settings'); },
  savePeriodSettings(data) { return this.request('/period/settings', { method:'PUT', data }); },
  getPeriodRecords(year, month) { return this.request(`/period/records?year=${year}&month=${month}`); },
  savePeriodRecord(data) { return this.request('/period/records', { method:'POST', data }); },
  // 日记
  getDiary(year, month) { return this.request(`/diary/${year}/${month}`); },
  saveDiary(data) { return this.request('/diary', { method:'POST', data }); },
  // AI
  aiChat(data) { return this.request('/ai/chat', { method:'POST', data }); },
  aiAgent(data) { return this.request('/ai/agent', { method:'POST', data }); },
  aiRecommend(data) { return this.request('/ai/recommend', { method:'POST', data }); },
  getHealthReport(days) { return this.request('/ai/health-report?days='+(days||30)); },
  ttsUrl(text) { return API_BASE + '/ai/tts?text=' + encodeURIComponent(text); },
  // 商品
  getProducts(params) {
    const qs = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    return this.request('/products' + (qs ? '?'+qs : ''));
  },
  getProductDetail(id) { return this.request('/products/'+id); },
  getAvoidProducts(params) {
    const qs = params ? Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
    return this.request('/avoid-products' + (qs ? '?'+qs : ''));
  },
  // 区块链
  blockchainRecord(data) { return this.request('/blockchain/record', { method:'POST', data }); },
  blockchainVerify() { return this.request('/blockchain/verify'); },
  blockchainRecords(limit) { return this.request('/blockchain/records?limit='+(limit||50)); },
  // 健康档案
  getMedicalRecords(params) {
    const qs = params ? Object.entries(params).filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&') : '';
    return this.request('/medical/records' + (qs ? '?'+qs : ''));
  },
  saveMedicalRecord(data) { return this.request('/medical/records', { method:'POST', data }); },
  deleteMedicalRecord(id) { return this.request('/medical/records/'+id, { method:'DELETE' }); },
  // 反馈
  submitFeedback(data) { return this.request('/admin/feedback', { method:'POST', data }); },
  // 健康检查
  health() { return this.request('/health'); }
};

window.Api = Api;
