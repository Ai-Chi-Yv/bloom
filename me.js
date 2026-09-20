// ===== Me Page - 个人中心 =====
Router.register('me', function(root, params) {
  function getUser() {
    try { return JSON.parse(localStorage.getItem('userProfile') || 'null'); } catch (e) { return null; }
  }
  function isLoggedIn() { return !!localStorage.getItem('token'); }

  function render() {
    const user = getUser();
    const logged = isLoggedIn();
    const favorites = Storage.get('favorites') || [];
    const cart = Storage.get('cart') || [];
    const diary = Storage.get('diary') || {};

    const nick = user ? (user.nickname || user.username || '小暖用户') : '未登录';
    const avatar = user && user.avatarUrl ? user.avatarUrl : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="40" fill="%23ffb6c1"/><text x="40" y="52" font-size="28" text-anchor="middle" fill="%23fff">🌸</text></svg>';

    root.innerHTML = `
      <div class="me-page">
        <div class="me-header">
          <div class="me-avatar"><img src="${avatar}"/></div>
          <div class="me-user-info">
            <div class="me-nick">${nick}</div>
            <div class="me-id">ID: u${Storage.getCurrentUserId().slice(0,8)}</div>
          </div>
          ${logged ? '' : '<button class="me-login-btn" data-action="login">登录 / 注册</button>'}
        </div>
        <div class="me-stats">
          <div class="me-stat-item" data-action="favorites">
            <div class="me-stat-num">${favorites.length}</div><div class="me-stat-lbl">我的收藏</div>
          </div>
          <div class="me-stat-item" data-action="cart">
            <div class="me-stat-num">${cart.length}</div><div class="me-stat-lbl">购物车</div>
          </div>
          <div class="me-stat-item" data-action="diary-tab">
            <div class="me-stat-num">${Object.keys(diary).length}</div><div class="me-stat-lbl">心情日记</div>
          </div>
        </div>
        <div class="me-menu-group">
          <div class="me-menu-item" data-action="records">
            <span class="mm-icon">📋</span><span class="mm-text">健康档案</span><span class="mm-arrow">›</span>
          </div>
          <div class="me-menu-item" data-action="report">
            <span class="mm-icon">📊</span><span class="mm-text">健康报告</span><span class="mm-arrow">›</span>
          </div>
          <div class="me-menu-item" data-action="care">
            <span class="mm-icon">📚</span><span class="mm-text">科学护理</span><span class="mm-arrow">›</span>
          </div>
          <div class="me-menu-item" data-action="favorites">
            <span class="mm-icon">❤️</span><span class="mm-text">商品收藏</span><span class="mm-arrow">›</span>
          </div>
          <div class="me-menu-item" data-action="cart">
            <span class="mm-icon">🛒</span><span class="mm-text">购物车</span><span class="mm-arrow">›</span>
          </div>
        </div>
        <div class="me-menu-group">
          <div class="me-menu-item" data-action="settings">
            <span class="mm-icon">⚙️</span><span class="mm-text">设置</span><span class="mm-arrow">›</span>
          </div>
          <div class="me-menu-item" data-action="feedback">
            <span class="mm-icon">💬</span><span class="mm-text">意见反馈</span><span class="mm-arrow">›</span>
          </div>
          <div class="me-menu-item" data-action="about">
            <span class="mm-icon">ℹ️</span><span class="mm-text">关于我们</span><span class="mm-arrow">›</span>
          </div>
        </div>
        ${logged ? `<div class="me-menu-group"><div class="me-menu-item" data-action="logout"><span class="mm-icon">🚪</span><span class="mm-text" style="color:#ff5f8f">退出登录</span><span class="mm-arrow">›</span></div></div>` : ''}
        <div style="text-align:center;padding:20px;color:#bbb;font-size:12px">Herbloom · 女性健康管家 v1.0</div>
      </div>
    `;

    root.querySelectorAll('[data-action]').forEach(el => {
      el.onclick = () => {
        const a = el.dataset.action;
        const map = {
          login: showLoginDialog,
          logout: () => { Utils.modal({ title:'确认退出？', content:'退出后本地数据仍保留', showCancel:true, confirmText:'退出', onConfirm:()=>{ Storage.fullLogout(); Utils.toast('已退出'); render(); }}); },
          favorites:'favorites', cart:'cart', records:'records', report:'report', care:'care', settings:'settings', feedback:'feedback', about:'about', 'diary-tab':()=>Router.goTab('diary')
        };
        const target = map[a];
        if (typeof target === 'function') target();
        else if (target) Router.go(target);
      };
    });
  }

  function showLoginDialog() {
    Utils.modal({
      title: '登录 / 注册',
      content: `
        <div style="padding:10px 0">
          <input id="loginUser" placeholder="手机号/用户名" style="width:100%;padding:10px;border:1px solid #eee;border-radius:8px;margin-bottom:10px;box-sizing:border-box"/>
          <input id="loginPwd" type="password" placeholder="密码" style="width:100%;padding:10px;border:1px solid #eee;border-radius:8px;margin-bottom:10px;box-sizing:border-box"/>
          <button id="btnDevLogin" style="width:100%;padding:10px;background:#ffb6c1;color:#fff;border:none;border-radius:8px;margin-top:6px">🛠️ 开发登录（快速体验）</button>
          <button id="btnRealLogin" style="width:100%;padding:10px;background:#ff5f8f;color:#fff;border:none;border-radius:8px;margin-top:6px">正式登录</button>
        </div>`,
      showCancel: true, cancelText: '取消', confirmText: '注册',
      onConfirm: () => {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPwd').value;
        if (!u || !p) { Utils.toast('请填写完整'); return; }
        Utils.modal({ title:'注册中...', content:'后端未启动，已为你创建本地虚拟账号', showCancel:false, confirmText:'好的' });
        finishLogin({ userId:'local_'+Date.now(), nickname: u, username: u });
      }
    });
    setTimeout(() => {
      document.getElementById('btnDevLogin').onclick = () => {
        finishLogin({ userId:'dev_'+Math.floor(Math.random()*1000), nickname:'小暖开发者', username:'dev'});
      };
      document.getElementById('btnRealLogin').onclick = async () => {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPwd').value;
        if (!u || !p) { Utils.toast('请填写完整'); return; }
        try {
          const res = await Api.login({ username:u, password:p });
          if (res.token) { Api.setToken(res.token); finishLogin(res.user || { nickname:u }); }
          else Utils.toast(res.message || '登录失败');
        } catch (e) {
          Utils.toast('后端未启动，已为你创建本地虚拟账号');
          finishLogin({ userId:'local_'+Date.now(), nickname: u, username: u });
        }
      };
    }, 50);
  }

  function finishLogin(user) {
    localStorage.setItem('userProfile', JSON.stringify(user));
    if (!localStorage.getItem('token')) localStorage.setItem('token', 'wx_local_' + Date.now());
    Utils.toast('登录成功 💗');
    render();
  }

  render();
});
