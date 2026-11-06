import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Trash2, ShieldCheck } from 'lucide-react';
import { useApp, STAGE_LABEL } from '../app';
import { data } from '../data/repo';
import { TABLES, TABLE_LABEL, type Stage, type TableName } from '../data/types';
import { ConfirmPregnancy } from '../components/Stage';
import { Note, PageHeader, Section, cx, useToast } from '../components/ui';
import { today as todayStr } from '../lib/dates';
import { THEMES, THEME_IDS, isTheme, type ThemeId } from '../lib/theme';
import { Check } from 'lucide-react';

function download(name: string, text: string | Blob, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(text instanceof Blob ? text : new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

export default function SettingsPage() {
  const { s, themeId } = useApp();
  const toast = useToast();
  const [name, setName] = useState(s.name);
  useEffect(() => { setName(s.name); }, [s.name]);  // 還原備份後也要更新
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

          <Section title="外觀">
            <p className="text-[12.5px] text-mute mb-3">選一個喜歡的顏色主題，會記在這支手機上。</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5" role="radiogroup" aria-label="顏色主題">
              {THEME_IDS.map(id => <ThemeCard key={id} id={id} on={(isTheme(s.theme) ? s.theme : 'forest') === id} showing={themeId === id}
                onPick={async () => { await data.saveSettings({ theme: id }); toast('已換成「' + THEMES[id].name + '」'); }} />)}
            </div>
            <label className="flex items-center justify-between gap-3 mt-4 text-[14px] cursor-pointer">
              <span>夜間模式跟著手機自動切換<span className="block text-[12px] text-mute">手機切到深色模式時，自動改用「夜間」主題</span></span>
              <Switch on={!!s.themeAuto} onChange={v => data.saveSettings({ themeAuto: v })} label="夜間模式跟著手機自動切換" />
            </label>
            {s.themeAuto && themeId === 'night' && s.theme !== 'night' && <p className="text-[12px] text-mute mt-2">手機目前是深色模式，所以先顯示「夜間」；手機切回淺色就會用你選的「{THEMES[isTheme(s.theme) ? s.theme : 'forest'].name}」。</p>}
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

/** 主題卡片：主題自己的顏色畫一個小小的畫面預覽 */
function ThemeCard({ id, on, showing, onPick }: { id: ThemeId; on: boolean; showing: boolean; onPick: () => void }) {
  const t = THEMES[id], c = t.c;
  return (
    <button role="radio" aria-checked={on} onClick={onPick} className={cx('relative text-left rounded-[16px] border p-2.5 transition', on ? 'border-forest ring-1 ring-forest' : 'border-line')}>
      <div className="rounded-[11px] p-2.5 h-[78px] flex flex-col justify-between" style={{ background: c.ivory, border: '1px solid ' + c.line }}>
        <div className="flex items-center justify-between">
          <span className="brand text-[13px]" style={{ color: c.forest }}>Blooming</span>
          <span className="w-9 h-3.5 rounded-full" style={{ background: c.forest }} />
        </div>
        <div className="rounded-[8px] px-2 py-1.5" style={{ background: c.paper, border: '1px solid ' + c.line }}>
          <div className="h-1.5 w-12 rounded-full" style={{ background: c.sage }} />
          <div className="flex gap-1 mt-1.5">{[c.oat, c.rose, c['sage-soft']].map((x, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: x }} />)}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5"><span className="serif text-[14.5px]">{t.name}</span>{on && <Check size={14} className="text-forest" strokeWidth={2} />}</div>
      <div className="text-[11.5px] text-mute leading-snug">{t.desc}</div>
      {showing && !on && <span className="absolute top-1.5 right-1.5 tag bg-forest text-paper">顯示中</span>}
    </button>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={e => { e.preventDefault(); onChange(!on); }}
      className={cx('relative w-12 h-7 rounded-full transition shrink-0', on ? 'bg-forest' : 'bg-line')}>
      <span className={cx('absolute top-1 w-5 h-5 rounded-full bg-paper shadow transition-all', on ? 'left-6' : 'left-1')} />
    </button>
  );
}
