import { BloomDB } from './db';
import { validate } from './validate';
import { TABLES, type Base, type FileRec, type Settings, type TableName, type Tables } from './types';

/*
 * Repository / Service Layer
 * 畫面只透過這裡讀寫資料；之後要換成雲端資料庫，只要另外實作 DataService 就好。
 */
export type NewRec<T> = Omit<T, keyof Base>;
export class ValidationError extends Error { constructor(public errors: string[]) { super(errors.join('、')); } }
/** 重複紀錄：hard = 不允許（例如同一天兩筆日記）；soft = 可能重複，使用者確認後可以照樣新增 */
export class DuplicateError extends Error { constructor(msg: string, public existingId: string, public hard: boolean) { super(msg); } }

export interface Repo<T extends Base> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  add(data: NewRec<T>, opts?: { force?: boolean }): Promise<T>;
  update(id: string, data: Partial<NewRec<T>>, opts?: { force?: boolean }): Promise<T>;
  remove(id: string): Promise<void>;
}
export interface Backup {
  app: 'blooming-days'; version: 1; exportedAt: string; settings: Settings | null;
  tables: { [K in TableName]?: Tables[K][] }; files: (Omit<FileRec, 'blob'> & { data: string })[];
}
/** 給雲端同步用：資料改了、刪了要通知；手機上找不到的附件可以從雲端抓 */
export interface SyncHooks {
  changed(): void;
  deleted(table: TableName | '_files', ids: string[]): void;
  fetchFile(id: string): Promise<FileRec | undefined>;
}
export const syncHooks: SyncHooks = { changed() {}, deleted() {}, fetchFile: async () => undefined };

export interface DataService {
  table<K extends TableName>(name: K): Repo<Tables[K]>;
  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<Settings>;
  putFile(file: File | Blob, name?: string): Promise<string>;
  getFile(id: string): Promise<FileRec | undefined>;
  removeFile(id: string): Promise<void>;
  exportBackup(): Promise<Backup>;
  importBackup(b: unknown): Promise<{ imported: number; skipped: number }>;
  exportCSV(name: TableName): Promise<string>;
  /** 一次新增很多筆（例如預設清單），格式不對的略過 */
  bulkAdd<K extends TableName>(name: K, rows: NewRec<Tables[K]>[]): Promise<number>;
  clearAll(): Promise<void>;
  subscribe(fn: () => void): () => void;
  /** 雲端同步把別台裝置的資料放進來之後，通知畫面重新讀（不會再觸發同步） */
  refresh(): void;
}

export const DEFAULT_SETTINGS: Settings = { id: 'me', name: '', stage: 'preconception', defaultCycle: 28, budgetByCat: {}, favorites: [], updatedAt: 0 };
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

// 找出重複的紀錄
async function findDuplicate(db: BloomDB, name: TableName, r: any, selfId?: string): Promise<DuplicateError | null> {
  const other = (x: any) => x && x.id !== selfId;
  const one = async (t: any, q: Record<string, any>) => (await t.where(q).toArray()).find(other);
  switch (name) {
    case 'body': case 'sleep': case 'journal': {
      const x = await one(db[name], { date: r.date });
      return x ? new DuplicateError('這一天已經有紀錄了，請直接修改那一筆', x.id, true) : null;
    }
    case 'supplementLogs': {
      const x = await one(db.supplementLogs, { date: r.date, supplementId: r.supplementId });
      return x ? new DuplicateError('今天已經記錄過這個補充品', x.id, true) : null;
    }
    case 'periods': {
      const all = (await db.periods.toArray()).filter(other);
      const end = r.end || r.start;
      const x = all.find(p => p.start === r.start || (r.start <= (p.end || p.start) && end >= p.start));
      return x ? new DuplicateError(`跟 ${x.start} 開始的月經紀錄重疊`, x.id, true) : null;
    }
    case 'expenses': {
      const x = (await db.expenses.where({ date: r.date }).toArray()).filter(other)
        .find(e => e.amount === r.amount && e.category === r.category && (e.item || '') === (r.item || ''));
      return x ? new DuplicateError('同一天已經有一筆一樣的花費，確定要再新增一筆嗎？', x.id, false) : null;
    }
    case 'hospitals': case 'doctors': case 'supplements': case 'insurance': case 'items': case 'benefits': {
      const x = (await (db[name] as any).toArray()).filter(other).find((h: any) => h.name.trim() === String(r.name || '').trim());
      return x ? new DuplicateError(`已經有「${x.name}」了，確定要再新增一筆嗎？`, x.id, false) : null;
    }
  }
  return null;
}

