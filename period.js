// ===== Period Page - 经期记录 (与原小程序算法 1:1 对齐) =====
Router.register('period', function(root, params) {
  const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weekdays: ['日','一','二','三','四','五','六'],
    selectedDate: '',
    periodStatus: 0,
    flowLevel: 0,
    painLevel: 0,
    selectedSymptoms: [],
    periodLength: 7, cycleLength: 28,
    dailyRecords: {},
    predictedPeriods: [], predictedOvulations: [], predictedOvulationDays: [],
    extendedDates: [],
    nextPeriodDate: '', nextOvulationPeriod: '', nextOvulationDay: '',
    daysToNextPeriod: 0,
    currentPhase: '', currentPhaseDesc: '', phaseForAI: '',
    futurePredictions: [],
    avgCycleLength: 28, avgPeriodLength: 7,
    cycleRegularity: '暂无数据',
    showHealthAdvice: true,
    healthAdvice: {},
    isIrregular: false, irregularAdvice: '',
    predictionConfidence: { confidence: 30, level: '低', color: '#e74c3c' },
    healthWarnings: []
  };

  function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return parseInt(parts[0]) + '-' + parseInt(parts[1]) + '-' + parseInt(parts[2]);
  }
  function dateInList(dateStr, dateList) {
    if (!dateList || !Array.isArray(dateList)) return false;
    const n1 = normalizeDate(dateStr);
    for (let i = 0; i < dateList.length; i++) if (normalizeDate(dateList[i]) === n1) return true;
    return false;
  }
  function fmt(d) { return d.getFullYear()+'-'+Utils.pad2(d.getMonth()+1)+'-'+Utils.pad2(d.getDate()); }

  // ====== 算法模块 ======
  function findPeriodGroups(periodDates, periodLength) {
    if (periodDates.length === 0) return [];
    const sorted = periodDates.slice().sort();
    const groups = []; let cur = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i-1]); const curDate = new Date(sorted[i]);
      if (Math.round((curDate - prev)/86400000) <= periodLength + 1) cur.push(sorted[i]);
      else { groups.push(cur); cur = [sorted[i]]; }
    }
    groups.push(cur); return groups;
  }
  function extractStartDates(groups) { return groups.map(g => g[0]); }
  function extendPeriodGroups(groups, periodDates, periodLength) {
    const extGroups = []; const extDates = [];
    for (const group of groups) {
      const minDate = new Date(group[0]);
      const maxDate = new Date(group[group.length-1]);
      const actualLen = Math.round((maxDate - minDate)/86400000) + 1;
      const daysToExtend = periodLength - actualLen;
      if (daysToExtend > 0) maxDate.setDate(maxDate.getDate() + daysToExtend);
      extGroups.push({
        startDate: fmt(minDate), endDate: fmt(maxDate), originalDates: group
      });
      for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate()+1)) {
        const ds = normalizeDate(fmt(d));
        if (!dateInList(ds, periodDates) && !dateInList(ds, extDates)) extDates.push(ds);
      }
    }
    return { groups: extGroups, extendedDates: extDates };
  }
  function calculateSmartValues(dailyRecords) {
    const periodDates = Object.keys(dailyRecords).filter(k => dailyRecords[k] && dailyRecords[k].status === 1).sort();
    if (periodDates.length < 5) return { avgPeriod: 7, avgCycle: 28, cycleCount: 0, hasEnoughData: false };
    const groups = findPeriodGroups(periodDates, 15);
    const startDates = extractStartDates(groups);
    if (startDates.length < 2) return { avgPeriod: 7, avgCycle: 28, cycleCount: 0, hasEnoughData: false };
    const avgPeriod = calculateAvgPeriodLength(groups);
    const avgCycle = calculateAvgCycleLength(startDates);
    return { avgPeriod, avgCycle, cycleCount: startDates.length, hasEnoughData: true };
  }
  function calculateWeights(cycleCount) {
    const table = { 1:[1.0,0], 2:[0.8,0.2], 3:[0.6,0.4], 4:[0.4,0.6], 5:[0.25,0.75] };
    if (table[cycleCount]) return { userWeight: table[cycleCount][0], smartWeight: table[cycleCount][1] };
    if (cycleCount >= 6) return { userWeight: 0.1, smartWeight: 0.9 };
    return { userWeight: 1.0, smartWeight: 0.0 };
  }
  function calculateAvgPeriodLength(groups) {
    const lengths = [];
    for (const g of groups) {
      if (g.length > 0) {
        const min = new Date(g[0]); const max = new Date(g[g.length-1]);
        const d = Math.round((max - min)/86400000) + 1;
        if (d >= 3 && d <= 15) lengths.push(d);
      }
    }
    if (lengths.length === 0) return 7;
    return Math.round(lengths.reduce((a,b)=>a+b,0)/lengths.length);
  }
  function calculateAvgCycleLength(startDates) {
    const cycles = [];
    for (let i = 1; i < startDates.length; i++) {
      const diff = Math.round((new Date(startDates[i]) - new Date(startDates[i-1]))/86400000);
      if (diff >= 21 && diff <= 45) cycles.push(diff);
    }
    if (cycles.length === 0) return 28;
    const cleaned = removeOutliers(cycles);
    const useCleaned = cleaned.length > 0 ? cleaned : cycles;
    return Math.round(useCleaned.reduce((a,b)=>a+b,0)/useCleaned.length);
  }
  function removeOutliers(data) {
    if (data.length < 3) return data;
    const sorted = data.slice().sort((a,b)=>a-b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lb = q1 - 1.5 * iqr; const ub = q3 + 1.5 * iqr;
    return data.filter(v => v >= lb && v <= ub);
  }
  function calculatePredictionConfidence(cycleCount, regularityScore) {
    if (cycleCount <= 1) return { confidence: 30, level: '低', color: '#e74c3c' };
    if (cycleCount === 2) return { confidence: 45, level: '较低', color: '#f39c12' };
    if (cycleCount === 3) return { confidence: 60, level: '中等', color: '#f1c40f' };
    let baseConf = 50 + cycleCount * 8;
    const regBonus = Math.max(0, (100 - regularityScore) * 0.5);
    const total = Math.min(95, baseConf + regBonus);
    let level, color;
    if (total >= 80) { level = '高'; color = '#27ae60'; }
    else if (total >= 60) { level = '中等'; color = '#f1c40f'; }
    else { level = '较低'; color = '#f39c12'; }
    return { confidence: Math.round(total), level, color };
  }
  function calculateRegularityScore(startDates) {
    if (startDates.length < 3) return 100;
    const cycles = [];
    for (let i = 1; i < startDates.length; i++) {
      cycles.push(Math.round((new Date(startDates[i]) - new Date(startDates[i-1]))/86400000));
    }
    const mean = cycles.reduce((a,b)=>a+b,0)/cycles.length;
    const variance = cycles.reduce((s,v)=>s+Math.pow(v-mean,2),0)/cycles.length;
    return Math.round(Math.sqrt(variance));
  }
  function getHealthWarnings(periodDates, startDates, dailyRecords) {
    const warnings = [];
    if (periodDates.length >= 10) {
      let totalFlow = 0; let n = 0;
      for (const date of periodDates) {
        if (dailyRecords[date] && dailyRecords[date].flow) { totalFlow += dailyRecords[date].flow; n++; }
      }
      if (n > 0 && totalFlow/n >= 4) warnings.push({ type:'warning', title:'经血量较多', message:'检测到您的经血量较多，建议注意补充铁质，如有不适请及时就医。' });
    }
    if (startDates.length >= 3) {
      const cycles = [];
      for (let i = 1; i < startDates.length; i++) cycles.push(Math.round((new Date(startDates[i]) - new Date(startDates[i-1]))/86400000));
      if (calculateVariance(cycles) > 50) warnings.push({ type:'info', title:'周期波动提示', message:'您的周期波动较大，建议保持规律作息，减轻压力。' });
    }
    for (let i = 1; i < startDates.length; i++) {
      const diff = Math.round((new Date(startDates[i]) - new Date(startDates[i-1]))/86400000);
      if (diff < 21) { warnings.push({ type:'warning', title:'检测到过短周期', message:'周期短于21天，建议咨询医生。' }); break; }
      if (diff > 45) { warnings.push({ type:'warning', title:'检测到过长周期', message:'周期长于45天，建议咨询医生。' }); break; }
    }
    return warnings;
  }
  function calculateVariance(data) {
    if (data.length === 0) return 0;
    const mean = data.reduce((a,b)=>a+b,0)/data.length;
    return data.reduce((s,v)=>s+Math.pow(v-mean,2),0)/data.length;
  }
  function analyzeCycles(startDates, periodDates, defaultCycle, defaultPeriod, useAlgorithm) {
    let avgCycle = defaultCycle, avgPeriod = defaultPeriod;
    let regularity = '暂无数据', isIrregular = false, advice = '';

    if (startDates.length >= 2 && useAlgorithm) {
      const cycles = [];
      for (let i = 1; i < startDates.length; i++) {
        const diff = Math.round((new Date(startDates[i]) - new Date(startDates[i-1]))/86400000);
        if (diff > 15 && diff < 100) cycles.push(diff);
      }
      if (cycles.length > 0) {
        let weightedSum = 0, weightSum = 0;
        for (let i = 0; i < cycles.length; i++) { const w = i+1; weightedSum += cycles[i]*w; weightSum += w; }
        avgCycle = Math.round(weightedSum / weightSum);
        if (cycles.length >= 2) {
          const m = cycles.reduce((a,b)=>a+b,0)/cycles.length;
          const stdDev = Math.sqrt(calculateVariance(cycles));
          if (stdDev <= 2) regularity = '非常规律 🎉';
          else if (stdDev <= 4) regularity = '比较规律 ✨';
          else if (stdDev <= 8) regularity = '基本规律 💫';
          else { regularity = '周期不规律 ⚠️'; isIrregular = true; advice = getIrregularAdvice(stdDev, cycles); }
        } else { regularity = '逐渐规律中...'; }
      }
      avgPeriod = calculateActualPeriodLength(startDates, periodDates, defaultPeriod);
    } else if (startDates.length === 1) {
      regularity = '数据较少，继续记录~';
      avgPeriod = calculatePeriodLengthFromStart(startDates[0], periodDates, defaultPeriod);
    }
    return { avgCycle, avgPeriod, regularity, isIrregular, advice };
  }
  function calculateActualPeriodLength(startDates, periodDates, defaultPeriod) {
    if (startDates.length < 2) return defaultPeriod;
    const lengths = [];
    for (const sd of startDates) {
      const start = new Date(sd); let len = 0;
      for (let j = 0; j < 30; j++) {
        const check = new Date(start); check.setDate(start.getDate()+j);
        const ds = fmt(check);
        if (dateInList(ds, periodDates)) len = j+1; else break;
      }
      if (len > 0 && len <= 15) lengths.push(len);
    }
    if (lengths.length === 0) return defaultPeriod;
    return Math.round(lengths.reduce((a,b)=>a+b,0)/lengths.length);
  }
  function calculatePeriodLengthFromStart(startDate, periodDates, defaultPeriod) {
    const start = new Date(startDate); let len = 0;
    for (let i = 0; i < 30; i++) {
      const check = new Date(start); check.setDate(start.getDate()+i);
      if (dateInList(fmt(check), periodDates)) len = i+1; else break;
    }
    return len > 0 ? len : defaultPeriod;
  }
  function getIrregularAdvice(stdDev, cycles) {
    const pieces = [];
    if (stdDev > 10) {
      pieces.push('检测到您的周期波动较大，这可能由以下原因引起：');
      pieces.push('• 生活作息不规律 🌙');
      pieces.push('• 精神压力过大 😟');
      pieces.push('• 饮食习惯变化 🥗');
      pieces.push('• 过度运动或休息不足 🎯');
    } else if (stdDev > 6) {
      pieces.push('您的周期有一些波动，建议：');
      pieces.push('• 保持规律作息 ⏰');
      pieces.push('• 适度运动，避免过度劳累 🏃');
      pieces.push('• 保持心情愉悦 😊');
    }
    pieces.push('');
    pieces.push('💖 温馨提示：');
    pieces.push('• 继续记录2-3个周期，预测会更准确');
    pieces.push('• 如果周期持续不规律（少于21天或超过35天），建议咨询妇科医生');
    pieces.push('• 注意观察经血量和痛经情况，有异常及时就医');
    return pieces.join('\n');
  }
  function generateHealthAdvice(phase, isIrregular) {
    const map = {
      '经期': { title:'🌸 经期护理', desc:'注意保暖和休息，避免剧烈运动~',
        tips:['保持充足睡眠 7-8小时','注意腹部保暖，可以用热水袋','避免生冷辛辣食物','适度散步促进血液循环'],
        food:['红枣','红糖姜茶','猪肝','菠菜'] },
      '卵泡期': { title:'💪 卵泡期', desc:'身体恢复期，适合补养和运动！',
        tips:['可以开始规律运动计划','多吃富含蛋白质的食物','保持积极心情状态'],
        food:['黄豆','牛奶','鸡蛋','鱼类'] },
      '排卵期': { title:'✨ 排卵期', desc:'雌激素高峰，精力旺盛期！',
        tips:['把握好状态做重要工作','注意个人卫生护理','保持适度运动'],
        food:['黑豆','蜂蜜','坚果','新鲜果蔬'] },
      '黄体期': { title:'🌙 黄体期', desc:'孕激素升高，注意调节情绪~',
        tips:['减少咖啡因摄入','增加镁和维生素B6','做些轻松愉快的事','适度放松减压'],
        food:['香蕉','南瓜','菠菜','深绿色蔬菜'] },
    };
    const advice = map[phase] || { title:'💖 健康贴士', desc:'继续记录，让我们更了解您的身体~', tips:['保持良好作息','均衡饮食','适度运动'], food:['新鲜水果','蔬菜'] };
    if (isIrregular) advice.tips.push('⚠️ 周期不规律，建议持续观察并就医咨询');
    return advice;
  }

  // ====== 主预测入口 ======
  function computePredictions(records) {
    const dailyRecords = records || state.dailyRecords;
    const settings = Storage.get('periodSettings') || {};
    let cycleLength = settings.cycleLength || 28;
    let periodLength = settings.periodLength || 7;
    const useAlgorithm = settings.useAlgorithm !== false;

    if (useAlgorithm) {
      const sv = calculateSmartValues(dailyRecords);
      if (sv.hasEnoughData) {
        const w = calculateWeights(sv.cycleCount);
        cycleLength = Math.round(cycleLength * w.userWeight + sv.avgCycle * w.smartWeight);
        periodLength = Math.round(periodLength * w.userWeight + sv.avgPeriod * w.smartWeight);
      }
    }

    const periodDates = Object.keys(dailyRecords).filter(k => dailyRecords[k] && dailyRecords[k].status === 1).sort();

    if (periodDates.length === 0) {
      Object.assign(state, {
        predictedPeriods:[], predictedOvulations:[], predictedOvulationDays:[],
        extendedDates:[],
        nextPeriodDate:'', nextOvulationPeriod:'', nextOvulationDay:'',
        daysToNextPeriod:0,
        currentPhase:'未知', currentPhaseDesc:'请先记录至少一次经期~', phaseForAI:'未知',
        futurePredictions:[],
        avgCycleLength: cycleLength, avgPeriodLength: periodLength,
        cycleRegularity:'暂无数据',
        showHealthAdvice:false,
        healthAdvice:{ title:'💖 健康贴士', desc:'继续记录，让我们更了解您的身体~', tips:['保持良好作息','均衡饮食','适度运动'], food:['新鲜水果','蔬菜'] },
        predictionConfidence:{ confidence:30, level:'低', color:'#e74c3c' },
        healthWarnings:[]
      });
      return;
    }

    const periodGroups = findPeriodGroups(periodDates, periodLength);
    const startDates = extractStartDates(periodGroups);
    const cycleStats = analyzeCycles(startDates, periodDates, cycleLength, periodLength, useAlgorithm);

    const avgCycle = cycleStats.avgCycle; const avgPeriod = cycleStats.avgPeriod;
    const regularity = cycleStats.regularity; const isIrregular = cycleStats.isIrregular;
    const irregularAdvice = cycleStats.advice;

    const { groups: extGroups, extendedDates } = extendPeriodGroups(periodGroups, periodDates, periodLength);
    const lastGroup = extGroups[extGroups.length - 1];
    const lastStart = new Date(lastGroup.startDate);
    const lastEnd = new Date(lastGroup.endDate);

    const today = new Date(); const todayStr = fmt(today);

    // predicted periods: extended + future 3 cycles
    const predictedPeriods = extendedDates.slice();
    for (let c = 0; c <= 3; c++) {
      const cycleStart = new Date(lastStart);
      cycleStart.setDate(lastStart.getDate() + avgCycle * c);
      for (let j = 0; j < avgPeriod; j++) {
        const d = new Date(cycleStart); d.setDate(cycleStart.getDate()+j);
        const ds = normalizeDate(fmt(d));
        if (!dateInList(ds, periodDates) && !dateInList(ds, predictedPeriods)) predictedPeriods.push(ds);
      }
    }

    const nextStart = new Date(lastStart); nextStart.setDate(lastStart.getDate() + avgCycle);
    const ovStart = new Date(nextStart); ovStart.setDate(nextStart.getDate() - 14);
    const ovEnd = new Date(ovStart); ovEnd.setDate(ovStart.getDate() + 5);
    const ovDay = new Date(ovStart); ovDay.setDate(ovStart.getDate() + 1);

    const predictedOvulations = []; const predictedOvulationDays = [];
    for (let c = 0; c <= 3; c++) {
      const cOvStart = new Date(lastStart);
      cOvStart.setDate(lastStart.getDate() + avgCycle * c + avgCycle - 14);
      for (let k = 0; k < 10; k++) {
        const d = new Date(cOvStart); d.setDate(cOvStart.getDate()+k);
        const ds = normalizeDate(fmt(d));
        if (!dateInList(ds, predictedOvulations)) predictedOvulations.push(ds);
      }
      const peak = new Date(cOvStart); peak.setDate(cOvStart.getDate()+1);
      const ds = normalizeDate(fmt(peak));
      if (!dateInList(ds, predictedOvulationDays)) predictedOvulationDays.push(ds);
    }

    const daysToNext = Math.max(0, Math.ceil((nextStart - today)/86400000));
    const daysSinceLastEnd = Math.max(0, Math.ceil((today - lastEnd)/86400000));

    // calcPhase — 与原小程序完全一致
    let phaseName = '卵泡期', phaseDesc = '身体恢复和准备阶段，保持良好作息和饮食习惯。';
    if (today >= lastStart && today <= lastEnd) { phaseName='经期'; phaseDesc='月经期，注意保暖休息，避免剧烈运动和生冷食物，多补充铁质。'; }
    else if (dateInList(todayStr, periodDates)) { phaseName='经期'; phaseDesc='月经期，注意保暖休息，避免剧烈运动和生冷食物，多补充铁质。'; }
    else if (dateInList(todayStr, extendedDates)) { phaseName='经期'; phaseDesc='月经期，注意保暖休息，避免剧烈运动和生冷食物，多补充铁质。'; }
    else if (dateInList(todayStr, predictedPeriods)) { phaseName='经期'; phaseDesc='预测经期期间，注意保暖休息。'; }
    else if (daysSinceLastEnd > 0 && daysSinceLastEnd <= periodLength) { phaseName='经期'; phaseDesc='月经期，注意保暖休息。'; }
    else if (daysSinceLastEnd > periodLength && daysSinceLastEnd <= periodLength + 7) { phaseName='卵泡期'; phaseDesc='卵泡发育期，精力恢复中，皮肤逐渐变好，适合适度运动。'; }
    else if (daysToNext <= 14 && daysToNext > 8) { phaseName='排卵期'; phaseDesc='雌激素达峰值，精力旺盛，注意保暖和个人卫生护理。'; }
    else if (daysToNext <= 8 && daysToNext > 0) { phaseName='黄体期'; phaseDesc='黄体酮升高，注意调节情绪，减少咖啡因，增加镁和维生素B6。'; }
    else if (daysSinceLastEnd > periodLength + 7 && daysSinceLastEnd <= avgCycle - 14) { phaseName='卵泡期'; phaseDesc='卵泡发育期，精力恢复中，皮肤逐渐变好，适合适度运动。'; }

    const futurePredictions = [];
    for (let i = 1; i <= 3; i++) {
      const fs = new Date(lastStart); fs.setDate(lastStart.getDate() + avgCycle * i);
      futurePredictions.push((fs.getMonth()+1)+'月'+fs.getDate()+'日');
    }

    const healthAdvice = generateHealthAdvice(phaseName, isIrregular);
    const regularityScore = calculateRegularityScore(startDates);
    const predictionConfidence = calculatePredictionConfidence(startDates.length, regularityScore);
    const healthWarnings = getHealthWarnings(periodDates, startDates, dailyRecords);

    Object.assign(state, {
      predictedPeriods, predictedOvulations, predictedOvulationDays, extendedDates,
      nextPeriodDate: (nextStart.getMonth()+1)+'月'+nextStart.getDate()+'日',
      nextOvulationPeriod: (ovStart.getMonth()+1)+'月'+ovStart.getDate()+'日-'+(ovEnd.getMonth()+1)+'月'+ovEnd.getDate()+'日',
      nextOvulationDay: (ovDay.getMonth()+1)+'月'+ovDay.getDate()+'日',
      daysToNextPeriod: daysToNext,
      currentPhase: phaseName, currentPhaseDesc: phaseDesc, phaseForAI: phaseName,
      futurePredictions,
      avgCycleLength: avgCycle, avgPeriodLength: avgPeriod,
      cycleRegularity: regularity,
      isIrregular, irregularAdvice,
      showHealthAdvice: true, healthAdvice,
      predictionConfidence, healthWarnings
    });
  }

  // ====== render ======
  function render() {
    const container = root;
    const firstDay = new Date(state.year, state.month - 1, 1);
    const lastDay = new Date(state.year, state.month, 0);
    const startDay = firstDay.getDay();
    const endDay = lastDay.getDate();

    state.dailyRecords = Storage.get('dailyPeriodRecords') || {};
    state.periodLength = (Storage.get('periodSettings') || {}).periodLength || 7;
    state.cycleLength = (Storage.get('periodSettings') || {}).cycleLength || 28;
    computePredictions(state.dailyRecords);

    let daysHTML = '';
    const prevDays = new Date(state.year, state.month - 1, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) { const d = new Date(state.year, state.month - 2, prevDays - i); daysHTML += renderDay(d, false); }
    for (let i = 1; i <= endDay; i++) { const d = new Date(state.year, state.month - 1, i); daysHTML += renderDay(d, true); }
    let nextOffset = 1;
    while (daysHTML.split('class="day').length - 1 < Math.ceil((startDay + endDay) / 7) * 7) {
      const d = new Date(state.year, state.month, nextOffset); daysHTML += renderDay(d, false); nextOffset++;
      if (nextOffset > 10) break;
    }

    const conf = state.predictionConfidence || { confidence:30, level:'低', color:'#e74c3c' };
    const warningsHTML = (state.healthWarnings || []).map(w => `<div class="hw-card hw-${w.type}"><span class="hw-icon">${w.type==='warning'?'⚠️':'ℹ️'}</span><span class="hw-title">${w.title}</span><div class="hw-msg">${w.message}</div></div>`).join('');

    const banner = state.currentPhase && state.currentPhase !== '未知' ? `
      <div class="period-banner"><div class="phase-info"><span class="phase-label">当前：</span><span class="phase-name">${state.currentPhase}</span></div><div class="phase-desc">${state.currentPhaseDesc}</div></div>` : '';
    const irregular = state.isIrregular ? `
      <div class="irregular-banner"><span class="irregular-title">⚠️ 周期不规律提醒</span><div class="irregular-desc">${state.irregularAdvice.replace(/\n/g,'<br>')}</div></div>` : '';

    container.innerHTML = `
      <div class="period-container">
        <div class="period-header">
          <button class="period-arrow" data-action="prev">◀</button>
          <div class="period-month">${state.year}年${state.month}月</div>
          <button class="period-arrow" data-action="next">▶</button>
          <button style="position:absolute;right:10px;font-size:18px;padding:4px 8px" data-action="settings">⚙️</button>
        </div>
        <div style="text-align:center;font-size:10px;color:#ccc;margin-bottom:6px">← 左右滑动切换月份 →</div>
        ${banner}
        ${irregular}
        <div class="calendar">
          <div class="weekdays">${state.weekdays.map(w => '<span>'+w+'</span>').join('')}</div>
          <div class="days">${daysHTML}</div>
          <div class="legend">
            <div class="legend-item"><div class="lg p"></div>记录·经期</div>
            <div class="legend-item"><div class="lg pp"></div>预测·经期</div>
            <div class="legend-item"><div class="lg o"></div>排卵期</div>
            <div class="legend-item"><div class="lg od"></div>排卵日</div>
          </div>
        </div>

        <div class="section-title">经期记录（${state.selectedDate || '请选择日期'}）</div>
        <div class="record-section">
          <div class="record-item">
            <span class="record-label">月经</span>
            <div class="record-value" style="display:flex;gap:6px">
              <button class="flow-btn ${state.periodStatus===0?'active':''}" data-val="0">没来</button>
              <button class="flow-btn ${state.periodStatus===1?'active':''}" data-val="1">来了</button>
            </div>
          </div>
          ${state.periodStatus===1 ? `
          <div class="record-item"><span class="record-label">流量</span>
            <div class="record-row">${[1,2,3].map(i => `<button class="flow-btn ${state.flowLevel>=i?'active':''}" data-flow="${i}">${'🩸'.repeat(i)}</button>`).join('')}</div></div>
          <div class="record-item"><span class="record-label">痛感</span>
            <div class="record-row">${[1,2,3].map(i => `<button class="pain-btn ${state.painLevel>=i?'active':''}" data-pain="${i}">${'⚡'.repeat(i)}</button>`).join('')}</div></div>` : ''}
          <div class="record-item" style="cursor:pointer" data-action="symptoms">
            <span class="record-label">症状</span>
            <div class="symptoms-list">${state.selectedSymptoms.length===0 ? '<span style="color:#999">点击选择</span>' : state.selectedSymptoms.map(s=>'<span class="tag tag-pink">'+s+'</span>').join('')}</div>
          </div>
        </div>

        <div class="prediction">
          <div class="prediction-title">智能经期预测
            <span class="pred-confidence" style="background:${conf.color}">可信度 ${conf.confidence}% · ${conf.level}</span>
          </div>
          <div class="prediction-stats">
            <div class="stat-col"><div class="stat-num">${state.daysToNextPeriod}</div><div class="stat-lbl">天后来潮</div></div>
            <div class="stat-col"><div class="stat-num">${state.avgCycleLength}</div><div class="stat-lbl">天平均周期</div></div>
            <div class="stat-col"><div class="stat-num">${state.cycleRegularity}</div><div class="stat-lbl">周期状态</div></div>
          </div>
          ${state.nextPeriodDate ? `
          <div class="prediction-detail">
            <div class="pred-row"><span class="pred-lbl">预计经期</span><span class="pred-val period">${state.nextPeriodDate}</span></div>
            ${state.nextOvulationPeriod ? `<div class="pred-row"><span class="pred-lbl">预计排卵期</span><span class="pred-val ovulation">${state.nextOvulationPeriod}</span></div>` : ''}
            ${state.nextOvulationDay ? `<div class="pred-row"><span class="pred-lbl">预计排卵日</span><span class="pred-val ovday">${state.nextOvulationDay}</span></div>` : ''}
          </div>` : ''}
          ${state.futurePredictions.length>0 ? `
          <div class="trend">
            <span class="trend-lbl">未来3次预测来潮</span>
            <div class="trend-items">${state.futurePredictions.map((p,i)=>`<span>第${i+1}次：${p}</span>`).join('')}</div>
          </div>` : ''}
        </div>

        ${warningsHTML ? `<div class="hw-block"><div class="hw-block-title">🩺 健康关注</div>${warningsHTML}</div>` : ''}

        ${state.showHealthAdvice && state.healthAdvice.title ? `
        <div class="health-advice">
          <div class="advice-title">${state.healthAdvice.title}</div>
          <div class="advice-desc">${state.healthAdvice.desc}</div>
          <div class="advice-tips">${state.healthAdvice.tips.map(t=>'<div class="advice-tip"><div class="tip-dot"></div>'+t+'</div>').join('')}</div>
          <div class="food-box"><span class="food-lbl">🍽️ 推荐食材</span><div class="food-list">${state.healthAdvice.food.map(f=>'<span class="food-tag">'+f+'</span>').join('')}</div></div>
        </div>` : ''}
      </div>
    `;

    container.querySelectorAll('.period-arrow').forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.action === 'prev') { state.month--; if (state.month < 1) { state.month = 12; state.year--; } }
        else { state.month++; if (state.month > 12) { state.month = 1; state.year++; } }
        state.selectedDate = ''; state.periodStatus = 0; state.flowLevel = 0; state.painLevel = 0; state.selectedSymptoms = [];
        render();
      };
    });
    container.querySelector('[data-action="settings"]').onclick = () => Router.go('settings');
    container.querySelectorAll('.day').forEach(d => {
      d.onclick = () => {
        const date = d.dataset.date; state.selectedDate = date;
        const rec = state.dailyRecords[date];
        if (rec) { state.periodStatus = rec.status||0; state.flowLevel = rec.flow||0; state.painLevel = rec.pain||0; state.selectedSymptoms = rec.symptoms||[]; }
        else { state.periodStatus = 0; state.flowLevel = 0; state.painLevel = 0; state.selectedSymptoms = []; }
        render();
      };
    });
    container.querySelectorAll('.flow-btn[data-val]').forEach(b => b.onclick = () => { state.periodStatus = parseInt(b.dataset.val); if (state.selectedDate) saveRecord(); render(); });
    container.querySelectorAll('.flow-btn[data-flow]').forEach(b => b.onclick = () => { state.flowLevel = parseInt(b.dataset.flow); if (state.selectedDate) saveRecord(); render(); });
    container.querySelectorAll('.pain-btn').forEach(b => b.onclick = () => { state.painLevel = parseInt(b.dataset.pain); if (state.selectedDate) saveRecord(); render(); });
    container.querySelector('[data-action="symptoms"]').onclick = () => { Router.go('symptoms', { date: state.selectedDate || '' }); };

    let sx, sy;
    container.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; });
    container.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx > 0) { state.month--; if (state.month < 1) { state.month = 12; state.year--; } }
        else { state.month++; if (state.month > 12) { state.month = 1; state.year++; } }
        render();
      }
    });
  }

  function renderDay(d, isCurrentMonth) {
    const dateStr = fmt(d);
    const rec = state.dailyRecords[dateStr];
    const isToday = dateStr === fmt(new Date());
    const isSelected = state.selectedDate === dateStr;
    const isPeriod = rec && rec.status === 1;
    const isPredicted = !rec && dateInList(dateStr, state.predictedPeriods);
    const isOvulation = dateInList(dateStr, state.predictedOvulations);
    const isOvDay = dateInList(dateStr, state.predictedOvulationDays);

    let dots = '';
    if (isPeriod) dots += '<div class="dot period"></div>';
    else if (isPredicted) dots += '<div class="dot predict"></div>';
    if (isOvulation) dots += '<div class="dot ovulation"></div>';
    if (isOvDay) dots += '<div class="dot ovday"></div>';

    return `<div class="day ${isCurrentMonth?'':'other'} ${isToday?'today':''} ${isSelected?'selected':''}" data-date="${dateStr}">
      <span class="dn">${d.getDate()}</span>${dots}
    </div>`;
  }

  function saveRecord() {
    const date = state.selectedDate; if (!date) return;
    const records = Storage.get('dailyPeriodRecords') || {};
    const prevDate = new Date(date); prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = fmt(prevDate);
    records[date] = {
      status: state.periodStatus, flow: state.flowLevel, pain: state.painLevel,
      symptoms: state.selectedSymptoms.slice(),
      isFirst: state.periodStatus === 1 && (!records[prevStr] || records[prevStr].status !== 1)
    };
    Storage.set('dailyPeriodRecords', records);
    try { Api.savePeriodRecord({ date, periodStatus: state.periodStatus, flowLevel: state.flowLevel, painLevel: state.painLevel, symptoms: state.selectedSymptoms }); } catch(e){}
  }

  // init
  const saved = Storage.get('dailyPeriodRecords') || {};
  state.selectedDate = fmt(new Date());
  const todayRec = saved[state.selectedDate];
  if (todayRec) { state.periodStatus = todayRec.status||0; state.flowLevel = todayRec.flow||0; state.painLevel = todayRec.pain||0; state.selectedSymptoms = todayRec.symptoms||[]; }

  // 从症状选择页回传（sessionStorage bridge）：返回时把所选症状应用到对应日期
  try {
    const pending = sessionStorage.getItem('pending_period_symptoms');
    if (pending) {
      sessionStorage.removeItem('pending_period_symptoms');
      const p = JSON.parse(pending) || {};
      if (p.date) state.selectedDate = p.date;
      const rec = saved[state.selectedDate] || { status:0, flow:0, pain:0, symptoms:[] };
      rec.symptoms = (p.symptoms || []).slice();
      rec.status = rec.status || 0;
      saved[state.selectedDate] = rec;
      Storage.set('dailyPeriodRecords', saved);
      state.selectedSymptoms = rec.symptoms.slice();
      state.periodStatus = rec.status; state.flowLevel = rec.flow; state.painLevel = rec.pain;
      try { Api.savePeriodRecord({ date: state.selectedDate, symptoms: rec.symptoms }); } catch(e){}
    }
  } catch(e){}

  render();
});
