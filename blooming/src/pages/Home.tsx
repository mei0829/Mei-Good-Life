import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Circle } from 'lucide-react';
import { useApp, STAGE_EN, STAGE_LABEL, type Route } from '../app';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import { cycleStats } from '../lib/cycle';
import { pregnancy, TRI, weekLabel } from '../lib/pregnancy';
import { daysBetween, enDate, md, mdw, relDay, ymd } from '../lib/dates';
import { quoteOf } from '../content/quotes';
import { HeroArt, Sprig } from '../components/Botanical';
import { Badge, Note, cx } from '../components/ui';
import { ConfirmPregnancy } from '../components/Stage';

const activeOn = (x: { start?: string; end?: string }, d: string) => (!x.start || x.start <= d) && (!x.end || x.end >= d);

export default function Home() {
  const { s, today, go } = useApp();
  const periods = useTable('periods') || [];
  const body = useTable('body') || [];
  const sleep = useTable('sleep') || [];
  const sups = useTable('supplements') || [];
  const logs = useTable('supplementLogs') || [];
  const journal = useTable('journal') || [];
  const visits = useTable('visits') || [];
  const exercise = useTable('exercise') || [];
  const hospitals = useTable('hospitals') || [];
  const [confirm, setConfirm] = useState(false);
  const photo = usePhoto(s.heroPhoto);

  const st = useMemo(() => cycleStats(periods, today), [periods, today]);
  const p = s.stage === 'pregnant' ? pregnancy(s.lmp, s.edd, today) : null;
  const h = new Date().getHours();
  const hello = (h < 11 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  const zhHello = (h < 11 ? '早安' : h < 18 ? '午安' : '晚安') + (s.name ? '，' + s.name : '');
  const [qEn, qZh] = quoteOf(today);

  const tb = body.find(b => b.date === today), ts = sleep.find(x => x.date === today), tj = journal.find(j => j.date === today);
  const activeSups = sups.filter(x => activeOn(x, today));
  const takenIds = new Set(logs.filter(l => l.date === today).map(l => l.supplementId));
  const todayEx = exercise.filter(e => e.date === today && e.done);

  // 待完成紀錄
  const todos: [string, boolean, Route, string?][] = [];
  if (s.stage === 'preconception') todos.push(['量基礎體溫', tb?.bbt != null, 'cycle']);
  todos.push(['身體紀錄（體重、心情）', !!(tb && (tb.weight != null || tb.mood)), 'wellness', 'body']);
  todos.push(['昨晚睡眠', !!ts, 'wellness', 'sleep']);
  activeSups.forEach(x => todos.push(['補充 ' + x.name, takenIds.has(x.id), 'wellness', 'nutrition']));
  todos.push([s.stage === 'pregnant' ? '今日日記（含孕期症狀）' : '今日日記', !!tj, 'journal']);

  // 近期行程：看診日與醫師交代的下次回診
  const hname = (id?: string) => hospitals.find(x => x.id === id)?.name;
  const events = [
    ...visits.filter(v => v.date >= today).map(v => ({ d: v.date, t: v.kind, m: hname(v.hospitalId) })),
    ...visits.filter(v => v.nextDate && v.nextDate >= today && !visits.some(o => o.date === v.nextDate)).map(v => ({ d: v.nextDate!, t: '回診（' + v.kind + '）', m: hname(v.hospitalId) })),
  ].sort((a, b) => a.d.localeCompare(b.d)).slice(0, 4);

  return (
    <div>
      {/* 雜誌封面刊頭 */}
      <header className="flex items-end justify-between border-b border-ink/80 pb-3">
        <div>
          <p className="eyebrow">{enDate()}</p>
          <h1 className="display text-[54px] md:text-[84px] leading-[.9] text-forest mt-2 -ml-0.5">Blooming Days</h1>
        </div>
        <p className="hidden sm:block display italic text-[15px] text-mute text-right max-w-[180px] leading-snug">A Journey of Wellness &amp; Motherhood</p>
      </header>
      <div className="flex justify-between items-baseline py-2.5 border-b border-line text-[12.5px] text-mute">
        <span className="serif">在成為媽媽之前，先好好照顧自己。</span>
        <span className="num hidden sm:inline">Issue {ymd(today)}</span>
      </div>

      <div className="mt-6 flex items-baseline gap-3 flex-wrap">
        <span className="display italic text-[24px] md:text-[28px] text-ink">{hello}.</span>
        <span className="serif text-[16px]">{zhHello}</span>
      </div>

      {/* 主視覺 */}
      <figure className="relative mt-5 rounded-[22px] overflow-hidden aspect-[1/1] sm:aspect-[16/9] md:aspect-[21/9] bg-oat-soft">
        {photo ? <img src={photo} alt="主視覺照片" className="absolute inset-0 w-full h-full object-cover" /> : <HeroArt className="absolute inset-0 w-full h-full" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2c372e]/75 via-[#2c372e]/15 to-transparent" />
        <figcaption className="absolute left-5 right-5 bottom-5 md:left-8 md:bottom-7 text-paper">
          <div className="eyebrow !text-paper/80">{STAGE_EN[s.stage]} · {STAGE_LABEL[s.stage]}</div>
          {p ? (<>
            <div className="display text-[44px] md:text-[60px] leading-none mt-2">{p.weeks}<span className="text-[22px] md:text-[26px] mx-1.5 italic">weeks</span>{p.dayOfWeek}<span className="text-[22px] md:text-[26px] ml-1.5 italic">days</span></div>
            <div className="serif text-[14px] mt-2 text-paper/90">{TRI[p.trimester]}・預產期 {ymd(p.edd)}・{p.left > 0 ? `還有 ${p.left} 天` : p.left === 0 ? '就是今天' : `已過 ${-p.left} 天`}</div>
            <div className="h-[3px] bg-paper/25 rounded-full mt-3 max-w-md"><div className="h-full bg-paper rounded-full" style={{ width: p.progress * 100 + '%' }} /></div>
          </>) : s.stage === 'pregnant' ? (
            <div className="serif text-[18px] mt-2">請到設定填寫末次月經日期，計算孕週</div>
          ) : s.stage === 'postpartum' ? (
            <div className="serif text-[20px] mt-2">產後階段（功能預留，之後擴充）</div>
          ) : (<>
            <div className="display text-[44px] md:text-[60px] leading-none mt-2">{st.cycleDay ? <>Day {st.cycleDay}</> : 'Begin'}</div>
            <div className="serif text-[14px] mt-2 text-paper/90">{st.cycleDay ? '這次週期第 ' + st.cycleDay + ' 天' : '記錄第一次月經，開始了解你的週期'}</div>
          </>)}
        </figcaption>
      </figure>

      {/* 階段摘要 */}
      <div className="grid md:grid-cols-[1.25fr_1fr] gap-x-10 mt-9">
        <div>
          {s.stage === 'pregnant' ? <PregSummary p={p} visits={events} /> : <CycleSummary st={st} />}
          <Today tb={tb} ts={ts} sup={[takenIds.size ? activeSups.filter(x => takenIds.has(x.id)).length : 0, activeSups.length]} ex={todayEx.reduce((a, e) => a + (e.minutes || 0), 0)} />
          {s.stage === 'preconception' && (
            <div className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-mute">
              {st.lateBy ? <span>月經比預測晚 {st.lateBy} 天。</span> : null}
              <button className="btn-ghost" onClick={() => setConfirm(true)}>已確認懷孕？切換到孕期</button>
            </div>
          )}
        </div>
        <aside className="mt-9 md:mt-0">
          <Block en="To do" title="今天待完成">
            <ul>
              {todos.map(([t, done, r, sub]) => (
                <li key={t}><button onClick={() => go(r, sub)} className="w-full flex items-center gap-3 py-2.5 border-b border-line text-left text-[14px]">
                  {done ? <Check size={17} className="text-forest shrink-0" strokeWidth={1.8} /> : <Circle size={17} className="text-oat shrink-0" strokeWidth={1.4} />}
                  <span className={cx('flex-1', done && 'text-mute line-through decoration-line')}>{t}</span>
                  {!done && <ArrowUpRight size={15} className="text-mute" strokeWidth={1.4} />}
                </button></li>
              ))}
            </ul>
          </Block>
          <Block en="Upcoming" title="近期行程">
            {events.length ? events.map((e, i) => (
              <button key={i} onClick={() => go('medical', 'visits')} className="w-full flex gap-4 py-2.5 border-b border-line text-left">
                <span className="num text-[13px] w-[86px] shrink-0 text-forest">{mdw(e.d)}</span>
                <span className="flex-1 text-[14px]">{e.t}{e.m && <span className="text-mute text-[12.5px]">・{e.m}</span>}</span>
                <span className="text-[12px] text-mute">{relDay(e.d, today)}</span>
              </button>
            )) : <p className="text-[13px] text-mute py-2">沒有排定的行程。看診紀錄填上「下次回診日期」就會出現在這裡。</p>}
          </Block>
        </aside>
      </div>

      {/* 每日一句 */}
      <blockquote className="relative mt-12 py-10 px-6 md:px-14 text-center border-y border-line">
        <Sprig className="w-10 h-10 mx-auto mb-3" />
        <p className="display italic text-[26px] md:text-[34px] leading-snug text-forest">“{qEn}”</p>
        <p className="serif text-[14.5px] mt-3 text-ink/80">{qZh}</p>
      </blockquote>

      <ConfirmPregnancy open={confirm} onClose={() => setConfirm(false)} />
    </div>
  );
}

function Block({ en, title, children }: { en: string; title: string; children: React.ReactNode }) {
  return <section className="mb-8"><h2 className="flex items-baseline gap-2 mb-1"><span className="display italic text-[20px] text-forest">{en}</span><span className="serif text-[14px]">{title}</span></h2>{children}</section>;
}

function CycleSummary({ st }: { st: ReturnType<typeof cycleStats> }) {
  const { go } = useApp();
  return (
    <Block en="Cycle" title="月經週期摘要">
      {st.confidence === 'none' ? (
        <Note tone="oat">預測尚待累積：{st.count === 0 ? '還沒有月經紀錄' : '目前只有 1 次月經紀錄'}，需要至少兩次月經開始日才能估算週期。<button className="underline ml-1 text-forest" onClick={() => go('cycle')}>前往記錄</button></Note>
      ) : (
        <div className="grid grid-cols-3 gap-4 py-2">
          <div><div className="text-[12px] text-mute">下次月經</div><div className="serif text-[20px] mt-1">{md(st.nextStart)}</div><div className="text-[11.5px] text-mute">預測</div></div>
          <div><div className="text-[12px] text-mute">排卵期</div><div className="serif text-[20px] mt-1">{md(st.ovulation)}</div><div className="text-[11.5px] text-mute">預測</div></div>
          <div><div className="text-[12px] text-mute">易孕期</div><div className="serif text-[20px] mt-1">{md(st.fertileStart)}–{md(st.fertileEnd)}</div><div className="text-[11.5px] text-mute">預測</div></div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {st.avgCycle && <Badge>平均週期 {st.avgCycle} 天</Badge>}
        {st.confidence === 'low' && <Badge tone="oat">資料還很少</Badge>}
        {st.irregular && <Badge tone="rose">週期不規律，預測可能不準</Badge>}
      </div>
    </Block>
  );
}

function PregSummary({ p, visits }: { p: ReturnType<typeof pregnancy>; visits: { d: string; t: string }[] }) {
  const { go, today } = useApp();
  if (!p) return <Block en="Pregnancy" title="孕期摘要"><Note>還沒有末次月經日期。<button className="underline text-forest" onClick={() => go('settings')}>到設定填寫</button></Note></Block>;
  const nv = visits[0];
  return (
    <Block en="Pregnancy" title="孕期摘要">
      <div className="grid grid-cols-3 gap-4 py-2">
        <div><div className="text-[12px] text-mute">目前孕週</div><div className="serif text-[20px] mt-1">{weekLabel(p)}</div></div>
        <div><div className="text-[12px] text-mute">預產期</div><div className="serif text-[20px] mt-1">{md(p.edd)}</div><div className="text-[11.5px] text-mute">{p.adjusted ? '醫師調整' : '依末次月經推算'}</div></div>
        <div><div className="text-[12px] text-mute">下次產檢</div><div className="serif text-[20px] mt-1">{nv ? md(nv.d) : '—'}</div>{nv && <div className="text-[11.5px] text-mute">{daysBetween(today, nv.d)} 天後</div>}</div>
      </div>
    </Block>
  );
}

function Today({ tb, ts, sup, ex }: { tb?: any; ts?: any; sup: [number, number]; ex: number }) {
  const { go } = useApp();
  const cell = (label: string, v: React.ReactNode, onClick: () => void) => (
    <button onClick={onClick} className="text-left py-3 border-t border-line">
      <div className="text-[12px] text-mute">{label}</div><div className="num text-[19px] mt-0.5">{v}</div>
    </button>
  );
  return (
    <Block en="Today" title="今日健康摘要">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5">
        {cell('體重', tb?.weight != null ? <>{tb.weight}<small className="text-[12px] text-mute ml-1">kg</small></> : '—', () => go('wellness', 'body'))}
        {cell('基礎體溫', tb?.bbt != null ? <>{tb.bbt}<small className="text-[12px] text-mute ml-1">°C</small></> : '—', () => go('cycle'))}
        {cell('睡眠', ts?.hours != null ? <>{ts.hours}<small className="text-[12px] text-mute ml-1">小時</small></> : '—', () => go('wellness', 'sleep'))}
        {cell('營養補充', sup[1] ? `${sup[0]} / ${sup[1]}` : '—', () => go('wellness', 'nutrition'))}
        {cell('運動', ex ? <>{ex}<small className="text-[12px] text-mute ml-1">分鐘</small></> : '—', () => go('wellness', 'exercise'))}
        {cell('心情', <span className="serif text-[17px]">{tb?.mood || '—'}</span>, () => go('wellness', 'body'))}
      </div>
    </Block>
  );
}

function usePhoto(id?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!id) { setUrl(undefined); return; }
    let u = ''; data.getFile(id).then(f => { if (f) { u = URL.createObjectURL(f.blob); setUrl(u); } });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url;
}
