import { describe, expect, it } from 'vitest';
import { cycleStats, dayMarks } from '../src/lib/cycle';
import { pregnancy } from '../src/lib/pregnancy';
import { sleepHours } from '../src/lib/dates';

const P = (start: string, end?: string) => ({ id: start, createdAt: 0, updatedAt: 0, start, end });

describe('cycle predictions', () => {
  it('no data: no prediction', () => {
    const s = cycleStats([], '2026-11-06');
    expect(s.confidence).toBe('none'); expect(s.nextStart).toBeUndefined();
  });
  it('one period: still no prediction (not pretending)', () => {
    const s = cycleStats([P('2026-10-20')], '2026-11-06');
    expect(s.confidence).toBe('none'); expect(s.nextStart).toBeUndefined(); expect(s.cycleDay).toBe(18);
  });
  it('two periods: low-confidence estimate', () => {
    const s = cycleStats([P('2026-09-22', '2026-09-26'), P('2026-10-20', '2026-10-24')], '2026-11-06');
    expect(s.confidence).toBe('low'); expect(s.avgCycle).toBe(28); expect(s.avgPeriod).toBe(5);
    expect(s.nextStart).toBe('2026-11-17'); expect(s.ovulation).toBe('2026-11-03');
    expect(s.fertileStart).toBe('2026-10-29'); expect(s.fertileEnd).toBe('2026-11-04');
  });
  it('regular history is ok; irregular flagged', () => {
    const ok = cycleStats([P('2026-07-01'), P('2026-07-29'), P('2026-08-27'), P('2026-09-24')], '2026-10-01');
    expect(ok.confidence).toBe('ok'); expect(ok.irregular).toBe(false);
    const irr = cycleStats([P('2026-06-01'), P('2026-06-24'), P('2026-08-01'), P('2026-08-26')], '2026-09-01');
    expect(irr.irregular).toBe(true);
  });
  it('outlier cycles are ignored', () => {
    const s = cycleStats([P('2026-01-01'), P('2026-04-15'), P('2026-05-13')], '2026-05-20');
    expect(s.lengths).toEqual([28]); expect(s.ignored).toBe(1);
  });
  it('late period is reported but nothing else changes', () => {
    const s = cycleStats([P('2026-09-01'), P('2026-09-29')], '2026-11-06');
    expect(s.lateBy).toBe(10);
  });
  it('future periods are not used', () => {
    const s = cycleStats([P('2026-10-01'), P('2026-12-01')], '2026-11-06');
    expect(s.count).toBe(1); expect(s.confidence).toBe('none');
  });
  it('calendar marks distinguish actual vs predicted', () => {
    const ps = [P('2026-09-22', '2026-09-26'), P('2026-10-20', '2026-10-24')];
    const s = cycleStats(ps, '2026-11-06');
    const m = dayMarks(ps, s, '2026-10-01', '2026-11-30', '2026-11-06');
    expect(m['2026-10-21'].period).toBe(true);
    expect(m['2026-11-17'].predicted).toBe(true);
    expect(m['2026-11-17'].period).toBeUndefined();
    expect(m['2026-12-01']).toBeUndefined();
    expect(m['2026-11-03']).toBeUndefined(); // 過去的排卵預測不顯示
  });
});

describe('pregnancy', () => {
  it('weeks and EDD from LMP', () => {
    const p = pregnancy('2026-07-01', undefined, '2026-11-06')!;
    expect(p.edd).toBe('2027-04-07'); expect(p.weeks).toBe(18); expect(p.dayOfWeek).toBe(2); expect(p.trimester).toBe(2);
  });
  it('doctor-adjusted EDD wins', () => {
    const p = pregnancy('2026-07-01', '2027-04-14', '2026-11-06')!;
    expect(p.adjusted).toBe(true); expect(p.weeks).toBe(17); expect(p.edd).toBe('2027-04-14');
  });
  it('future LMP returns null', () => { expect(pregnancy('2026-12-01', undefined, '2026-11-06')).toBeNull(); });
});

describe('sleep hours', () => {
  it('handles crossing midnight', () => { expect(sleepHours('23:30', '07:00')).toBe(7.5); expect(sleepHours('01:00', '08:15')).toBe(7.3); });
});
