import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import { daysBetween, md, mdw, relDay, ymd } from '../lib/dates';
import { pregnancy, TRI, weekLabel, weekOf } from '../lib/pregnancy';
import { PRECONCEPTION_CHECKS, PRENATAL_CHECKS, PRENATAL_VISITS, type CheckItem } from '../content/medical';
import { VISIT_KIND } from '../content/options';
import { EntityForm, useEditor, type Field } from '../components/form';
import { Badge, DateCell, Empty, Note, PageHeader, Row, Section, Sheet, Tabs, cx, useToast } from '../components/ui';

type Tab = 'guide' | 'visits' | 'care';

export default function Medical() {
  const { sub, go, s, today } = useApp();
  const tab = (['guide', 'visits', 'care'].includes(sub) ? sub : 'guide') as Tab;
  const preg = s.stage === 'pregnant';
  const p = preg ? pregnancy(s.lmp, s.edd, today) : null;
  return (
    <div>
      <PageHeader kicker="幸孕女子・檢查與產檢" title="醫療管理" sub={preg ? '孕週、預產期、產檢行事曆與每次看診的紀錄。' : '備孕檢查建議、看診紀錄、醫院與醫師資料。'} />
      {preg && <PregBanner p={p} />}
      <Tabs value={tab} onChange={t => go('medical', t)} items={[['guide', preg ? '產檢行事曆' : '備孕檢查建議'], ['visits', preg ? '產檢與看診紀錄' : '看診紀錄'], ['care', '醫院與醫師']]} />
      {tab === 'guide' && (preg ? <PrenatalGuide week={p ? p.weeks : null} /> : <CheckList items={PRECONCEPTION_CHECKS} />)}
      {tab === 'visits' && <Visits />}
      {tab === 'care' && <Care />}
    </div>
  );
}

function PregBanner({ p }: { p: ReturnType<typeof pregnancy> }) {
  const { s } = useApp();
  const [open, setOpen] = useState(false);
  const [edd, setEdd] = useState(s.edd || '');
  const [lmp, setLmp] = useState(s.lmp || '');
  const toast = useToast();
  return (
    <div className="surface p-5 md:p-6 mb-8 grid sm:grid-cols-4 gap-5 items-end">
      <div className="sm:col-span-2">
        <div className="eyebrow">目前孕週</div>
        <div className="serif text-[34px] leading-tight text-forest mt-1">{p ? weekLabel(p) : '—'}</div>
        <div className="text-[12.5px] text-mute mt-1">{p ? TRI[p.trimester] + (p.adjusted ? '・依醫師調整的預產期計算' : '・依末次月經推算') : '尚未設定末次月經'}</div>
      </div>
      <div><div className="text-[12px] text-mute">預產期</div><div className="serif text-[18px]">{p ? ymd(p.edd) : '—'}</div></div>
      <div className="flex sm:justify-end"><button className="btn-ghost" onClick={() => { setEdd(s.edd || ''); setLmp(s.lmp || ''); setOpen(true); }}>調整日期</button></div>
      <Sheet open={open} onClose={() => setOpen(false)} title="孕週與預產期">
        <label className="block text-[12.5px] text-mute mb-1.5" htmlFor="m-lmp">末次月經第一天</label>
        <input id="m-lmp" type="date" className="field num" value={lmp} onChange={e => setLmp(e.target.value)} />
        <label className="block text-[12.5px] text-mute mb-1.5 mt-4" htmlFor="m-edd">醫師告知的預產期（選填）</label>
        <input id="m-edd" type="date" className="field num" value={edd} onChange={e => setEdd(e.target.value)} />
        <p className="text-[12px] text-mute mt-2">醫師依超音波調整過預產期時填寫，孕週會改用預產期反推。留空則用末次月經 + 280 天。</p>
        <div className="flex justify-end gap-2 mt-6"><button className="btn-ghost" onClick={() => setOpen(false)}>取消</button>
          <button className="btn-primary" disabled={!lmp && !edd} onClick={async () => { await data.saveSettings({ lmp: lmp || undefined, edd: edd || undefined }); toast('已更新'); setOpen(false); }}>儲存</button></div>
      </Sheet>
    </div>
  );
}

