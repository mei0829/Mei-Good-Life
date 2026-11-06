// Lifestyle：運動與飲食建議（一般性資訊，依個人狀況及醫師建議調整）
export interface Activity { id: string; title: string; cat: '備孕運動' | '孕婦瑜伽' | '散步與伸展' | '健康飲食' | '孕期活動'; stage: 'pre' | 'preg' | 'both'; minutes?: number; intensity?: string; desc: string; caution?: string }
export const ACTIVITIES: Activity[] = [
  { id: 'walk', title: '輕快散步', cat: '散步與伸展', stage: 'both', minutes: 30, intensity: '輕鬆', desc: '可以說話但微喘的速度，每週累積約 150 分鐘中等強度活動。', caution: '天氣炎熱時避開正午，記得補充水分。' },
  { id: 'stretch', title: '晨間全身伸展', cat: '散步與伸展', stage: 'both', minutes: 10, intensity: '輕鬆', desc: '頸肩、胸椎、髖關節、小腿依序伸展，每個動作停 20–30 秒。' },
  { id: 'hip', title: '髖部與骨盆放鬆', cat: '散步與伸展', stage: 'both', minutes: 10, intensity: '輕鬆', desc: '貓牛式、蝴蝶式、骨盆前後傾，緩解久坐腰痠。', caution: '懷孕中後期避免長時間平躺。' },
  { id: 'strength', title: '基礎肌力訓練', cat: '備孕運動', stage: 'pre', minutes: 30, intensity: '中等', desc: '深蹲、臀橋、划船、平板支撐，每週 2–3 次，建立核心與下肢力量。' },
  { id: 'cardio', title: '有氧運動（快走、騎車、游泳）', cat: '備孕運動', stage: 'pre', minutes: 30, intensity: '中等', desc: '維持心肺功能與健康體重，有助調整代謝。', caution: '避免過度訓練或快速減重，可能影響月經週期。' },
  { id: 'pilates', title: '核心皮拉提斯', cat: '備孕運動', stage: 'pre', minutes: 25, intensity: '中等', desc: '強化深層核心與骨盆底肌，為懷孕做準備。' },
  { id: 'pyoga', title: '孕婦瑜伽（第二孕期起）', cat: '孕婦瑜伽', stage: 'preg', minutes: 30, intensity: '輕鬆', desc: '著重呼吸、髖部開展與背部舒緩，建議參加有孕婦瑜伽資格的課程。', caution: '避免熱瑜伽、深度扭轉、腹部受壓與長時間平躺；有出血、腹痛、頭暈請立即停止並就醫。' },
  { id: 'breath', title: '腹式呼吸與放鬆', cat: '孕婦瑜伽', stage: 'both', minutes: 10, intensity: '輕鬆', desc: '吸氣時腹部與肋骨向外擴張，吐氣放鬆，幫助睡前放鬆與減壓。' },
  { id: 'pelvic', title: '骨盆底肌運動（凱格爾）', cat: '孕期活動', stage: 'both', minutes: 5, intensity: '輕鬆', desc: '收縮 5 秒、放鬆 5 秒，重複 10 次，一天數回。' },
  { id: 'swim', title: '孕期游泳或水中漫步', cat: '孕期活動', stage: 'preg', minutes: 30, intensity: '輕鬆', desc: '浮力減輕關節負擔，適合孕期中後段。', caution: '注意池邊防滑；有前置胎盤、破水等狀況需先問醫師。' },
  { id: 'pwalk', title: '孕期散步', cat: '孕期活動', stage: 'preg', minutes: 20, intensity: '輕鬆', desc: '穿好走的鞋，依身體狀況分段完成。', caution: '出現規律宮縮、出血、破水、胎動明顯減少時請就醫。' },
  { id: 'folate', title: '葉酸與深綠色蔬菜', cat: '健康飲食', stage: 'both', desc: '菠菜、地瓜葉、花椰菜、豆類都含葉酸；補充劑劑量請與醫師或藥師確認。' },
  { id: 'protein', title: '每餐一份優質蛋白', cat: '健康飲食', stage: 'both', desc: '魚、蛋、豆腐、雞肉、瘦肉輪流吃，幫助穩定血糖與飽足感。' },
  { id: 'iron', title: '鐵質與維生素 C 一起吃', cat: '健康飲食', stage: 'both', desc: '紅肉、深綠色蔬菜搭配水果，幫助鐵質吸收。' },
  { id: 'fish', title: '選擇低汞魚類', cat: '健康飲食', stage: 'both', desc: '鮭魚、鯖魚、秋刀魚等每週 2–3 份；避免大型掠食魚類（如鯊魚、旗魚）。' },
  { id: 'safe', title: '孕期飲食安全', cat: '健康飲食', stage: 'preg', desc: '避免生食、未全熟的蛋與肉、未殺菌乳品；含咖啡因飲料適量。', caution: '飲食限制依個人狀況（例如妊娠糖尿病）請遵照醫師與營養師建議。' },
  { id: 'cycle-food', title: '規律三餐、少精緻糖', cat: '健康飲食', stage: 'pre', desc: '以原型食物為主，維持穩定血糖與體重，有助荷爾蒙平衡。' },
];
export const ACT_CATS = ['備孕運動', '孕婦瑜伽', '散步與伸展', '孕期活動', '健康飲食'] as const;
