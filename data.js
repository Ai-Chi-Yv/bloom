// ===== healthCatalog.js - 本地精选目录 =====
const Catalog = (() => {
  const CATEGORIES = [
    { key: '经期用品', name: '经期护理', icon: '🌸', color: '#ff6b9d',
      subs: [
        { key: '卫生巾', name: '卫生巾', icon: '🌷' },
        { key: '卫生棉条', name: '卫生棉条', icon: '💧' },
        { key: '护垫', name: '护垫', icon: '🍃' },
        { key: '湿巾', name: '湿巾', icon: '🧻' },
        { key: '经期内裤', name: '经期内裤', icon: '👙' },
        { key: '内衣洗衣液', name: '内衣洗衣液', icon: '🫧' },
      ]},
    { key: '个人护理', name: '个护清洁', icon: '🧴', color: '#8e7bff',
      subs: [
        { key: '洗发水', name: '洗发水', icon: '💆' },
        { key: '沐浴露', name: '沐浴露', icon: '🛁' },
        { key: '洗手液', name: '洗手液', icon: '🧼' },
        { key: '身体乳', name: '身体乳', icon: '🥛' },
        { key: '面膜', name: '面膜', icon: '✨' },
        { key: '口腔护理', name: '口腔护理', icon: '🪥' },
        { key: '眼罩', name: '眼罩', icon: '😴' },
      ]},
    { key: '保健食品', name: '营养保健', icon: '💊', color: '#22b573',
      subs: [
        { key: '维生素', name: '维生素', icon: '🍊' },
        { key: '益生菌', name: '益生菌', icon: '🫙' },
        { key: '蛋白粉', name: '蛋白粉', icon: '💪' },
        { key: '滋补品', name: '滋补品', icon: '🕊️' },
        { key: '膳食纤维', name: '膳食纤维', icon: '🌾' },
        { key: '酵素', name: '酵素', icon: '🍋' },
      ]},
    { key: '医疗器械', name: '医疗器械', icon: '🩺', color: '#2f80ed',
      subs: [
        { key: '血压计', name: '血压计', icon: '💓' },
        { key: '血糖仪', name: '血糖仪', icon: '🩸' },
        { key: '体温计', name: '体温计', icon: '🌡️' },
        { key: '按摩器', name: '按摩器', icon: '💆‍♀️' },
        { key: '理疗仪', name: '理疗仪', icon: '⚡' },
        { key: '制氧机', name: '制氧机', icon: '🌬️' },
      ]},
    { key: '母婴用品', name: '母婴专区', icon: '🍼', color: '#f2994a',
      subs: [
        { key: '纸尿裤', name: '纸尿裤', icon: '👶' },
        { key: '奶粉', name: '奶粉', icon: '🍼' },
        { key: '奶瓶', name: '奶瓶', icon: '🍶' },
        { key: '安抚奶嘴', name: '安抚奶嘴', icon: '😌' },
        { key: '婴儿洗护', name: '婴儿洗护', icon: '🧴' },
      ]},
  ];

  const BANNERS = [
    { title: '经期安心购', sub: '精选纯棉·医护级', gradient: 'linear-gradient(135deg,#ff8fab,#d43f6e)' },
    { title: '消费避雷', sub: '第三方测评红黑榜', gradient: 'linear-gradient(135deg,#ff9500,#e0485f)' },
    { title: 'AI 智能推荐', sub: '结合你的经期阶段', gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
  ];

  const PLACEHOLDER_GRADIENTS = [
    ['#ff9a9e','#fad0c4'],['#a18cd1','#fbc2eb'],['#a6c1ee','#c2e9fb'],
    ['#84fab0','#8fd3f4'],['#fccb90','#d57eeb'],['#e0c3fc','#8ec5fc'],
    ['#f093fb','#f5576c'],['#ffecd2','#fcb69f'],['#f6d365','#fda085'],
    ['#5ee7df','#b490ca']
  ];

  function hashStr(s) { let h=0; for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))>>>0; } return h; }
  function brandChar(brand) { const m=String(brand||'').match(/[\u4e00-\u9fa5]/); if(m) return m[0]; return String(brand||'品').charAt(0).toUpperCase(); }

  const PRODUCTS = [
    { id:900002, brand:'她研社', name:'她研社奶滑小方卫生巾日夜组合', category:'经期用品', subCategory:'卫生巾', price:24.9, features:['牛奶蛋白表层','奶滑亲肤','日夜组合'], image:'', sales:45000, rating:4.8, styles:['日用240mm','夜用290mm','超长夜用420mm','日夜组合装'] },
    { id:900003, brand:'Libresse薇尔', name:'薇尔小V巾舒适V感日用240mm', category:'经期用品', subCategory:'卫生巾', price:29.9, features:['V型剪裁','立体防漏','动态贴合'], image:'', sales:41000, rating:4.9, styles:['日用240mm','夜用290mm','日夜组合装'] },
    { id:900004, brand:'舒莱', name:'舒莱悬浮芯消毒级纯棉卫生巾', category:'经期用品', subCategory:'卫生巾', price:16.9, features:['医护消毒级','天然纯棉','敏感肌适用'], image:'', sales:38000, rating:4.7, styles:['日用240mm','夜用290mm','日夜组合装'] },
    { id:900005, brand:'美适互动', name:'美适互动奢养蚕丝益生菌卫生巾', category:'经期用品', subCategory:'卫生巾', price:19.9, features:['蚕丝益生菌','蔓越莓精华芯','奢柔亲肤'], image:'', sales:58000, rating:4.9, styles:['日用240mm','夜用290mm'] },
    { id:900008, brand:'淘淘氧棉', name:'淘淘氧棉天山白纯棉卫生巾', category:'经期用品', subCategory:'卫生巾', price:21.9, features:['新疆纯棉','消毒级','无荧光剂'], image:'', sales:52000, rating:4.8, styles:['日用240mm','夜用290mm','日夜组合装'] },
    { id:900010, brand:'丹碧丝Tampax', name:'丹碧丝导管式卫生棉条普通流量', category:'经期用品', subCategory:'卫生棉条', price:49.9, features:['顺滑导管','欧洲进口','游泳可用'], image:'', sales:32000, rating:4.8, styles:['普通流量','大流量','混合装'] },
    { id:900014, brand:'护舒宝Whisper', name:'护舒宝云感棉超薄卫生护垫', category:'经期用品', subCategory:'护垫', price:12.9, features:['云感棉柔','透气超薄','155mm日常'], image:'', sales:81000, rating:4.7, styles:['22片装','44片装'] },
    { id:900024, brand:'优衣库UNIQLO', name:'优衣库AIRism无痕经期内裤', category:'经期用品', subCategory:'经期内裤', price:79.9, features:['无痕贴身','AIRism透气','防漏裆部'], image:'', sales:18000, rating:4.9, styles:['S','M','L','XL'] },
    { id:900028, brand:'小林制药', name:'小林制药内衣专用清洗剂', category:'经期用品', subCategory:'内衣洗衣液', price:39.9, features:['去血渍专用','抑菌除味','日本进口'], image:'', sales:45000, rating:4.8, styles:['120ml','300ml','组合装'] },
    { id:900007, brand:'洁伶', name:'洁伶全程护理装干爽网面卫生巾', category:'经期用品', subCategory:'卫生巾', price:15.9, features:['全程护理装','超薄干爽','含香薰片'], image:'', sales:27000, rating:4.6, styles:['日用240mm','夜用290mm'] },
    { id:900018, brand:'德佑', name:'德佑婴儿手口EDI纯水湿巾80抽', category:'经期用品', subCategory:'湿巾', price:19.9, features:['EDI纯水','手口可用','经期清洁同样安心'], image:'', sales:74000, rating:4.8, styles:['20抽便携','80抽家庭装'] },
    { id:900040, brand:'舒肤佳Safeguard', name:'舒肤佳纯白清香健康沐浴露', category:'个人护理', subCategory:'沐浴露', price:27.9, features:['长效抑菌','经典清香','易冲洗'], image:'', sales:98000, rating:4.8, styles:['单瓶装','囤货装'] },
    { id:900063, brand:'汤臣倍健', name:'汤臣倍健多种维生素B族片', category:'保健食品', subCategory:'维生素', price:59.9, features:['8种B族维生素','熬夜党常备','蓝帽认证'], image:'', sales:86000, rating:4.7, styles:['60片','90片'] },
    { id:900068, brand:'WonderLab', name:'万益蓝小蓝瓶益生菌400亿', category:'保健食品', subCategory:'益生菌', price:129, features:['400亿活菌','小蓝瓶锁活','成人即食'], image:'', sales:94000, rating:4.8, styles:['10瓶','20瓶','30瓶'] },
    { id:900086, brand:'欧姆龙Omron', name:'欧姆龙U30上臂式电子血压计', category:'医疗器械', subCategory:'血压计', price:299.9, features:['医用精准','大屏背光','双人记忆'], image:'', sales:152000, rating:4.9, styles:['标准款','语音款'] },
    { id:900026, brand:'三枪', name:'三枪纯棉高腰经期内裤', category:'经期用品', subCategory:'经期内裤', price:59.9, features:['新疆纯棉','高腰护腰','易洗耐穿'], image:'', sales:25000, rating:4.7, styles:['M','L','XL','XXL'] },
    { id:900060, brand:'花王美舒律', name:'花王蒸汽眼罩薰衣草香', category:'个人护理', subCategory:'眼罩', price:39.9, features:['40℃恒温蒸汽','舒缓眼疲劳','12片装'], image:'', sales:120000, rating:4.8, styles:['5片','12片','36片'] },
    { id:900090, brand:'罗氏Roche', name:'罗氏卓越精采血糖仪', category:'医疗器械', subCategory:'血糖仪', price:189.9, features:['医院同款','5秒出值','需血量小'], image:'', sales:98000, rating:4.8, styles:['单机','50片试纸套'] },
  ];

  const AVOID_PRODUCTS = [
    { id:'ap001', brand:'XX牌', name:'薄荷型卫生护垫', category:'经期用品', severity:2, severityText:'警惕', issueType:'添加香精', reason:'检测出人工合成香精成分，敏感肌易引发外阴瘙痒', evidence:'国家市场监督管理局2023年抽查报告', tip:'经期避免使用香薰型卫生巾护垫，选择无香产品' },
    { id:'ap002', brand:'XX牌', name:'廉价棉柔卫生巾（10元3包）', category:'经期用品', severity:3, severityText:'注意', issueType:'菌落超标', reason:'某电商抽检发现菌落总数超标3倍，消毒不彻底', evidence:'XX电商品质抽检报告2024', tip:'选择正规品牌消毒级产品，经期勤更换' },
    { id:'ap003', brand:'XX牌', name:'网红缩阴产品', category:'个人护理', severity:1, severityText:'高危', issueType:'虚假宣传', reason:'监管部门通报：此类产品无法达到宣传效果，部分含违规成分', evidence:'国家药监局2023年消费警示', tip:'女性私密护理保持清洁干燥即可，不要相信速效产品' },
    { id:'ap004', brand:'XX牌', name:'口服减肥药（含西布曲明）', category:'保健食品', severity:1, severityText:'高危', issueType:'违禁成分', reason:'检测出已被国家明令禁止的西布曲明成分，可能导致心悸失眠', evidence:'食品药品监督管理局通报', tip:'健康减肥请通过合理饮食和运动，切勿服用来路不明产品' },
    { id:'ap005', brand:'XX牌', name:'低价血压计', category:'医疗器械', severity:3, severityText:'注意', issueType:'精度不达标', reason:'非正规渠道销售的血压计抽检合格率仅40%', evidence:'XX省计量监督抽检2023', tip:'医疗器械建议在正规药店或医院购买' },
  ];

  return {
    CATEGORIES, BANNERS, PLACEHOLDER_GRADIENTS, PRODUCTS, AVOID_PRODUCTS,
    formatSales(n) { if(n>=10000) return (n/10000).toFixed(1)+'万'; return n; },
    decorateProduct(p) {
      const g = PLACEHOLDER_GRADIENTS[hashStr(p.brand) % PLACEHOLDER_GRADIENTS.length];
      return Object.assign({}, p, {
        priceText: Number(p.price).toFixed(1),
        salesText: Catalog.formatSales(p.sales) + '人付款',
        tags: (p.features||[]).slice(0,2),
        placeholder: { char: brandChar(p.brand), from: g[0], to: g[1] }
      });
    },
    decorateAvoid(a) {
      const reason = String(a.reason||'');
      return Object.assign({}, a, { reasonShort: reason.length>26?reason.slice(0,26)+'…':reason });
    },
    getProduct(id) { return PRODUCTS.find(p => String(p.id)===String(id)); }
  };
})();

