import { data, syncHooks, DEFAULT_SETTINGS } from './repo';
import { TABLES, type FileRec, type Settings, type TableName } from './types';
import { chunk, mergeTable, mergeTomb, sameRows, sameTomb, type Row, type Tomb } from './sync';

/*
 * 雲端同步（Firebase）
 * - 手機上的資料庫（IndexedDB）照樣是主要的，打開快、沒網路也能用；有登入就同步到自己的私人雲端。
 * - 存在 data/users/{uid}/ 底下，跟記帳同一個地方，只有自己看得到（firestore.rules 已經限制）：
 *   b_{資料種類}（太大會分成 b_{種類}.2、.3…）、b__settings 設定、b__meta 刪除紀錄、p_bd_{id} 照片與附件。
 * - 登入跟網站其他頁共用（同一個網址），在記帳登入過，這裡就會自動登入。
 */

const V = '12.18.0', CDN = `https://www.gstatic.com/firebasejs/${V}/`;
const imp = (u: string) => import(/* @vite-ignore */ u);
const UNIQUE_DATE: TableName[] = ['body', 'sleep', 'journal'];
const FILE_MAX = 1_000_000;  // 一個雲端文件最多約 1 MB

export type Phase = 'starting' | 'local' | 'login' | 'syncing' | 'ok' | 'error';
export interface SyncState { phase: Phase; email?: string; last?: number; msg?: string; tooBig?: number }

let state: SyncState = { phase: 'starting' };
const subs = new Set<() => void>();
// 第一次跟雲端對完（或確定連不上、沒登入）才算準備好：例如放預設清單前要先等，才不會兩台裝置各放一份
let readyFn: () => void = () => {};
const readyP = new Promise<void>(r => { readyFn = r; });
const set = (p: Partial<SyncState>) => {
  state = { ...state, ...p };
  if (['ok', 'error', 'local', 'login'].includes(state.phase)) readyFn();
  subs.forEach(f => f());
};
export const cloud = {
  get: () => state,
  subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
  syncNow: () => sync(),
  /** 等第一次同步完成（最多等 8 秒） */
  ready: () => Promise.race([readyP, new Promise<void>(r => setTimeout(r, 8000))]),
  login: async (_e: string, _p: string): Promise<string> => '還沒準備好，請稍後再試'
};

// ---------- 這支手機上記的同步狀態 ----------
const ls = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
};
/** 這支手機上刪掉、還沒跟雲端對過的：{ 種類: { id: 刪除時間 } } */
const loadTomb = () => ls.get<Record<string, Tomb>>('bd-tomb', {});
const saveTomb = (t: Record<string, Tomb>) => ls.set('bd-tomb', t);
/** 已經上傳（或從雲端抓下來）的附件；太大傳不上去的另外記 */
const loadUp = () => new Set(ls.get<string[]>('bd-up', []));
const saveUp = (s: Set<string>) => ls.set('bd-up', [...s]);
const loadBig = () => new Set(ls.get<string[]>('bd-big', []));
const saveBig = (s: Set<string>) => ls.set('bd-big', [...s]);

syncHooks.deleted = (table, ids) => {
  const t = loadTomb(), now = Date.now();
  t[table] = t[table] || {};
  for (const id of ids) t[table][id] = now;
  saveTomb(t);
};

// ---------- Firebase ----------
let fb: { fs: any; m: any; col: string } | null = null;
let busy = false, again = false, timer = 0;
syncHooks.changed = () => { if (!fb) return; clearTimeout(timer); timer = window.setTimeout(sync, 1500); };

/** 別台裝置加的照片、附件：要看的時候才從雲端抓 */
syncHooks.fetchFile = async (id: string) => {
  if (!fb) return undefined;
  const { fs, m, col } = fb;
  const x = await m.getDoc(m.doc(fs, col, 'p_bd_' + id));
  if (!x.exists()) return undefined;
  const d = x.data();
  const rec: FileRec = { id, name: d.name || '檔案', type: d.type || 'application/octet-stream', size: +d.size || 0, createdAt: +d.createdAt || Date.now(), blob: await (await fetch(d.d)).blob() };
  await data.db.files.put(rec);
  const up = loadUp(); up.add(id); saveUp(up);
  return rec;
};

