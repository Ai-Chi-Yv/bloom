// ===== Symptoms Page =====
Router.register('symptoms', function(root, params) {
  const SYMPTOMS = ['腹痛','腰酸','乳房胀痛','头痛','恶心','腹泻','便秘','失眠','食欲变化','情绪波动','长痘','水肿','手脚冰凉','乏力','头晕','痛经'];
  const state = { selected: params.symptoms ? JSON.parse(decodeURIComponent(params.symptoms)) : [] };

  root.innerHTML = `
    <div style="padding:16px">
      <div style="font-size:13px;color:#999;margin-bottom:10px">选择你经历的症状（可多选）</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${SYMPTOMS.map(s => `<span class="sym-tag ${state.selected.includes(s)?'on':''}" data-sym="${s}">${s}</span>`).join('')}
      </div>
      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn" style="flex:1;background:#f5f5f5;color:#666" id="btnCancel">取消</button>
        <button class="btn" style="flex:1;background:#ff5f8f;color:#fff" id="btnSave">确认 ${state.selected.length ? '('+state.selected.length+')' : ''}</button>
      </div>
    </div>
  `;

  root.querySelectorAll('.sym-tag').forEach(t => t.onclick = () => {
    const v = t.dataset.sym;
    const idx = state.selected.indexOf(v);
    if (idx >= 0) state.selected.splice(idx, 1); else state.selected.push(v);
    t.classList.toggle('on');
    document.getElementById('btnSave').textContent = '确认' + (state.selected.length ? '('+state.selected.length+')' : '');
  });

  document.getElementById('btnCancel').onclick = () => Router.back();
  document.getElementById('btnSave').onclick = () => {
    // 把所选症状和来源日期一起存到 sessionStorage，退回经期页后由其应用
    sessionStorage.setItem('pending_period_symptoms', JSON.stringify({ date: params.date || '', symptoms: state.selected }));
    Router.back();
  };
});
