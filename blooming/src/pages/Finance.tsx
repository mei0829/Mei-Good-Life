import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../app';
import type { Palette } from '../lib/theme';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import { money, parse, ym, ymd } from '../lib/dates';
import { EXPENSE_CAT, INS_STATUS, INS_TYPE, PAY_FREQ } from '../content/options';
import { EntityForm, useEditor, type Field } from '../components/form';
import { Badge, DateCell, Empty, Figure, Note, PageHeader, Row, Section, Sheet, Tabs, cx, useToast } from '../components/ui';

// 圖表顏色跟著主題
const TT = (C: Palette) => ({ contentStyle: { borderRadius: 12, border: '1px solid ' + C.line, background: C.paper, color: C.ink, fontSize: 12 } });
const PER_YEAR: Record<string, number> = { 年繳: 1, 半年繳: 2, 季繳: 4, 月繳: 12, 躉繳: 0 };

export default function Finance() {
  const { sub, go } = useApp();
  const tab = sub === 'insurance' ? 'insurance' : 'expenses';
  return (
    <div>
      <PageHeader kicker="幸孕女子・花費與保單" title="財務與保險" sub="孕期花費、預算與保單資料。" />
      <Tabs value={tab} onChange={t => go('finance', t)} items={[['expenses', '孕期花費'], ['insurance', '保險管理']]} />
      {tab === 'expenses' ? <Expenses /> : <Insurance />}
    </div>
  );
}

/** 寶寶準備頁的嬰兒用品花費與福利，在這裡也看得到 */
function PrepLink() {
  const { go } = useApp();
  const items = useTable('items') || [], bens = useTable('benefits') || [];
  const spent = items.reduce((a, r) => a + (r.price || 0), 0), got = bens.reduce((a, r) => a + (r.amount || 0), 0);
  if (!spent && !got) return null;
  return (
    <button onClick={() => go('prep')} className="w-full text-left mb-6 rounded-[14px] bg-sage-soft px-4 py-3 text-[13px] flex justify-between gap-3">
      <span>寶寶準備：嬰兒用品已花費 <b className="num">{money(spent)}</b>，準媽媽福利已領 <b className="num">{money(got)}</b></span><span className="text-forest shrink-0">查看 ›</span>
    </button>
  );
}

const EXP_FIELDS: Field[] = [
  { key: 'date', label: '日期', type: 'date', required: true, half: true },
  { key: 'amount', label: '金額', type: 'number', unit: '元', required: true, half: true, min: 0 },
  { key: 'category', label: '類別', type: 'select', options: EXPENSE_CAT, required: true },
  { key: 'item', label: '項目', type: 'text', hint: '例如：非侵入性染色體檢測、計程車、葉酸' },
  { key: 'note', label: '備註', type: 'textarea' },
];

