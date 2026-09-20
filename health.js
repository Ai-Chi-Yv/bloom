// ===== Health Page - 健康防护/电商 =====
Router.register('health', function(root, params) {
  if (params.tab === 'avoid') {
    setTimeout(() => render({ currentTab:'avoid' }), 0);
  }
  const state = {
    horizontalNav: 0,
    verticalNav: 0,
    currentTab: 'products',
    keyword: '',
    searching: false
  };

  function hashStr(s) { let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
  function brandChar(brand) { const m=String(brand||'').match(/[\u4e00-\u9fa5]/); if(m) return m[0]; return String(brand||'品').charAt(0).toUpperCase(); }
  const GRADIENTS = [['#ff9a9e','#fad0c4'],['#a18cd1','#fbc2eb'],['#a6c1ee','#c2e9fb'],['#84fab0','#8fd3f4'],['#fccb90','#d57eeb']];

  function applyView() {
    const cat = Catalog.CATEGORIES[state.horizontalNav];
    const sub = cat && cat.subs[state.verticalNav];
    const kw = (state.keyword || '').trim().toLowerCase();
    let products = Catalog.PRODUCTS.slice();
    let avoids = Catalog.AVOID_PRODUCTS.slice();

    if (kw) {
      products = products.filter(p => (p.brand+p.name+(p.features||[]).join('')+p.category+p.subCategory).toLowerCase().includes(kw));
      avoids = avoids.filter(a => (a.brand+a.name+a.reason+a.issueType+a.category).toLowerCase().includes(kw));
    } else if (cat && sub) {
      products = products.filter(p => p.category === cat.key && p.subCategory === sub.key);
      avoids = avoids.filter(a => a.category === cat.key);
    }

    products.sort((a,b)=> (b.rating-a.rating) || (b.sales-a.sales));
    avoids.sort((a,b)=> a.severity-b.severity);

    return { cat, sub, products, avoids };
  }

  function render() {
    const { cat, products, avoids } = applyView();
    const hNavs = Catalog.CATEGORIES;
    const subNavs = cat ? cat.subs : [];

    let productsHTML = '';
    if (state.currentTab === 'products') {
      productsHTML = products.length === 0 ? `<div class="empty-state"><div class="empty-icon">🫧</div><div>暂无相关精选商品</div><div class="empty-sub">换个关键词或分类看看吧</div></div>` :
        `<div class="product-grid">${products.map(p => {
          const g = GRADIENTS[hashStr(p.brand) % GRADIENTS.length];
          const ph = p.image ? `<img src="${p.image}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'p-ph\\' style=\\'background:linear-gradient(135deg,${g[0]},${g[1]})\\'><div class=\\'p-ph-char\\'>${brandChar(p.brand)}</div><div class=\\'p-ph-brand\\'>${p.brand}</div></div>'">` :
            `<div class="p-ph" style="background:linear-gradient(135deg,${g[0]},${g[1]})"><div class="p-ph-char">${brandChar(p.brand)}</div><div class="p-ph-brand">${p.brand}</div></div>`;
          return `<div class="p-card" data-action="goto-detail" data-id="${p.id}">
            <div class="p-media">${ph}</div>
            <div class="p-name">${p.name}</div>
            <div class="p-tags">${(p.features||[]).slice(0,2).map(f=>'<span class="p-tag">'+f+'</span>').join('')}</div>
            <div class="p-foot"><div class="p-price"><span class="yen">¥</span>${p.price.toFixed(1)}</div><div class="p-rate">★${p.rating}</div></div>
            <div class="p-sales">${Catalog.formatSales(p.sales)}人付款</div>
          </div>`;
        }).join('')}</div>`;
    } else {
      productsHTML = avoids.length === 0 ? `<div class="empty-state"><div class="empty-icon">🛡️</div><div>该分类暂无避雷记录</div><div class="empty-sub">精选库持续更新中</div></div>` :
        `<div class="avoid-list">${avoids.map(a => `<div class="a-card s${a.severity}" data-toggle="${a.id}">
          <div class="a-head">
            <span class="a-sev sev-bg-${a.severity}">${a.severityText}</span>
            <span class="a-type">${a.issueType}</span>
            <span class="a-arrow" id="arrow-${a.id}">›</span>
          </div>
          <div class="a-title">${a.brand} · ${a.name}</div>
          <div class="a-reason">${a.reasonShort}</div>
          <div id="extra-${a.id}" style="display:none">
            ${a.tip ? `<div class="a-tip">💡 ${a.tip}</div>` : ''}
            <div class="a-source">📎 来源：${a.evidence}</div>
          </div>
          <div class="a-foot-tip">点击展开详情与消费提示</div>
        </div>`).join('')}</div>`;
    }

    root.innerHTML = `
      <div class="health-page">
        <div class="health-header">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input placeholder="搜索卫生巾/益生菌/血压计…" value="${state.keyword}" id="searchInput"/>
            <span class="search-clear" id="searchClear" style="display:${state.keyword?'':'none'}">✕</span>
          </div>
        </div>

        ${!state.searching ? `
        <div class="banner-strip">
          ${Catalog.BANNERS.map((b,i)=>`<div class="banner-card" style="background:${b.gradient}" data-banner="${i}">
            <div><div class="banner-title">${b.title}</div><div class="banner-sub">${b.sub}</div></div>
            <div class="banner-go">›</div>
          </div>`).join('')}
        </div>
        <div class="cat-nav">
          ${hNavs.map((c,i)=>`<div class="cat-item ${state.horizontalNav===i?'active':''}" data-hnav="${i}"><div class="cat-icon">${c.icon}</div><div class="cat-name">${c.name}</div></div>`).join('')}
        </div>` : `<div class="search-tip"><span>“${state.keyword}” 的搜索结果</span><span class="search-exit" id="searchExit">返回分类 ✕</span></div>`}

        <div class="health-body">
          ${!state.searching ? `<div class="side-nav">${subNavs.map((s,i)=>`<div class="side-item ${state.verticalNav===i?'active':''}" data-vnav="${i}">${s.icon} ${s.name}</div>`).join('')}</div>` : ''}
          <div class="main-area">
            <div class="tabs">
              <div class="tab ${state.currentTab==='products'?'active':''}" data-tab="products"><span>精选推荐</span><span class="tab-badge">${products.length}</span></div>
              <div class="tab ${state.currentTab==='avoid'?'active':''}" data-tab="avoid"><span>消费避雷</span><span class="tab-badge tab-badge-warn">${avoids.length}</span></div>
            </div>
            ${productsHTML}
          </div>
        </div>
      </div>`;

    // events
    const inp = document.getElementById('searchInput');
    if (inp) {
      inp.oninput = e => { state.keyword = e.target.value; document.getElementById('searchClear').style.display = state.keyword?'':'none'; };
      inp.onkeydown = e => { if (e.key === 'Enter') { state.searching = !!state.keyword.trim(); render(); } };
    }
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.onclick = () => { state.keyword=''; state.searching=false; render(); };
    const exitBtn = document.getElementById('searchExit');
    if (exitBtn) exitBtn.onclick = () => { state.keyword=''; state.searching=false; render(); };

    root.querySelectorAll('[data-hnav]').forEach(b => b.onclick = () => { state.horizontalNav = parseInt(b.dataset.hnav); state.verticalNav = 0; render(); });
    root.querySelectorAll('[data-vnav]').forEach(b => b.onclick = () => { state.verticalNav = parseInt(b.dataset.vnav); render(); });
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { state.currentTab = b.dataset.tab; render(); });
    root.querySelectorAll('[data-action="goto-detail"]').forEach(c => c.onclick = () => Router.go('product', { id: c.dataset.id }));
    root.querySelectorAll('.p-card').forEach(c => c.onclick = () => Router.go('product', { id: c.dataset.id }));

    // banner clicks
    root.querySelectorAll('[data-banner]').forEach(b => b.onclick = () => {
      const i = parseInt(b.dataset.banner);
      if (i === 2) Router.goTab('ai'); else if (i === 1) { state.currentTab='avoid'; render(); }
    });

    // avoid expand
    root.querySelectorAll('[data-toggle]').forEach(c => c.onclick = () => {
      const id = c.dataset.toggle; const extra = document.getElementById('extra-'+id); const arrow = document.getElementById('arrow-'+id);
      if (extra) extra.style.display = extra.style.display === 'none' ? 'block' : 'none';
      if (arrow) arrow.classList.toggle('a-arrow-up');
    });
  }

  render();
});
