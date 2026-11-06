import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addMonths, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { cycleStats, dayMarks } from '../lib/cycle';
import { daysBetween, iso, md, mdShort, mdw, parse, shift, ym, ymd } from '../lib/dates';
import { EntityForm, useEditor } from '../components/form';
import { Badge, DateCell, Empty, Figure, Note, PageHeader, Row, Section, Sheet, cx } from '../components/ui';
import { ConfirmPregnancy } from '../components/Stage';
import { CYCLE_DAY_FIELDS, PERIOD_FIELDS } from './fields';

export default function Cycle() {
  const { today, s } = useApp();
  const periods = useTable('periods') || [];
  const body = useTable('body') || [];
  const st = useMemo(() => cycleStats(periods, today), [periods, today]);
  const pe = useEditor(), be = useEditor();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [day, setDay] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const preg = s.stage === 'pregnant';
  const bodyOf = (d: string) => body.find(b => b.date === d);
  const openBody = (d: string) => { const b = bodyOf(d); b ? be.edit(b.id) : be.add({ date: d }); };

  return (
    <div>
      <PageHeader kicker="Blooming Days・日曆與預測" title="月經週期" sub="預測只根據你自己的紀錄估算，記得越多越準。預測和實際紀錄在日曆上用不同樣式標示。"
        action={<button className="btn-primary" onClick={() => pe.add({ start: today })}><Plus size={16} strokeWidth={1.6} />記錄月經</button>} />

      {preg && <div className="mb-6"><Note tone="rose">目前是懷孕階段，週期預測已暫停。過去的月經與備孕紀錄都完整保留在這裡。</Note></div>}

      {/* 摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-7">
        <Figure value={st.cycleDay && !preg ? st.cycleDay : '—'} unit={st.cycleDay && !preg ? '天' : ''} label="這次週期第幾天" tone="forest" />
        <Figure value={st.avgCycle ?? '—'} unit={st.avgCycle ? '天' : ''} label={`平均週期${st.lengths.length ? `（${st.lengths.length} 次）` : ''}`} />
        <Figure value={st.avgPeriod ?? '—'} unit={st.avgPeriod ? '天' : ''} label="平均經期" />
        <Figure value={!preg && st.nextStart ? md(st.nextStart) : '—'} label="下次月經（預測）" tone="rose" />
      </div>

      {!preg && <Prediction st={st} onConfirm={() => setConfirm(true)} />}

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-x-10">
        <Section title="月經日曆" action={
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-mute" aria-label="上個月" onClick={() => setMonth(format(addMonths(parse(month + '-01'), -1), 'yyyy-MM'))}><ChevronLeft size={18} /></button>
            <span className="text-[14px] w-[104px] text-center">{ym(month + '-01')}</span>
            <button className="p-1.5 text-mute" aria-label="下個月" onClick={() => setMonth(format(addMonths(parse(month + '-01'), 1), 'yyyy-MM'))}><ChevronRight size={18} /></button>
          </div>}>
          <Calendar month={month} today={today} periods={periods} st={preg ? { ...st, nextStart: undefined, ovulation: undefined } : st} body={body} onPick={setDay} />
          <Legend />
        </Section>

        <Section title="基礎體溫" action={<button className="btn-quiet" onClick={() => openBody(today)}><Plus size={15} />記錄</button>}>
          <BBTChart body={body} today={today} ovulation={preg ? undefined : st.ovulation} />
        </Section>
      </div>

      <Section title="歷史週期">
        {periods.length ? (
          <>
            {st.minCycle != null && <p className="text-[13px] text-mute mb-2">最短 {st.minCycle} 天・最長 {st.maxCycle} 天{st.ignored ? `・有 ${st.ignored} 個週期太短或太長（少於 15 天或超過 60 天），沒有算進平均` : ''}</p>}
            <History periods={periods} onEdit={pe.edit} />
          </>
        ) : <Empty title="還沒有月經紀錄" hint="記錄月經開始日後，至少需要兩次開始日才能算出週期長度。" action={<button className="btn-primary" onClick={() => pe.add({ start: today })}>記錄第一次</button>} />}
      </Section>

      <DaySheet day={day} onClose={() => setDay(null)} periods={periods} body={bodyOf(day || '')} onPeriod={() => { pe.add({ start: day }); setDay(null); }} onEditPeriod={id => { pe.edit(id); setDay(null); }} onBody={() => { openBody(day!); setDay(null); }} />
      <EntityForm table="periods" title="月經紀錄" fields={PERIOD_FIELDS} {...pe} onClose={pe.close} />
      <EntityForm table="body" title="體溫與試紙" fields={CYCLE_DAY_FIELDS} {...be} onClose={be.close} footnote="跟「健康管理 › 身體紀錄」是同一筆每日紀錄，同一天只會有一筆。" />
      <ConfirmPregnancy open={confirm} onClose={() => setConfirm(false)} />
    </div>
  );
}

function Prediction({ st, onConfirm }: { st: ReturnType<typeof cycleStats>; onConfirm: () => void }) {
  if (st.confidence === 'none') {
    const need = st.count === 0 ? 2 : 1;
    return <div className="mb-9"><Note tone="oat"><b className="serif">預測尚待累積。</b>還需要再記錄 {need} 次月經開始日，才能算出你的週期長度。在那之前不會顯示預測日期。</Note></div>;
  }
  return (
    <div className="mb-9 surface p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3"><span className="eyebrow">週期預測</span><Badge tone={st.confidence === 'ok' ? 'sage' : 'oat'}>{st.confidence === 'ok' ? `依最近 ${st.lengths.length} 個週期` : `資料還很少（${st.lengths.length} 個週期），僅供參考`}</Badge></div>
      <div className="grid sm:grid-cols-3 gap-5">
        <div><div className="text-[12px] text-mute">預測下次月經</div><div className="serif text-[19px] mt-0.5">{mdw(st.nextStart)}</div></div>
        <div><div className="text-[12px] text-mute">預測排卵日</div><div className="serif text-[19px] mt-0.5">{mdw(st.ovulation)}</div></div>
        <div><div className="text-[12px] text-mute">預測易孕期</div><div className="serif text-[19px] mt-0.5">{md(st.fertileStart)} – {md(st.fertileEnd)}</div></div>
      </div>
      <p className="text-[12px] text-mute mt-4 leading-relaxed">以平均週期推算，排卵日約在下次月經前 14 天，易孕期為排卵日前 5 天到後 1 天。這是估算，不是診斷，也不能當作避孕或受孕的依據。</p>
      {st.irregular && <p className="text-[13px] text-alert mt-2">你的週期長短相差超過 7 天（{st.minCycle}–{st.maxCycle} 天），週期不規律時預測可能不準確。</p>}
      {st.lateBy && (
        <div className="mt-4 pt-4 border-t border-line text-[13.5px] leading-relaxed">
          月經比預測晚了 <b className="num">{st.lateBy}</b> 天。週期本來就可能變動；想確認的話可以驗孕或就醫。
          <span className="text-mute">Blooming Days 不會因為月經延遲自動切換成懷孕階段。</span>
          <div className="mt-2"><button className="btn-ghost" onClick={onConfirm}>我已確認懷孕</button></div>
        </div>
      )}
    </div>
  );
}

function Calendar({ month, today, periods, st, body, onPick }: { month: string; today: string; periods: any[]; st: ReturnType<typeof cycleStats>; body: any[]; onPick: (d: string) => void }) {
  const first = startOfMonth(parse(month + '-01')), last = endOfMonth(first);
  const from = iso(first), to = iso(last);
  const marks = dayMarks(periods, st, from, to, today);
  const pad = (getDay(first) + 6) % 7;
  const days = Array.from({ length: last.getDate() }, (_, i) => shift(from, i));
  const bmap = new Map(body.map(b => [b.date, b]));
  return (
    <div className="grid grid-cols-7 gap-y-1 text-center" role="grid" aria-label={ym(month + '-01') + '日曆'}>
      {'一二三四五六日'.split('').map(w => <div key={w} className="text-[11px] text-mute pb-2">{w}</div>)}
      {Array.from({ length: pad }, (_, i) => <div key={'p' + i} />)}
      {days.map(d => {
        const m = marks[d] || {}, b = bmap.get(d);
        return (
          <button key={d} onClick={() => onPick(d)} aria-label={md(d) + (m.period ? ' 經期' : m.predicted ? ' 預測經期' : m.ovulation ? ' 預測排卵日' : m.fertile ? ' 預測易孕期' : '')}
            className="relative h-11 flex flex-col items-center justify-center">
            {m.fertile && <span className="absolute inset-x-0 inset-y-1.5 bg-sage-soft" />}
            <span className={cx('relative w-8 h-8 rounded-full grid place-items-center num text-[13.5px]',
              m.period && 'bg-rose text-paper', m.predicted && 'border border-dashed border-rose text-rose-ink',
              m.ovulation && !m.period && 'ring-1 ring-forest text-forest', d === today && !m.period && 'font-semibold underline underline-offset-4 decoration-forest')}>{+d.slice(8)}</span>
            <span className="relative flex gap-0.5 h-1 mt-0.5">
              {b?.bbt != null && <span className="w-1 h-1 rounded-full bg-oat" />}
              {b?.opk?.startsWith('陽性') && <span className="w-1 h-1 rounded-full bg-forest" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function Legend() {
  const i = (el: React.ReactNode, t: string) => <span className="flex items-center gap-1.5">{el}{t}</span>;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-mute mt-4">
      {i(<span className="w-3 h-3 rounded-full bg-rose" />, '實際經期')}
      {i(<span className="w-3 h-3 rounded-full border border-dashed border-rose" />, '預測經期')}
      {i(<span className="w-3 h-3 bg-sage-soft" />, '預測易孕期')}
      {i(<span className="w-3 h-3 rounded-full ring-1 ring-forest" />, '預測排卵日')}
      {i(<span className="w-1.5 h-1.5 rounded-full bg-oat" />, '有體溫')}
      {i(<span className="w-1.5 h-1.5 rounded-full bg-forest" />, '試紙陽性')}
    </div>
  );
}

function BBTChart({ body, today, ovulation }: { body: any[]; today: string; ovulation?: string }) {
  const C = useApp().theme.c;
  const from = shift(today, -59);
  const pts = body.filter(b => b.bbt != null && b.date >= from && b.date <= today).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({ d: mdShort(b.date), date: b.date, t: b.bbt, opk: b.opk }));
  if (pts.length < 2) return <Empty title="體溫資料還不夠" hint="記錄兩天以上的基礎體溫，就會顯示最近 60 天的曲線。排卵後體溫通常會上升約 0.3–0.5°C。" />;
  const ts = pts.map(p => p.t), lo = Math.floor((Math.min(...ts) - .1) * 10) / 10, hi = Math.ceil((Math.max(...ts) + .1) * 10) / 10;
  return (
    <div className="h-56 -ml-3" aria-label="基礎體溫折線圖">
      <ResponsiveContainer>
        <LineChart data={pts} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.mute }} tickLine={false} axisLine={{ stroke: C.line }} minTickGap={18} />
          <YAxis domain={[lo, hi]} tick={{ fontSize: 11, fill: C.mute }} tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(v: any) => [v + ' °C', '體溫']} labelFormatter={(l: any) => { const p = pts.find(x => x.d === l); return p ? md(p.date) : l; }} labelStyle={{ color: C.ink }} contentStyle={{ borderRadius: 12, border: '1px solid ' + C.line, background: C.paper, fontSize: 12 }} />
          <Line type="monotone" dataKey="t" stroke={C.forest} strokeWidth={1.6} dot={{ r: 2.5, fill: C.forest }} isAnimationActive={false} />
          {pts.filter(p => p.opk?.startsWith('陽性')).map(p => <ReferenceDot key={p.date} x={p.d} y={p.t} r={5} fill={C.rose} stroke="none" />)}
          {ovulation && pts.some(p => p.date === ovulation) && <ReferenceDot x={mdShort(ovulation)} y={pts.find(p => p.date === ovulation)!.t} r={6} fill="none" stroke={C.forest} />}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[11.5px] text-mute ml-3">粉色點：排卵試紙陽性</p>
    </div>
  );
}

function History({ periods, onEdit }: { periods: any[]; onEdit: (id: string) => void }) {
  const ps = [...periods].sort((a, b) => b.start.localeCompare(a.start));
  return (
    <div>
      {ps.map((p, i) => {
        const next = ps[i - 1], len = next ? daysBetween(p.start, next.start) : null, dur = p.end ? daysBetween(p.start, p.end) + 1 : null;
        return <Row key={p.id} onClick={() => onEdit(p.id)} left={<DateCell date={p.start} />}
          title={<>經期 {dur ? `${dur} 天` : '（尚未填結束日）'}{p.flow && <span className="text-mute text-[13px]">・{p.flow}</span>}</>}
          meta={[p.end && `${md(p.start)} 至 ${md(p.end)}`, p.pain != null && `經痛 ${p.pain}/10`, p.symptoms?.join('、')].filter(Boolean).join('・')}
          right={len != null ? <span className={cx(len < 15 || len > 60 ? 'text-alert' : 'text-forest')}>{len} 天週期</span> : <span className="text-mute text-[12.5px]">最近一次</span>} />;
      })}
    </div>
  );
}

function DaySheet({ day, onClose, periods, body, onPeriod, onEditPeriod, onBody }: { day: string | null; onClose: () => void; periods: any[]; body?: any; onPeriod: () => void; onEditPeriod: (id: string) => void; onBody: () => void }) {
  const p = day ? periods.find(x => day >= x.start && day <= (x.end || x.start)) : null;
  return (
    <Sheet open={!!day} onClose={onClose} title={day ? mdw(day) : ''}>
      <div className="space-y-3 text-[14px]">
        {p ? <Row title="月經紀錄" meta={`${ymd(p.start)} 開始${p.end ? '，' + ymd(p.end) + ' 結束' : ''}`} onClick={() => onEditPeriod(p.id)} right={<span className="text-forest text-[13px]">修改</span>} />
          : <button className="btn-ghost w-full" onClick={onPeriod}>這天月經開始</button>}
        {body && (body.bbt != null || body.opk) ? <Row title="體溫與試紙" meta={[body.bbt != null && body.bbt + ' °C', body.opk && '試紙：' + body.opk].filter(Boolean).join('・')} onClick={onBody} right={<span className="text-forest text-[13px]">修改</span>} />
          : <button className="btn-ghost w-full" onClick={onBody}>記錄體溫／排卵試紙</button>}
      </div>
    </Sheet>
  );
}
