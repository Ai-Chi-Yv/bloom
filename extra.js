// ===== Favorites Page =====
Router.register('favorites', function(root, params) {
  function render() {
    const favs = Storage.get('favorites') || [];
    const GRADIENTS = [['#ff9a9e','#fad0c4'],['#a18cd1','#fbc2eb'],['#a6c1ee','#c2e9fb'],['#84fab0','#8fd3f4']];

    root.innerHTML = `
      <div style="padding:12px">
        ${favs.length === 0 ? `<div style="text-align:center;padding:60px 20px;color:#999">
          <div style="font-size:48px">❤️</div>
          <div style="margin-top:10px">还没有收藏商品~</div>
          <button class="btn" style="margin-top:16px;background:#ff5f8f;color:#fff" onclick="Router.goTab('health')">去逛逛</button>
        </div>` :
          favs.map((f,idx) => `<div class="p-card fav-card" data-id="${f.id}">
            <div class="p-media" style="background:linear-gradient(135deg,${GRADIENTS[idx%GRADIENTS.length][0]},${GRADIENTS[idx%GRADIENTS.length][1]})"><div class="p-ph-char">🌸</div></div>
            <div class="p-name">${f.name}</div>
            <div class="p-tags"><span class="p-tag">${f.brand}</span></div>
            <div class="p-foot"><div class="p-price"><span class="yen">¥</span>${parseFloat(f.price||0).toFixed(1)}</div>
              <button class="btn" style="font-size:12px;padding:2px 8px;background:#ff5f8f;color:#fff" data-del="${idx}">取消</button>
            </div>
          </div>`).join('')
        }
      </div>
    `;
    root.querySelectorAll('[data-id]').forEach(c => c.onclick = () => { if (c.dataset.id !== 'undefined') Router.go('product', { id: c.dataset.id }); });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = (e) => {
      e.stopPropagation(); const favs2 = Storage.get('favorites') || []; favs2.splice(parseInt(b.dataset.del),1); Storage.set('favorites', favs2); Utils.toast('已取消收藏'); render();
    });
  }
  render();
});

// ===== Care (knowledge) Page =====
Router.register('care', function(root, params) {
  root.innerHTML = `
    <div style="padding:12px">
      <div class="care-hero">
        <div class="care-hero-title">📚 科学护理知识库</div>
        <div class="care-hero-desc">精选女性健康科普，愿你被温柔以待</div>
      </div>
      ${KnowledgeData && KnowledgeData.articles ? KnowledgeData.articles.map(a => `<div class="care-card" data-detail="${a.id}">
        <div class="care-card-title">${a.title}</div>
        <div class="care-card-meta"><span>📅 ${a.date}</span><span>⏱️ ${a.readTime}</span><span>❤️ ${a.likes} 喜欢</span></div>
        <div class="care-card-excerpt">${a.summary}</div>
      </div>`).join('') : '<div style="color:#999;text-align:center;padding:40px">暂无文章</div>'}
    </div>
  `;
  root.querySelectorAll('.care-card').forEach(c => c.onclick = () => {
    const id = c.dataset.detail;
    const art = KnowledgeData.articles.find(a => a.id === id);
    if (!art) return;
    Utils.modal({
      title: art.title,
      content: `<div style="max-height:60vh;overflow-y:auto;font-size:14px;line-height:1.8">${(art.content || art.summary || '').replace(/\n/g,'<br>')}</div>`,
      showCancel: false, confirmText: '好的'
    });
  });
});

