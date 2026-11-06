import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { mdw, shift } from '../lib/dates';
import { pregnancy } from '../lib/pregnancy';
import { APPETITE, APPETITE_CHANGE, DISCOMFORT, MOODS, PREG_SYMPTOMS } from '../content/options';
import { EntityForm, FileList, useEditor, type Field } from '../components/form';
import { Badge, Chips, Empty, PageHeader } from '../components/ui';

export default function Journal() {
  const { s, today } = useApp();
  const preg = s.stage === 'pregnant';
  const rows = (useTable('journal') || []).sort((a, b) => b.date.localeCompare(a.date));
  const sleep = useTable('sleep') || [];
  const ed = useEditor();
  const [range, setRange] = useState('全部');
  const fields: Field[] = [
    { key: 'date', label: '日期', type: 'date', required: true, half: true },
    { key: 'mood', label: '今日心情', type: 'select', options: MOODS, half: true },
    { key: 'body', label: '今日身體狀況', type: 'text', hint: '一句話描述就好' },
    { key: 'sleep', label: '睡眠紀錄', type: 'text', hint: '詳細睡眠時數可以到健康管理 › 睡眠記錄', half: false },
    { key: 'appetite', label: '食慾', type: 'select', options: APPETITE, half: true },
    { key: 'discomfort', label: '身體不適', type: 'multi', options: DISCOMFORT },
    // 懷孕階段才顯示
    ...(preg ? [
      { key: 'vomit', label: '孕吐次數', type: 'number', unit: '次', half: true, min: 0 },
      { key: 'nausea', label: '噁心程度', type: 'scale', min: 0, max: 5, scaleLabels: ['沒有', '非常嚴重'] },
      { key: 'appetiteChange', label: '食慾變化', type: 'select', options: APPETITE_CHANGE, half: true },
      { key: 'fetal', label: '胎動紀錄', type: 'text', hint: '例如：晚上 9 點後明顯，約 10 次／小時' },
      { key: 'pregSymptoms', label: '孕期症狀', type: 'multi', options: PREG_SYMPTOMS },
    ] as Field[] : []),
    { key: 'text', label: '自由文字', type: 'textarea' },
    { key: 'photos', label: '照片', type: 'images' },
  ];
  const open = () => {
    const t = rows.find(r => r.date === today);
    if (t) return ed.edit(t.id);
    const sl = sleep.find(x => x.date === today);
    ed.add({ date: today, sleep: sl?.hours != null ? `${sl.hours} 小時${sl.quality ? '，品質 ' + sl.quality + '/5' : ''}` : undefined });
  };
  const from = range === '最近 7 天' ? shift(today, -6) : range === '最近 30 天' ? shift(today, -29) : '';
  const list = rows.filter(r => !from || r.date >= from);
  return (
    <div>
      <PageHeader en="Journal" zh="每日日記" sub="今天的心情、身體與一點點小事。" action={<button className="btn-primary" onClick={open}><Plus size={16} />今天</button>} />
      <Chips value={range} onChange={setRange} items={['全部', '最近 7 天', '最近 30 天']} />
      {list.length ? list.map(j => {
        const p = preg ? pregnancy(s.lmp, s.edd, j.date) : null;
        const tags = [...(j.discomfort || []), ...(j.pregSymptoms || [])];
        return (
          <article key={j.id} className="grid grid-cols-[64px_1fr] md:grid-cols-[120px_1fr] gap-4 md:gap-8 py-6 border-b border-line">
            <button onClick={() => ed.edit(j.id)} className="text-left self-start">
              <div className="display text-[40px] md:text-[52px] leading-none text-forest">{+j.date.slice(8)}</div>
              <div className="num text-[11px] text-mute mt-1 tracking-wider">{j.date.slice(0, 7).replace('-', '.')}</div>
              {p && <div className="text-[11px] text-mute mt-1">{p.weeks}w{p.dayOfWeek}d</div>}
            </button>
            <div className="min-w-0">
              <button onClick={() => ed.edit(j.id)} className="text-left w-full">
                <div className="flex flex-wrap items-center gap-2"><span className="serif text-[16px]">{mdw(j.date)}</span>{j.mood && <Badge tone="rose">{j.mood}</Badge>}</div>
                {j.text && <p className="text-[14.5px] leading-[1.85] mt-2 whitespace-pre-wrap line-clamp-6">{j.text}</p>}
                <p className="text-[12.5px] text-mute mt-2">{[j.body, j.sleep && '睡眠：' + j.sleep, j.appetite && '食慾' + j.appetite, j.vomit != null && '孕吐 ' + j.vomit + ' 次', j.nausea != null && '噁心 ' + j.nausea + '/5', j.appetiteChange, j.fetal && '胎動：' + j.fetal].filter(Boolean).join('・')}</p>
                {tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{tags.map(t => <Badge key={t} tone="line">{t}</Badge>)}</div>}
              </button>
              {j.photos?.length ? <div className="mt-3"><FileList ids={j.photos} /></div> : null}
            </div>
          </article>
        );
      }) : <Empty title="還沒有日記" hint={preg ? '懷孕階段會多出孕吐、噁心程度、胎動和孕期症狀。' : '寫下今天的心情和身體狀況，之後回頭看會很有意思。'} action={<button className="btn-primary" onClick={open}>寫今天的日記</button>} />}
      <EntityForm table="journal" title="日記" fields={fields} {...ed} onClose={ed.close} />
    </div>
  );
}
