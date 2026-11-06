import { useMemo } from 'react';
import { Check, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import { md, shift, sleepHours, ymd } from '../lib/dates';
import { EntityForm, useEditor, type Field } from '../components/form';
import { Badge, DateCell, Empty, Figure, PageHeader, Row, Section, Tabs, cx, useToast } from '../components/ui';
import { INTENSITY } from '../content/options';
import { BODY_FIELDS } from './fields';

type Tab = 'body' | 'nutrition' | 'sleep' | 'exercise';
const TT = { contentStyle: { borderRadius: 12, border: '1px solid #E6E0D5', background: '#FFFCF7', fontSize: 12 } };
const AX = { tick: { fontSize: 11, fill: '#888478' }, tickLine: false };

export const SUP_FIELDS: Field[] = [
  { key: 'name', label: '品名', type: 'text', required: true },
  { key: 'brand', label: '品牌', type: 'text', half: true },
  { key: 'time', label: '攝取時間', type: 'text', half: true, hint: '例如：早餐後' },
  { key: 'dose', label: '每日建議攝取量', type: 'text', half: true, hint: '依產品標示或醫囑' },
  { key: 'actual', label: '實際攝取量', type: 'text', half: true },
  { key: 'start', label: '開始日期', type: 'date', half: true },
  { key: 'end', label: '結束日期', type: 'date', half: true },
  { key: 'note', label: '備註', type: 'textarea' },
];
const SLEEP_FIELDS: Field[] = [
  { key: 'date', label: '起床日期', type: 'date', required: true, hint: '以早上起床的日期記錄' },
  { key: 'bed', label: '入睡時間', type: 'time', half: true },
  { key: 'wake', label: '起床時間', type: 'time', half: true },
  { key: 'quality', label: '睡眠品質', type: 'scale', min: 1, max: 5, scaleLabels: ['很差', '很好'] },
  { key: 'note', label: '備註', type: 'textarea' },
];
export const EX_FIELDS: Field[] = [
  { key: 'date', label: '日期', type: 'date', required: true, half: true },
  { key: 'minutes', label: '運動時間', type: 'number', unit: '分鐘', half: true },
  { key: 'name', label: '運動名稱', type: 'text', required: true },
  { key: 'intensity', label: '運動強度', type: 'select', options: INTENSITY, half: true },
  { key: 'done', label: '已完成', type: 'check', half: true },
  { key: 'note', label: '運動備註', type: 'textarea' },
];

export default function Wellness() {
  const { sub, go } = useApp();
  const tab = (['body', 'nutrition', 'sleep', 'exercise'].includes(sub) ? sub : 'body') as Tab;
  return (
    <div>
      <PageHeader en="Wellness" zh="健康管理" sub="身體、營養、睡眠與運動。紀錄是給自己看的，不需要每天完美。" />
      <Tabs value={tab} onChange={t => go('wellness', t)} items={[['body', '身體紀錄'], ['nutrition', '營養補充'], ['sleep', '睡眠'], ['exercise', '運動']]} />
      {tab === 'body' && <Body />}{tab === 'nutrition' && <Nutrition />}{tab === 'sleep' && <SleepTab />}{tab === 'exercise' && <ExerciseTab />}
    </div>
  );
}

function Body() {
  const { today } = useApp();
  const rows = (useTable('body') || []).sort((a, b) => b.date.localeCompare(a.date));
  const ed = useEditor();
  const w = rows.filter(r => r.weight != null).slice(0, 90).reverse().map(r => ({ d: md(r.date), w: r.weight, f: r.bodyFat }));
  const last = rows.find(r => r.weight != null), first = [...rows].reverse().find(r => r.weight != null);
  const open = () => { const t = rows.find(r => r.date === today); t ? ed.edit(t.id) : ed.add({ date: today }); };
  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <div className="grid grid-cols-3 gap-6">
          <Figure value={last?.weight ?? '—'} unit={last ? 'kg' : ''} label="最近體重" tone="forest" />
          <Figure value={last && first && last !== first ? ((last.weight! - first.weight!) > 0 ? '+' : '') + (last.weight! - first.weight!).toFixed(1) : '—'} unit={last && first && last !== first ? 'kg' : ''} label="跟第一筆相比" />
          <Figure value={rows.find(r => r.bodyFat != null)?.bodyFat ?? '—'} unit={rows.some(r => r.bodyFat != null) ? '%' : ''} label="最近體脂率" />
        </div>
        <button className="btn-primary shrink-0" onClick={open}><Plus size={16} />今天</button>
      </div>
      {w.length >= 2 && (
        <Section en="Trend" title="體重變化">
          <div className="h-52 -ml-3"><ResponsiveContainer><LineChart data={w}><CartesianGrid stroke="#E6E0D5" vertical={false} /><XAxis dataKey="d" {...AX} minTickGap={20} axisLine={{ stroke: '#E6E0D5' }} /><YAxis domain={['dataMin - 1', 'dataMax + 1']} {...AX} axisLine={false} width={36} /><Tooltip {...TT} formatter={(v: any) => [v + ' kg', '體重']} /><Line dataKey="w" stroke="#455C4A" strokeWidth={1.6} dot={{ r: 2.5 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
        </Section>
      )}
      <Section en="Records" title="每日紀錄">
        {rows.length ? rows.slice(0, 60).map(r => (
          <Row key={r.id} onClick={() => ed.edit(r.id)} left={<DateCell date={r.date} />}
            title={[r.weight != null && r.weight + ' kg', r.bodyFat != null && '體脂 ' + r.bodyFat + '%', r.bbt != null && r.bbt + ' °C'].filter(Boolean).join('・') || (r.mood ? '心情紀錄' : '紀錄')}
            meta={[r.mood && '心情：' + r.mood, r.symptoms?.join('、'), r.opk && '試紙：' + r.opk, r.note].filter(Boolean).join('・')} />
        )) : <Empty title="還沒有身體紀錄" hint="體重、體脂率、基礎體溫、症狀和心情都可以記在每日紀錄裡。" />}
      </Section>
      <EntityForm table="body" title="身體紀錄" fields={BODY_FIELDS} {...ed} onClose={ed.close} />
    </>
  );
}

function Nutrition() {
  const { today } = useApp();
  const sups = useTable('supplements') || [];
  const logs = useTable('supplementLogs') || [];
  const ed = useEditor();
  const toast = useToast();
  const active = sups.filter(x => (!x.start || x.start <= today) && (!x.end || x.end >= today));
  const ended = sups.filter(x => !active.includes(x));
  const todayLog = (id: string) => logs.find(l => l.date === today && l.supplementId === id);
  const toggle = async (x: typeof sups[number]) => {
    const l = todayLog(x.id);
    if (l) { await data.table('supplementLogs').remove(l.id); toast('已取消今天的紀錄'); }
    else { const n = new Date(); await data.table('supplementLogs').add({ date: today, supplementId: x.id, amount: x.actual || x.dose, time: `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}` }); toast('已記錄：' + x.name); }
  };
  const days7 = Array.from({ length: 7 }, (_, i) => shift(today, i - 6));
  return (
    <>
      <Section en="Today" title="今天的營養補充" action={<button className="btn-quiet" onClick={() => ed.add({ start: today })}><Plus size={15} />新增補充品</button>}>
        {active.length ? active.map(x => {
          const l = todayLog(x.id);
          const n7 = days7.filter(d => logs.some(g => g.date === d && g.supplementId === x.id)).length;
          return (
            <div key={x.id} className="flex items-center gap-4 py-3.5 border-b border-line">
              <button onClick={() => toggle(x)} aria-pressed={!!l} aria-label={(l ? '取消' : '記錄') + '今天吃了 ' + x.name}
                className={cx('w-9 h-9 rounded-full border grid place-items-center shrink-0 transition', l ? 'bg-forest border-forest text-paper' : 'border-oat text-transparent')}><Check size={17} strokeWidth={2} /></button>
              <button className="flex-1 text-left min-w-0" onClick={() => ed.edit(x.id)}>
                <div className="text-[15px]">{x.name}{x.brand && <span className="text-mute text-[13px]">・{x.brand}</span>}</div>
                <div className="text-[12.5px] text-mute">{[x.dose && '建議 ' + x.dose, x.actual && '實際 ' + x.actual, x.time, l?.time && '今天 ' + l.time + ' 已吃'].filter(Boolean).join('・')}</div>
              </button>
              <div className="flex gap-1" aria-label={`最近 7 天吃了 ${n7} 天`}>{days7.map(d => <span key={d} className={cx('w-1.5 h-4 rounded-full', logs.some(g => g.date === d && g.supplementId === x.id) ? 'bg-sage' : 'bg-line')} />)}</div>
            </div>
          );
        }) : <Empty title="還沒有正在吃的補充品" hint="例如葉酸、鐵劑、維生素 D、魚油。劑量請依產品標示或醫師、藥師建議。" action={<button className="btn-primary" onClick={() => ed.add({ start: today })}>新增補充品</button>} />}
      </Section>
      {ended.length > 0 && <Section en="Archive" title="已結束或尚未開始">{ended.map(x => <Row key={x.id} onClick={() => ed.edit(x.id)} title={x.name} meta={[x.brand, x.start && ymd(x.start) + ' – ' + (x.end ? ymd(x.end) : '')].filter(Boolean).join('・')} right={<Badge tone="line">{x.end && x.end < today ? '已結束' : '尚未開始'}</Badge>} />)}</Section>}
      <EntityForm table="supplements" title="營養補充品" fields={SUP_FIELDS} {...ed} onClose={ed.close} footnote="劑量請依產品標示或醫師、藥師建議，App 不提供用藥建議。" />
    </>
  );
}

function SleepTab() {
  const { today } = useApp();
  const rows = (useTable('sleep') || []).sort((a, b) => b.date.localeCompare(a.date));
  const ed = useEditor();
  const d14 = Array.from({ length: 14 }, (_, i) => shift(today, i - 13));
  const chart = d14.map(d => ({ d: md(d), h: rows.find(r => r.date === d)?.hours ?? 0 }));
  const recent = rows.filter(r => r.date > shift(today, -7) && r.hours != null);
  const avg = useMemo(() => recent.length ? Math.round(recent.reduce((a, r) => a + r.hours!, 0) / recent.length * 10) / 10 : null, [recent]);
  const q = recent.filter(r => r.quality).map(r => r.quality!);
  const open = () => { const t = rows.find(r => r.date === today); t ? ed.edit(t.id) : ed.add({ date: today, bed: '23:00', wake: '07:00' }); };
  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <div className="grid grid-cols-2 gap-8">
          <Figure value={avg ?? '—'} unit={avg ? '小時' : ''} label="最近 7 天平均" tone="forest" />
          <Figure value={q.length ? (q.reduce((a, b) => a + b, 0) / q.length).toFixed(1) : '—'} unit={q.length ? '/ 5' : ''} label="平均睡眠品質" />
        </div>
        <button className="btn-primary shrink-0" onClick={open}><Plus size={16} />昨晚</button>
      </div>
      {rows.length > 0 && (
        <Section en="Two weeks" title="最近 14 天">
          <div className="h-44 -ml-3"><ResponsiveContainer><BarChart data={chart}><CartesianGrid stroke="#E6E0D5" vertical={false} /><XAxis dataKey="d" {...AX} minTickGap={10} axisLine={{ stroke: '#E6E0D5' }} /><YAxis {...AX} axisLine={false} width={30} domain={[0, 12]} /><Tooltip {...TT} formatter={(v: any) => [v + ' 小時', '睡眠']} /><Bar dataKey="h" fill="#A8B5A0" radius={[6, 6, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
        </Section>
      )}
      <Section en="Records" title="睡眠紀錄">
        {rows.length ? rows.slice(0, 60).map(r => <Row key={r.id} onClick={() => ed.edit(r.id)} left={<DateCell date={r.date} />} title={r.hours != null ? r.hours + ' 小時' : '睡眠'} meta={[r.bed && r.wake && `${r.bed} – ${r.wake}`, r.note].filter(Boolean).join('・')} right={r.quality ? <span className="text-forest">{'●'.repeat(r.quality)}<span className="text-line">{'●'.repeat(5 - r.quality)}</span></span> : null} />)
          : <Empty title="還沒有睡眠紀錄" hint="填入睡和起床時間，會自動算出睡眠時數。" />}
      </Section>
      <EntityForm table="sleep" title="睡眠" fields={SLEEP_FIELDS} {...ed} onClose={ed.close} derive={v => ({ ...v, hours: sleepHours(v.bed, v.wake) })} footnote="睡眠時數會用入睡與起床時間自動計算（跨夜也可以）。" />
    </>
  );
}

function ExerciseTab() {
  const { today } = useApp();
  const rows = (useTable('exercise') || []).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const ed = useEditor();
  const week = rows.filter(r => r.done && r.date > shift(today, -7));
  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <div className="grid grid-cols-2 gap-8">
          <Figure value={week.reduce((a, r) => a + (r.minutes || 0), 0)} unit="分鐘" label="最近 7 天完成" tone="forest" />
          <Figure value={week.length} unit="次" label="最近 7 天" />
        </div>
        <button className="btn-primary shrink-0" onClick={() => ed.add({ date: today, done: true })}><Plus size={16} />運動</button>
      </div>
      <p className="text-[12.5px] text-mute -mt-2 mb-6">一般建議每週累積約 150 分鐘中等強度活動；懷孕或有特殊狀況請依醫師建議調整。可以到 Lifestyle 找運動靈感。</p>
      <Section en="Records" title="運動紀錄">
        {rows.length ? rows.slice(0, 80).map(r => <Row key={r.id} onClick={() => ed.edit(r.id)} left={<DateCell date={r.date} />} title={r.name} meta={[r.minutes && r.minutes + ' 分鐘', r.intensity, r.note].filter(Boolean).join('・')} right={<Badge tone={r.done ? 'sage' : 'line'}>{r.done ? '已完成' : '計畫中'}</Badge>} />)
          : <Empty title="還沒有運動紀錄" />}
      </Section>
      <EntityForm table="exercise" title="運動" fields={EX_FIELDS} {...ed} onClose={ed.close} />
    </>
  );
}
