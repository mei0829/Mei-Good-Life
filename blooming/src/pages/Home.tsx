import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Circle } from 'lucide-react';
import { useApp, STAGE_LABEL, type Route } from '../app';
import { useTable } from '../data/hooks';
import { cycleStats } from '../lib/cycle';
import { pregnancy, TRI, weekLabel } from '../lib/pregnancy';
import { daysBetween, fullDate, md, mdw, relDay, ymd } from '../lib/dates';
import { quoteOf } from '../content/quotes';
import { Duck, DuckPair, type DuckSpec } from '../components/Duck';
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

  const st = useMemo(() => cycleStats(periods, today), [periods, today]);
  const p = s.stage === 'pregnant' ? pregnancy(s.lmp, s.edd, today) : null;
  const h = new Date().getHours();
  const hello = (h < 11 ? '早安' : h < 18 ? '午安' : '晚安') + (s.name ? '，' + s.name : '');
  const helloSub = h < 11 ? '新的一天，從照顧自己開始。' : h < 18 ? '記得喝水，也記得休息一下。' : '今天辛苦了，好好放鬆。';
  const quote = quoteOf(today);
  // 首頁的鴨子跟著階段改變：備孕站在小花旁、懷孕抱著蛋、產後旁邊一顆小愛心
  const stageDuck: DuckSpec = s.stage === 'pregnant' ? { pose: 'sit', prop: 'egg' } : s.stage === 'postpartum' ? { pose: 'stand', prop: 'heart' } : { pose: 'stand', prop: 'flower' };
  const stageDuckTitle = s.stage === 'pregnant' ? '抱著蛋的柯爾鴨' : s.stage === 'postpartum' ? '柯爾鴨' : '站在小花旁的柯爾鴨';

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
          <p className="eyebrow">{fullDate(today)}</p>
          <h1 className="brand text-[54px] md:text-[84px] leading-[.9] text-forest mt-2 -ml-0.5">Blooming Days</h1>
        </div>
        <p className="hidden sm:block serif text-[13.5px] text-mute text-right max-w-[200px] leading-relaxed tracking-[.02em]">備孕與孕期<br />健康日誌</p>
      </header>
      <div className="flex justify-between items-baseline py-2.5 border-b border-line text-[12.5px] text-mute">
        <span className="serif">在成為媽媽之前，先好好照顧自己。</span>
        <span className="hidden sm:inline">今日號・{ymd(today)}</span>
      </div>

      <div className="mt-6 flex items-baseline gap-3 flex-wrap">
        <span className="serif text-[24px] md:text-[28px] text-ink tracking-[.02em]">{hello}</span>
        <span className="text-[14px] text-mute">{helloSub}</span>
      </div>

      {/* 目前階段：紙張面板＋一隻依階段變化的鴨子 */}
      <section className="relative mt-5 surface px-5 py-5 md:px-8 md:py-7 flex items-end justify-between gap-3 overflow-hidden text-forest">
        <div className="min-w-0 flex-1">
          <div className="eyebrow">目前階段・{STAGE_LABEL[s.stage]}</div>
          {p ? (<>
            <div className="leading-none mt-2"><span className="display text-[50px] md:text-[64px]">{p.weeks}</span><span className="serif text-[20px] md:text-[24px] mx-2">週</span><span className="display text-[50px] md:text-[64px]">{p.dayOfWeek}</span><span className="serif text-[20px] md:text-[24px] ml-2">天</span></div>
            <div className="serif text-[14px] mt-2 text-mute">{TRI[p.trimester]}・預產期 {ymd(p.edd)}・{p.left > 0 ? `還有 ${p.left} 天` : p.left === 0 ? '就是今天' : `已過 ${-p.left} 天`}</div>
            <div className="h-[3px] bg-line rounded-full mt-3 max-w-md"><div className="h-full bg-forest rounded-full" style={{ width: p.progress * 100 + '%' }} /></div>
          </>) : s.stage === 'pregnant' ? (
            <div className="serif text-[18px] mt-2">請到設定填寫末次月經日期，計算孕週</div>
          ) : s.stage === 'postpartum' ? (
            <div className="serif text-[20px] mt-2">產後階段（功能預留，之後擴充）</div>
          ) : (<>
            {st.cycleDay ? (
              <div className="leading-none mt-2 whitespace-nowrap"><span className="serif text-[18px] md:text-[24px] mr-1.5">月經週期第</span><span className="display text-[46px] md:text-[64px]">{st.cycleDay}</span><span className="serif text-[18px] md:text-[24px] ml-1.5">天</span></div>
            ) : <div className="serif text-[26px] md:text-[32px] mt-2 tracking-[.02em]">從今天開始</div>}
            <div className="serif text-[14px] mt-2 text-mute">{st.cycleDay ? (st.nextStart ? '下次月經預測在 ' + md(st.nextStart) : '再多記錄幾次月經，就能估算週期') : '記錄第一次月經，開始了解你的週期'}</div>
          </>)}
        </div>
        <Duck {...stageDuck} className="w-28 h-28 md:w-44 md:h-44 shrink-0 -mr-2 -mb-2" title={stageDuckTitle} />
      </section>

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
          <Block title="今天待完成">
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
          <Block title="近期行程">
            {events.length ? events.map((e, i) => (
              <button key={i} onClick={() => go('medical', 'visits')} className="w-full flex gap-4 py-2.5 border-b border-line text-left">
                <span className="text-[13px] w-[128px] shrink-0 text-forest">{mdw(e.d)}</span>
                <span className="flex-1 text-[14px]">{e.t}{e.m && <span className="text-mute text-[12.5px]">・{e.m}</span>}</span>
                <span className="text-[12px] text-mute">{relDay(e.d, today)}</span>
              </button>
            )) : <p className="text-[13px] text-mute py-2">沒有排定的行程。看診紀錄填上「下次回診日期」就會出現在這裡。</p>}
          </Block>
        </aside>
      </div>

      {/* 每日一句 */}
      <blockquote className="relative mt-12 py-10 px-6 md:px-14 text-center border-y border-line">
        <DuckPair className="w-36 h-20 mx-auto mb-4" big={{ pose: 'walk' }} small={{ pose: 'walk', kind: 'duckling', flip: true }} />
        <p className="eyebrow mb-3">每日一句</p>
        <p className="serif text-[22px] md:text-[28px] leading-relaxed text-forest tracking-[.02em]">「{quote}」</p>
      </blockquote>

      <ConfirmPregnancy open={confirm} onClose={() => setConfirm(false)} />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-8"><h2 className="serif text-[18px] text-forest tracking-[.02em] mb-1.5 flex items-center gap-2"><span className="w-4 h-px bg-sage inline-block" aria-hidden="true" />{title}</h2>{children}</section>;
}

