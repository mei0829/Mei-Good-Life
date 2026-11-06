import { useEffect, useState } from 'react';
import { data } from '../data/repo';
import { useTable } from '../data/hooks';
import { useApp } from '../app';
import { pregnancy, weekLabel } from '../lib/pregnancy';
import { ymd } from '../lib/dates';
import { Note, Sheet, useToast } from './ui';

/**
 * 確認懷孕：一定要使用者自己確認，輸入末次月經日期。
 * 月經延遲不會自動切換階段；過去的月經與備孕紀錄全部保留。
 */
export function ConfirmPregnancy({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { today, s } = useApp();
  const periods = useTable('periods');
  const toast = useToast();
  const lastStart = periods?.filter(p => p.start <= today).sort((a, b) => b.start.localeCompare(a.start))[0]?.start;
  const [lmp, setLmp] = useState('');
  const [edd, setEdd] = useState('');
  const [ok, setOk] = useState(false);
  useEffect(() => { if (open) { setLmp(s.lmp || lastStart || ''); setEdd(s.edd || ''); setOk(false); } }, [open]);
  const p = pregnancy(lmp || undefined, edd || undefined, today);
  const bad = lmp && lmp > today ? '末次月經不能是未來的日期' : lmp && !p ? '日期不正確' : p && p.weeks > 44 ? '孕週超過 44 週，請確認日期' : '';
  const save = async () => {
    await data.saveSettings({ stage: 'pregnant', lmp, edd: edd || undefined, pregnantSince: today });
    toast('已切換為懷孕階段，恭喜你'); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="確認懷孕">
      <p className="text-[14px] leading-relaxed">切換後會顯示孕週、預產期、產檢與孕期紀錄。你之前的月經與備孕紀錄都會保留。</p>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-[12.5px] text-mute mb-1.5" htmlFor="lmp">末次月經第一天 <span className="text-alert">*</span></label>
          <input id="lmp" type="date" className="field num" value={lmp} max={today} onChange={e => setLmp(e.target.value)} />
          {lastStart && lmp !== lastStart && <button className="btn-quiet text-[12.5px] mt-1" onClick={() => setLmp(lastStart)}>使用最近一次紀錄：{ymd(lastStart)}</button>}
        </div>
        <div>
          <label className="block text-[12.5px] text-mute mb-1.5" htmlFor="edd">醫師告知的預產期（選填）</label>
          <input id="edd" type="date" className="field num" value={edd} onChange={e => setEdd(e.target.value)} />
          <p className="text-[11.5px] text-mute mt-1">醫師依超音波調整過預產期的話請填這裡，孕週會以這個日期計算。</p>
        </div>
        {p && !bad && <Note>目前約 <b className="num">{weekLabel(p)}</b>，預產期 <b className="num">{ymd(p.edd)}</b></Note>}
        {bad && <p className="text-alert text-[13px]">{bad}</p>}
        <label className="flex gap-2.5 items-start text-[13.5px]"><input type="checkbox" className="w-5 h-5 mt-0.5 accent-[#455C4A]" checked={ok} onChange={e => setOk(e.target.checked)} />我已經由驗孕或醫師確認懷孕</label>
      </div>
      <div className="flex justify-end gap-2 mt-6"><button className="btn-ghost" onClick={onClose}>取消</button><button className="btn-primary px-6 disabled:opacity-40" disabled={!lmp || !!bad || !ok} onClick={save}>確認切換</button></div>
    </Sheet>
  );
}
