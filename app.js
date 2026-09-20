// ===== app.js - 应用入口 =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌸 Herbloom H5 App Booting...');

  // 全局错误捕获
  window.addEventListener('error', (e) => {
    console.error('[App Error]', e.message, e.filename, e.lineno);
  });

  // 检查后端连通性（静默）
  if (window.Api) {
    Api.health().then(r => console.log('[Backend] Connected', r || 'ok')).catch(() => console.log('[Backend] Offline - using local data'));
  }

  // 恢复 token
  if (localStorage.getItem('token')) {
    try { Api.setToken(localStorage.getItem('token')); } catch(e){}
  }

  // 桥接：症状选择页 → 经期页 的回传已由 symptoms.js + period.js 通过
  // sessionStorage('pending_period_symptoms') 完成，见对应页面。

  // 初始化路由
  Router.init();

  console.log('✅ App Ready');
});