// ===== Records (Health Profile) Page =====
Router.register('records', function(root, params) {
  function render() {
    const recs = Storage.get('medicalRecords') || [
      { id:'1', title:'首次健康建档', type:'profile', date:'2024-03-15', content:'初始周期28天，经期7天' },
      { id:'2', title:'年度体检', type:'checkup', date:'2024-05-20', content:'各项指标正常，轻微缺铁' },
      { id:'3', title:'痛经就诊', type:'visit', date:'2024-08-10', content:'开具止痛药，建议热敷' }
    ];

    root.innerHTML = `
      <div style="padding:12px">
        <div class="records-hero">
          <div class="rh-title">📋 我的健康档案</div>
          <div class="rh-desc">记录每一次就诊、体检和健康变化</div>
        </div>
        <button class="btn" style="width:100%;background:#ff5f8f;color:#fff;margin-bottom:12px" id="btnAddRecord">+ 添加记录</button>
        ${recs.length === 0 ? '<div style="color:#999;text-align:center;padding:40px">暂无档案记录</div>' :
          recs.map(r => `<div class="rec-item">
            <div class="rec-icon">${r.type==='profile'?'📝':r.type==='checkup'?'🔬':'🏥'}</div>
            <div style="flex:1">
              <div class="rec-title">${r.title}</div>
              <div class="rec-meta">
                <span>${r.date}</span>
                <span style="margin-left:8px;padding:1px 6px;background:#fce4ec;color:#ff5f8f;border-radius:10px;font-size:11px">${r.type==='profile'?'建档':r.type==='checkup'?'体检':'就诊'}</span>
              </div>
              <div class="rec-content">${r.content}</div>
            </div>
            <button style="color:#ccc;font-size:14px" data-del="${r.id}">🗑️</button>
          </div>`).join('')}
      </div>
    `;

    document.getElementById('btnAddRecord').onclick = () => {
      Utils.modal({
        title: '添加健康记录',
        content: `
          <input id="recTitle" placeholder="标题（如：XX体检/XX就诊）" style="width:100%;padding:8px;border:1px solid #eee;border-radius:6px;margin-bottom:6px;box-sizing:border-box"/>
          <select id="recType" style="width:100%;padding:8px;border:1px solid #eee;border-radius:6px;margin-bottom:6px">
            <option value="profile">建档</option>
            <option value="checkup">体检</option>
            <option value="visit">就诊</option>
          </select>
          <textarea id="recContent" placeholder="记录内容" style="width:100%;padding:8px;border:1px solid #eee;border-radius:6px;box-sizing:border-box;min-height:60px"></textarea>
        `,
        confirmText: '保存',
        onConfirm: () => {
          const title = document.getElementById('recTitle').value.trim();
          const type = document.getElementById('recType').value;
          const content = document.getElementById('recContent').value.trim();
          if (!title) return Utils.toast('请填写标题');
          const recs = Storage.get('medicalRecords') || [];
          recs.unshift({ id:Date.now()+'', title, type, date:Utils.fmtDate(new Date()), content });
          Storage.set('medicalRecords', recs);
          Utils.toast('已保存'); render();
        }
      });
    };
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const recs = Storage.get('medicalRecords') || [];
      Utils.modal({ title:'删除记录？', content:'此操作不可撤销', confirmText:'删除', onConfirm:()=>{
        const filtered = recs.filter(r => r.id !== id); Storage.set('medicalRecords', filtered); render();
      }});
    });
  }
  render();
});

// ===== Report Page =====
Router.register('report', function(root, params) {
  const daily = Storage.get('dailyPeriodRecords') || {};
  const diary = Storage.get('diary') || {};
  const pdDates = Object.keys(daily).filter(k => daily[k] && daily[k].status === 1).sort();
  const settings = Storage.get('periodSettings') || {};
  const cLen = settings.cycleLength || 28;

  let avgCycle = cLen, irregularity = '规律';
  if (pdDates.length >= 2) {
    const diffs = [];
    for (let i=1; i<pdDates.length; i++) diffs.push(Math.round((new Date(pdDates[i]) - new Date(pdDates[i-1]))/86400000));
    if (diffs.length) avgCycle = Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length);
    if (diffs.length >= 2) {
      const m = diffs.reduce((a,b)=>a+b,0)/diffs.length;
      const sd = Math.sqrt(diffs.reduce((s,v)=>s+Math.pow(v-m,2),0)/diffs.length);
      irregularity = sd > 8 ? '不规律 ⚠️' : sd > 4 ? '基本规律' : sd > 2 ? '比较规律' : '非常规律 🎉';
    }
  }

  const today = new Date();
  const moodDist = {};
  Object.values(diary).forEach(d => { if (d && d.mood) moodDist[d.mood] = (moodDist[d.mood]||0)+1; });
  const topMood = Object.entries(moodDist).sort((a,b)=>b[1]-a[1])[0] || ['暂无心情记录', 0];

  const suggestions = [];
  if (irregularity.indexOf('不规律') >= 0) suggestions.push('您的周期波动较大，建议保持规律作息、减轻压力，如持续不规律建议就医检查。');
  if (pdDates.length === 0) suggestions.push('您还没有记录经期哦，开始记录吧！');
  if (pdDates.length > 0 && new Date(pdDates[pdDates.length-1]) < new Date(today.getTime() - avgCycle * 86400000 * 1.5)) suggestions.push('距上次经期时间较长，如有不适建议检查。');
  if (topMood[0] === '难过' || topMood[0] === '焦虑') suggestions.push('检测到您近期情绪偏低，要照顾好自己哦 💗。');
  if (suggestions.length === 0) suggestions.push('您的身体状态整体良好，继续保持！');

  root.innerHTML = `
    <div style="padding:12px">
      <div class="report-hero">
        <div class="rh-title">🩺 AI 健康洞察报告</div>
        <div class="rh-date">报告生成时间：${Utils.fmtDate(new Date())}</div>
      </div>

      <div class="report-section">
        <div class="rs-title">📈 经期数据</div>
        <div class="rs-grid">
          <div class="rs-cell"><div class="rs-num">${pdDates.length}</div><div class="rs-lbl">经期记录天</div></div>
          <div class="rs-cell"><div class="rs-num">${avgCycle}</div><div class="rs-lbl">平均周期(天)</div></div>
          <div class="rs-cell"><div class="rs-num">${Object.keys(diary).length}</div><div class="rs-lbl">心情日记</div></div>
        </div>
        <div class="rs-row">周期状态：${irregularity}</div>
        <div class="rs-row">今日阶段：${(function(){
          const today2 = new Date(); const last = pdDates.length ? new Date(pdDates[pdDates.length-1]) : today2;
          const since = Math.ceil((today2-last)/86400000);
          if (pdDates.length === 0) return '未知';
          if (since <= 7) return '经期';
          if (since <= 12) return '卵泡期';
          if (since <= 20) return '排卵期';
          return '黄体期';
        })()}</div>
      </div>

      <div class="report-section">
        <div class="rs-title">💭 情绪洞察</div>
        ${Object.keys(moodDist).length === 0 ? '<div style="color:#999;font-size:13px">暂无心情日记，请记录后获得更精准分析</div>' :
          Object.entries(moodDist).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([m,c])=>{
            const max = topMood[1];
            const w = Math.round(c/max*100);
            return `<div style="display:flex;align-items:center;margin:4px 0;gap:8px"><span style="width:48px;font-size:12px">${m}</span><div style="flex:1;background:#f5f5f5;border-radius:8px;height:12px"><div style="background:linear-gradient(90deg,#ffb6c1,#ff5f8f);width:${w}%;height:100%;border-radius:8px"></div></div><span style="font-size:12px;color:#888;width:32px;text-align:right">${c}篇</span></div>`;
          }).join('')}
      </div>

      <div class="report-section">
        <div class="rs-title">💡 AI 健康建议</div>
        ${suggestions.map(s => `<div class="ai-card" style="border-left:3px solid #ff5f8f;margin-bottom:8px"><div>${s}</div></div>`).join('')}
        <div style="margin-top:10px;padding:10px;background:#fff5d6;border-radius:8px;font-size:12px;color:#a07400">
          ⚠️ 本报告由 AI 生成，仅供参考学习。如有不适症状请及时就医，不要替代专业诊断。
        </div>
      </div>

      <button class="btn" style="width:100%;background:#ff5f8f;color:#fff;margin-top:12px" onclick="Utils.toast('已复制到剪贴板'); Utils.copyText(document.body.innerText)">📤 分享报告</button>
      <button class="btn" style="width:100%;background:#fff;margin-top:6px;border:1px solid #ff5f8f;color:#ff5f8f" onclick="Router.goTab('ai')">💬 向小暖提问</button>
    </div>
  `;
});

