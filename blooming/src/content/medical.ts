/*
 * 台灣孕產照護參考資料。
 * 整理自衛生福利部國民健康署公告：自 110 年 7 月 1 日起，公費產前檢查由 10 次增為 14 次（新增妊娠第 8、24、30、37 週），
 * 一般超音波 3 次（每個孕期各 1 次）、妊娠糖尿病篩檢與貧血檢驗（24–28 週）、乙型鏈球菌篩檢、產前衛教指導 2 次。
 * 實際時程、項目與補助以國健署最新公告、孕婦健康手冊及就診醫院安排為準。
 */
export interface CheckItem {
  id: string; title: string; weeks?: [number, number]; purpose: string;
  cost: '公費' | '自費' | '部分補助' | '健保'; optional: boolean; note?: string; source: string;
}
export const SRC_HPA = '衛生福利部國民健康署（孕婦健康手冊、孕產婦照護公告）';
export const SRC_HPA_PRE = '衛生福利部國民健康署（孕前健康檢查補助公告）';
export const SRC_LOCAL = '各縣市衛生局公告';
export const SRC_CLINIC = '依醫療院所自費項目說明';

// 公費產檢建議週數（14 次）
const VISIT_WEEKS = [8, 12, 16, 20, 24, 28, 30, 32, 34, 36, 37, 38, 39, 40];
export const PRENATAL_VISITS: CheckItem[] = VISIT_WEEKS.map((w, i) => ({
  id: 'v' + (i + 1), title: `第 ${i + 1} 次公費產檢`, weeks: [w, w], cost: '公費', optional: false, source: SRC_HPA,
  purpose: i === 0 ? '確認懷孕、建立孕婦健康手冊，含問診、身體檢查、血液及尿液等初次檢查' : '例行檢查：體重、血壓、胎心音、胎位、尿糖、尿蛋白等',
  note: '週數為建議時間，依醫院安排可能前後調整'
}));

export const PRENATAL_CHECKS: CheckItem[] = [
  { id: 'us1', title: '一般超音波（第一孕期）', weeks: [8, 13], purpose: '確認胎兒心跳、著床位置與週數', cost: '公費', optional: false, source: SRC_HPA, note: '公費超音波共 3 次，每個孕期 1 次' },
  { id: 'edu1', title: '產前健康照護衛教指導（第一次）', weeks: [8, 13], purpose: '孕期營養、生活與危險徵兆衛教', cost: '公費', optional: false, source: SRC_HPA },
  { id: 'nt', title: '早期唐氏症篩檢（頸部透明帶＋母血）', weeks: [11, 14], purpose: '評估胎兒染色體異常風險（篩檢，非診斷）', cost: '自費', optional: true, source: SRC_LOCAL, note: '部分縣市有補助，可詢問戶籍地衛生局' },
  { id: 'nipt', title: '非侵入性胎兒染色體檢測（NIPT）', weeks: [10, 22], purpose: '以母血檢測常見染色體異常風險（篩檢，非診斷）', cost: '自費', optional: true, source: SRC_CLINIC },
  { id: 'pe', title: '子癲前症風險篩檢', weeks: [11, 14], purpose: '評估子癲前症風險，醫師可能依結果建議預防措施', cost: '自費', optional: true, source: SRC_CLINIC },
  { id: 'amnio', title: '羊膜穿刺（產前遺傳診斷）', weeks: [16, 20], purpose: '診斷胎兒染色體異常', cost: '部分補助', optional: true, source: SRC_HPA, note: '符合條件（例如 34 歲以上、篩檢高風險、家族史）可申請補助；有侵入性風險，請與醫師討論' },
  { id: 'us2', title: '一般超音波（第二孕期）', weeks: [20, 24], purpose: '評估胎兒生長、胎盤位置與羊水量', cost: '公費', optional: false, source: SRC_HPA },
  { id: 'lvus', title: '高層次超音波', weeks: [20, 24], purpose: '較詳細檢查胎兒器官構造', cost: '自費', optional: true, source: SRC_CLINIC },
  { id: 'gdm', title: '妊娠糖尿病篩檢', weeks: [24, 28], purpose: '及早發現妊娠糖尿病', cost: '公費', optional: false, source: SRC_HPA },
  { id: 'hb', title: '貧血檢驗', weeks: [24, 28], purpose: '檢查血紅素，及早補充或治療', cost: '公費', optional: false, source: SRC_HPA },
  { id: 'us3', title: '一般超音波（第三孕期）', weeks: [32, 37], purpose: '評估胎兒大小、胎位與羊水', cost: '公費', optional: false, source: SRC_HPA },
  { id: 'edu2', title: '產前健康照護衛教指導（第二次）', weeks: [29, 40], purpose: '生產準備、哺乳與產後照護衛教', cost: '公費', optional: false, source: SRC_HPA },
  { id: 'gbs', title: '乙型鏈球菌篩檢', weeks: [35, 37], purpose: '檢查是否帶有乙型鏈球菌，生產時可預防新生兒感染', cost: '公費', optional: false, source: SRC_HPA },
];

export const PRECONCEPTION_CHECKS: CheckItem[] = [
  { id: 'pre', title: '孕前健康檢查', purpose: '夫妻雙方孕前評估，包含問診、血液、傳染病等項目', cost: '部分補助', optional: false, source: SRC_HPA_PRE, note: '國健署提供符合資格的夫妻補助，到合約院所預約，項目與資格以公告為準' },
  { id: 'rubella', title: '德國麻疹抗體檢驗', purpose: '沒有抗體的話，建議孕前接種疫苗（接種後需間隔一段時間再懷孕）', cost: '部分補助', optional: false, source: SRC_HPA_PRE },
  { id: 'std', title: '梅毒、愛滋等傳染病篩檢', purpose: '避免垂直感染給胎兒', cost: '部分補助', optional: false, source: SRC_HPA_PRE },
  { id: 'thal', title: '血液常規與海洋性貧血篩檢', purpose: '了解是否為帶因者，夫妻皆帶因需進一步諮詢', cost: '部分補助', optional: false, source: SRC_HPA_PRE },
  { id: 'tsh', title: '甲狀腺功能', purpose: '甲狀腺異常可能影響受孕與懷孕', cost: '自費', optional: true, source: SRC_CLINIC },
  { id: 'amh', title: 'AMH 抗穆勒氏管荷爾蒙', purpose: '評估卵巢庫存量（參考值，不代表能否懷孕）', cost: '自費', optional: true, source: SRC_CLINIC },
  { id: 'semen', title: '精液分析（男方）', purpose: '評估精蟲數量與活動力', cost: '自費', optional: true, source: SRC_CLINIC },
  { id: 'pap', title: '子宮頸抹片、婦科超音波', purpose: '確認子宮與卵巢狀態', cost: '健保', optional: true, source: SRC_HPA, note: '30 歲以上子宮頸抹片有公費補助' },
  { id: 'folic', title: '葉酸補充諮詢', purpose: '孕前至懷孕初期補充葉酸，降低神經管缺陷風險；劑量請與醫師或藥師確認', cost: '自費', optional: false, source: SRC_HPA },
];
