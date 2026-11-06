import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { BloomDB } from '../src/data/db';
import { createDexieService, DuplicateError, ValidationError } from '../src/data/repo';

const svc = () => createDexieService(new BloomDB('t' + Math.random()));

describe('repository', () => {
  it('validates input', async () => {
    const d = svc();
    await expect(d.table('expenses').add({ date: '2026-11-06', category: '產檢費', amount: -5 })).rejects.toBeInstanceOf(ValidationError);
    await expect(d.table('periods').add({ start: '2026-11-06', end: '2026-11-01' })).rejects.toBeInstanceOf(ValidationError);
    await expect(d.table('body').add({ date: '2026-13-40' })).rejects.toBeInstanceOf(ValidationError);
  });
  it('one journal / body record per day (hard duplicate)', async () => {
    const d = svc();
    const a = await d.table('journal').add({ date: '2026-11-06', text: 'a' });
    const e = await d.table('journal').add({ date: '2026-11-06', text: 'b' }).catch(x => x);
    expect(e).toBeInstanceOf(DuplicateError); expect(e.hard).toBe(true); expect(e.existingId).toBe(a.id);
    await expect(d.table('journal').add({ date: '2026-11-06' }, { force: true })).rejects.toBeInstanceOf(DuplicateError);
    // 修改自己不算重複
    await d.table('journal').update(a.id, { text: 'c' });
  });
  it('overlapping periods rejected', async () => {
    const d = svc();
    await d.table('periods').add({ start: '2026-10-20', end: '2026-10-24' });
    await expect(d.table('periods').add({ start: '2026-10-22' })).rejects.toBeInstanceOf(DuplicateError);
    await d.table('periods').add({ start: '2026-11-17' });
  });
  it('soft duplicate expense can be forced', async () => {
    const d = svc();
    const r = { date: '2026-11-06', category: '掛號費', amount: 150 };
    await d.table('expenses').add(r);
    const e = await d.table('expenses').add(r).catch(x => x);
    expect(e).toBeInstanceOf(DuplicateError); expect(e.hard).toBe(false);
    await d.table('expenses').add(r, { force: true });
    expect((await d.table('expenses').list()).length).toBe(2);
  });
  it('removing a supplement removes its logs', async () => {
    const d = svc();
    const s = await d.table('supplements').add({ name: '葉酸' });
    await d.table('supplementLogs').add({ date: '2026-11-06', supplementId: s.id });
    await expect(d.table('supplementLogs').add({ date: '2026-11-06', supplementId: s.id })).rejects.toBeInstanceOf(DuplicateError);
    await d.table('supplements').remove(s.id);
    expect(await d.table('supplementLogs').list()).toEqual([]);
  });
  it('backup round-trip keeps records, settings and files', async () => {
    const a = svc();
    await a.saveSettings({ name: 'Mei', stage: 'pregnant', lmp: '2026-07-01' });
    const fid = await a.putFile(new Blob(['hello'], { type: 'text/plain' }), 'note.txt');
    await a.table('visits').add({ date: '2026-11-06', kind: '產檢', files: [fid] });
    await a.table('expenses').add({ date: '2026-11-06', category: '產檢費', amount: 500 });
    const b = JSON.parse(JSON.stringify(await a.exportBackup()));
    const c = svc();
    await c.table('journal').add({ date: '2026-01-01' });
    const r = await c.importBackup(b);
    expect(r.imported).toBe(2); expect(r.skipped).toBe(0);
    expect((await c.table('journal').list()).length).toBe(0);
    expect((await c.getSettings()).lmp).toBe('2026-07-01');
    expect((await c.getFile(fid))?.name).toBe('note.txt');
    await expect(c.importBackup({ app: 'other' })).rejects.toThrow();
  });
  it('csv export escapes and joins arrays', async () => {
    const d = svc();
    await d.table('periods').add({ start: '2026-10-20', symptoms: ['經痛', '腰痠'], note: 'a,"b"' });
    const csv = await d.exportCSV('periods');
    expect(csv).toContain('經痛、腰痠'); expect(csv).toContain('"a,""b"""');
  });
});

describe('baby prep', () => {
  it('bulk adds seed lists and skips invalid rows', async () => {
    const d = createDexieService(new BloomDB('t' + Math.random()));
    const n = await d.bulkAdd('items', [{ name: '奶瓶', cat: '哺餵' }, { name: '' } as any, { name: '尿布', price: -1 } as any]);
    expect(n).toBe(1);
    await d.bulkAdd('benefits', [{ name: '產假 8 週', cat: '生產', status: '還沒申請' }]);
    const b = JSON.parse(JSON.stringify(await d.exportBackup()));
    expect(b.tables.items.length).toBe(1); expect(b.tables.benefits.length).toBe(1);
  });
  it('old backups without the new lists still restore', async () => {
    const d = createDexieService(new BloomDB('t' + Math.random()));
    const r = await d.importBackup({ app: 'blooming-days', version: 1, exportedAt: 'x', settings: null, tables: { journal: [{ id: 'j', date: '2026-11-06', createdAt: 1, updatedAt: 1 }] }, files: [] });
    expect(r.imported).toBe(1); expect(await d.table('items').list()).toEqual([]);
  });
});
