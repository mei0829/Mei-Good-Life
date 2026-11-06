import { useMemo, useState } from 'react';
import { BellRing, ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { buildEvents, EV_LABEL, lmpBase, planAlert, planWindow, type Ev, type EvKind } from '../lib/events';
import { iso, md, mdw, parse, relDay, shift, ym } from '../lib/dates';
import { Chips, Empty, PageHeader, Section, cx } from '../components/ui';

// 每一種事件的顏色（跟著主題）
export const EV_DOT: Record<EvKind, string> = {
  check: 'bg-forest', book: 'bg-oat-ink', visit: 'bg-sage', benefit: 'bg-rose-ink', edd: 'bg-alert',
  period: 'bg-rose', predicted: 'bg-rose/50', fertile: 'bg-sage-soft ring-1 ring-sage',
};
const FILTERS: [string, EvKind[] | null][] = [
  ['全部', null], ['檢查', ['check']], ['預約提醒', ['book']], ['看診', ['visit']], ['福利', ['benefit']], ['月經', ['period', 'predicted', 'fertile']],
];

export default function Calendar() {
  const { s, today, go } = useApp();
  const plans = useTable('plans') || [], visits = useTable('visits') || [], benefits = useTable('benefits') || [], periods = useTable('periods') || [];
  const [month, setMonth] = useState(today.slice(0, 7));
  const [sel, setSel] = useState('');
  const [f, setF] = useState('全部');
  const kinds = FILTERS.find(x => x[0] === f)?.[1];
  const keep = (e: Ev) => !kinds || kinds.includes(e.kind);

  const first = startOfMonth(parse(month + '-01')), last = endOfMonth(first);
  const from = iso(first), to = iso(last);
  const src = { s, today, plans, visits, benefits, periods };
  const monthEv = useMemo(() => buildEvents(src, from, to).filter(keep), [plans, visits, benefits, periods, s, month, f]);
  const upcoming = useMemo(() => buildEvents(src, today, shift(today, 30)).filter(keep).filter(e => e.kind !== 'fertile'), [plans, visits, benefits, periods, s, today, f]);
  const byDay = new Map<string, Ev[]>(); monthEv.forEach(e => byDay.set(e.d, [...(byDay.get(e.d) || []), e]));

  // 該預約、已過建議時間的檢查
  const base = lmpBase(s, today);
  const alerts = plans.filter(p => (p.stage === 'preg') === (s.stage === 'pregnant')).map(p => ({ p, a: planAlert(p, planWindow(p, base), today), w: planWindow(p, base) })).filter(x => x.a === 'book-now' || x.a === 'book-soon');

  const pad = (getDay(first) + 6) % 7;
  const days = Array.from({ length: last.getDate() }, (_, i) => shift(from, i));
  const list = sel ? (byDay.get(sel) || []) : upcoming;

  return (
    <div>
      <PageHeader kicker="幸孕女子・檢查・預約・回診" title="好孕行事曆" sub="月經、檢查、該預約的時間、回診和福利申請期限，都在這裡。" />

      {alerts.length > 0 && (
        <button onClick={() => go('medical', 'plans')} className="w-full text-left mb-7 rounded-[16px] border border-oat bg-oat-soft px-4 py-3">
          <div className="flex items-center gap-2 text-oat-ink text-[14px] mb-1"><BellRing size={16} strokeWidth={1.6} />預約提醒</div>
          {alerts.map(({ p, w }) => <div key={p.id} className="text-[13.5px] py-0.5 flex justify-between gap-3"><span>{p.name}</span><span className="text-oat-ink shrink-0">{w.bookBy! <= today ? '該預約了' : md(w.bookBy) + ' 前'}</span></div>)}
        </button>
      )}

      <Chips value={f} onChange={v => { setF(v); }} items={FILTERS.map(x => x[0])} />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-x-10">
        <Section title="月曆" action={
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-mute" aria-label="上個月" onClick={() => { setMonth(format(addMonths(first, -1), 'yyyy-MM')); setSel(''); }}><ChevronLeft size={18} /></button>
            <span className="text-[14px] w-[104px] text-center">{ym(from)}</span>
            <button className="p-1.5 text-mute" aria-label="下個月" onClick={() => { setMonth(format(addMonths(first, 1), 'yyyy-MM')); setSel(''); }}><ChevronRight size={18} /></button>
          </div>}>
          <div className="grid grid-cols-7 gap-y-1 text-center" role="grid" aria-label={ym(from) + '月曆'}>
            {'一二三四五六日'.split('').map(w => <div key={w} className="text-[11px] text-mute pb-2">{w}</div>)}
            {Array.from({ length: pad }, (_, i) => <div key={'p' + i} />)}
            {days.map(d => {
              const ev = byDay.get(d) || [], dots = [...new Set(ev.map(e => e.kind))].filter(k => k !== 'fertile');
              const fertile = ev.some(e => e.kind === 'fertile'), period = ev.some(e => e.kind === 'period');
              return (
                <button key={d} onClick={() => setSel(sel === d ? '' : d)} aria-pressed={sel === d}
                  aria-label={md(d) + (ev.length ? '：' + ev.map(e => e.title).join('、') : '')}
                  className={cx('relative h-12 flex flex-col items-center justify-center rounded-[10px]', sel === d && 'bg-line')}>
                  {fertile && <span className="absolute inset-x-0 inset-y-2 bg-sage-soft" />}
                  <span className={cx('relative w-8 h-8 rounded-full grid place-items-center num text-[13.5px]', period && 'bg-rose text-paper', d === today && !period && 'font-semibold underline underline-offset-4 decoration-forest')}>{+d.slice(8)}</span>
                  <span className="relative flex gap-0.5 h-1.5 mt-0.5">{dots.filter(k => k !== 'period').slice(0, 4).map(k => <span key={k} className={cx('w-1.5 h-1.5 rounded-full', EV_DOT[k])} />)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-mute mt-4">
            {(['check', 'book', 'visit', 'benefit', 'edd', 'period', 'predicted', 'fertile'] as EvKind[]).map(k => <span key={k} className="flex items-center gap-1.5"><span className={cx('w-2.5 h-2.5 rounded-full', EV_DOT[k])} />{EV_LABEL[k]}</span>)}
          </div>
        </Section>

        <Section title={sel ? mdw(sel) : '接下來 30 天'} action={sel ? <button className="btn-quiet text-[13px]" onClick={() => setSel('')}>看接下來 30 天</button> : undefined}>
          {list.length ? <Agenda list={list} showDate={!sel} today={today} onGo={r => { const [a, b] = r.split('/'); go(a as any, b); }} />
            : <Empty title={sel ? '這天沒有事情' : '接下來 30 天沒有安排'} hint="在「醫療管理 › 檢查規劃」填上預約日期，或在看診紀錄填下次回診，就會出現在這裡。" />}
        </Section>
      </div>
    </div>
  );
}

function Agenda({ list, showDate, today, onGo }: { list: Ev[]; showDate: boolean; today: string; onGo: (route: string) => void }) {
  let cur = '';
  return (
    <div>
      {list.map((e, i) => {
        const head = showDate && e.d !== cur ? (cur = e.d, <div key={'h' + e.d} className={cx('text-[13px] mt-4 mb-1 first:mt-0', e.d === today ? 'text-forest' : 'text-mute')}>{mdw(e.d)}・{relDay(e.d, today)}</div>) : null;
        return (
          <div key={i}>
            {head}
            <button onClick={() => onGo(e.route)} className="w-full text-left flex gap-3 items-start py-2.5 border-b border-line">
              <span className={cx('w-2.5 h-2.5 rounded-full mt-1.5 shrink-0', EV_DOT[e.kind])} />
              <span className="flex-1 min-w-0"><span className="text-[14.5px]">{e.title}</span>{e.sub && <span className="block text-[12.5px] text-mute truncate">{e.sub}</span>}</span>
              <span className="text-[11.5px] text-mute shrink-0">{EV_LABEL[e.kind]}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
