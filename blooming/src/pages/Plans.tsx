import { useEffect, useMemo, useState } from 'react';
import { BellRing, ExternalLink, Plus } from 'lucide-react';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import type { Plan } from '../data/types';
import { md, mdw, money, relDay } from '../lib/dates';
import { lmpBase, planAlert, planWindow } from '../lib/events';
import { BENEFIT_WHERE, PLAN_KIND, PLAN_STATUS, SUBSIDY, planSeeds } from '../content/plans';
import { EntityForm, useEditor, type Field } from '../components/form';
import { Badge, Chips, Empty, Figure, Note, cx, useToast } from '../components/ui';

// 第一次打開時放好預設清單，並幫之前放好的福利補上「去哪裡申請」與網站
let seeding = false;
async function seedOnce() {
  if (seeding) return; seeding = true;
  try {
    const s = await data.getSettings();
    if (s.plansSeeded) return;
    if (!(await data.table('plans').list()).length) await data.bulkAdd('plans', planSeeds());
    for (const b of await data.table('benefits').list()) {
      const w = BENEFIT_WHERE[b.name];
      if (w && !b.where && !b.url) await data.table('benefits').update(b.id, w);
    }
    await data.saveSettings({ plansSeeded: true });
  } finally { seeding = false; }
}

const STAGE_OPT: [string, string][] = [['pre', '備孕'], ['preg', '懷孕']];
const isPreg = (v: Record<string, any>) => v.stage === 'preg';
export const PLAN_FIELDS: Field[] = [
  { key: 'name', label: '名稱', type: 'text', required: true },
  { key: 'kind', label: '類型', type: 'select', options: PLAN_KIND, half: true },
  { key: 'stage', label: '階段', type: 'select', options: STAGE_OPT, half: true },
  { key: 'weekFrom', label: '建議從第幾週', type: 'number', unit: '週', half: true, min: 0, max: 42, show: isPreg },
  { key: 'weekTo', label: '到第幾週', type: 'number', unit: '週', half: true, min: 0, max: 42, show: isPreg },
  { key: 'lead', label: '要提前幾週預約', type: 'number', unit: '週', half: true, min: 0, max: 20, hint: '0 = 不用特別預約' },
  { key: 'status', label: '狀態', type: 'select', options: PLAN_STATUS, half: true },
  { key: 'date', label: '預約／檢查日期', type: 'date', half: true },
  { key: 'time', label: '時間', type: 'time', half: true },
  { key: 'where', label: '去哪裡做', type: 'text', hint: '醫院、診所或單位' },
  { key: 'subsidy', label: '能不能補助', type: 'select', options: SUBSIDY, half: true },
  { key: 'cost', label: '預估費用', type: 'number', unit: '元', half: true, min: 0, hint: '醫院報價' },
  { key: 'subsidyAmt', label: '補助金額', type: 'number', unit: '元', half: true, min: 0 },
  { key: 'paid', label: '實際花費', type: 'number', unit: '元', half: true, min: 0, hint: '做完再填' },
  { key: 'applyAt', label: '補助怎麼申請、去哪裡申請', type: 'textarea' },
  { key: 'url', label: '相關網站', type: 'url', hint: '從瀏覽器網址列複製貼上' },
  { key: 'note', label: '備註', type: 'textarea' },
];
const EXP_CAT = (k?: string) => (k === '公費產檢' ? '產檢費' : k === '補助申請' || k === '其他' || !k ? '其他費用' : '檢查費');

/** 做完並填了實際花費：同時記到孕期花費（只記一次） */
export async function syncExpense(p: Plan, today: string, toast: (m: string) => void) {
  if (p.status !== '已完成' || !p.paid || p.expenseId) return;
  try {
    const e = await data.table('expenses').add({ date: p.date || today, category: EXP_CAT(p.kind), item: p.name, amount: p.paid }, { force: true });
    await data.table('plans').update(p.id, { expenseId: e.id });
    toast('已同時記到孕期花費');
  } catch { /* 記不進去也不影響原本的儲存 */ }
}

const ALERT_TXT = { 'book-now': '該預約了', 'book-soon': '快要預約', missed: '時間已過，做了嗎？', 'in-window': '現在是建議時間' } as const;