const COST_TONE = { 公費: 'sage', 健保: 'sage', 部分補助: 'oat', 自費: 'rose' } as const;
function CheckCard({ c, state }: { c: CheckItem; state?: 'now' | 'past' | 'next' }) {
  return (
    <div className={cx('py-4 border-b border-line grid grid-cols-[76px_1fr] gap-4', state === 'past' && 'opacity-55')}>
      <div>{c.weeks ? <><div className="display text-[26px] leading-none text-forest">{c.weeks[0] === c.weeks[1] ? c.weeks[0] : `${c.weeks[0]}–${c.weeks[1]}`}</div><div className="text-[11px] text-mute mt-1">孕週</div></> : <div className="serif text-[16px] text-forest">懷孕前</div>}</div>
      <div>
        <div className="flex flex-wrap items-center gap-2"><span className="serif text-[15.5px]">{c.title}</span>{state === 'now' && <Badge tone="forest">現在</Badge>}</div>
        <p className="text-[13px] text-ink/80 mt-1 leading-relaxed">{c.purpose}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge tone={COST_TONE[c.cost]}>{c.cost}</Badge>
          <Badge tone={c.optional ? 'line' : 'sage'}>{c.optional ? '選擇性，請與醫師討論' : '常規建議'}</Badge>
        </div>
        {c.note && <p className="text-[12px] text-mute mt-2">{c.note}</p>}
        <p className="text-[11px] text-mute mt-1">資料來源：{c.source}</p>
      </div>
    </div>
  );
}

function Disclaimer() {
  return <div className="mb-6"><Note tone="oat">依衛生福利部國民健康署公告與一般孕產照護資訊整理，實際時程、項目與補助以國健署最新公告、孕婦健康手冊和你的醫院安排為準。「選擇性」檢查不是每個人都要做，請跟醫師討論是否適合你。</Note></div>;
}
function CheckList({ items }: { items: CheckItem[] }) {
  return <><Disclaimer />{items.map(c => <CheckCard key={c.id} c={c} />)}</>;
}

function PrenatalGuide({ week }: { week: number | null }) {
  const [show, setShow] = useState<'all' | 'visits' | 'checks'>('all');
  const list = [...(show !== 'checks' ? PRENATAL_VISITS : []), ...(show !== 'visits' ? PRENATAL_CHECKS : [])].sort((a, b) => a.weeks![0] - b.weeks![0] || a.weeks![1] - b.weeks![1]);
  const stateOf = (c: CheckItem) => week == null ? undefined : week > c.weeks![1] ? 'past' : week >= c.weeks![0] ? 'now' : 'next';
  return (
    <>
      <Disclaimer />
      <div className="flex gap-2 mb-2">{([['all', '全部'], ['visits', '14 次公費產檢'], ['checks', '超音波與篩檢']] as const).map(([k, n]) => <button key={k} className={cx('chip', show === k && 'chip-on')} onClick={() => setShow(k)}>{n}</button>)}</div>
      {list.map(c => <CheckCard key={c.id} c={c} state={stateOf(c)} />)}
    </>
  );
}

function Visits() {
  const { s, today } = useApp();
  const preg = s.stage === 'pregnant';
  const rows = (useTable('visits') || []).sort((a, b) => b.date.localeCompare(a.date));
  const hospitals = useTable('hospitals') || [];
  const doctors = useTable('doctors') || [];
  const ed = useEditor();
  const hn = (id?: string) => hospitals.find(h => h.id === id)?.name;
  const dn = (id?: string) => doctors.find(d => d.id === id)?.name;
  const isPregKind = (v: any) => preg && ['產檢', '超音波'].includes(v.kind);
  const fields: Field[] = [
    { key: 'date', label: '看診日期', type: 'date', required: true, half: true },
    { key: 'kind', label: '類型', type: 'select', required: true, half: true, options: preg ? VISIT_KIND : VISIT_KIND.filter(k => !['產檢', '超音波'].includes(k)) },
    { key: 'hospitalId', label: '醫院', type: 'select', half: true, options: [...hospitals].sort((a, b) => +!!b.favorite - +!!a.favorite).map(h => [h.id, (h.favorite ? '★ ' : '') + h.name] as [string, string]), hint: hospitals.length ? undefined : '先到「醫院與醫師」新增' },
    { key: 'doctorId', label: '醫師', type: 'select', half: true, options: doctors.map(d => [d.id, d.name + (d.dept ? '（' + d.dept + '）' : '')] as [string, string]) },
    { key: 'week', label: '當時孕週', type: 'text', half: true, show: isPregKind, hint: '空著會依日期自動計算' },
    { key: 'efw', label: '胎兒估計體重', type: 'number', unit: '公克', half: true, show: v => isPregKind(v) },
    { key: 'ultrasound', label: '超音波紀錄', type: 'textarea', show: isPregKind, hint: '胎心、頭圍、股骨長、羊水、胎位等' },
    { key: 'items', label: '檢查項目', type: 'textarea' },
    { key: 'results', label: '檢查結果', type: 'textarea' },
    { key: 'advice', label: '醫師建議', type: 'textarea' },
    { key: 'nextDate', label: '下次回診日期', type: 'date', half: true },
    { key: 'files', label: '報告附件', type: 'files' },
  ];
  const derive = (v: Record<string, any>) => {
    if (isPregKind(v) && !v.week && v.date) { const p = pregnancy(s.lmp, s.edd, v.date); if (p) return { ...v, week: weekOf(p) }; }
    return v;
  };
  const next = rows.map(r => r.nextDate).filter((d): d is string => !!d && d >= today).sort()[0];
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[13.5px]">{next ? <>下次回診 <b className="serif">{mdw(next)}</b><span className="text-mute">・{relDay(next, today)}</span></> : <span className="text-mute">尚未排定下次回診</span>}</p>
        <button className="btn-primary" onClick={() => ed.add({ date: today, kind: preg ? '產檢' : '備孕檢查' })}><Plus size={16} />新增紀錄</button>
      </div>
      {rows.length ? rows.map(v => (
        <Row key={v.id} onClick={() => ed.edit(v.id)} left={<DateCell date={v.date} />}
          title={<>{v.kind}{v.week && <span className="text-mute text-[13px]">・{v.week}</span>}</>}
          meta={[hn(v.hospitalId), dn(v.doctorId), v.items, v.nextDate && '下次 ' + md(v.nextDate)].filter(Boolean).join('・')}
          right={v.date > today ? <Badge tone="oat">{daysBetween(today, v.date)} 天後</Badge> : v.files?.length ? <Badge tone="line">附件 {v.files.length}</Badge> : null}>
          {(v.advice || v.results) && <p className="text-[13px] text-ink/80 mt-1 line-clamp-2">{v.advice || v.results}</p>}
        </Row>
      )) : <Empty title="還沒有看診紀錄" hint="每次看診可以記下檢查項目、結果、醫師建議和報告照片。" />}
      <EntityForm table="visits" title={preg ? '產檢／看診' : '看診紀錄'} fields={fields} {...ed} onClose={ed.close} derive={derive} footnote="報告與附件只存在這個瀏覽器，記得定期到「設定」下載備份。" />
    </>
  );
}