async function toDataURL(b: Blob) {
  return await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(b); });
}
/** 照片太大就縮小（雲端那份縮小，手機上的原檔不動） */
async function shrink(b: Blob, side: number, q: number): Promise<Blob> {
  const bm = await createImageBitmap(b), k = Math.min(1, side / Math.max(bm.width, bm.height));
  const c = document.createElement('canvas'); c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
  c.getContext('2d')!.drawImage(bm, 0, 0, c.width, c.height);
  return await new Promise<Blob>((res, rej) => c.toBlob(x => (x ? res(x) : rej(new Error('壓縮失敗'))), 'image/jpeg', q));
}
async function fileDoc(f: FileRec): Promise<Record<string, unknown> | null> {
  let blob = f.blob, type = f.type;
  let d = await toDataURL(blob);
  if (d.length > FILE_MAX && /^image\//.test(type)) {
    for (const [side, q] of [[1800, 0.82], [1400, 0.75], [1000, 0.7]] as const) {
      try { blob = await shrink(f.blob, side, q); type = 'image/jpeg'; d = await toDataURL(blob); } catch { break; }
      if (d.length <= FILE_MAX) break;
    }
  }
  if (d.length > FILE_MAX) return null;
  return { d, name: f.name, type, size: blob.size, createdAt: f.createdAt };
}

async function sync(): Promise<void> {
  if (!fb) return;
  if (busy) { again = true; return; }
  busy = true; clearTimeout(timer);
  set({ phase: 'syncing' });
  const { fs, m, col } = fb;
  try {
    // 1. 讀雲端
    const snap = await m.getDocs(m.query(m.collection(fs, col), m.where(m.documentId(), '>=', 'b_'), m.where(m.documentId(), '<', 'b`')));
    const docs = new Map<string, any>(); snap.docs.forEach((d: any) => docs.set(d.id, d.data()));
    const cloudRows: Record<string, Row[]> = {}, chunks: Record<string, string[]> = {};
    for (const [id, v] of docs) {
      const mt = id.match(/^b_([a-zA-Z]+)(?:\.\d+)?$/);
      if (!mt || !TABLES.includes(mt[1] as TableName)) continue;
      (chunks[mt[1]] = chunks[mt[1]] || []).push(id);
      try { (cloudRows[mt[1]] = cloudRows[mt[1]] || []).push(...JSON.parse(v.j)); } catch { /* 壞掉的略過 */ }
    }
    let cloudTomb: Record<string, Tomb> = {};
    try { cloudTomb = JSON.parse(docs.get('b__meta')?.j || '{}').tomb || {}; } catch { /* ignore */ }
    const localTomb = loadTomb(), tomb: Record<string, Tomb> = {};
    let localChanged = false;
    const now = Date.now();

    // 2. 每種資料：合併、放回手機、寫回雲端
    for (const n of TABLES) {
      const t = (data.db as any)[n];
      const local: Row[] = await t.toArray();
      const r = mergeTable(local, cloudRows[n] || [], localTomb[n], cloudTomb[n], UNIQUE_DATE.includes(n), now);
      tomb[n] = r.tomb;
      const lm = new Map(local.map(x => [x.id, +x.updatedAt || 0]));
      const put = r.rows.filter(x => lm.get(x.id) !== (+x.updatedAt || 0));
      const keep = new Set(r.rows.map(x => x.id)), del = local.filter(x => !keep.has(x.id)).map(x => x.id);
      if (put.length || del.length) {
        await data.db.transaction('rw', t, async () => { if (del.length) await t.bulkDelete(del); if (put.length) await t.bulkPut(put); });
        localChanged = true;
      }
      if (!sameRows(r.rows, cloudRows[n] || [])) {
        const parts = chunk(r.rows), ids = parts.map((_, i) => 'b_' + n + (i ? '.' + (i + 1) : ''));
        for (let i = 0; i < parts.length; i++) await m.setDoc(m.doc(fs, col, ids[i]), { j: parts[i], t: now });
        for (const old of chunks[n] || []) if (!ids.includes(old)) await m.deleteDoc(m.doc(fs, col, old));
      }
    }

    // 3. 照片與附件：別台裝置刪掉的，這裡也刪；這裡刪掉的，雲端也刪
    tomb._files = mergeTomb(localTomb._files, cloudTomb._files, now);
    const fileIds = new Set((await data.db.files.toCollection().primaryKeys()) as string[]);
    const goneHere = Object.keys(tomb._files).filter(id => fileIds.has(id));
    const up = loadUp(), big = loadBig();
    if (goneHere.length) { await data.db.files.bulkDelete(goneHere); goneHere.forEach(id => up.delete(id)); localChanged = true; }
    for (const id of Object.keys(localTomb._files || {})) {
      if (up.has(id)) { await m.deleteDoc(m.doc(fs, col, 'p_bd_' + id)); up.delete(id); }
      big.delete(id);
    }

    // 4. 設定：比較新的贏
    const ls_: Settings | undefined = await data.db.settings.get('me');
    let cs: Settings | null = null; try { cs = docs.get('b__settings') ? JSON.parse(docs.get('b__settings').j) : null; } catch { /* ignore */ }
    if (cs && (!ls_ || (+cs.updatedAt || 0) > (+ls_.updatedAt || 0))) { await data.db.settings.put({ ...DEFAULT_SETTINGS, ...cs, id: 'me' }); localChanged = true; }
    else if (ls_ && (!cs || (+ls_.updatedAt || 0) > (+cs.updatedAt || 0))) await m.setDoc(m.doc(fs, col, 'b__settings'), { j: JSON.stringify(ls_), t: now });

    // 5. 刪除紀錄
    const ct = cloudTomb as Record<string, Tomb>;
    if (Object.keys(tomb).some(k => !sameTomb(tomb[k], ct[k] || {})) || Object.keys(ct).some(k => !tomb[k]))
      await m.setDoc(m.doc(fs, col, 'b__meta'), { j: JSON.stringify({ tomb }), t: now });
    // 對過的刪除紀錄就不用再記；同步途中又刪的留著，下次再對
    const cur = loadTomb();
    for (const k of Object.keys(localTomb)) for (const [id, ts] of Object.entries(localTomb[k])) if (cur[k]?.[id] === ts) delete cur[k][id];
    saveTomb(cur);

    // 6. 上傳還沒上傳的照片與附件（照片太大會先縮小；還是太大的只留在這支手機）
    for (const f of await data.db.files.toArray()) {
      if (up.has(f.id) || big.has(f.id)) continue;
      const d = await fileDoc(f);
      if (!d) { big.add(f.id); continue; }
      await m.setDoc(m.doc(fs, col, 'p_bd_' + f.id), d);
      up.add(f.id);
      saveUp(up);
    }
    saveUp(up); saveBig(big);

    if (localChanged) data.refresh();
    set({ phase: 'ok', last: Date.now(), msg: undefined, tooBig: big.size });
  } catch (e: any) {
    console.error('雲端同步', e);
    set({ phase: 'error', msg: e?.code === 'permission-denied' ? '沒有權限：請確認登入的是你的帳號，而且 Email 已經驗證' : navigator.onLine ? '同步失敗，等一下會再試' : '沒有網路，先存在這支手機，連上網路會再同步' });
  }
  busy = false;
  if (again) { again = false; sync(); }
}