export function PlanList() {
  const { s, today } = useApp();
  const all = useTable('plans') || [];
  const ed = useEditor();
  const toast = useToast();
  const [f, setF] = useState('全部');
  useEffect(() => { if (!s.plansSeeded) seedOnce(); }, [s.plansSeeded]);
  const preg = s.stage === 'pregnant';
  const base = lmpBase(s, today);
  const rows = useMemo(() => all.filter(p => (p.stage === 'preg') === preg || !p.stage)
    .map(p => ({ p, w: planWindow(p, base) })).map(x => ({ ...x, a: planAlert(x.p, x.w, today) }))
    .sort((x, y) => (x.p.weekFrom ?? 99) - (y.p.weekFrom ?? 99) || (x.p.date || '').localeCompare(y.p.date || '') || x.p.createdAt - y.p.createdAt), [all, preg, base, today]);
  const active = rows.filter(r => r.p.status !== '不需要');
  const done = active.filter(r => r.p.status === '已完成').length;
  const est = active.reduce((a, r) => a + (r.p.cost || 0), 0), sub = active.reduce((a, r) => a + (r.p.subsidyAmt || 0), 0), paid = active.reduce((a, r) => a + (r.p.paid || 0), 0);
  const alerts = rows.filter(r => r.a === 'book-now' || r.a === 'book-soon');
  const list = rows.filter(r => f === '全部' || (r.p.status || '待安排') === f || r.p.subsidy === f || r.p.kind === f);
  const chips = ['全部', ...PLAN_STATUS.filter(st => rows.some(r => (r.p.status || '待安排') === st)), ...SUBSIDY.filter(x => rows.some(r => r.p.subsidy === x))];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 flex-1">
          <Figure value={`${done} / ${active.length}`} label="已完成" tone="forest" />
          <Figure value={money(Math.max(0, est - sub))} label="預估自付" />
          <Figure value={money(paid)} label="實際已花" />
        </div>
        <button className="btn-primary self-end" onClick={() => ed.add({ stage: preg ? 'preg' : 'pre', status: '待安排', kind: '其他', lead: 0 })}><Plus size={16} />新增項目</button>
      </div>
      {preg && !base && <div className="mb-5"><Note tone="rose">還沒有末次月經或預產期，所以算不出建議日期。可以在上方「調整日期」填寫。</Note></div>}
      {alerts.length > 0 && (
        <div className="mb-6 rounded-[16px] border border-oat bg-oat-soft px-4 py-3">
          <div className="flex items-center gap-2 text-oat-ink text-[14px] mb-1"><BellRing size={16} strokeWidth={1.6} />預約提醒</div>
          {alerts.map(({ p, w }) => (
            <button key={p.id} onClick={() => ed.edit(p.id)} className="w-full text-left text-[13.5px] py-1 flex justify-between gap-3">
              <span>{p.name}</span><span className="text-oat-ink shrink-0">{w.bookBy! <= today ? '該預約了' : md(w.bookBy) + ' 前預約'}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mb-5"><Note tone="oat">預設項目依衛生福利部國民健康署公告整理，時程、補助與價格以國健署最新公告、孕婦健康手冊和醫院說明為準。「自費」項目價格各院所不同，請先詢問後自己填上。每一項都可以修改，也可以新增自己的項目。</Note></div>
      <Chips value={f} onChange={setF} items={chips} />
      {list.length ? list.map(({ p, w, a }) => (
        <article key={p.id} className={cx('border-b border-line', (p.status === '不需要') && 'opacity-50', p.status === '已完成' && 'opacity-75')}>
          <button onClick={() => ed.edit(p.id)} className="w-full text-left py-4 grid grid-cols-[64px_1fr] gap-3">
            <div>{p.weekFrom != null ? <><div className="display text-[24px] leading-none text-forest">{p.weekFrom === p.weekTo || p.weekTo == null ? p.weekFrom : `${p.weekFrom}–${p.weekTo}`}</div><div className="text-[11px] text-mute mt-1">孕週</div></> : <div className="serif text-[15px] text-forest">{p.stage === 'pre' ? '懷孕前' : '自訂'}</div>}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="serif text-[15.5px] mr-1">{p.name}</span>
                <Badge tone={p.status === '已完成' ? 'sage' : p.status === '已預約' ? 'forest' : 'line'}>{p.status || '待安排'}</Badge>
                {a && <Badge tone={a === 'missed' ? 'rose' : 'oat'}>{ALERT_TXT[a]}</Badge>}
              </div>
              <div className="text-[13px] mt-1.5 space-y-0.5">
                {p.date ? <div className="text-forest">📅 {mdw(p.date)}{p.time && ' ' + p.time}<span className="text-mute">・{relDay(p.date, today)}</span></div>
                  : w.start ? <div>建議 {md(w.start)} 至 {md(w.end)}{w.bookBy && <span className="text-oat-ink">・{md(w.bookBy)} 前預約</span>}</div>
                  : p.lead ? <div className="text-oat-ink">建議提前 {p.lead} 週預約</div> : null}
                <div className="text-mute">
                  {[p.subsidy && (p.subsidy === '自費' ? '自費' : '可補助：' + p.subsidy), p.cost != null && '預估 ' + money(p.cost), p.subsidyAmt ? '補助 ' + money(p.subsidyAmt) : '', p.paid != null && '實付 ' + money(p.paid)].filter(Boolean).join('・')}
                </div>
                {p.where && <div className="text-mute">📍 {p.where}</div>}
                {p.applyAt && <div className="text-mute">申請：{p.applyAt}</div>}
              </div>
              {p.note && <p className="text-[12.5px] text-mute mt-1 line-clamp-2 leading-relaxed">{p.note}</p>}
            </div>
          </button>
          {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-forest ml-[76px] -mt-2 mb-3">相關網站<ExternalLink size={13} /></a>}
        </article>
      )) : <Empty title="沒有符合的項目" hint="按「新增項目」加入自己的檢查或申請。" />}
      <EntityForm table="plans" title="檢查與申請" fields={PLAN_FIELDS} {...ed} onClose={ed.close}
        onSaved={r => syncExpense(r, today, toast)} footnote="狀態改成「已完成」並填了實際花費，會同時記一筆到孕期花費。" />
    </>
  );
}
