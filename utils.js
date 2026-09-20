// ===== utils.js - 工具函数 =====
const Utils = {
  pad2(n) { return n < 10 ? '0'+n : ''+n; },
  fmtDate(d) {
    if (typeof d === 'string') return d;
    return d.getFullYear()+'-'+this.pad2(d.getMonth()+1)+'-'+this.pad2(d.getDate());
  },
  fmtDateShort(s) {
    if (!s) return '';
    const parts = String(s).split('-');
    return Number(parts[1])+'月'+Number(parts[2])+'日';
  },
  toast(msg, duration=1800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { t.style.display = 'none'; }, duration);
  },
  modal(opts) {
    const box = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = opts.title || '';
    document.getElementById('modalContent').innerHTML = opts.content || '';
    const cancel = document.getElementById('modalCancel');
    const confirm = document.getElementById('modalConfirm');
    if (opts.showCancel === false) cancel.style.display = 'none'; else cancel.style.display = '';
    cancel.onclick = () => { box.style.display='none'; opts.onCancel && opts.onCancel(); };
    confirm.textContent = opts.confirmText || '确定';
    confirm.onclick = () => { box.style.display='none'; opts.onConfirm && opts.onConfirm(); };
    box.style.display = 'flex';
  },
  showActionSheet(items) {
    // Simple confirm-style action sheet simulation
    return new Promise((resolve) => {
      const opts = items.map((t,i) => `${i+1}. ${t}`).join('\n');
      const choice = prompt(opts + '\n\n输入序号选择：');
      if (choice && !isNaN(choice)) {
        const idx = parseInt(choice) - 1;
        if (idx >= 0 && idx < items.length) resolve(idx); else resolve(-1);
      } else resolve(-1);
    });
  },
  copyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); this.toast('已复制'); }
    catch(e) { this.toast('复制失败'); }
    document.body.removeChild(ta);
  }
};

window.Utils = Utils;