const ERR: Record<string, string> = {
  'auth/invalid-credential': 'Email 或密碼錯誤', 'auth/wrong-password': 'Email 或密碼錯誤', 'auth/user-not-found': 'Email 或密碼錯誤',
  'auth/invalid-email': 'Email 格式不正確', 'auth/missing-password': '請輸入密碼', 'auth/too-many-requests': '嘗試太多次，請稍後再試',
  'auth/network-request-failed': '網路連線失敗，請確認網路後再試'
};

/** 打開 App 時呼叫一次 */
export async function startCloud() {
  if (typeof window === 'undefined') return;
  let cfg: any, appm: any, am: any, fsm: any;
  try {
    // firebase-config.js 跟網站其他頁共用（放在網站根目錄，幸孕女子在 /blooming/ 底下）
    cfg = (await imp(new URL('../firebase-config.js', location.href).href)).firebaseConfig;
    [appm, am, fsm] = await Promise.all([imp(CDN + 'firebase-app.js'), imp(CDN + 'firebase-auth.js'), imp(CDN + 'firebase-firestore.js')]);
  } catch {
    return set({ phase: 'local', msg: navigator.onLine ? '連不到雲端，資料先存在這支手機' : '沒有網路，資料先存在這支手機，連上網路後重新打開就會同步' });
  }
  if (!cfg?.apiKey) return set({ phase: 'local', msg: '還沒設定雲端' });
  const app = appm.initializeApp(cfg), auth = am.getAuth(app), fs = fsm.getFirestore(app);
  try { await am.setPersistence(auth, am.browserLocalPersistence); } catch { /* ignore */ }
  cloud.login = async (email: string, pw: string) => {
    try { await am.signInWithEmailAndPassword(auth, email.trim(), pw); return ''; }
    catch (e: any) { return ERR[e?.code] || '登入失敗（' + (e?.code || e) + '）'; }
  };
  am.onAuthStateChanged(auth, (user: any) => {
    if (!user) { fb = null; return set({ phase: 'login', email: undefined }); }
    // 這支手機的資料是另一個帳號的：不要混在一起
    const owner = ls.get<string>('bd-owner', '');
    if (owner && owner !== user.uid) { fb = null; return set({ phase: 'error', email: user.email, msg: '這支手機上的資料是另一個帳號的，沒有同步。請用原本的帳號登入。' }); }
    ls.set('bd-owner', user.uid);
    fb = { fs, m: fsm, col: 'data/users/' + user.uid };
    set({ email: user.email });
    sync();
  });
  // 回到這個 App、連上網路、每兩分鐘：跟別台裝置對一下
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  addEventListener('online', () => sync());
  setInterval(() => { if (!document.hidden) sync(); }, 120_000);
}
