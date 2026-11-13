import { describe, expect, it } from 'vitest';
import { chunk, mergeTable, mergeTomb, sameRows, TOMB_DAYS } from '../src/data/sync';

// 時間都用「現在往前幾毫秒」，才不會被當成太舊的刪除紀錄清掉
const NOW = 1_800_000_000_000, T = (n: number) => NOW - 1_000_000 + n;
const r = (id: string, updatedAt: number, extra: Record<string, unknown> = {}) => ({ id, updatedAt: T(updatedAt), ...extra });

describe('cloud sync merge', () => {
  it('keeps records from both sides, newer edit wins', () => {
    const m = mergeTable([r('a', 1), r('b', 5, { v: 'phone' })], [r('b', 3, { v: 'pc' }), r('c', 2)], {}, {}, false, NOW);
    expect(m.rows.map(x => x.id)).toEqual(['a', 'b', 'c']);
    expect(m.rows.find(x => x.id === 'b')!.v).toBe('phone');
  });
  it('deleted on one device stays deleted', () => {
    const m = mergeTable([], [r('a', 10)], { a: T(20) }, {}, false, NOW);
    expect(m.rows).toEqual([]);
    expect(m.tomb.a).toBe(T(20));
  });
  it('edited after the delete comes back', () => {
    const m = mergeTable([r('a', 30)], [], {}, { a: T(20) }, false, NOW);
    expect(m.rows.map(x => x.id)).toEqual(['a']);
  });
  it('one record per day: keeps the newer, tombstones the other', () => {
    const m = mergeTable([r('x', 5, { date: '2026-11-10' })], [r('y', 9, { date: '2026-11-10' })], {}, {}, true, NOW);
    expect(m.rows.map(x => x.id)).toEqual(['y']);
    expect(m.tomb.x).toBe(T(5));
    // 另一台裝置之後同步，也不會把 x 帶回來
    expect(mergeTable([r('x', 5, { date: '2026-11-10' })], m.rows, {}, m.tomb, true, NOW).rows.map(x => x.id)).toEqual(['y']);
  });
  it('old tombstones are cleaned up', () => {
    const old = NOW - (TOMB_DAYS + 1) * 864e5;
    expect(mergeTomb({ a: old, b: NOW - 1000 }, {}, NOW)).toEqual({ b: NOW - 1000 });
  });
  it('compares rows by id and edit time', () => {
    expect(sameRows([r('a', 1), r('b', 2)], [r('b', 2), r('a', 1)])).toBe(true);
    expect(sameRows([r('a', 1)], [r('a', 2)])).toBe(false);
  });
  it('splits big data into documents under the size limit', () => {
    const rows = Array.from({ length: 50 }, (_, i) => r('id' + i, i, { text: 'x'.repeat(1000) }));
    const parts = chunk(rows, 10_000);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every(p => p.length <= 10_000)).toBe(true);
    expect(parts.flatMap(p => JSON.parse(p))).toEqual(rows);
    expect(chunk([])).toEqual(['[]']);
  });
});