// ===== Feedback Page =====
Router.register('feedback', function(root, params) {
  root.innerHTML = `
    <div style="padding:16px">
      <div style="font-size:14px;color:#888;margin-bottom:10px">告诉我们你的想法，让 Herbloom 更好 ✨</div>
      <textarea id="fbContent" placeholder="你的建议、遇到的问题、喜欢的地方..." style="width:100%;padding:10px;border:1px solid #eee;border-radius:10px;min-height:120px;box-sizing:border-box;font-size:14px"></textarea>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:#999;margin-bottom:6px">反馈类型</div>
        <div id="fbTypes" style="display:flex;gap:8px;flex-wrap:wrap">
          ${['功能建议','Bug反馈','使用问题','其他'].map((t,i)=>`<span class="tg-tag ${i===0?'on-trigger':''}" data-type="${t}" style="padding:6px 12px">${t}</span>`).join('')}
        </div>
      </div>
      <button class="btn" style="width:100%;background:#ff5f8f;color:#fff;margin-top:20px" id="btnSubmitFb">提交反馈</button>
    </div>
  `;
  let curType = '功能建议';
  root.querySelectorAll('.tg-tag').forEach(t => t.onclick = () => {
    curType = t.dataset.type;
    root.querySelectorAll('.tg-tag').forEach(x => x.classList.remove('on-trigger'));
    t.classList.add('on-trigger');
  });
  document.getElementById('btnSubmitFb').onclick = () => {
    const content = document.getElementById('fbContent').value.trim();
    if (!content) return Utils.toast('请写下你的反馈');
    const list = Storage.get('feedbacks') || [];
    list.unshift({ type: curType, content, time: new Date().toISOString() });
    Storage.set('feedbacks', list);
    Utils.toast('感谢你的反馈 💗');
    Router.back();
  };
});

// ===== About Page =====
Router.register('about', function(root, params) {
  root.innerHTML = `
    <div style="padding:24px 20px;text-align:center">
      <div style="font-size:60px">🌸</div>
      <div style="font-size:22px;font-weight:600;margin-top:8px">Herbloom</div>
      <div style="color:#999;font-size:13px;margin-top:4px">女性健康管家 · 温柔陪伴每一天</div>
      <div style="margin-top:30px;text-align:left;font-size:13px;color:#666;line-height:1.9;background:#fdf4f5;padding:16px;border-radius:12px">
        Herbloom 致力于为每一位女性提供科学、温和、可靠的健康管理方案。<br><br>
        ✅ 智能经期预测 &nbsp;✅ 心情日记疗愈<br>
        ✅ AI 健康问答 &nbsp;✅ 精选好物种草<br>
        ✅ 区块链数据存证<br><br>
        <span style="color:#999">数据与隐私：你记录的一切数据都属于你自己，端上加密存储，可选区块链上链存证。</span>
      </div>
      <div style="margin-top:20px;color:#bbb;font-size:11px">v1.0.0 · H5 Web Edition</div>
    </div>
  `;
});