function Expenses() {
  const { today, s, theme } = useApp();
  const C = theme.c;
  const rows = useTable('expenses') || [];
  const ed = useEditor();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [budgetOpen, setBudgetOpen] = useState(false);
  const mrows = rows.filter(r => r.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const total = mrows.reduce((a, r) => a + r.amount, 0);
  const all = rows.reduce((a, r) => a + r.amount, 0);
  const budget = s.budgetMonthly;
  const byCat = EXPENSE_CAT.map(c => ({ c, v: mrows.filter(r => r.category === c).reduce((a, r) => a + r.amount, 0), b: s.budgetByCat?.[c] })).filter(x => x.v || x.b);
  const months = Array.from({ length: 12 }, (_, i) => format(addMonths(parse(today.slice(0, 7) + '-01'), i - 11), 'yyyy-MM'));
  const trend = months.map(m => ({ m: +m.slice(5) + '月', key: m, v: rows.filter(r => r.date.startsWith(m)).reduce((a, r) => a + r.amount, 0) }));
  const shiftM = (n: number) => setMonth(format(addMonths(parse(month + '-01'), n), 'yyyy-MM'));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-mute" onClick={() => shiftM(-1)} aria-label="上個月"><ChevronLeft size={18} /></button>
          <span className="serif text-[22px] w-[150px] text-center">{ym(month + '-01')}</span>
          <button className="p-1.5 text-mute" onClick={() => shiftM(1)} aria-label="下個月"><ChevronRight size={18} /></button>
        </div>
        <div className="flex gap-2"><button className="btn-ghost" onClick={() => setBudgetOpen(true)}>設定預算</button><button className="btn-primary" onClick={() => ed.add({ date: month === today.slice(0, 7) ? today : month + '-01' })}><Plus size={16} />記一筆</button></div>
      </div>
      <PrepLink />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-9">
        <Figure value={money(total)} label="本月支出" tone="forest" />
        <Figure value={budget ? money(budget) : '—'} label="本月預算" />
        <Figure value={budget ? money(budget - total) : '—'} label={budget ? (budget - total >= 0 ? '預算剩餘' : '超出預算') : '預算差異（未設定預算）'} tone={budget && budget - total < 0 ? 'rose' : 'ink'} />
        <Figure value={money(all)} label="累積支出" />
      </div>

      <div className="grid lg:grid-cols-2 gap-x-10">
        <Section title="本月類別統計">
          {byCat.length ? (<>
            <div className="h-48 -ml-3"><ResponsiveContainer><BarChart data={byCat} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="c" width={78} tick={{ fontSize: 12, fill: C.ink }} tickLine={false} axisLine={false} />
              <Tooltip {...TT(C)} formatter={(v: any) => [money(v), '支出']} />
              <Bar dataKey="v" radius={[0, 6, 6, 0]} isAnimationActive={false}>{byCat.map((_, i) => <Cell key={i} fill={theme.chart[i % theme.chart.length]} />)}</Bar>
            </BarChart></ResponsiveContainer></div>
            <table className="w-full text-[13px] mt-2">
              <thead><tr className="text-mute text-left"><th className="font-normal py-1.5">類別</th><th className="font-normal text-right">支出</th><th className="font-normal text-right">預算</th><th className="font-normal text-right">差異</th></tr></thead>
              <tbody className="num">{byCat.map(x => <tr key={x.c} className="border-t border-line"><td className="py-2 font-sans">{x.c}</td><td className="text-right">{money(x.v)}</td><td className="text-right text-mute">{x.b ? money(x.b) : '—'}</td><td className={cx('text-right', x.b && x.b - x.v < 0 ? 'text-alert' : 'text-forest')}>{x.b ? money(x.b - x.v) : '—'}</td></tr>)}</tbody>
            </table>
          </>) : <Empty title="這個月還沒有花費" />}
        </Section>
        <Section title="每月支出">
          <div className="h-56 -ml-3"><ResponsiveContainer><BarChart data={trend}>
            <CartesianGrid stroke={C.line} vertical={false} /><XAxis dataKey="m" tick={{ fontSize: 11, fill: C.mute }} tickLine={false} axisLine={{ stroke: C.line }} />
            <YAxis tick={{ fontSize: 11, fill: C.mute }} tickLine={false} axisLine={false} width={52} tickFormatter={v => v >= 10000 ? +(v / 10000).toFixed(1) + ' 萬' : v >= 1000 ? +(v / 1000).toFixed(1) + ' 千' : v} />
            <Tooltip {...TT(C)} formatter={(v: any) => [money(v), '支出']} />
            <Bar dataKey="v" radius={[6, 6, 0, 0]} isAnimationActive={false}>{trend.map(t => <Cell key={t.key} fill={t.key === month ? C.forest : C.sage} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
          {budget ? <p className="text-[12px] text-mute">每月預算 {money(budget)}</p> : null}
        </Section>
      </div>

      <Section title="本月明細">
        {mrows.length ? mrows.map(r => <Row key={r.id} onClick={() => ed.edit(r.id)} left={<DateCell date={r.date} />} title={r.item || r.category} meta={[r.item && r.category, r.note].filter(Boolean).join('・')} right={money(r.amount)} />)
          : <Empty title="這個月還沒有花費" hint="產檢費、掛號費、檢查費、營養補充品、交通費都可以記。" />}
      </Section>
      <EntityForm table="expenses" title="花費" fields={EXP_FIELDS} {...ed} onClose={ed.close} />
      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </>
  );
}

function BudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s } = useApp();
  const toast = useToast();
  const [m, setM] = useState<string>('');
  const [c, setC] = useState<Record<string, string>>({});
  useEffect(() => {
    if (open) { setM(s.budgetMonthly ? String(s.budgetMonthly) : ''); setC(Object.fromEntries(Object.entries(s.budgetByCat || {}).map(([k, v]) => [k, String(v)]))); }
  }, [open]);
  const num = (v: string) => (v === '' || isNaN(+v) || +v < 0 ? undefined : +v);
  const save = async () => {
    const byCat: Record<string, number> = {}; for (const [k, v] of Object.entries(c)) { const n = num(v); if (n) byCat[k] = n; }
    await data.saveSettings({ budgetMonthly: num(m), budgetByCat: byCat }); toast('預算已更新'); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="每月預算">
      <label className="block text-[12.5px] text-mute mb-1.5" htmlFor="b-m">每月總預算（元）</label>
      <input id="b-m" className="field num" type="number" inputMode="numeric" value={m} onChange={e => setM(e.target.value)} />
      <p className="eyebrow mt-6 mb-2">各類別預算（元）</p>
      <div className="grid grid-cols-2 gap-3">
        {EXPENSE_CAT.map(k => <label key={k} className="block"><span className="block text-[12px] text-mute mb-1">{k}</span><input className="field num" type="number" inputMode="numeric" value={c[k] || ''} onChange={e => setC(o => ({ ...o, [k]: e.target.value }))} /></label>)}
      </div>
      <div className="flex justify-end gap-2 mt-6"><button className="btn-ghost" onClick={onClose}>取消</button><button className="btn-primary" onClick={save}>儲存</button></div>
    </Sheet>
  );
}

