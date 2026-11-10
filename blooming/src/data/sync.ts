// ---------- 雲端同步用的合併規則（純函式，方便測試）----------
// 每筆紀錄比 updatedAt，新的贏；刪除會留下「墓碑」（id → 刪除時間），別台裝置同步時也會刪掉，不會又長回來。

/** 刪除紀錄：id → 刪除的時間 */
export type Tomb = Record<string, number>;
export interface Row { id: string; updatedAt: number; date?: string; [k: string]: unknown }

/** 墓碑留多久（天）：超過就清掉，避免越存越多 */
export const TOMB_DAYS = 400;

export function mergeTomb(a: Tomb = {}, b: Tomb = {}, now = Date.now()): Tomb {
  const r: Tomb = {}, min = now - TOMB_DAYS * 864e5;
  for (const t of [a, b]) for (const [id, ts] of Object.entries(t)) if (+ts > min && !(r[id] >= +ts)) r[id] = +ts;
  return r;
}

/**
 * 合併手機上和雲端上的同一種資料。
 * uniqueDate：每天只能有一筆（身體紀錄、睡眠、日記）；兩台裝置同一天各記了一筆，留比較新的那筆。
 */
export function mergeTable<T extends Row>(local: T[], cloud: T[], tl: Tomb = {}, tc: Tomb = {}, uniqueDate = false, now = Date.now()): { rows: T[]; tomb: Tomb } {
  const tomb = mergeTomb(tl, tc, now);
  const by = new Map<string, T>();
  for (const r of [...local, ...cloud]) {
    if (!r || typeof r.id !== 'string') continue;
    const c = by.get(r.id);
    if (!c || (+r.updatedAt || 0) > (+c.updatedAt || 0)) by.set(r.id, r);
  }
  // 刪除之後沒有再改過的，就算刪掉了
  let rows = [...by.values()].filter(r => !(tomb[r.id] >= (+r.updatedAt || 0)));
  if (uniqueDate) {
    const day = new Map<string, T>();
    for (const r of rows) {
      const k = String(r.date), c = day.get(k);
      if (!c) { day.set(k, r); continue; }
      const [win, lose] = (+r.updatedAt || 0) > (+c.updatedAt || 0) ? [r, c] : [c, r];
      day.set(k, win); tomb[lose.id] = Math.max(tomb[lose.id] || 0, +lose.updatedAt || 0);
    }
    rows = [...day.values()];
  }
  rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { rows, tomb };
}

/** 兩邊的內容是不是一樣（只比 id 和修改時間） */
export function sameRows(a: Row[], b: Row[]): boolean {
  if (a.length !== b.length) return false;
  const m = new Map(a.map(r => [r.id, +r.updatedAt || 0]));
  return b.every(r => m.get(r.id) === (+r.updatedAt || 0));
}
export function sameTomb(a: Tomb = {}, b: Tomb = {}): boolean {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => a[k] === b[k]);
}

/** 一個雲端文件最多約 1 MB：資料太多就分成好幾份 */
export function chunk<T>(rows: T[], max = 900_000): string[] {
  const out: string[] = [];
  let cur: string[] = [], len = 2;
  for (const r of rows) {
    const s = JSON.stringify(r);
    if (cur.length && len + s.length + 1 > max) { out.push('[' + cur.join(',') + ']'); cur = []; len = 2; }
    cur.push(s); len += s.length + 1;
  }
  out.push('[' + cur.join(',') + ']');
  return out;
}