function CycleSummary({ st }: { st: ReturnType<typeof cycleStats> }) {
  const { go } = useApp();
  return (
    <Block title="月經週期摘要">
      {st.confidence === 'none' ? (
        <Note tone="oat">預測尚待累積：{st.count === 0 ? '還沒有月經紀錄' : '目前只有 1 次月經紀錄'}，需要至少兩次月經開始日才能估算週期。<button className="underline ml-1 text-forest" onClick={() => go('cycle')}>前往記錄</button></Note>
      ) : (
        <div className="grid grid-cols-3 gap-4 py-2">
          <div><div className="text-[12px] text-mute">下次月經</div><div className="serif text-[17px] sm:text-[20px] mt-1">{md(st.nextStart)}</div><div className="text-[11.5px] text-mute">預測</div></div>
          <div><div className="text-[12px] text-mute">排卵期</div><div className="serif text-[17px] sm:text-[20px] mt-1">{md(st.ovulation)}</div><div className="text-[11.5px] text-mute">預測</div></div>
          <div><div className="text-[12px] text-mute">易孕期</div><div className="serif text-[15.5px] sm:text-[20px] mt-1 leading-snug"><span className="whitespace-nowrap">{md(st.fertileStart)}</span><br /><span className="whitespace-nowrap"><span className="text-[13px] text-mute">至</span> {md(st.fertileEnd)}</span></div><div className="text-[11.5px] text-mute">預測</div></div>
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
  if (!p) return <Block title="孕期摘要"><Note>還沒有末次月經日期。<button className="underline text-forest" onClick={() => go('settings')}>到設定填寫</button></Note></Block>;
  const nv = visits[0];
  return (
    <Block title="孕期摘要">
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
    <Block title="今日健康摘要">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5">
        {cell('體重', tb?.weight != null ? <>{tb.weight}<small className="text-[12px] text-mute ml-1">公斤</small></> : '—', () => go('wellness', 'body'))}
        {cell('基礎體溫', tb?.bbt != null ? <>{tb.bbt}<small className="text-[12px] text-mute ml-1">°C</small></> : '—', () => go('cycle'))}
        {cell('睡眠', ts?.hours != null ? <>{ts.hours}<small className="text-[12px] text-mute ml-1">小時</small></> : '—', () => go('wellness', 'sleep'))}
        {cell('營養補充', sup[1] ? `${sup[0]} / ${sup[1]}` : '—', () => go('wellness', 'nutrition'))}
        {cell('運動', ex ? <>{ex}<small className="text-[12px] text-mute ml-1">分鐘</small></> : '—', () => go('wellness', 'exercise'))}
        {cell('心情', <span className="serif text-[17px]">{tb?.mood || '—'}</span>, () => go('wellness', 'body'))}
      </div>
    </Block>
  );
}