const INS_FIELDS: Field[] = [
  { key: 'name', label: '保單名稱', type: 'text', required: true },
  { key: 'company', label: '保險公司', type: 'text', half: true },
  { key: 'type', label: '保單類型', type: 'select', options: INS_TYPE, half: true },
  { key: 'insured', label: '被保險人', type: 'text', half: true, hint: '例如：本人、寶寶' },
  { key: 'status', label: '狀態', type: 'select', options: INS_STATUS, half: true },
  { key: 'sum', label: '保額', type: 'number', unit: '元', half: true },
  { key: 'premium', label: '保費', type: 'number', unit: '元', half: true },
  { key: 'freq', label: '繳費方式', type: 'select', options: PAY_FREQ, half: true },
  { key: 'effective', label: '生效日期', type: 'date', half: true },
  { key: 'waiting', label: '等待期', type: 'text', hint: '依保單條款填寫，例如：生效後 30 天' },
  { key: 'maternity', label: '生育相關保障', type: 'textarea', hint: '照條款原文記錄，例如妊娠併發症、新生兒相關保障' },
  { key: 'exclusions', label: '除外責任', type: 'textarea' },
  { key: 'claims', label: '理賠條件', type: 'textarea', hint: '需要的文件、申請期限、聯絡窗口' },
  { key: 'note', label: '備註', type: 'textarea' },
  { key: 'files', label: '保單文件附件', type: 'files' },
];

function Insurance() {
  const rows = (useTable('insurance') || []).sort((a, b) => INS_STATUS.indexOf(a.status || '') - INS_STATUS.indexOf(b.status || '') || a.name.localeCompare(b.name));
  const ed = useEditor();
  const active = rows.filter(r => r.status === '有效');
  const yearly = active.reduce((a, r) => a + (r.premium || 0) * (PER_YEAR[r.freq || ''] ?? 0), 0);
  return (
    <>
      <div className="mb-7"><Note tone="rose"><b className="serif">保單是否能理賠，以保險公司正式條款與審核結果為準。</b>這裡只幫你整理資料，不會判斷或推定可以理賠。請記錄條款原文，並跟保險公司或業務員核對。</Note></div>
      <div className="flex justify-between items-end mb-6">
        <div className="grid grid-cols-2 gap-8"><Figure value={active.length} unit="張" label="有效保單" tone="forest" /><Figure value={money(yearly)} label="有效保單年繳保費（概算）" /></div>
        <button className="btn-primary shrink-0" onClick={() => ed.add({ status: '有效', freq: '年繳' })}><Plus size={16} />保單</button>
      </div>
      {rows.length ? rows.map(r => (
        <article key={r.id} className="border-b border-line">
          <button className="w-full text-left py-5 grid md:grid-cols-[1fr_auto] gap-3" onClick={() => ed.edit(r.id)}>
            <div>
              <div className="eyebrow">{[r.company, r.type].filter(Boolean).join('・') || '保單'}</div>
              <h3 className="serif text-[18px] mt-1">{r.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">{r.status && <Badge tone={r.status === '有效' ? 'sage' : r.status === '考慮中' ? 'oat' : 'line'}>{r.status}</Badge>}{r.insured && <Badge tone="line">被保險人：{r.insured}</Badge>}{r.files?.length ? <Badge tone="line">附件 {r.files.length}</Badge> : null}</div>
              {r.maternity && <p className="text-[13px] mt-3 leading-relaxed"><span className="text-mute">生育相關保障：</span>{r.maternity}</p>}
              {r.waiting && <p className="text-[12.5px] text-mute mt-1">等待期：{r.waiting}</p>}
            </div>
            <div className="md:text-right num text-[13px] text-mute space-y-0.5">
              {r.sum != null && <div>保額 <span className="text-ink">{money(r.sum)}</span></div>}
              {r.premium != null && <div>保費 <span className="text-ink">{money(r.premium)}</span>{r.freq && ' / ' + r.freq}</div>}
              {r.effective && <div>生效 {ymd(r.effective)}</div>}
            </div>
          </button>
        </article>
      )) : <Empty title="還沒有保單" hint="記下保單類型、保額、等待期、除外責任和生育相關保障，方便比較和日後申請。" />}
      <EntityForm table="insurance" title="保單" fields={INS_FIELDS} {...ed} onClose={ed.close} footnote="請依保單條款原文填寫。本工具不會判斷保單是否可以理賠。" />
    </>
  );
}
