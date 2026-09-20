// ===== Diary Page - 心情日记 =====
Router.register('diary', function(root, params) {
  const MOOD_CATEGORIES = [
    { key:'happy', label:'愉悦', color:'#ffb6c1', items:[{emoji:'😊',label:'开心'},{emoji:'🥳',label:'兴奋'},{emoji:'😍',label:'满足'},{emoji:'😌',label:'平静'},{emoji:'🥰',label:'感恩'},{emoji:'🤩',label:'惊喜'},{emoji:'😂',label:'大笑'},{emoji:'😇',label:'幸福'}]},
    { key:'sad', label:'低落', color:'#7ea9e1', items:[{emoji:'😢',label:'难过'},{emoji:'😭',label:'委屈'},{emoji:'😔',label:'失落'},{emoji:'🥺',label:'受伤'},{emoji:'😞',label:'沮丧'},{emoji:'😣',label:'无助'},{emoji:'🥲',label:'心酸'},{emoji:'😿',label:'孤单'}]},
    { key:'angry', label:'愤怒', color:'#e8927c', items:[{emoji:'😡',label:'生气'},{emoji:'😤',label:'烦躁'},{emoji:'🤬',label:'愤怒'},{emoji:'💢',label:'不满'},{emoji:'🙄',label:'无语'},{emoji:'😒',label:'吐槽'}]},
    { key:'anxious', label:'焦虑', color:'#c9a0dc', items:[{emoji:'😰',label:'焦虑'},{emoji:'😨',label:'紧张'},{emoji:'😟',label:'担心'},{emoji:'🤔',label:'迷茫'},{emoji:'😵‍💫',label:'混乱'},{emoji:'😰',label:'压力'}]},
    { key:'tired', label:'疲惫', color:'#b8b8b8', items:[{emoji:'😴',label:'困倦'},{emoji:'😮‍💨',label:'累'},{emoji:'🥱',label:'无聊'},{emoji:'😶‍🌫️',label:'麻木'},{emoji:'🙃',label:'应付'},{emoji:'😵',label:'精疲力尽'}]},
    { key:'neutral', label:'中性', color:'#a8d5ba', items:[{emoji:'🙂',label:'一般'},{emoji:'😐',label:'平静'},{emoji:'🤗',label:'温暖'},{emoji:'🤓',label:'专注'},{emoji:'🧐',label:'思考'},{emoji:'😷',label:'低调'}]},
  ];
  const TRIGGER_TAGS = ['工作','学习','家庭','朋友','感情','金钱','健康','经期','天气','独处','美食','运动','睡眠','突发事件','其他'];
  const BODY_TAGS = ['无痛经','轻微痛经','严重痛经','腰酸','头痛','乳房胀痛','下腹坠胀','疲劳','失眠','食欲变化','长痘','水肿','情绪波动','手脚冰凉'];
  const INTENSITY_LABELS = ['很淡','有点','一般','挺强','非常'];
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: Utils.fmtDate(new Date()),
    activeCategory: 'happy',
    selectedEmoji: '',
    selectedMoodLabel: '',
    intensity: 3,
    selectedTriggers: [],
    selectedBodies: [],
    content: '',
    reloadSelected: true
  };

  function calcStats(diary) {
    const keys = Object.keys(diary).sort();
    const total = keys.length;
    const pad = n => String(n).padStart(2, '0');
    const prefix = state.year+'-'+pad(state.month+1)+'-';
    const monthCount = keys.filter(k => k.indexOf(prefix) === 0).length;
    let streak = 0;
    const cursor = new Date();
    if (!diary[Utils.fmtDate(cursor)]) cursor.setDate(cursor.getDate()-1);
    while (diary[Utils.fmtDate(cursor)]) { streak++; cursor.setDate(cursor.getDate()-1); }
    const moodDist = {};
    keys.filter(k => k.indexOf(prefix) === 0).forEach(k => {
      const d = diary[k]; const m = (d && d.mood) || '未分类';
      moodDist[m] = (moodDist[m] || 0) + 1;
    });
    return { streak, monthCount, total, moodDist };
  }

  function render() {
    const diary = Storage.get('diary') || {};
    const stats = calcStats(diary);

    // 仅当需要加载选中日期数据时（点了某天/首次打开），才把编辑区刷新为该天内容
    const currentDiary = diary[state.selectedDate];
    if (state.reloadSelected) {
      if (currentDiary) {
        state.selectedEmoji = currentDiary.emoji || '';
        state.selectedMoodLabel = currentDiary.mood || '';
        state.activeCategory = currentDiary.moodCategory || 'happy';
        state.intensity = currentDiary.intensity || 3;
        state.selectedTriggers = currentDiary.triggers || [];
        state.selectedBodies = currentDiary.body || [];
        state.content = currentDiary.content || '';
      } else {
        state.selectedEmoji = ''; state.selectedMoodLabel = ''; state.activeCategory = 'happy';
        state.intensity = 3; state.selectedTriggers = []; state.selectedBodies = []; state.content = '';
      }
      state.reloadSelected = false;
    }

    // days
    const days = [];
    const firstDay = new Date(state.year, state.month, 1);
    const lastDay = new Date(state.year, state.month+1, 0);
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(state.year, state.month, -i);
      days.push({ day: d.getDate(), date: Utils.fmtDate(d), isCurrent: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(state.year, state.month, i);
      days.push({ day: i, date: Utils.fmtDate(d), isCurrent: true, isToday: Utils.fmtDate(d) === Utils.fmtDate(new Date()) });
    }
    let nextDays = 42 - days.length;
    for (let i = 1; i <= nextDays; i++) {
      const d = new Date(state.year, state.month+1, i);
      days.push({ day: i, date: Utils.fmtDate(d), isCurrent: false });
    }

    const activeCat = MOOD_CATEGORIES.find(c => c.key === state.activeCategory);

    root.innerHTML = `
      <div class="diary-container">
        <div class="diary-stats">
          <div class="diary-stat"><div class="diary-stat-num">${stats.streak}</div><div class="diary-stat-lbl">🔥 连续打卡</div></div>
          <div class="diary-stat-divider"></div>
          <div class="diary-stat"><div class="diary-stat-num">${stats.monthCount}</div><div class="diary-stat-lbl">📅 本月篇数</div></div>
          <div class="diary-stat-divider"></div>
          <div class="diary-stat"><div class="diary-stat-num">${stats.total}</div><div class="diary-stat-lbl">✨ 累计篇数</div></div>
        </div>

        <div class="diary-cal">
          <div class="diary-cal-head">
            <button class="diary-cal-arrow" data-action="prev">‹</button>
            <div class="diary-cal-month">${state.year}年 ${state.month+1}月</div>
            <button class="diary-cal-arrow" data-action="next">›</button>
          </div>
          <div class="weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
          <div class="days-grid">
            ${days.map(d => `<div class="d ${!d.isCurrent?'dim':''} ${d.isToday?'today':''} ${d.date===state.selectedDate?'selected':''}" data-date="${d.date}"><span class="dn">${d.day}</span>${diary[d.date]?`<span class="de">${diary[d.date].emoji}</span>`:''}</div>`).join('')}
          </div>
        </div>

        <div class="diary-edit">
          <div class="diary-edit-head">
            <div class="diary-edit-title">✍️ ${state.selectedDate || '先选个日子'} 的心情</div>
            ${currentDiary ? '<button class="diary-edit-del" data-action="delete">🗑️</button>' : ''}
          </div>
          <div class="mood-cats">
            ${MOOD_CATEGORIES.map(c => `<div class="mood-cat ${state.activeCategory===c.key?'active':''}" data-cat="${c.key}" ${state.activeCategory===c.key?'style="background:'+c.color+'"':''}>${c.label}</div>`).join('')}
          </div>
          <div class="emoji-grid">
            ${activeCat ? activeCat.items.map(it => `<div class="emoji-cell ${state.selectedEmoji===it.emoji?'on':''}" data-emoji="${it.emoji}" data-label="${it.label}" ${state.selectedEmoji===it.emoji?'style="border-color:'+activeCat.color+';background:'+activeCat.color+'20"':''}>
              <span class="ec-emoji">${it.emoji}</span><span class="ec-label">${it.label}</span>
            </div>`).join('') : ''}
          </div>
          <div class="intensity-row">
            <span class="intensity-label">情绪强度</span>
            <input type="range" min="1" max="5" value="${state.intensity}" class="intensity-slider" id="intensitySlider"/>
            <span class="intensity-val">${INTENSITY_LABELS[state.intensity-1]}</span>
          </div>
          <div class="tag-group">
            <span class="tg-title">🔖 今天因为什么</span>
            <div class="tg-list">${TRIGGER_TAGS.map(t => `<span class="tg-tag ${state.selectedTriggers.includes(t)?'on-trigger':''}" data-trigger="${t}">${t}</span>`).join('')}</div>
          </div>
          <div class="tag-group">
            <span class="tg-title">💗 身体感受</span>
            <div class="tg-list">${BODY_TAGS.map(t => `<span class="tg-tag ${state.selectedBodies.includes(t)?'on-body':''}" data-body="${t}">${t}</span>`).join('')}</div>
          </div>
          <textarea class="diary-textarea" placeholder="今天发生了什么？有什么想记下来的..." id="diaryContent">${esc(state.content)}</textarea>
          ${state.selectedEmoji || state.selectedTriggers.length || state.selectedBodies.length ? `
          <div class="diary-summary">
            <span class="ss-emoji">${state.selectedEmoji}</span>
            <span class="ss-text">${state.selectedMoodLabel || '选个心情吧'}</span>
            ${state.selectedTriggers.length ? `<span class="ss-more">· ${state.selectedTriggers.join('/')}</span>` : ''}
            ${state.selectedBodies.length ? `<span class="ss-more">· ${state.selectedBodies.join('/')}</span>` : ''}
          </div>` : ''}
          <button class="save-diary-btn" data-action="save">💾 保存日记</button>
        </div>

        ${currentDiary ? `
        <div class="diary-show">
          <div class="diary-show-head">
            <div class="diary-show-emoji">${currentDiary.emoji}</div>
            <div class="diary-show-meta">
              <div class="diary-show-mood">${currentDiary.mood || '未命名心情'}</div>
              <div class="diary-show-intensity">强度 ${currentDiary.intensity || 3}/5</div>
            </div>
          </div>
          ${currentDiary.triggers && currentDiary.triggers.length ? `<div style="font-size:12px;color:#888;margin-bottom:4px">触发：${currentDiary.triggers.map(t=>'<span class="tag tag-pink">#'+t+'</span>').join(' ')}</div>` : ''}
          ${currentDiary.body && currentDiary.body.length ? `<div style="font-size:12px;color:#888;margin-bottom:6px">身体：${currentDiary.body.map(t=>'<span class="tag" style="background:#fff5d6;color:#c98800">'+t+'</span>').join(' ')}</div>` : ''}
          <div class="diary-show-content">${esc(currentDiary.content || '（无内容）')}</div>
          ${currentDiary.updatedAt ? `<span class="diary-show-time">更新于 ${new Date(currentDiary.updatedAt).toLocaleString()}</span>` : ''}
        </div>` : ''}

        ${stats.monthCount > 0 ? `
        <div class="dist-card">
          <span class="dist-title">📊 本月情绪分布</span>
          <div class="dist-tags">${Object.entries(stats.moodDist).map(([n,c])=>`<div class="dist-item"><span>${n}</span><span class="di-count">${c}</span></div>`).join('')}</div>
        </div>` : ''}

        <div class="ai-card" data-action="goai">
          <span class="ai-icon">💗</span>
          <div class="ai-info">
            <span class="ai-title">AI心情疗愈</span>
            <span class="ai-sub">${state.selectedEmoji ? '基于你今天的心情 '+state.selectedMoodLabel+'，小暖为你准备了专属建议' : '记录心情后获取 AI 专属疗愈建议'}</span>
          </div>
          <span class="ai-arrow">›</span>
        </div>
      </div>
    `;

    // events
    root.querySelectorAll('.diary-cal-arrow').forEach(b => b.onclick = () => {
      if (b.dataset.action === 'prev') { state.month--; if (state.month<0){state.month=11;state.year--;} }
      else { state.month++; if (state.month>11){state.month=0;state.year++;} }
      render();
    });
    root.querySelectorAll('.d').forEach(d => d.onclick = () => { state.selectedDate = d.dataset.date; state.reloadSelected = true; render(); });
    root.querySelectorAll('.mood-cat').forEach(b => b.onclick = () => { state.activeCategory = b.dataset.cat; render(); });
    root.querySelectorAll('.emoji-cell').forEach(c => c.onclick = () => { state.selectedEmoji = c.dataset.emoji; state.selectedMoodLabel = c.dataset.label; render(); });
    root.querySelectorAll('.tg-tag[data-trigger]').forEach(t => t.onclick = () => {
      const v = t.dataset.trigger; const idx = state.selectedTriggers.indexOf(v);
      if (idx >= 0) state.selectedTriggers.splice(idx, 1); else state.selectedTriggers.push(v);
      render();
    });
    root.querySelectorAll('.tg-tag[data-body]').forEach(t => t.onclick = () => {
      const v = t.dataset.body; const idx = state.selectedBodies.indexOf(v);
      if (idx >= 0) state.selectedBodies.splice(idx, 1); else state.selectedBodies.push(v);
      render();
    });
    const slider = document.getElementById('intensitySlider');
    if (slider) slider.oninput = e => { state.intensity = parseInt(e.target.value); document.querySelector('.intensity-val').textContent = INTENSITY_LABELS[state.intensity-1]; };
    const ta = document.getElementById('diaryContent');
    if (ta) ta.oninput = e => { state.content = e.target.value; };
    root.querySelector('[data-action="save"]').onclick = () => {
      if (!state.selectedDate) return Utils.toast('请先选择日期');
      if (!state.selectedEmoji) return Utils.toast('选一个心情吧');
      const diary = Storage.get('diary') || {};
      const entry = {
        emoji: state.selectedEmoji, mood: state.selectedMoodLabel, moodCategory: state.activeCategory,
        intensity: state.intensity, triggers: state.selectedTriggers, body: state.selectedBodies,
        content: state.content, createdAt: Date.now(), updatedAt: Date.now()
      };
      diary[state.selectedDate] = entry;
      Storage.set('diary', diary);
      Utils.toast('保存成功 ✨');
      render();
    };
    root.querySelector('[data-action="delete"]').onclick = () => {
      Utils.modal({
        title: '删除这篇日记？', content: '删除后无法恢复哦',
        confirmText: '删除', onConfirm: () => {
          const diary = Storage.get('diary') || {}; delete diary[state.selectedDate];
          Storage.set('diary', diary);
          state.selectedEmoji = ''; state.selectedMoodLabel = ''; state.selectedTriggers = []; state.selectedBodies = []; state.content = '';
          render(); Utils.toast('已删除');
        }
      });
    };
    root.querySelector('[data-action="goai"]').onclick = () => Router.goTab('ai');
  }

  render();
});
