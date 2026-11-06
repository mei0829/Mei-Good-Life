import { describe, expect, it } from 'vitest';
import { buildEvents, planAlert, planWindow } from '../src/lib/events';
import { planSeeds } from '../src/content/plans';
import type { Plan, Settings } from '../src/data/types';

const P = (x: Partial<Plan>): Plan => ({ id: Math.random().toString(), createdAt: 0, updatedAt: 0, name: '測試', stage: 'preg', status: '待安排', ...x });
const S = (x: Partial<Settings>): Settings => ({ id: 'me', name: '', stage: 'pregnant', updatedAt: 0, ...x });

describe('plan timing', () => {
  it('turns weeks into dates and a book-by date', () => {
    const w = planWindow(P({ weekFrom: 11, weekTo: 14, lead: 3 }), '2026-07-01');
    expect(w.start).toBe('2026-09-16'); expect(w.end).toBe('2026-10-13'); expect(w.bookBy).toBe('2026-08-26');
  });
  it('no dates without LMP or for preconception items', () => {
    expect(planWindow(P({ weekFrom: 11 }), undefined)).toEqual({});
    expect(planWindow(P({ stage: 'pre', weekFrom: 11 }), '2026-07-01')).toEqual({});
  });
  it('alerts: book now, soon, missed, nothing once booked', () => {
    const p = P({ weekFrom: 20, weekTo: 24, lead: 4 }), w = planWindow(p, '2026-07-01'); // 11/18–12/22，10/21 前預約
    expect(planAlert(p, w, '2026-10-25')).toBe('book-now');
    expect(planAlert(p, w, '2026-10-10')).toBe('book-soon');
    expect(planAlert(p, w, '2026-09-01')).toBeNull();
    expect(planAlert(p, w, '2026-12-30')).toBe('missed');
    expect(planAlert({ ...p, date: '2026-11-20' }, w, '2026-10-25')).toBeNull();
    expect(planAlert({ ...p, status: '已完成' }, w, '2026-12-30')).toBeNull();
  });
});

describe('calendar events', () => {
  const plans = [P({ name: '高層次超音波', weekFrom: 20, weekTo: 24, lead: 4 }), P({ name: 'NT', date: '2026-11-10', time: '10:30' }), P({ name: '孕前檢查', stage: 'pre', date: '2026-11-12' })];
  it('includes checks, booking reminders, follow-ups, deadlines and due date', () => {
    const ev = buildEvents({ s: S({ lmp: '2026-07-01' }), today: '2026-10-01', plans, periods: [],
      visits: [{ id: 'v', createdAt: 0, updatedAt: 0, date: '2026-10-05', kind: '產檢', nextDate: '2026-11-02' }],
      benefits: [{ id: 'b', createdAt: 0, updatedAt: 0, name: '縣市生育津貼', deadline: '2026-12-01' }] }, '2026-10-01', '2027-04-30');
    const t = ev.map(e => e.kind + ':' + e.title);
    expect(t).toContain('book:預約：高層次超音波');
    expect(t).toContain('check:NT');
    expect(t).toContain('visit:回診（產檢）');
    expect(t).toContain('benefit:申請期限：縣市生育津貼');
    expect(t).toContain('edd:預產期');
    expect(t.some(x => x.includes('孕前檢查'))).toBe(false); // 懷孕時不顯示備孕項目
    expect(ev.find(e => e.kind === 'book')!.d).toBe('2026-10-21');
  });
});

describe('seed list', () => {
  it('has preconception and pregnancy items; public items cost 0, self-pay left blank', () => {
    const s = planSeeds();
    expect(s.filter(p => p.stage === 'pre').length).toBeGreaterThan(5);
    expect(s.filter(p => p.stage === 'preg').length).toBe(27);
    expect(s.filter(p => p.subsidy === '公費').every(p => p.cost === 0)).toBe(true);
    expect(s.filter(p => p.subsidy === '自費').every(p => p.cost == null)).toBe(true);
    expect(s.every(p => !p.url || p.url.startsWith('https://'))).toBe(true);
  });
});
