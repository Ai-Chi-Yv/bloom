// ===== AI Chat Page - 升级版 =====
Router.register('ai', function(root, params) {
  const state = {
    tabIndex: 0,
    messages: [],
    agentMessages: [],
    inputText: '', agentInputText: '',
    isChatLoading: false, isAgentLoading: false,
    speakingId: null,
    blockchainRecords: [], lastChainTime: '--',
    blockDetail: null, showBlockDetail: false, showVerifyModal: false, verifyResult: null,
    quickQuestions: ['经期延迟怎么办？','如何缓解痛经？','经期可以运动吗？','如何调理月经周期？','推荐什么卫生巾？'],
    quickEmojis: ['😊','🥰','😢','😡','😰','😴','👍','💪','🙏','❤️','✨','🎉'],
    agentTools: [
      { name:'记录经期', icon:'📝', question:'我今天来月经了，帮我记录一下' },
      { name:'写心情日记', icon:'💭', question:'今天好开心，天气也不错，帮我写进日记' },
      { name:'加购卫生巾', icon:'🛒', question:'给我加3款平价优秀卫生巾到购物车' },
      { name:'避坑清理', icon:'⚠️', question:'帮我查一下需要避雷的产品' },
      { name:'经期设置', icon:'⚙️', question:'帮我把月经周期改成30天，经期5天' },
      { name:'清空购物车', icon:'🗑️', question:'帮我清空购物车' },
    ],
    refreshing: false
  };

  function fmtTime() { return new Date().getHours().toString().padStart(2,'0') + ':' + new Date().getMinutes().toString().padStart(2,'0'); }

  function loadRecommendLocal() {
    const daily = Storage.get('dailyPeriodRecords') || {};
    const diary = Storage.get('diary') || {};
    const settings = Storage.get('periodSettings') || {};
    const cLen = settings.cycleLength || 28;
    const pLen = settings.periodLength || 7;
    const pdDates = Object.keys(daily).filter(k => daily[k] && daily[k].status === 1).sort();

    let phase = '未知', daysToNext = 0;
    if (pdDates.length > 0) {
      const last = new Date(pdDates[pdDates.length - 1]);
      const next = new Date(last); next.setDate(last.getDate() + cLen);
      daysToNext = Math.max(0, Math.ceil((next - new Date())/86400000));
      const since = Math.ceil((new Date() - last)/86400000);
      if (since <= pLen) phase = '经期';
      else if (since <= pLen + 5) phase = '卵泡期';
      else if (daysToNext <= 14 && daysToNext > 8) phase = '排卵期';
      else if (daysToNext <= 8 && daysToNext > 0) phase = '黄体期';
      else phase = '卵泡期';
    }

    const todayStr = Utils.fmtDate(new Date());
    const todayRec = daily[todayStr];
    const dd = diary[todayStr];
    const symptoms = todayRec ? todayRec.symptoms || [] : [];
    const hasData = phase !== '未知' || dd || symptoms.length > 0;

    if (!hasData) {
      return { phase:'提示', recommendation:'👋 您好！为了给您提供更精准的健康建议，请先记录您的经期信息或心情日记哦~\n\n📅 在经期记录页面标记经期日期\n💭 记录每天的心情状态', products:[], medicalAdvice:[] };
    }

    const adviceMap = {
      '经期': '🌸 经期小贴士：\n• 注意保暖，避免受凉\n• 饮食清淡，多喝温水\n• 保证充足睡眠\n• 适当休息，避免剧烈运动',
      '卵泡期': '🌱 卵泡期小贴士：\n• 身体正在恢复，适合补充营养\n• 可以开始规律运动\n• 保持积极乐观的心态',
      '排卵期': '✨ 排卵期小贴士：\n• 雌激素水平较高，皮肤状态好\n• 精力充沛，适合重要工作\n• 注意个人卫生',
      '黄体期': '🌙 黄体期小贴士：\n• 孕激素升高，注意情绪调节\n• 减少咖啡因摄入\n• 适当补充镁元素（坚果、香蕉）'
    };
    const medAdvice = [];
    if (todayRec && todayRec.pain >= 2) medAdvice.push('检测到你有中度以上痛感，建议热敷+止痛药缓解，持续痛经需就医');
    if (todayRec && todayRec.flow >= 3) medAdvice.push('今日经血量较多，注意补充铁质（红枣、菠菜）');
    if (phase === '黄体期') medAdvice.push('黄体期情绪易波动，注意减压放松');

    let rec = adviceMap[phase] + '\n';
    if (symptoms.length) rec += `• 您记录的症状：${symptoms.join('、')}\n`;
    if (dd) rec += `\n💭 今日心情：${dd.emoji || ''} ${dd.mood || ''}\n`;
    rec += '\n📌 今日建议：保持规律作息、多喝水、适当运动30分钟、保持心情愉悦';

    let products = [];
    if (Catalog && Catalog.PRODUCTS) {
      if (phase === '经期') products = Catalog.PRODUCTS.filter(p => p.subCategory === '卫生巾').slice(0, 3);
      else if (phase === '排卵期') products = Catalog.PRODUCTS.filter(p => p.subCategory === '卫生湿巾').slice(0, 2);
      else products = Catalog.PRODUCTS.slice(0, 3);
    }
    products = products.map(p => { Catalog.decorateProduct && Catalog.decorateProduct(p); return p; });

    return { phase, recommendation: rec, products, medicalAdvice: medAdvice };
  }

  function loadBC() {
    const records = Storage.get('blockchainRecords') || [];
    state.blockchainRecords = records.slice(0, 50).map(r => ({
      ...r,
      hashShort: (r.block_hash || '').slice(0, 20),
      timeText: r.created_at ? new Date(r.created_at).toLocaleString() : ''
    }));
    state.lastChainTime = state.blockchainRecords[0]?.timeText || '--';
  }

  function render() {
    const container = root;
    const tabNames = ['智能推荐','AI问答','AI Agent','区块链'];

    container.innerHTML = `
      <div class="ai-page">
        <div class="ai-tabs">
          ${tabNames.map((t,i) => `<div class="ai-tab ${state.tabIndex===i?'active':''}" data-tab="${i}">${t}</div>`).join('')}
        </div>
        <div class="chat-body">
          ${state.tabIndex===0 ? renderRecommend() : ''}
          ${state.tabIndex===1 ? renderChat() : ''}
          ${state.tabIndex===2 ? renderAgent() : ''}
          ${state.tabIndex===3 ? renderBlockchain() : ''}
        </div>
        ${state.showBlockDetail || state.showVerifyModal ? renderModal() : ''}
      </div>
    `;

    container.querySelectorAll('.ai-tab').forEach(b => b.onclick = () => { state.tabIndex = parseInt(b.dataset.tab); render(); });

    if (state.tabIndex === 0) {
      const rb = container.querySelector('[data-go-report]');
      if (rb) rb.onclick = () => Router.go('report');
      container.querySelectorAll('.quick-item').forEach(b => b.onclick = () => { state.inputText = b.textContent; state.tabIndex = 1; render(); });
      container.querySelectorAll('[data-refresh-rec]').forEach(b => {
        let loading = false;
        b.onclick = () => { if (loading) return; loading = true; state.refreshing = true; b.textContent = '刷新中...'; setTimeout(()=>{ loading=false; state.refreshing=false; b.textContent='🔄 刷新'; render(); }, 800); };
      });
      container.querySelectorAll('.rec-product-card').forEach(c => c.onclick = () => Router.go('product', { id: c.dataset.id }));
    }
    if (state.tabIndex === 1) {
      const sendBtn = container.querySelector('[data-chat-send]');
      const input = container.querySelector('#chatInput');
      if (input) input.oninput = e => { state.inputText = e.target.value; sendBtn.style.background = state.inputText ? 'linear-gradient(135deg,#ff8fb1,#ff5f8f)' : '#ddd'; };
      if (input) input.onkeydown = e => { if (e.key === 'Enter') sendChat(); };
      if (sendBtn) sendBtn.onclick = sendChat;
      container.querySelectorAll('[data-emoji]').forEach(b => b.onclick = () => { state.inputText += b.dataset.emoji; input.value = state.inputText; });
      container.querySelector('[data-chat-clear]').onclick = () => { state.messages = []; render(); };
      container.querySelectorAll('[data-speak]').forEach(b => b.onclick = () => {
        const idx = parseInt(b.dataset.index);
        if (state.speakingId === idx) { state.speakingId = null; } else { state.speakingId = idx; Utils.toast('🔊 模拟语音播报中（H5本地模式）'); setTimeout(()=>{ state.speakingId=null; render(); }, 3000); }
        render();
      });
      container.querySelectorAll('[data-copy-msg]').forEach(b => b.onclick = () => Utils.copyText(b.dataset.content));
      container.querySelectorAll('[data-fav-msg]').forEach(b => b.onclick = () => { const favs = Storage.get('fav_messages') || []; favs.push({ content: b.dataset.content, time: new Date().toISOString() }); Storage.set('fav_messages', favs); Utils.toast('⭐ 已收藏'); });
      container.querySelectorAll('[data-del-msg]').forEach(b => b.onclick = () => { state.messages.splice(parseInt(b.dataset.index),1); render(); });
    }
    if (state.tabIndex === 2) {
      const agentInput = container.querySelector('#agentInput');
      const agentSend = container.querySelector('[data-agent-send]');
      if (agentInput) agentInput.oninput = e => { state.agentInputText = e.target.value; };
      if (agentInput) agentInput.onkeydown = e => { if (e.key === 'Enter') sendAgent(); };
      if (agentSend) agentSend.onclick = sendAgent;
      container.querySelector('[data-agent-stop]').onclick = () => { state.isAgentLoading = false; render(); Utils.toast('已停止'); };
      container.querySelectorAll('[data-agent-tool]').forEach(b => b.onclick = () => { state.agentInputText = b.dataset.question; agentInput.value = state.agentInputText; });
      container.querySelectorAll('[data-agent-action]').forEach(b => {
        b.onclick = () => {
          const map = { goHealth:'health', goCare:'care', goPeriod:'period', goMood:'diary', goRecords:'records', goCart:'cart', goFavorites:'favorites', goProduct:'product' };
          if (map[b.dataset.action]) Router.go(map[b.dataset.action]);
        };
      });
    }
    if (state.tabIndex === 3) {
      container.querySelector('[data-bc-record]').onclick = recordOnChain;
      container.querySelector('[data-bc-verify]').onclick = verifyChain;
      container.querySelectorAll('.bc-item').forEach(c => c.onclick = () => {
        const idx = parseInt(c.dataset.idx);
        state.blockDetail = state.blockchainRecords[idx];
        state.showBlockDetail = true; render();
      });
      container.querySelectorAll('[data-copy-hash]').forEach(b => b.onclick = (e) => { e.stopPropagation(); Utils.copyText(b.dataset.hash); });
    }
    if (state.showBlockDetail || state.showVerifyModal) {
      container.querySelector('[data-modal-close]').onclick = () => { state.showBlockDetail = false; state.showVerifyModal = false; state.blockDetail = null; state.verifyResult = null; render(); };
      container.querySelector('[data-modal-mask]').onclick = () => { state.showBlockDetail = false; state.showVerifyModal = false; state.blockDetail = null; state.verifyResult = null; render(); };
    }
  }

  function renderRecommend() {
    const data = loadRecommendLocal();
    const productsHTML = data.products && data.products.length > 0 ?
      `<div class="rec-products">
        <div class="rp-title"><span>🛍️ 为你智能挑选</span></div>
        <div class="rp-scroll">
          ${data.products.map(p => `<div class="rp-card rec-product-card" data-id="${p.id}">
            <div class="pd-ph" style="background:linear-gradient(135deg,${p.placeholder?.from||'#ffb6c1'},${p.placeholder?.to||'#ff8fab'})"><span class="p-ph-char">${p.placeholder?.char||'🌸'}</span></div>
            <div class="rp-name">${p.name}</div>
            <div class="rp-brand" style="font-size:10px;color:#999">${p.brand||''}</div>
            <div class="rp-meta"><span class="rp-price" style="color:#ff5f8f">¥${p.price}</span></div>
          </div>`).join('')}
        </div>
      </div>` : '';

    return `
      <div style="flex:1;overflow-y:auto;padding:8px">
        <div class="report-entry" data-go-report>
          <div class="re-left"><span class="re-icon">🩺</span>
            <div><span class="re-title">AI 健康洞察报告</span><span class="re-desc">经期×情绪×症状生成专属身心分析</span></div>
          </div><span class="re-arrow">›</span>
        </div>
        <div class="recommend-card">
          <div class="rec-hdr"><span class="rec-icon">💡</span><span class="rec-title">今日智能推荐</span><span class="rec-phase">${data.phase}</span><span data-refresh-rec style="margin-left:auto;font-size:12px;color:#ff5f8f;cursor:pointer">🔄 刷新</span></div>
          <div class="rec-content">${data.recommendation.replace(/\n/g,'<br>')}</div>
          ${data.medicalAdvice && data.medicalAdvice.length > 0 ? `
          <div class="med-advice">
            <div class="ma-title">🩺 医疗建议与风险提醒</div>
            ${data.medicalAdvice.map(t => `<div class="ma-item"><span class="ma-dot">•</span><span>${t}</span></div>`).join('')}
          </div>` : ''}
          ${productsHTML}
          <div class="rec-disclaimer">以上建议仅供参考，如有不适请及时就医</div>
        </div>
        <div class="quick-section">
          <div class="quick-title">快捷提问</div>
          <div class="quick-list">${state.quickQuestions.map(q=>`<div class="quick-item">${q}</div>`).join('')}</div>
        </div>
      </div>
    `;
  }

  function renderChat() {
    return `
      <div class="chat-body">
        <div class="chat-toolbar"><span class="ct-title">💬 AI 智能问答</span><span class="ct-clear" data-chat-clear>🗑️ 清空</span></div>
        <div class="chat-scroll" id="chatScroll" style="flex:1;overflow-y:auto;padding:8px">
          ${state.messages.length === 0 ? `<div style="text-align:center;padding:40px 20px;color:#999">🤖 你好，我是小暖AI助手~<br><br>请问我能帮你什么？</div>` :
            state.messages.map((m,i) => `<div class="msg-row ${m.role==='user'?'right':'left'}">
              <div class="msg-bubble ${m.role==='user'?'right':'left'}">
                ${m.content.replace(/\n/g,'<br>')}
                ${m.role==='assistant' ? `<div class="speak-btn ${state.speakingId===i?'speaking':''}" data-speak data-index="${i}">${state.speakingId===i?'🔊 播报中':'🔈 语音播报'}</div>
                <div class="msg-action-row">
                  <span class="msg-act" data-copy-msg data-content="${m.content}">📋 复制</span>
                  <span class="msg-act" data-fav-msg data-content="${m.content}">⭐ 收藏</span>
                  <span class="msg-act" data-del-msg data-index="${i}">🗑️ 删除</span>
                </div>` : ''}
                <div class="msg-ts">${m.time}</div>
              </div>
            </div>`).join('')}
          ${state.isChatLoading ? `<div class="typing-row"><div class="typing-d"></div><div class="typing-d"></div><div class="typing-d"></div></div>` : ''}
        </div>
        <div class="input-area">
          ${state.inputText.length === 0 ? `<div class="emoji-bar">${state.quickEmojis.map(e => `<span class="emoji-chip" data-emoji="${e}">${e}</span>`).join('')}</div>` : ''}
          <div class="input-row">
            <div class="inp-box"><input class="inp-input" id="chatInput" value="${state.inputText}" placeholder="向小暖提问..."/></div>
            <div class="inp-send" data-chat-send>发送</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAgent() {
    return `
      <div class="chat-body">
        <div class="chat-toolbar"><span class="ct-title">🤖 AI Agent · 智能执行</span><span style="font-size:11px;color:#999">我能帮你做事，不只是回答</span></div>
        <div class="chat-scroll" style="flex:1;overflow-y:auto;padding:8px">
          ${state.agentMessages.length === 0 ? `<div style="text-align:center;padding:30px 10px;color:#999;font-size:13px">🤖 你好！我是小暖 AI Agent——<br><br>说「我今天来月经了」<br>说「帮我加3款卫生巾到购物车」<br>说「把周期改成30天经期5天」</div>` :
            state.agentMessages.map(m => renderAgentMsg(m)).join('')}
          ${state.isAgentLoading ? `<div class="typing-row"><div class="typing-d"></div><div class="typing-d"></div><div class="typing-d"></div></div>` : ''}
        </div>
        <div class="agent-tool-strip">${state.agentTools.map(t => `<div class="agent-chip ${state.isAgentLoading?'chip-disabled':''}" data-agent-tool data-question="${t.question}"><span class="agent-chip-icon">${t.icon}</span><span class="agent-chip-name">${t.name}</span></div>`).join('')}</div>
        <div class="input-area">
          <div class="input-row">
            <div class="inp-box"><input class="inp-input" id="agentInput" value="${state.agentInputText}" placeholder="向 Agent 下指令..." ${state.isAgentLoading?'disabled':''}/></div>
            ${state.isAgentLoading ? `<div class="inp-stop" data-agent-stop>停止</div>` : `<div class="inp-send" data-agent-send>发送</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderAgentMsg(m) {
    if (m.type === 'trace') {
      return `<div class="msg-row left"><div class="msg-bubble left">
        <div class="trace-card">
          <div class="trace-head"><span class="trace-gear">⚙️</span><span class="trace-title">${m.traceTitle}</span></div>
          ${m.pending ? `<div class="trace-pending"><div class="trace-loader"><div class="trace-loader-bar"></div></div><span class="trace-hint">${m.hint}</span></div>` : ''}
          ${!m.pending && m.planStepCount ? `<div class="trace-cog-row">
            <span class="trace-cog cog-plan">🧠 规划${m.planStepCount}步</span>
            ${m.reflectCount>0 ? `<span class="trace-cog cog-reflect">🔄 反思${m.reflectCount}次</span>` : ''}
            ${m.memoryCount>0 ? `<span class="trace-cog cog-mem">📝 记忆${m.memoryCount}条</span>` : ''}
            <span class="trace-cog cog-time">⏱ ${m.executionLabel}</span>
          </div>` : ''}
          ${m.steps ? m.steps.map(s => `<div class="trace-step"><span class="trace-state">${s.ok?'✅':'❌'}</span><div class="step-texts"><span class="step-label">${s.label}</span><div class="step-summary">${s.summary||''}</div></div></div>`).join('') : ''}
          ${m.reflectBarText ? `<div class="trace-reflect-bar">${m.reflectBarText}</div>` : ''}
          ${m.actionButtons && m.actionButtons.length ? `<div class="agent-actions">${m.actionButtons.map(a=>`<button class="agent-act-btn" data-agent-action="${a.action}">${a.label}</button>`).join('')}</div>` : ''}
        </div>
        ${m.time ? `<div class="msg-ts">${m.time}</div>` : ''}
      </div></div>`;
    }
    return `<div class="msg-row ${m.role==='user'?'right':'left'}"><div class="msg-bubble ${m.role==='user'?'right':'left'}">
      ${m.content.replace(/\n/g,'<br>')}
      ${m.actionButtons && m.actionButtons.length ? `<div class="agent-actions">${m.actionButtons.map(a=>`<button class="agent-act-btn" data-agent-action="${a.action}">${a.label}</button>`).join('')}</div>` : ''}
      ${m.time ? `<div class="msg-ts">${m.time}</div>` : ''}
    </div></div>`;
  }

  function renderBlockchain() {
    loadBC();
    return `
      <div style="flex:1;overflow-y:auto;padding:8px">
        <div class="bc-overview">
          <div class="bc-ov-head"><span class="bc-ov-title">🔗 个人数据上链存证</span><span class="bc-ov-dot"></span><span class="bc-ov-status">实时</span></div>
          <div class="bc-ov-stats">
            <div class="bc-ov-cell"><span class="bc-ov-num">${state.blockchainRecords.length}</span><span class="bc-ov-lbl">存证记录</span></div>
            <div class="bc-ov-divider"></div>
            <div class="bc-ov-cell"><span class="bc-ov-num" style="font-size:12px">${state.lastChainTime}</span><span class="bc-ov-lbl">最近上链</span></div>
          </div>
        </div>
        <div class="bc-actions">
          <button class="bc-btn bc-1" data-bc-record>📝 数据上链</button>
          <button class="bc-btn bc-2" data-bc-verify>🔍 验证链</button>
        </div>
        ${state.blockchainRecords.length === 0 ? `<div class="bc-empty">暂无存证记录，点「📝 数据上链」开始</div>` :
          state.blockchainRecords.map((r,i) => `<div class="bc-item" data-idx="${i}">
            <div class="bc-top"><span class="bc-idx">#${r.block_index}</span><span class="bc-type">${r.record_type}</span><span class="bc-copy" data-copy-hash data-hash="${r.block_hash}">📋 复制 Hash</span></div>
            <div class="bc-hash"><span class="bc-lbl" style="color:#bbb;font-size:10px">哈希</span> <span style="word-break:break-all">${r.hashShort}...</span></div>
            <div class="bc-sum">${r.data_summary || ''}</div>
            <div class="bc-time">${r.timeText}</div>
          </div>`).join('')}
      </div>
    `;
  }

  function renderModal() {
    let body = '';
    if (state.showBlockDetail && state.blockDetail) {
      const b = state.blockDetail;
      body = `<div class="modal-row"><span class="modal-lbl">区块号</span><span>#${b.block_index}</span></div>
        <div class="modal-row"><span class="modal-lbl">类型</span><span>${b.record_type}</span></div>
        <div class="modal-row"><span class="modal-lbl">摘要</span><span>${b.data_summary||'-'}</span></div>
        <div class="modal-row"><span class="modal-lbl">哈希</span><span class="mono" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.block_hash}</span></div>
        <div class="modal-row"><span class="modal-lbl">前哈希</span><span class="mono">${b.previous_hash||'-'}</span></div>
        <div class="modal-row"><span class="modal-lbl">时间</span><span>${new Date(b.created_at).toLocaleString()}</span></div>
        <div class="modal-row"><span class="modal-lbl">状态</span><span style="color:#07c160">✅ 已验证</span></div>`;
    }
    return `<div class="modal-mask" data-modal-mask><div class="modal-box">
      <div class="modal-hdr">区块详情</div>
      ${body}
      <button class="modal-close" data-modal-close>关闭</button>
    </div></div>`;
  }

  function sendChat() {
    const text = state.inputText.trim();
    if (!text || state.isChatLoading) return;
    state.messages.push({ role:'user', content:text, time: fmtTime() });
    state.inputText = ''; state.isChatLoading = true; render();
    setTimeout(() => {
      state.messages.push({ role:'assistant', content: generateLocalReply(text), time: fmtTime() });
      state.isChatLoading = false; render();
    }, 900);
  }

  function generateLocalReply(text) {
    const lower = text.toLowerCase();
    if (lower.indexOf('痛经') >= 0 || lower.indexOf('痛') >= 0) return '痛经缓解建议：\n• 用热水袋或暖宝宝热敷腹部\n• 适当饮用红糖姜茶\n• 避免生冷食物和剧烈运动\n• 保证充足睡眠\n• 如果疼痛严重，可考虑短期服用止痛药\n\n如痛经持续加重或影响生活，建议及时就医检查。';
    if (lower.indexOf('提前') >= 0 || lower.indexOf('延迟') >= 0 || lower.indexOf('推迟') >= 0) return '经期提前/延迟的常见原因：\n• 压力过大或情绪波动\n• 生活作息不规律\n• 饮食变化或体重变化\n• 剧烈运动\n• 环境变化\n\n偶尔一次波动不必担心。如果连续3个周期不规律，建议就医检查。';
    if (lower.indexOf('运动') >= 0) return '经期运动建议：\n✅ 可以：散步、轻柔瑜伽、拉伸\n❌ 避免：跑步、游泳、力量训练、剧烈运动\n\n适量运动有助于缓解经期不适，但要注意不要过度。';
    if (lower.indexOf('卫生巾') >= 0 || lower.indexOf('护垫') >= 0) return '卫生巾选购建议：\n1. 优先选择医护级/消毒级认证产品\n2. 敏感肌选纯棉表层\n3. 避免含香精、药物成分的\n4. 勤更换（2-3小时一次）\n\n去「健康防护」页面查看精选推荐~';
    if (lower.indexOf('怀孕') >= 0 || lower.indexOf('备孕') >= 0) return '备孕建议：\n• 孕前3个月开始补充叶酸\n• 保持规律作息和健康饮食\n• 戒烟戒酒\n• 进行孕前检查\n• 监测排卵日（下次月经前14天）';
    if (lower.indexOf('情绪') >= 0 || lower.indexOf('心情') >= 0) return '情绪低落时可以试试：\n• 与信任的人聊一聊\n• 做自己喜欢的事转移注意力\n• 保持规律作息\n• 适当运动有助于改善情绪\n• 严重时建议寻求专业心理咨询';
    if (lower.indexOf('你好') >= 0 || lower.indexOf('在吗') >= 0) return '你好呀 💗 我是小暖，你的健康助手。有什么可以帮你的？';
    return '我理解你的问题了。建议你：\n\n1. 保持规律作息\n2. 均衡饮食\n3. 适当运动\n4. 关注身体信号\n\n具体问题也可以告诉我更多细节~';
  }

  function sendAgent() {
    const text = state.agentInputText.trim();
    if (!text || state.isAgentLoading) return;
    state.agentMessages.push({ role:'user', content:text });
    state.agentInputText = ''; state.isAgentLoading = true;

    // trace pending
    const traceId = Date.now();
    state.agentMessages.push({ id: traceId, role:'assistant', type:'trace', traceTitle:'正在规划执行步骤...', pending:true, hint:'AI 正在分析任务...' });
    render();

    setTimeout(() => {
      // resolve trace
      const last = state.agentMessages[state.agentMessages.length - 1];
      if (last && last.id === traceId && last.pending) {
        let steps = [], reply = '', actionButtons = [], reflectBar = '', planStepCount = 3, reflectCount = 0, memoryCount = 0;

        if (text.indexOf('来月经') >= 0 || text.indexOf('记录经期') >= 0) {
          const records = Storage.get('dailyPeriodRecords') || {};
          records[Utils.fmtDate(new Date())] = { status:1, flow:0, pain:0, symptoms:[] };
          Storage.set('dailyPeriodRecords', records);
          steps = [{ label:'解析意图：记录经期', summary:'识别为经期记录请求', ok:true }, { label:'验证今日日期', summary:Utils.fmtDate(new Date()), ok:true }, { label:'写入本地存储', summary:'Storage set dailyPeriodRecords ✓', ok:true }];
          planStepCount = 3; memoryCount = 1; reflectBar = '✅ 记录成功，建议补充流量/痛感';
          actionButtons = [{ label:'📅 去经期记录', action:'goPeriod' }];
          reply = '✅ 已为你记录今天来月经了！建议你去「经期记录」页面补充流量、痛感和症状详情~';
        } else if (text.indexOf('日记') >= 0 || text.indexOf('心情') >= 0) {
          steps = [{ label:'识别心情日记请求', ok:true }, { label:'准备跳转', summary:'打开日记 Tab', ok:true }];
          reflectBar = '去「心情日记」页面选个 emoji 吧 💗';
          actionButtons = [{ label:'💭 去心情日记', action:'goMood' }];
          reply = '📝 好的，去「心情日记」页面记录吧！';
        } else if (text.indexOf('加') >= 0 || text.indexOf('购物车') >= 0) {
          const cart = Storage.get('cart') || [];
          const targetProds = Catalog.PRODUCTS.filter(p => p.subCategory === '卫生巾').slice(0, 3);
          targetProds.forEach(p => {
            if (!cart.find(c => c.id === p.id)) cart.push({ id:p.id, name:p.name, brand:p.brand, price:String(p.price), quantity:1, checked:true, addedTime:Date.now() });
          });
          Storage.set('cart', cart);
          steps = [{ label:'查询商品目录', summary:'找到3款卫生巾', ok:true }, { label:'写入购物车', summary:`当前购物车 ${cart.length} 件`, ok:true }, { label:'生成办事按钮', ok:true }];
          planStepCount = 3; reflectCount = 1; memoryCount = 1;
          reflectBar = '🛒 加购完成！';
          actionButtons = [{ label:'🛒 去购物车看看', action:'goCart' }];
          reply = `🛒 已帮你加了 ${targetProds.length} 款卫生巾到购物车！`;
        } else if (text.indexOf('避雷') >= 0) {
          steps = [{ label:'查询避雷清单', summary:'5+ 款避雷产品', ok:true }];
          actionButtons = [{ label:'⚠️ 查看避雷清单', action:'goHealth' }];
          reflectBar = '去「健康防护」→ 消费避雷 Tab';
          reply = '⚠️ 为你查询需要避雷的产品清单，去「健康防护」→ 消费避雷 Tab 查看完整列表！';
        } else if (text.indexOf('周期') >= 0 || text.indexOf('设置') >= 0) {
          const numMatch = text.match(/(\d+)\s*天/);
          if (numMatch) {
            const num = parseInt(numMatch[1]);
            const settings = Storage.get('periodSettings') || {};
            if (text.indexOf('经期') >= 0 || text.indexOf('天数') >= 0) { settings.periodLength = num; }
            else { settings.cycleLength = num; }
            Storage.set('periodSettings', settings);
            steps = [{ label:'解析数值：'+num+'天', ok:true }, { label:'写入 periodSettings', ok:true }, { label:'重算经期预测', summary:'智能算法已启动', ok:true }];
            planStepCount = 3; reflectBar = '⚙️ 设置已更新！';
            reply = `⚙️ 已更新设置！${text.indexOf('经期') >= 0 ? '经期' : '周期'}已改为 ${num} 天。`;
          } else {
            reply = '⚙️ 请告诉我具体天数，比如「把周期改成30天」';
          }
        } else if (text.indexOf('清空') >= 0) {
          Storage.set('cart', []);
          steps = [{ label:'清空购物车 Storage', ok:true }];
          reply = '🗑️ 购物车已清空！';
        } else {
          steps = [{ label:'理解用户意图', summary:'H5 Agent 能力有限', ok:true }, { label:'建议替代方案', summary:'引导到对应页面', ok:true }];
          reply = '我理解你的需求了，但当前 H5 版本 Agent 能力有限。你可以试试：\n\n• 「帮我加3款卫生巾到购物车」\n• 「我今天来月经了」\n• 「把周期改成30天」';
        }

        state.agentMessages[state.agentMessages.length - 1] = {
          id: traceId, role:'assistant', type:'trace', traceTitle:'Agent 执行完成', pending:false,
          planStepCount, reflectCount, memoryCount, executionLabel:'1.5s',
          steps, reflectBarText: reflectBar, actionButtons
        };
        state.agentMessages.push({ role:'assistant', content:reply, actionButtons });
        state.isAgentLoading = false;
        render();
      }
    }, 1200);
  }

  function recordOnChain() {
    const daily = Storage.get('dailyPeriodRecords') || {};
    const diary = Storage.get('diary') || {};
    const records = Storage.get('blockchainRecords') || [];
    const hash = '0x' + Array.from({length:40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    records.unshift({
      block_index: records.length + 1,
      block_hash: hash,
      previous_hash: records[0]?.block_hash || '0x0000',
      record_type: 'health',
      data_summary: `经期${Object.keys(daily).length}条，日记${Object.keys(diary).length}篇`,
      created_at: new Date().toISOString()
    });
    Storage.set('blockchainRecords', records);
    Utils.toast('已上链存证 ✅'); render();
  }

  function verifyChain() {
    const records = Storage.get('blockchainRecords') || [];
    if (records.length === 0) { Utils.toast('暂无存证记录'); return; }
    state.verifyResult = { allValid: true, results: records.map(r => ({ blockIndex: r.block_index, valid: true })) };
    state.showVerifyModal = true; render();
  }

  if (state.messages.length === 0) {
    state.messages.push({ role:'assistant', content:'你好！我是小暖AI助手，有什么健康问题都可以问我~ 💗', time: fmtTime() });
  }

  render();
});