// 空字串、undefined、NaN 都拿掉，存進去的資料比較乾淨
function clean<T extends object>(o: T): T {
  const r: any = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    r[k] = typeof v === 'string' ? v.trim() : v;
  }
  return r;
}

async function toB64(b: Blob) {
  const u = new Uint8Array(await b.arrayBuffer());
  let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return `data:${b.type || 'application/octet-stream'};base64,${btoa(s)}`;
}
const fromB64 = async (d: string) => (await fetch(d)).blob();
const csvCell = (v: unknown) => { const s = Array.isArray(v) ? v.join('、') : v == null ? '' : typeof v === 'boolean' ? (v ? '是' : '否') : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export function createDexieService(db = new BloomDB(), hooks: SyncHooks = { changed() {}, deleted() {}, fetchFile: async () => undefined }): DataService & { db: BloomDB } {
  const subs = new Set<() => void>();
  const emit = () => subs.forEach(f => f());
  // 別的分頁改了資料也要更新
  let bc: BroadcastChannel | null = null;
  try { bc = new BroadcastChannel('blooming-days'); bc.onmessage = () => subs.forEach(f => f()); } catch { /* 不支援就算了 */ }
  const refresh = () => { emit(); try { bc?.postMessage(1); } catch { /* ignore */ } };
  const changed = () => { refresh(); hooks.changed(); };

  const repos = new Map<TableName, Repo<any>>();
  function table<K extends TableName>(name: K): Repo<Tables[K]> {
    if (repos.has(name)) return repos.get(name)!;
    const t = (db as any)[name] as import('dexie').Table<any, string>;
    const repo: Repo<any> = {
      list: () => t.toArray(),
      get: id => t.get(id),
      async add(data, opts) {
        const r = clean(data as any);
        const errs = validate(name, r); if (errs.length) throw new ValidationError(errs);
        const dup = await findDuplicate(db, name, r); if (dup && (dup.hard || !opts?.force)) throw dup;
        const now = Date.now(), rec = { ...r, id: uid(), createdAt: now, updatedAt: now };
        await t.add(rec); changed(); return rec;
      },
      async update(id, data, opts) {
        const cur = await t.get(id); if (!cur) throw new Error('找不到這筆資料');
        const r = clean({ ...cur, ...data, id, createdAt: cur.createdAt });
        const errs = validate(name, r); if (errs.length) throw new ValidationError(errs);
        const dup = await findDuplicate(db, name, r, id); if (dup && (dup.hard || !opts?.force)) throw dup;
        const rec = { ...r, updatedAt: Date.now() };
        await t.put(rec); changed(); return rec;
      },
      async remove(id) {
        const cur: any = await t.get(id);
        // 一起刪掉附件
        const files = [...(cur?.files || []), ...(cur?.photos || [])];
        const logs = name === 'supplements' ? (await db.supplementLogs.where('supplementId').equals(id).primaryKeys()) as string[] : [];
        await db.transaction('rw', [t, db.files, db.supplementLogs], async () => {
          await t.delete(id);
          if (files.length) await db.files.bulkDelete(files);
          if (name === 'supplements') await db.supplementLogs.where('supplementId').equals(id).delete();
        });
        hooks.deleted(name, [id]);
        if (files.length) hooks.deleted('_files', files);
        if (logs.length) hooks.deleted('supplementLogs', logs);
        changed();
      }
    };
    repos.set(name, repo);
    return repo;
  }

  // 刪掉整批資料前，先記下有哪些（雲端也要一起刪）
  const allIds = async () => {
    const r: Record<string, string[]> = {};
    for (const n of TABLES) r[n] = (await (db as any)[n].toCollection().primaryKeys()) as string[];
    r._files = (await db.files.toCollection().primaryKeys()) as string[];
    return r;
  };
  const deletedSince = async (before: Record<string, string[]>) => {
    const now = await allIds();
    for (const k of Object.keys(before)) {
      const keep = new Set(now[k] || []), gone = before[k].filter(id => !keep.has(id));
      if (gone.length) hooks.deleted(k as TableName, gone);
    }
  };

  return {
    db,
    refresh,
    table,
    async getSettings() { return { ...DEFAULT_SETTINGS, ...(await db.settings.get('me')) }; },
    async saveSettings(patch) {
      const cur = { ...DEFAULT_SETTINGS, ...(await db.settings.get('me')) };
      const next: Settings = { ...cur, ...patch, id: 'me', updatedAt: Date.now() };
      await db.settings.put(next); changed(); return next;
    },
    async putFile(file, name) {
      const id = uid();
      await db.files.put({ id, name: name || (file as File).name || '檔案', type: file.type || 'application/octet-stream', size: file.size, blob: file, createdAt: Date.now() });
      hooks.changed();
      return id;
    },
    // 這支手機上沒有（別台裝置加的）：從雲端抓下來
    getFile: async id => (await db.files.get(id)) || (await hooks.fetchFile(id).catch(() => undefined)),
    async removeFile(id) { await db.files.delete(id); hooks.deleted('_files', [id]); changed(); },
    async exportBackup() {
      const tables: Backup['tables'] = {};
      for (const n of TABLES) (tables as any)[n] = await (db as any)[n].toArray();
      const files = await Promise.all((await db.files.toArray()).map(async ({ blob, ...f }) => ({ ...f, data: await toB64(blob) })));
      return { app: 'blooming-days', version: 1, exportedAt: new Date().toISOString(), settings: (await db.settings.get('me')) || null, tables, files };
    },
    async importBackup(raw) {
      const b = raw as Backup;
      if (!b || b.app !== 'blooming-days' || b.version !== 1 || typeof b.tables !== 'object') throw new Error('這不是 Blooming Days 的備份檔');
      let imported = 0, skipped = 0;
      const ok: Record<string, any[]> = {};
      for (const n of TABLES) {
        ok[n] = [];
        for (const r of (b.tables as any)[n] || []) {
          if (r && typeof r.id === 'string' && !validate(n, r).length) { ok[n].push({ ...r, createdAt: +r.createdAt || Date.now(), updatedAt: +r.updatedAt || Date.now() }); imported++; }
          else skipped++;
        }
      }
      // 每天只能一筆的資料：同一天重複的只留最新的
      for (const n of ['body', 'sleep', 'journal']) {
        const m = new Map<string, any>(); for (const r of ok[n]) { const c = m.get(r.date); if (!c || r.updatedAt > c.updatedAt) { if (c) skipped++, imported--; m.set(r.date, r); } else { skipped++; imported--; } }
        ok[n] = [...m.values()];
      }
      const files: FileRec[] = [];
      for (const f of b.files || []) { try { files.push({ id: f.id, name: f.name, type: f.type, size: f.size, createdAt: f.createdAt, blob: await fromB64(f.data) }); } catch { skipped++; } }
      const before = await allIds();
      await db.transaction('rw', [...TABLES.map(n => (db as any)[n]), db.files, db.settings], async () => {
        for (const n of TABLES) { await (db as any)[n].clear(); await (db as any)[n].bulkPut(ok[n]); }
        await db.files.clear(); await db.files.bulkPut(files);
        // 還原的設定算是最新的，雲端才不會用舊的蓋回來
        await db.settings.clear(); if (b.settings) await db.settings.put({ ...DEFAULT_SETTINGS, ...b.settings, id: 'me', updatedAt: Date.now() });
      });
      await deletedSince(before);
      changed();
      return { imported, skipped };
    },
    async exportCSV(name) {
      const rows: any[] = await (db as any)[name].toArray();
      const keys = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => !['createdAt', 'updatedAt', 'files', 'photos'].includes(k));
      return '﻿' + [keys, ...rows.map(r => keys.map(k => r[k]))].map(r => r.map(csvCell).join(',')).join('\r\n');
    },
    async bulkAdd(name, rows) {
      const now = Date.now();
      const ok = rows.map(r => clean(r as any)).filter(r => !validate(name, r).length).map((r, i) => ({ ...r, id: uid(), createdAt: now + i, updatedAt: now + i }));
      await (db as any)[name].bulkAdd(ok); changed(); return ok.length;
    },
    async clearAll() {
      const before = await allIds();
      await db.transaction('rw', [...TABLES.map(n => (db as any)[n]), db.files, db.settings], async () => {
        for (const n of TABLES) await (db as any)[n].clear();
        await db.files.clear(); await db.settings.clear();
        // 設定改回預設，並標成最新，雲端上的舊設定才不會蓋回來
        await db.settings.put({ ...DEFAULT_SETTINGS, updatedAt: Date.now() });
      });
      await deletedSince(before);
      changed();
    },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; }
  };
}

export const data = createDexieService(new BloomDB(), {
  changed: () => syncHooks.changed(), deleted: (t, ids) => syncHooks.deleted(t, ids), fetchFile: id => syncHooks.fetchFile(id)
});
