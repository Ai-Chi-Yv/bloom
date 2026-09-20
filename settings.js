// ===== Settings Page =====
Router.register('settings', function(root, params) {
  let state = Storage.get('periodSettings') || { cycleLength: 28, periodLength: 7, aiRecommend: true, useAlgorithm: true };

  function render() {
    root.innerHTML = `
      <div style="padding:16px">
        <div class="setting-group">
          <div class="setting-row">
            <span>平均周期长度</span>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="num-btn" data-change="cycle" data-delta="-1">-</button>
              <span style="min-width:40px;text-align:center;font-size:16px;font-weight:600">${state.cycleLength}天</span>
              <button class="num-btn" data-change="cycle" data-delta="1">+</button>
            </div>
          </div>
          <div class="setting-row">
            <span>平均经期长度</span>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="num-btn" data-change="period" data-delta="-1">-</button>
              <span style="min-width:40px;text-align:center;font-size:16px;font-weight:600">${state.periodLength}天</span>
              <button class="num-btn" data-change="period" data-delta="1">+</button>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-row">
            <div><div>🧠 智能算法融合</div><div style="font-size:11px;color:#999;margin-top:2px">根据历史记录自动优化周期/经期预测</div></div>
            <label class="switch"><input type="checkbox" id="useAlgoSwitch" ${state.useAlgorithm!==false?'checked':''}><span class="slider"></span></label>
          </div>
          <div class="setting-row">
            <span>AI 智能推荐</span>
            <label class="switch"><input type="checkbox" id="aiRecSwitch" ${state.aiRecommend!==false?'checked':''}><span class="slider"></span></label>
          </div>
        </div>

        <div style="font-size:12px;color:#999;margin:16px 0 8px;padding:0 8px">数据管理</div>
        <div class="setting-group">
          <div class="setting-row" style="cursor:pointer;color:#ff5f8f" data-action="clearIsolated">
            <span>🗑️ 清除当前账号数据</span><span class="mm-arrow">›</span>
          </div>
          <div class="setting-row" style="cursor:pointer;color:#ff5f8f" data-action="logout">
            <span>🚪 退出登录</span><span class="mm-arrow">›</span>
          </div>
        </div>

        <div style="text-align:center;padding:30px 10px;color:#ccc;font-size:11px">Herbloom · 女性健康管家<br>v1.0 H5 Web Edition</div>
      </div>
    `;

    root.querySelectorAll('.num-btn').forEach(b => b.onclick = () => {
      const type = b.dataset.change; const delta = parseInt(b.dataset.delta);
      if (type === 'cycle') state.cycleLength = Math.max(15, Math.min(60, state.cycleLength + delta));
      else state.periodLength = Math.max(2, Math.min(14, state.periodLength + delta));
      Storage.set('periodSettings', state);
      render();
    });

    const swA = document.getElementById('useAlgoSwitch');
    if (swA) swA.onchange = () => { state.useAlgorithm = swA.checked; Storage.set('periodSettings', state); Utils.toast(state.useAlgorithm ? '已开启智能算法' : '已关闭，将使用手动设置值'); };

    const swR = document.getElementById('aiRecSwitch');
    if (swR) swR.onchange = () => { state.aiRecommend = swR.checked; Storage.set('periodSettings', state); };

    root.querySelectorAll('[data-action]').forEach(el => el.onclick = () => {
      const a = el.dataset.action;
      if (a === 'clearIsolated') Utils.modal({ title:'确认清除？', content:'将清除当前账号的经期记录、日记、购物车等所有本地数据', showCancel:true, confirmText:'清除', onConfirm:()=>{ Storage.clearCurrentUserIsolated(); Utils.toast('已清除'); render(); }});
      else if (a === 'logout') Utils.modal({ title:'确认退出？', content:'退出后本地数据仍保留', showCancel:true, confirmText:'退出', onConfirm:()=>{ Storage.fullLogout(); Utils.toast('已退出'); Router.back(); }});
    });
  }

  render();
});
