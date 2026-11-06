import type { Benefit, Period, Plan, Settings, Visit } from '../data/types';
import { cycleStats } from './cycle';
import { shift } from './dates';
import { pregnancy } from './pregnancy';

/** 檢查的建議時段（依孕週換成日期）與「最晚要預約的日期」 */
export interface PlanWindow { start?: string; end?: string; bookBy?: string }
export function planWindow(p: Plan, lmpBase: string | undefined): PlanWindow {
  if (p.stage !== 'preg' || !lmpBase || p.weekFrom == null) return {};
  const start = shift(lmpBase, p.weekFrom * 7);
  const end = shift(lmpBase, ((p.weekTo ?? p.weekFrom) + 1) * 7 - 1);
  return { start, end, bookBy: p.lead ? shift(start, -p.lead * 7) : undefined };
}
/** 懷孕時用來換算孕週的基準日（醫師調整過的預產期優先） */
export const lmpBase = (s: Settings, today: string) => (s.stage === 'pregnant' ? pregnancy(s.lmp, s.edd, today)?.lmp : undefined);

/** 這個項目現在的提醒狀態 */
export type PlanAlert = 'book-now' | 'book-soon' | 'missed' | 'in-window' | null;
export function planAlert(p: Plan, w: PlanWindow, today: string): PlanAlert {
  if (p.status && p.status !== '待安排') return null;
  if (p.date) return null;
  if (w.end && w.end < today) return 'missed';
  if (w.bookBy && w.bookBy <= today) return 'book-now';
  if (w.bookBy && w.bookBy <= shift(today, 14)) return 'book-soon';
  if (w.start && w.start <= today) return 'in-window';
  return null;
}

// ---------- 行事曆事件 ----------
export type EvKind = 'period' | 'predicted' | 'fertile' | 'check' | 'book' | 'visit' | 'benefit' | 'edd';
export interface Ev { d: string; kind: EvKind; title: string; sub?: string; route: string }
export const EV_LABEL: Record<EvKind, string> = {
  period: '月經', predicted: '預測月經', fertile: '易孕期', check: '檢查', book: '預約提醒', visit: '看診', benefit: '福利', edd: '預產期',
};

export function buildEvents(x: { s: Settings; today: string; plans: Plan[]; visits: Visit[]; benefits: Benefit[]; periods: Period[] }, from: string, to: string): Ev[] {
  const { s, today } = x;
  const out: Ev[] = [];
  const add = (e: Ev) => { if (e.d >= from && e.d <= to) out.push(e); };
  const base = lmpBase(s, today);
  const stageOk = (p: Plan) => !p.stage || (p.stage === 'preg') === (s.stage === 'pregnant');
  for (const p of x.plans) {
    if (p.status === '不需要' || !stageOk(p)) continue;
    if (p.date) add({ d: p.date, kind: 'check', title: p.name, sub: [p.time, p.where, p.status].filter(Boolean).join('・'), route: 'medical/plans' });
    else {
      const w = planWindow(p, base);
      if (w.bookBy && p.status !== '已完成') add({ d: w.bookBy, kind: 'book', title: '預約：' + p.name, sub: '建議第 ' + p.weekFrom + (p.weekTo !== p.weekFrom ? '–' + p.weekTo : '') + ' 週做', route: 'medical/plans' });
    }
  }
  for (const v of x.visits) {
    add({ d: v.date, kind: 'visit', title: v.kind, sub: v.items, route: 'medical/visits' });
    if (v.nextDate && !x.visits.some(o => o.date === v.nextDate)) add({ d: v.nextDate, kind: 'visit', title: '回診（' + v.kind + '）', route: 'medical/visits' });
  }
  for (const b of x.benefits) {
    if (b.status === '不適用' || b.status === '已領取') continue;
    if (b.deadline) add({ d: b.deadline, kind: 'benefit', title: '申請期限：' + b.name, sub: b.where, route: 'prep/benefits' });
  }
  if (s.stage === 'pregnant') { const p = pregnancy(s.lmp, s.edd, today); if (p) add({ d: p.edd, kind: 'edd', title: '預產期', route: 'medical' }); }
  // 月經：實際紀錄；備孕時另外放預測月經與易孕期
  for (const p of x.periods) {
    const end = p.end || p.start;
    for (let d = p.start; d <= end && d <= to; d = shift(d, 1)) if (d >= from) add({ d, kind: 'period', title: '月經', route: 'cycle' });
  }
  if (s.stage === 'preconception') {
    const st = cycleStats(x.periods, today);
    if (st.nextStart && st.avgCycle && st.fertileStart && st.fertileEnd) {
      for (let k = 0; k < 3; k++) {
        const ns = shift(st.nextStart, k * st.avgCycle);
        if (ns >= today) add({ d: ns, kind: 'predicted', title: '預測月經', route: 'cycle' });
        const fs = shift(st.fertileStart, k * st.avgCycle), fe = shift(st.fertileEnd, k * st.avgCycle);
        for (let d = fs; d <= fe; d = shift(d, 1)) if (d >= today) add({ d, kind: 'fertile', title: d === shift(st.ovulation!, k * st.avgCycle) ? '預測排卵日' : '易孕期', route: 'cycle' });
      }
    }
  }
  const order: EvKind[] = ['edd', 'check', 'visit', 'book', 'benefit', 'period', 'predicted', 'fertile'];
  return out.sort((a, b) => a.d.localeCompare(b.d) || order.indexOf(a.kind) - order.indexOf(b.kind));
}
