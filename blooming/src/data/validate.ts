import type { TableName, Tables } from './types';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const okDate = (s?: string) => !!s && DATE.test(s) && !isNaN(new Date(s + 'T00:00:00').getTime());
const inRange = (v: number | undefined, a: number, b: number) => v == null || (typeof v === 'number' && v >= a && v <= b);

/** 回傳錯誤訊息；空陣列代表資料正確 */
export function validate<T extends TableName>(table: T, r: Partial<Tables[T]>): string[] {
  const e: string[] = [];
  const x = r as any;
  const needDate = (k = 'date', label = '日期') => { if (!okDate(x[k])) e.push(`請填寫正確的${label}`); };
  const optDate = (k: string, label: string) => { if (x[k] && !okDate(x[k])) e.push(`${label}格式不正確`); };
  switch (table) {
    case 'periods':
      needDate('start', '月經開始日');
      optDate('end', '月經結束日');
      if (okDate(x.start) && okDate(x.end) && x.end < x.start) e.push('結束日不能早於開始日');
      if (okDate(x.start) && okDate(x.end) && (new Date(x.end).getTime() - new Date(x.start).getTime()) / 864e5 > 14) e.push('經期超過 14 天，請確認日期');
      if (!inRange(x.pain, 0, 10)) e.push('經痛程度請填 0–10');
      break;
    case 'body':
      needDate();
      if (!inRange(x.weight, 25, 250)) e.push('體重請填 25–250 公斤');
      if (!inRange(x.bodyFat, 3, 70)) e.push('體脂率請填 3–70%');
      if (!inRange(x.bbt, 34, 42)) e.push('基礎體溫請填 34–42°C');
      break;
    case 'supplements': if (!x.name?.trim()) e.push('請填寫品名'); optDate('start', '開始日期'); optDate('end', '結束日期');
      if (x.start && x.end && x.end < x.start) e.push('結束日期不能早於開始日期'); break;
    case 'supplementLogs': needDate(); if (!x.supplementId) e.push('缺少補充品'); break;
    case 'sleep': needDate(); if (!inRange(x.hours, 0, 24)) e.push('睡眠時數不正確'); if (!inRange(x.quality, 1, 5)) e.push('睡眠品質請選 1–5'); break;
    case 'exercise': needDate(); if (!x.name?.trim()) e.push('請填寫運動名稱'); if (!inRange(x.minutes, 0, 600)) e.push('運動時間請填 0–600 分鐘'); break;
    case 'hospitals': case 'doctors': if (!x.name?.trim()) e.push('請填寫名稱'); break;
    case 'visits': needDate('date', '看診日期'); optDate('nextDate', '下次回診日期'); if (!x.kind) e.push('請選擇類型'); break;
    case 'insurance': if (!x.name?.trim()) e.push('請填寫保單名稱'); optDate('effective', '生效日期');
      if (!inRange(x.premium, 0, 1e8)) e.push('保費不正確'); if (!inRange(x.sum, 0, 1e10)) e.push('保額不正確'); break;
    case 'expenses': needDate(); if (!x.category) e.push('請選擇類別');
      if (typeof x.amount !== 'number' || !(x.amount > 0) || x.amount > 1e8) e.push('請填寫正確的金額'); break;
    case 'items': if (!x.name?.trim()) e.push('請填寫品項');
      if (!inRange(x.budget, 0, 1e8)) e.push('預算不正確'); if (!inRange(x.price, 0, 1e8)) e.push('花費不正確'); break;
    case 'benefits': if (!x.name?.trim()) e.push('請填寫福利名稱'); optDate('date', '日期'); optDate('deadline', '申請期限');
      if (x.url && !okUrl(x.url)) e.push('網址格式不正確，請貼上完整網址（從瀏覽器網址列複製）');
      if (!inRange(x.amount, 0, 1e8)) e.push('金額不正確'); break;
    case 'plans':
      if (!x.name?.trim()) e.push('請填寫名稱'); optDate('date', '預約／檢查日期');
      if (!inRange(x.weekFrom, 0, 42) || !inRange(x.weekTo, 0, 42)) e.push('孕週請填 0–42');
      if (x.weekFrom != null && x.weekTo != null && x.weekTo < x.weekFrom) e.push('結束孕週不能小於開始孕週');
      if (!inRange(x.lead, 0, 20)) e.push('提前預約請填 0–20 週');
      if (!inRange(x.cost, 0, 1e7) || !inRange(x.paid, 0, 1e7) || !inRange(x.subsidyAmt, 0, 1e7)) e.push('金額不正確');
      if (x.url && !okUrl(x.url)) e.push('網址格式不正確，請貼上完整網址（從瀏覽器網址列複製）');
      break;
    case 'journal': needDate(); if (!inRange(x.nausea, 0, 5)) e.push('噁心程度請選 0–5'); if (!inRange(x.vomit, 0, 50)) e.push('孕吐次數不正確'); break;
  }
  return e;
}
const okUrl = (u: string) => /^https?:\/\/[^\s]+\.[^\s]+/.test(u);
export { okDate, okUrl };
