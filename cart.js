// ===== Cart Page =====
Router.register('cart', function(root, params) {
  function render() {
    const cart = Storage.get('cart') || [];
    const total = cart.filter(c => c.checked).reduce((s,c) => s + parseFloat(c.price) * c.quantity, 0);
    const totalCount = cart.reduce((s,c) => s + c.quantity, 0);
    const allChecked = cart.length > 0 && cart.every(c => c.checked);

    root.innerHTML = `
      <div style="padding:12px">
        ${cart.length === 0 ? `<div style="text-align:center;padding:60px 20px;color:#999">
          <div style="font-size:48px">🛒</div>
          <div style="margin-top:10px">购物车空空如也~</div>
          <button class="btn" style="margin-top:16px;background:#ff5f8f;color:#fff" onclick="Router.goTab('health')">去逛逛</button>
        </div>` : `
        <div class="cart-list">
          ${cart.map((c,idx) => `<div class="cart-item">
            <div class="cart-check ${c.checked?'on':''}" data-toggle="${idx}">${c.checked?'✓':''}</div>
            <div class="cart-thumb">🌸</div>
            <div class="cart-info" style="flex:1">
              <div class="cart-name">${c.name}</div>
              <div class="cart-brand">${c.brand}</div>
              <div class="cart-bottom">
                <span class="cart-price"><span class="yen">¥</span>${parseFloat(c.price).toFixed(1)}</span>
                <div class="qty-ctrl">
                  <button class="qty-btn" data-act="minus" data-idx="${idx}">-</button>
                  <span>${c.quantity}</span>
                  <button class="qty-btn" data-act="plus" data-idx="${idx}">+</button>
                  <button class="cart-del" data-idx="${idx}" style="margin-left:8px;color:#999;font-size:14px">🗑️</button>
                </div>
              </div>
            </div>
          </div>`).join('')}
        </div>
        <div style="height:70px"></div>
        <div class="cart-footer">
          <label class="cart-all-check"><input type="checkbox" id="allCheck" ${allChecked?'checked':''} style="accent-color:#ff5f8f"> 全选</label>
          <div class="cart-total">合计 <span class="cart-total-num">¥${total.toFixed(2)}</span></div>
          <button class="cart-checkout" ${cart.length===0?'disabled':''} id="checkoutBtn">结算(${cart.filter(c=>c.checked).length})</button>
        </div>`}
      </div>
    `;

    root.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const i = parseInt(b.dataset.toggle); cart[i].checked = !cart[i].checked; Storage.set('cart', cart); render();
    });
    root.querySelectorAll('.qty-btn').forEach(b => b.onclick = () => {
      const i = parseInt(b.dataset.idx); const act = b.dataset.act;
      if (act === 'minus' && cart[i].quantity > 1) cart[i].quantity--;
      else if (act === 'plus') cart[i].quantity++;
      Storage.set('cart', cart); render();
    });
    root.querySelectorAll('.cart-del').forEach(b => b.onclick = () => {
      cart.splice(parseInt(b.dataset.idx), 1); Storage.set('cart', cart); render();
    });
    const allChk = document.getElementById('allCheck');
    if (allChk) allChk.onchange = () => {
      cart.forEach(c => c.checked = allChk.checked); Storage.set('cart', cart); render();
    };
    const co = document.getElementById('checkoutBtn');
    if (co) co.onclick = () => {
      const selected = cart.filter(c => c.checked);
      if (selected.length === 0) return Utils.toast('请选择商品');
      Utils.modal({ title:'确认下单？', content:`共 ${selected.length} 件商品，合计 ¥${total.toFixed(2)}<br><br>H5版暂未接入真实支付，已模拟下单成功~`, confirmText:'支付 ¥'+total.toFixed(2), onConfirm:()=>{
        const ids = selected.map(c => c.id);
        const newCart = cart.filter(c => !ids.includes(c.id));
        Storage.set('cart', newCart);
        Utils.toast('下单成功 🎉'); render();
      }});
    };
  }
  render();
});