// ===== knowledgeData.js - 科普知识 =====
const KnowledgeData = (() => {
  const articles = [
    { id:1, title:'经期护理全攻略：从饮食到运动', phase:'period',
      content:'经期是女性身体的特殊时期，科学的护理有助于减轻不适：\n\n1. 饮食：多喝温水，避免生冷辛辣；适当补充铁质（红枣、菠菜、猪肝）。\n2. 运动：避免剧烈运动，可选择散步、轻柔瑜伽。\n3. 保暖：注意腹部保暖，可用热水袋热敷缓解痛经。\n4. 卫生：勤换卫生巾（2-3小时一次），保持阴部清洁干燥。\n5. 情绪：经期情绪波动是正常的，保持心情舒畅很重要。' },
    { id:2, title:'如何科学计算排卵期', phase:'ovulation',
      content:'排卵期是女性最易受孕的时期，通常为下一次月经来潮前14天左右。\n\n计算方法：\n• 记录连续8-12个月经周期\n• 最短周期天数 - 18 = 易孕期第一天\n• 最长周期天数 - 11 = 易孕期最后一天\n\n辅助判断：\n• 基础体温升高0.3-0.5℃\n• 宫颈黏液增多呈拉丝状\n• 排卵试纸检测阳性\n\n注意：排卵期因人而异，以上方法仅供参考。' },
    { id:3, title:'黄体期情绪管理', phase:'luteal',
      content:'黄体期（月经前7-14天）约有75%女性会经历经前综合征（PMS）：\n\n常见症状：乳房胀痛、腰酸、情绪低落、易怒、食欲变化。\n\n科学应对：\n1. 减少咖啡因摄入，避免加重焦虑。\n2. 增加镁和维生素B6摄入（香蕉、南瓜、坚果）。\n3. 规律运动有助于缓解情绪。\n4. 保证充足睡眠，睡前避免电子设备。\n5. 理解情绪波动是生理现象，不要过分自责。' },
    { id:4, title:'卵泡期营养补充要点', phase:'follicular',
      content:'卵泡期（月经后第1-14天）是身体恢复期：\n\n营养建议：\n• 蛋白质：牛奶、鸡蛋、鱼类（组织修复）\n• 铁质：红肉、菠菜、红枣（补充经期流失）\n• 叶酸：绿叶蔬菜、豆类（备孕重要）\n• 维生素C：柑橘类、草莓、西兰花\n\n生活建议：\n• 适合开始规律运动计划\n• 皮肤状态较好，适合护肤保养\n• 精力充沛，适合重要工作安排' },
    { id:5, title:'卫生巾选购指南', phase:'period',
      content:'选择卫生巾时关注以下几点：\n\n1. 认证：优先选择有消毒级认证、医护级认证的产品。\n2. 材质：纯棉表层适合敏感肌；网面干爽但可能刺激。\n3. 规格：240mm日用、290mm夜用、420mm超长夜用组合最实用。\n4. 无添加：避免含香精、药物成分的产品。\n5. 保质期：关注包装上的生产日期和保质期。\n\n温馨提示：即使未开封，卫生巾也建议存放不超过2年。' },
    { id:6, title:'痛经的识别与应对', phase:'period',
      content:'痛经分为原发性和继发性两类：\n\n原发性痛经：无器质性病变，多见于青春期女性。\n应对：热敷、适度运动、补充维生素B6、必要时服用止痛药（布洛芬）。\n\n继发性痛经：由子宫内膜异位症、子宫肌瘤等疾病引起。\n警示信号：\n• 疼痛逐渐加重\n• 止痛药无效\n• 月经量异常\n• 不孕\n\n建议：如果痛经严重影响生活，建议及时就医检查。' },
  ];
  return { articles };
})();

window.Catalog = Catalog;
window.KnowledgeData = KnowledgeData;
