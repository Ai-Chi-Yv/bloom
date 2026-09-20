// ===== router.js - Hash Router =====
const Router = {
  current: 'period',
  params: {},
  tabPages: ['period','health','diary','ai','me'],
  pages: {},

  init() {
    window.addEventListener('hashchange', () => this._handle());
    document.getElementById('navBack').onclick = () => this.back();
    // TabBar 点击
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.onclick = () => this.goTab(btn.dataset.tab);
    });
    this._handle();
  },

  register(name, handler) { this.pages[name] = handler; },

  goTab(name) {
    location.hash = '#/' + name;
  },

  go(name, params={}) {
    const qs = Object.entries(params).map(([k,v]) => k+'='+encodeURIComponent(v)).join('&');
    location.hash = '#/' + name + (qs ? '?'+qs : '');
  },

  back() {
    if (this.currentTabBarPage()) {
      location.hash = '#/' + this.current;
    } else {
      history.back();
    }
  },

  currentTabBarPage() { return this.tabPages.includes(this.current); },

  _handle() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [path, query] = hash.split('?');
    const params = {};
    if (query) query.split('&').forEach(kv => { const [k,v] = kv.split('='); params[k] = decodeURIComponent(v||''); });

    const name = path || 'period';
    this.current = name;
    this.params = params;

    // TabBar UI
    document.querySelectorAll('.tab-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === name);
    });

    const isTabBar = this.tabPages.includes(name);
    document.getElementById('tabBar').style.display = isTabBar ? '' : 'none';
    document.getElementById('navBack').style.display = isTabBar ? 'none' : '';

    // Nav title
    const titles = {
      period:'经期记录', health:'健康防护', diary:'心情日记', ai:'AI助手', me:'个人中心',
      symptoms:'选择症状', settings:'设置', product:'商品详情', cart:'购物车', favorites:'我的收藏',
      care:'科学护理', records:'健康档案', report:'健康报告', feedback:'意见反馈',
      about:'关于我们', blockchain:'区块链存证'
    };
    document.getElementById('navTitle').textContent = titles[name] || name;

    const container = document.getElementById('pageContainer');
    container.innerHTML = '';
    const handler = this.pages[name];
    if (handler) handler(container, params);
    else container.innerHTML = '<div style="padding:40px;text-align:center;color:#999">页面加载中...<br><br><button class="btn" onclick="location.reload()">刷新</button></div>';

    window.scrollTo(0, 0);
  }
};

window.Router = Router;
