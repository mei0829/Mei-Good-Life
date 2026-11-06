import { useEffect, useRef, useState } from 'react';
import { Paperclip, Trash2, FileText, X } from 'lucide-react';
import { data, DuplicateError, ValidationError } from '../data/repo';
import type { TableName, Tables } from '../data/types';
import { Scale, Sheet, cx, useToast } from './ui';

export type Field = {
  key: string; label: string; hint?: string; half?: boolean; required?: boolean;
  type: 'text' | 'number' | 'date' | 'time' | 'select' | 'multi' | 'textarea' | 'scale' | 'check' | 'files' | 'images';
  options?: (string | [string, string])[]; min?: number; max?: number; step?: number; unit?: string; scaleLabels?: [string, string];
  show?: (v: Record<string, any>) => boolean;
};

export function FormFields({ fields, v, set, onFile }: { fields: Field[]; v: Record<string, any>; set: (k: string, val: any) => void; onFile?: (ids: string[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      {fields.filter(f => !f.show || f.show(v)).map(f => (
        <div key={f.key} className={f.half ? 'col-span-1' : 'col-span-2'}>
          {f.type !== 'check' && <label className="block text-[12.5px] text-mute mb-1.5" htmlFor={'f-' + f.key}>{f.label}{f.required && <span className="text-alert"> *</span>}{f.unit && <span className="ml-1">（{f.unit}）</span>}</label>}
          <Input f={f} value={v[f.key]} set={val => set(f.key, val)} onFile={onFile} />
          {f.hint && <p className="text-[11.5px] text-mute mt-1">{f.hint}</p>}
        </div>
      ))}
    </div>
  );
}

function Input({ f, value, set, onFile }: { f: Field; value: any; set: (v: any) => void; onFile?: (ids: string[]) => void }) {
  const opts = (f.options || []).map(o => (Array.isArray(o) ? o : [o, o]) as [string, string]);
  const id = 'f-' + f.key;
  switch (f.type) {
    case 'textarea': return <textarea id={id} className="field min-h-[88px]" value={value ?? ''} onChange={e => set(e.target.value)} />;
    case 'number': return <input id={id} className="field num" type="number" inputMode="decimal" step={f.step ?? 'any'} min={f.min} max={f.max} value={value ?? ''} onChange={e => set(e.target.value === '' ? undefined : +e.target.value)} />;
    case 'select': return (
      <select id={id} className="field" value={value ?? ''} onChange={e => set(e.target.value || undefined)}>
        <option value="">請選擇</option>{opts.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
      </select>);
    case 'multi': {
      const cur: string[] = value || [];
      return <div className="flex flex-wrap gap-1.5">{opts.map(([k, n]) => <button type="button" key={k} onClick={() => set(cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k])} className={cx('chip', cur.includes(k) && 'chip-on')}>{n}</button>)}</div>;
    }
    case 'scale': return <Scale value={value} onChange={set} min={f.min ?? 0} max={f.max ?? 5} labels={f.scaleLabels} />;
    case 'check': return (
      <label className="flex items-center gap-2.5 text-[14.5px]"><input id={id} type="checkbox" className="w-5 h-5 accent-forest" checked={!!value} onChange={e => set(e.target.checked)} />{f.label}</label>);
    case 'files': case 'images': return <FilesInput ids={value || []} set={set} images={f.type === 'images'} onFile={onFile} />;
    default: return <input id={id} className={cx('field', (f.type === 'date' || f.type === 'time') && 'num')} type={f.type} value={value ?? ''} onChange={e => set(e.target.value)} />;
  }
}

/** 附件：存在這個瀏覽器（IndexedDB） */
function FilesInput({ ids, set, images, onFile }: { ids: string[]; set: (v: string[]) => void; images?: boolean; onFile?: (ids: string[]) => void }) {
  const inp = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const add = async (fl: FileList | null) => {
    if (!fl) return;
    const nids: string[] = [];
    for (const f of Array.from(fl)) {
      if (f.size > 15 * 1024 * 1024) { toast(`「${f.name}」超過 15 百萬位元組，沒有加入`); continue; }
      nids.push(await data.putFile(f));
    }
    onFile?.(nids); set([...ids, ...nids]);
  };
  return (
    <div>
      <FileList ids={ids} onRemove={id => set(ids.filter(x => x !== id))} />
      <input ref={inp} type="file" multiple hidden accept={images ? 'image/*' : 'image/*,application/pdf'} onChange={e => { add(e.target.files); e.target.value = ''; }} />
      <button type="button" className="btn-ghost mt-2" onClick={() => inp.current?.click()}><Paperclip size={15} strokeWidth={1.5} />{images ? '加入照片' : '加入附件（照片或文件檔）'}</button>
    </div>
  );
}

/** 顯示附件，點一下用新視窗打開 */
export function FileList({ ids, onRemove }: { ids: string[]; onRemove?: (id: string) => void }) {
  const [items, setItems] = useState<{ id: string; name: string; type: string; url: string }[]>([]);
  useEffect(() => {
    let alive = true; const urls: string[] = [];
    Promise.all(ids.map(id => data.getFile(id))).then(fs => {
      if (!alive) return;
      setItems(fs.filter(Boolean).map(f => { const url = URL.createObjectURL(f!.blob); urls.push(url); return { id: f!.id, name: f!.name, type: f!.type, url }; }));
    });
    return () => { alive = false; urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [ids.join(',')]);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(f => (
        <div key={f.id} className="relative">
          <a href={f.url} target="_blank" rel="noopener" className="block">
            {f.type.startsWith('image/') ? <img src={f.url} alt={f.name} className="w-20 h-20 object-cover rounded-[10px] border border-line" />
              : <div className="w-20 h-20 rounded-[10px] border border-line bg-paper flex flex-col items-center justify-center gap-1 px-1"><FileText size={20} strokeWidth={1.3} className="text-forest" /><span className="text-[10px] text-mute truncate w-full text-center">{f.name}</span></div>}
          </a>
          {onRemove && <button type="button" onClick={() => onRemove(f.id)} className="absolute -top-1.5 -right-1.5 bg-ink text-paper rounded-full p-0.5" aria-label={'移除 ' + f.name}><X size={12} /></button>}
        </div>
      ))}
    </div>
  );
}

/** 通用新增／修改視窗：驗證、防止重複、刪除都在這裡 */
export function EntityForm<K extends TableName>({ table, id, initial, fields, title, open, onClose, footnote, onSaved, derive }: {
  table: K; id?: string; initial?: Record<string, any>; fields: Field[]; title: string; open: boolean; onClose: () => void; footnote?: string; onSaved?: (r: Tables[K]) => void;
  /** 儲存前自動計算的欄位（例如睡眠時數） */ derive?: (v: Record<string, any>) => Record<string, any>;
}) {
  const [v, setV] = useState<Record<string, any>>({});
  const [curId, setCurId] = useState<string | undefined>(id);
  const [errs, setErrs] = useState<string[]>([]);
  const [dup, setDup] = useState<DuplicateError | null>(null);
  const [busy, setBusy] = useState(false);
  const fresh = useRef<string[]>([]);
  const toast = useToast();
  const repo = data.table(table);
  useEffect(() => {
    if (!open) return;
    setErrs([]); setDup(null); setCurId(id); fresh.current = [];
    if (id) repo.get(id).then(r => setV({ ...(r as any) })); else setV({ ...(initial || {}) });
  }, [open, id]);
  const set = (k: string, val: any) => { setV(o => ({ ...o, [k]: val })); setErrs([]); setDup(null); };
  const cancel = () => { fresh.current.forEach(f => data.removeFile(f)); onClose(); };
  const save = async (force = false) => {
    setBusy(true);
    try {
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = derive ? derive(v) : v;
      // 必填檢查
      const miss = fields.filter(f => f.required && (!f.show || f.show(v)) && (rest[f.key] == null || rest[f.key] === '')).map(f => '請填寫' + f.label);
      if (miss.length) { setErrs(miss); return; }
      const r = curId ? await repo.update(curId, rest as any, { force }) : await repo.add(rest as any, { force });
      fresh.current = [];
      toast(curId ? '已更新' : '已新增'); onSaved?.(r as any); onClose();
    } catch (e) {
      if (e instanceof ValidationError) setErrs(e.errors);
      else if (e instanceof DuplicateError) setDup(e);
      else setErrs([String((e as Error).message || e)]);
    } finally { setBusy(false); }
  };
  const del = async () => {
    if (!curId || !confirm('確定要刪除這筆資料？刪除後無法復原（附件也會一起刪除）。')) return;
    await repo.remove(curId); toast('已刪除'); onClose();
  };
  const openExisting = async () => { if (!dup) return; const r = await repo.get(dup.existingId); setCurId(dup.existingId); setV({ ...(r as any) }); setDup(null); };
  return (
    <Sheet open={open} onClose={cancel} title={(curId ? '修改' : '新增') + title}>
      <FormFields fields={fields} v={v} set={set} onFile={ids => { fresh.current.push(...ids); }} />
      {footnote && <p className="text-[12px] text-mute mt-4 leading-relaxed">{footnote}</p>}
      {errs.length > 0 && <div role="alert" className="mt-4 text-[13px] text-alert bg-rose-soft rounded-[12px] px-3 py-2">{errs.map(e => <div key={e}>・{e}</div>)}</div>}
      {dup && (
        <div role="alert" className="mt-4 text-[13px] bg-oat-soft rounded-[12px] px-3 py-2.5">
          <div>{dup.message}</div>
          <div className="flex gap-2 mt-2">
            <button className="btn-ghost" onClick={openExisting}>打開那一筆</button>
            {!dup.hard && <button className="btn-primary" onClick={() => save(true)}>仍要儲存</button>}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center gap-3 mt-6">
        {curId ? <button className="btn-quiet text-alert" onClick={del}><Trash2 size={15} strokeWidth={1.5} />刪除</button> : <span />}
        <div className="flex gap-2"><button className="btn-ghost" onClick={cancel}>取消</button><button className="btn-primary px-6" disabled={busy} onClick={() => save()}>儲存</button></div>
      </div>
    </Sheet>
  );
}

/** 方便頁面開關表單 */
export function useEditor() {
  const [st, setSt] = useState<{ open: boolean; id?: string; initial?: Record<string, any> }>({ open: false });
  return { ...st, add: (initial?: Record<string, any>) => setSt({ open: true, initial }), edit: (id: string) => setSt({ open: true, id }), close: () => setSt(s => ({ ...s, open: false })) };
}