function Care() {
  const hospitals = (useTable('hospitals') || []).sort((a, b) => +!!b.favorite - +!!a.favorite || a.name.localeCompare(b.name));
  const doctors = useTable('doctors') || [];
  const visits = useTable('visits') || [];
  const he = useEditor(), de = useEditor();
  const hf: Field[] = [
    { key: 'name', label: '醫院／診所名稱', type: 'text', required: true },
    { key: 'phone', label: '電話', type: 'text', half: true }, { key: 'favorite', label: '收藏', type: 'check', half: true },
    { key: 'address', label: '地址', type: 'text' }, { key: 'note', label: '備註', type: 'textarea', hint: '掛號方式、交通、自費項目價格等' },
  ];
  const df: Field[] = [
    { key: 'name', label: '醫師姓名', type: 'text', required: true },
    { key: 'hospitalId', label: '醫院', type: 'select', half: true, options: hospitals.map(h => [h.id, h.name] as [string, string]) },
    { key: 'dept', label: '科別', type: 'text', half: true }, { key: 'phone', label: '聯絡方式', type: 'text' }, { key: 'note', label: '備註', type: 'textarea', hint: '門診時間、看診心得' },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-x-10">
      <Section title="醫院收藏" action={<button className="btn-quiet" onClick={() => he.add()}><Plus size={15} />新增</button>}>
        {hospitals.length ? hospitals.map(h => (
          <div key={h.id} className="flex items-start gap-2">
            <button onClick={() => data.table('hospitals').update(h.id, { favorite: !h.favorite })} className="pt-4" aria-label={h.favorite ? '取消收藏' : '收藏'}><Star size={16} strokeWidth={1.4} className={h.favorite ? 'fill-oat text-oat' : 'text-line'} /></button>
            <div className="flex-1"><Row onClick={() => he.edit(h.id)} title={h.name} meta={[h.phone, h.address].filter(Boolean).join('・')} right={<span className="text-[12px] text-mute">{visits.filter(v => v.hospitalId === h.id).length} 次看診</span>} /></div>
          </div>
        )) : <Empty title="還沒有醫院" />}
      </Section>
      <Section title="醫師資料" action={<button className="btn-quiet" onClick={() => de.add()}><Plus size={15} />新增</button>}>
        {doctors.length ? doctors.map(d => <Row key={d.id} onClick={() => de.edit(d.id)} title={d.name} meta={[hospitals.find(h => h.id === d.hospitalId)?.name, d.dept, d.phone].filter(Boolean).join('・')} />) : <Empty title="還沒有醫師資料" />}
      </Section>
      <EntityForm table="hospitals" title="醫院" fields={hf} {...he} onClose={he.close} />
      <EntityForm table="doctors" title="醫師" fields={df} {...de} onClose={de.close} />
    </div>
  );
}
