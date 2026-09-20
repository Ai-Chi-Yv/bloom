// ===== Product Detail Page =====
Router.register('product', function(root, params) {
  const product = Catalog.PRODUCTS.find(p => String(p.id) === String(params.id)) || Catalog.PRODUCTS[0];
  if (!product) { root.innerHTML = '<div style="padding:40px;text-align:center;color:#999">商品不存在</div>'; return; }

  const GRADIENTS = [['#ff9a9e','#fad0c4'],['#a18cd1','#fbc2eb'],['#a6c1ee','#c2e9fb'],['#84fab0','#8fd3f4'],['#fccb90','#d57eeb']];
  const h = (product.brand || product.name || '品').split('').filter(c => /[\u4e00-\u9fa5A-Za-z]/.test(c)).join('').charAt(0);
  const g = GRADIENTS[Math.abs(hashStr(product.brand || product.name || '1')) % GRADIENTS.length];

  function hashStr(s) { let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }

  function isFav() {
    const favs = Storage.get('favorites') || [];
    return favs.findIndex(f => f.id === product.id) >= 0;
  }

  root.innerHTML = `
    <div class="product-detail">
      <div class="pd-media">
        ${product.image ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div class=\\'pd-ph\\' style=\\'width:100%;height:100%;background:linear-gradient(135deg,${g[0]},${g[1]})\\'><span class=\\'p-ph-char\\' style=\\'font-size:60px;color:#fff\\'>${h || '品'}</span><div class=\\'p-ph-brand\\'>${product.brand}</div></div>'">`
          : `<div class="pd-ph" style="width:100%;height:100%;background:linear-gradient(135deg,${g[0]},${g[1]})"><span class="p-ph-char" style="font-size:60px;color:#fff">${h || '品'}</span><div class="p-ph-brand">${product.brand}</div></div>`}
      </div>
      <div class="pd-info">
        <div class="pd-price-row">
          <span class="pd-price"><span class="yen">¥</span>${product.price.toFixed(1)}</span>
          <span class="pd-original" style="text-decoration:line-through;color:#aaa">¥${(product.price * 1.3).toFixed(1)}</span>
        </div>
        <div class="pd-title">${product.name}</div>
        <div class="pd-brand">${product.brand} · ${product.subCategory}</div>
        <div class="pd-tags">${(product.features||[]).map(f=>'<span class="pd-tag">'+f+'</span>').join('')}</div>
        <div class="pd-meta">
          <span class="pd-rating">★ ${product.rating}</span>
          <span class="pd-sales">${Catalog.formatSales(product.sales)}人付款</span>
        </div>
      </div>
      ${product.description ? `<div class="pd-desc"><div class="pd-desc-title">商品介绍</div><div class="pd-desc-content">${product.description}</div></div>` : ''}
      <div class="pd-specs">
        <div class="pd-desc-title">规格参数</div>
        ${product.specs ? Object.entries(product.specs).map(([k,v])=>`<div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('') : `<div class="spec-row"><span class="spec-key">品牌</span><span class="spec-val">${product.brand}</span></div>
          <div class="spec-row"><span class="spec-key">分类</span><span class="spec-val">${product.category}</span></div>
          <div class="spec-row"><span class="spec-key">子分类</span><span class="spec-val">${product.subCategory}</span></div>`}
      </div>
      <div class="pd-guarantee">
        ✅ 正品保证 &nbsp; · &nbsp; 🚚 顺丰包邮 &nbsp; · &nbsp; ↩️ 7天无忧退换
      </div>

      <div class="pd-footer">
        <div class="pd-bottom-icon ${isFav()?'fav-on':''}" id="btnFav">
          <span>${isFav()?'❤️':'🤍'}</span><span>${isFav()?'已收藏':'收藏'}</span>
        </div>
        <button class="pd-add-cart" id="btnAddCart">加入购物车</button>
        <button class="pd-buy-now" id="btnBuyNow">立即购买</button>
      </div>
    </div>
  `;

  document.getElementById('btnFav').onclick = () => {
    const favs = Storage.get('favorites') || [];
    const idx = favs.findIndex(f => f.id === product.id);
    if (idx >= 0) { favs.splice(idx,1); Utils.toast('已取消收藏'); }
    else { favs.unshift({ id:product.id, brand:product.brand, name:product.name, price:String(product.price), addedTime:Date.now() }); Utils.toast('已收藏 ❤️'); }
    Storage.set('favorites', favs);
    Router._handle();
  };
  document.getElementById('btnAddCart').onclick = () => {
    const cart = Storage.get('cart') || [];
    const exist = cart.find(c => c.id === product.id);
    if (exist) exist.quantity = (exist.quantity||1) + 1;
    else cart.push({ id:product.id, brand:product.brand, name:product.name, price:String(product.price), quantity:1, checked:true, addedTime:Date.now() });
    Storage.set('cart', cart);
    Utils.toast('已加入购物车 🛒');
  };
  document.getElementById('btnBuyNow').onclick = () => {
    const cart = Storage.get('cart') || [];
    cart.push({ id:product.id, brand:product.brand, name:product.name, price:String(product.price), quantity:1, checked:true, addedTime:Date.now() });
    Storage.set('cart', cart);
    Router.go('cart');
  };
});
