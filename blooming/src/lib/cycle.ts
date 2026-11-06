import type { Period } from '../data/types';
import { daysBetween, shift } from './dates';

/*
 * 週期預測：只用使用者自己的歷史紀錄估算。
 * - 少於兩次月經開始日：沒有週期長度，不預測（顯示「尚待累積」）
 * - 只有 1–2 個週期：可以估算，但標示「資料還很少」
 * - 週期長短差超過 7 天：標示「週期不規律，預測可能不準」
 */
export type Confidence = 'none' | 'low' | 'ok';
export interface CycleStats {
  count: number;              // 月經紀錄筆數
  lengths: number[];          // 可用的週期長度（由舊到新）
  ignored: number;            // 太短或太長、沒有拿來算的週期
  avgCycle?: number;
  avgPeriod?: number;
  minCycle?: number; maxCycle?: number;
  irregular: boolean;
  confidence: Confidence;
  last?: Period;
  nextStart?: string;         // 預測下次月經
  ovulation?: string;         // 預測排卵日
  fertileStart?: string; fertileEnd?: string;
  lateBy?: number;            // 比預測晚幾天（只是提醒，不會改變階段）
  cycleDay?: number;          // 今天是這次週期第幾天
}
const MIN = 15, MAX = 60, USE = 6;

export function cycleStats(periods: Period[], todayStr: string): CycleStats {
  const ps = [...periods].filter(p => p.start <= todayStr).sort((a, b) => a.start.localeCompare(b.start));
  const all: number[] = [];
  for (let i = 1; i < ps.length; i++) all.push(daysBetween(ps[i - 1].start, ps[i].start));
  const lengths = all.filter(n => n >= MIN && n <= MAX).slice(-USE);
  const durs = ps.filter(p => p.end).map(p => daysBetween(p.start, p.end!) + 1).slice(-USE);
  const last = ps[ps.length - 1];
  const s: CycleStats = { count: ps.length, lengths, ignored: all.length - all.filter(n => n >= MIN && n <= MAX).length, irregular: false, confidence: 'none', last };
  if (durs.length) s.avgPeriod = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
  if (last) s.cycleDay = daysBetween(last.start, todayStr) + 1;
  if (!lengths.length || !last) return s;
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  s.avgCycle = avg; s.minCycle = Math.min(...lengths); s.maxCycle = Math.max(...lengths);
  s.irregular = s.maxCycle - s.minCycle > 7;
  s.confidence = lengths.length >= 3 ? 'ok' : 'low';
  s.nextStart = shift(last.start, avg);
  // 黃體期一般約 14 天：排卵日 ≈ 下次月經前 14 天；易孕期 = 排卵日前 5 天到後 1 天
  s.ovulation = shift(s.nextStart, -14);
  s.fertileStart = shift(s.ovulation, -5); s.fertileEnd = shift(s.ovulation, 1);
  const late = daysBetween(s.nextStart, todayStr);
  if (late > 0) s.lateBy = late;
  return s;
}

/** 日曆用：某天是實際經期、預測經期、易孕期還是預測排卵日 */
export type DayMark = { period?: boolean; predicted?: boolean; fertile?: boolean; ovulation?: boolean };
export function dayMarks(periods: Period[], st: CycleStats, from: string, to: string, todayStr: string): Record<string, DayMark> {
  const m: Record<string, DayMark> = {};
  const put = (d: string, k: keyof DayMark) => { if (d >= from && d <= to) (m[d] ||= {})[k] = true; };
  for (const p of periods) {
    const end = p.end || (p.start <= todayStr ? (st.avgPeriod ? shift(p.start, st.avgPeriod - 1) : p.start) : p.start);
    for (let d = p.start; d <= end && d <= to; d = shift(d, 1)) put(d, 'period');
  }
  if (st.nextStart && st.ovulation && st.fertileStart && st.fertileEnd) {
    const plen = st.avgPeriod || 5;
    // 往後預測三個週期；已經過去的預測不顯示
    for (let k = 0; k < 3; k++) {
      const ns = shift(st.nextStart, k * st.avgCycle!);
      if (ns >= todayStr || k === 0) for (let i = 0; i < plen; i++) { const d = shift(ns, i); if (d >= todayStr && !m[d]?.period) put(d, 'predicted'); }
      const ov = shift(st.ovulation, k * st.avgCycle!);
      if (ov >= todayStr) {
        for (let d = shift(ov, -5); d <= shift(ov, 1); d = shift(d, 1)) if (d >= todayStr) put(d, 'fertile');
        put(ov, 'ovulation');
      }
    }
  }
  return m;
}
