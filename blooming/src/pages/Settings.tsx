import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Trash2, ShieldCheck } from 'lucide-react';
import { useApp, STAGE_LABEL } from '../app';
import { data } from '../data/repo';
import { TABLES, TABLE_LABEL, type Stage, type TableName } from '../data/types';
import { ConfirmPregnancy } from '../components/Stage';
import { Note, PageHeader, Section, cx, useToast } from '../components/ui';
import { today as todayStr } from '../lib/dates';

function download(name: string, text: string | Blob, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(text instanceof Blob ? text : new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

export default function SettingsPage() {
  const { s } = useApp();
  const toast = useToast();
  const [name, setName] = useState(s.name);
  const [confirm, setConfirm] = useState(false);
  const [csv, setCsv] = useState<TableName>('expenses');
  const [usage, setUsage] = useState<string>('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const restoreInp = useRef<HTMLInputElement>(null);
  useEffect(() => {
    navigator.storage?.estimate?.().then(e => setUsage(e.usage != null ? (e.usage / 1024 / 1024).toFixed(1) + ' 百萬位元組' : ''));
    navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  const setStage = async (st: Stage) => {
    if (st === s.stage) return;
    if (st === 'pregnant') return setConfirm(true);
    const msg = st === 'preconception' ? '切換回「備孕中」？孕期資料會保留，只是不顯示孕期功能。' : '切換到「產後」？產後功能目前是預留，之後會擴充；所有資料都會保留。';
    if (confirm_(msg)) { await data.saveSettings({ stage: st }); toast('已切換為' + STAGE_LABEL[st]); }
  };
  const backup = async () => {
    const b = await data.exportBackup();
    download(`blooming-days-backup-${todayStr()}.json`, JSON.stringify(b));
    toast('已下載完整備份（含附件）');
  };
  const restore = async (f?: File) => {
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      if (!confirm_('用這個備份檔取代目前所有資料？目前的資料會被覆蓋，建議先下載一份備份。')) return;
      const r = await data.importBackup(obj);
      toast(`已還原 ${r.imported} 筆${r.skipped ? `，${r.skipped} 筆格式不正確已略過` : ''}`);
    } catch (e) { alert('無法還原：' + ((e as Error).message || '檔案格式不正確')); }
  };
  const persist = async () => { const ok = await navigator.storage?.persist?.(); setPersisted(!!ok); toast(ok ? '瀏覽器已同意保留資料' : '瀏覽器沒有同意，請定期備份'); };
  const wipe = async () => {
    const t = prompt('這會刪除這個瀏覽器裡 Blooming Days 的全部資料，無法復原。\n請輸入「刪除」確認：');
    if (t !== '刪除') return;
    await data.clearAll(); toast('已刪除全部資料');
  };

  return (
    <div>
      <PageHeader kicker="Blooming Days・個人與資料" title="設定與備份" />
      <div className="grid lg:grid-cols-2 gap-x-12">
        <div>
          <Section title="個人">
            <label className="block text-[12.5px] text-mute mb-1.5" htmlFor="nm">稱呼（顯示在首頁問候）</label>
            <div className="flex gap-2"><input id="nm" className="field" value={name} onChange={e => setName(e.target.value)} maxLength={20} /><button className="btn-primary" onClick={async () => { await data.saveSettings({ name: name.trim() }); toast('已儲存'); }}>儲存</button></div>
          </Section>

          <Section title="目前階段">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="目前階段">
              {(['preconception', 'pregnant', 'postpartum'] as Stage[]).map(st => (
                <button key={st} role="radio" aria-checked={s.stage === st} onClick={() => setStage(st)}
                  className={cx('rounded-[14px] border px-3 py-3 text-left transition', s.stage === st ? 'border-forest bg-paper' : 'border-line')}>
                  <div className="serif text-[15px]">{STAGE_LABEL[st]}</div>
                  <div className="text-[11.5px] text-mute">{st === 'preconception' ? '月經與備孕' : st === 'pregnant' ? '孕週與產檢' : '預留・未來擴充'}</div>
                </button>
              ))}
            </div>
            <p className="text-[12.5px] text-mute mt-3 leading-relaxed">切換成懷孕需要你自己確認並輸入末次月經日期；月經延遲不會自動切換。切換階段不會刪除任何資料。</p>
          </Section>
        </div>

        <div>
          <Section title="備份與還原">
            <div className="mb-4"><Note tone="rose">資料只存在<b>這個瀏覽器</b>，不會上傳到任何伺服器。清除瀏覽器資料、使用無痕模式、換手機或換瀏覽器，資料都可能消失，也不會在手機和電腦之間同步。請定期下載備份檔，放在安全的地方。</Note></div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={backup}><Download size={15} strokeWidth={1.5} />下載完整備份檔</button>
              <button className="btn-ghost" onClick={() => restoreInp.current?.click()}><Upload size={15} strokeWidth={1.5} />從備份還原</button>
            </div>
            <input ref={restoreInp} type="file" accept="application/json,.json" hidden onChange={e => { restore(e.target.files?.[0]); e.target.value = ''; }} />
            <p className="text-[12px] text-mute mt-2">備份檔包含所有紀錄、設定、照片與附件。備份檔沒有加密，請小心保管、不要隨意分享。</p>

            <div className="mt-6">
              <label className="block text-[12.5px] text-mute mb-1.5" htmlFor="csv">匯出試算表檔案（可以用試算表軟體打開）</label>
              <div className="flex gap-2">
                <select id="csv" className="field" value={csv} onChange={e => setCsv(e.target.value as TableName)}>{TABLES.map(t => <option key={t} value={t}>{TABLE_LABEL[t]}</option>)}</select>
                <button className="btn-ghost shrink-0" onClick={async () => download(`blooming-${csv}-${todayStr()}.csv`, await data.exportCSV(csv), 'text/csv')}>匯出</button>
              </div>
            </div>
          </Section>

          <Section title="隱私與儲存">
            <ul className="text-[13px] leading-relaxed space-y-1.5 text-ink/85">
              <li>・不需要登入，健康資料不會傳送到外部服務，也不會出現在網址裡。</li>
              <li>・資料存在瀏覽器內建的資料庫；這不是加密保險箱，能使用這台裝置的人就可能看到。</li>
              <li>・附件與照片也存在本機，會包含在完整備份裡。</li>
            </ul>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-[13px]">
              <span className="text-mute">已使用 {usage || '—'}</span>
              {persisted ? <span className="flex items-center gap-1 text-forest"><ShieldCheck size={15} strokeWidth={1.5} />瀏覽器會盡量保留資料</span>
                : <button className="btn-ghost" onClick={persist}>請瀏覽器保留資料</button>}
            </div>
          </Section>

          <Section title="刪除資料">
            <button className="btn-ghost text-alert" onClick={wipe}><Trash2 size={15} strokeWidth={1.5} />刪除這個瀏覽器的全部資料</button>
          </Section>
        </div>
      </div>
      <ConfirmPregnancy open={confirm} onClose={() => setConfirm(false)} />
    </div>
  );
}
const confirm_ = (m: string) => window.confirm(m);
