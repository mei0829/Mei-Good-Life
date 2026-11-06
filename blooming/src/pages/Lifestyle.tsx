import { useState } from 'react';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import { ACTIVITIES, ACT_CATS, type Activity } from '../content/activities';
import { EntityForm, useEditor } from '../components/form';
import { Badge, Chips, DateCell, Empty, Note, PageHeader, Row, Section, cx } from '../components/ui';
import { EX_FIELDS } from './Wellness';

export default function Lifestyle() {
  const { s, today } = useApp();
  const preg = s.stage === 'pregnant';
  const ex = (useTable('exercise') || []).filter(e => e.activityId).sort((a, b) => b.date.localeCompare(a.date));
  const ed = useEditor();
  const fav = new Set(s.favorites || []);
  const [cat, setCat] = useState<string>('全部');
  const pool = ACTIVITIES.filter(a => a.stage === 'both' || (preg ? a.stage === 'preg' : a.stage === 'pre'));
  const cats = ['全部', '收藏', ...ACT_CATS.filter(c => pool.some(a => a.cat === c))];
  const list = pool.filter(a => cat === '全部' || (cat === '收藏' ? fav.has(a.id) : a.cat === cat));
  const toggleFav = (id: string) => data.saveSettings({ favorites: fav.has(id) ? [...fav].filter(x => x !== id) : [...fav, id] });
  const doneCount = (id: string) => ex.filter(e => e.activityId === id && e.done).length;
  const finish = (a: Activity) => ed.add({ date: today, name: a.title, minutes: a.minutes, intensity: a.intensity, done: true, activityId: a.id });

  return (
    <div>
      <PageHeader kicker="Blooming Days・運動與飲食" title="生活管理" sub={preg ? '孕期適合的活動、伸展與飲食。' : '備孕期的運動、伸展與飲食建議。'} />
      <div className="mb-7"><Note tone="oat">以下為一般性建議，{preg ? '懷孕期間運動前請先跟產檢醫師確認，' : ''}請依個人身體狀況與醫師建議調整。運動中如有出血、腹痛、頭暈、胸痛或呼吸困難，請立即停止並就醫。</Note></div>
      <Chips value={cat} onChange={setCat} items={cats} />
      {list.length ? (
        <div className="grid md:grid-cols-2 gap-x-10">
          {list.map((a, i) => (
            <article key={a.id} className={cx('py-5 border-b border-line', i < 2 && 'md:pt-2')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="eyebrow">{a.cat}{a.minutes ? `・約 ${a.minutes} 分鐘` : ''}</div>
                  <h3 className="serif text-[18px] mt-1">{a.title}</h3>
                </div>
                <button onClick={() => toggleFav(a.id)} aria-pressed={fav.has(a.id)} aria-label={fav.has(a.id) ? '取消收藏' : '收藏'} className="p-1"><Bookmark size={19} strokeWidth={1.4} className={fav.has(a.id) ? 'fill-forest text-forest' : 'text-mute'} /></button>
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink/85 mt-2">{a.desc}</p>
              {a.caution && <p className="text-[12.5px] text-[#8A5B53] mt-2 leading-relaxed">注意：{a.caution}</p>}
              <div className="flex items-center gap-3 mt-3">
                {a.cat !== '健康飲食' && <button className="btn-ghost" onClick={() => finish(a)}><CheckCircle2 size={15} strokeWidth={1.5} />完成一次</button>}
                {a.stage !== 'both' && <Badge tone={a.stage === 'preg' ? 'rose' : 'sage'}>{a.stage === 'preg' ? '孕期' : '備孕'}</Badge>}
                {doneCount(a.id) > 0 && <span className="text-[12px] text-mute">已完成 {doneCount(a.id)} 次</span>}
              </div>
            </article>
          ))}
        </div>
      ) : <Empty title={cat === '收藏' ? '還沒有收藏' : '沒有項目'} hint={cat === '收藏' ? '按右上角的書籤收藏喜歡的運動。' : undefined} />}

      <Section title="運動完成紀錄" className="mt-10">
        {ex.length ? ex.slice(0, 20).map(e => <Row key={e.id} onClick={() => ed.edit(e.id)} left={<DateCell date={e.date} />} title={e.name} meta={[e.minutes && e.minutes + ' 分鐘', e.intensity, e.note].filter(Boolean).join('・')} right={<Badge tone={e.done ? 'sage' : 'line'}>{e.done ? '完成' : '計畫'}</Badge>} />)
          : <Empty title="還沒有完成紀錄" hint="按「完成一次」會記到健康管理的運動紀錄。" />}
      </Section>
      <EntityForm table="exercise" title="運動" fields={EX_FIELDS} {...ed} onClose={ed.close} />
    </div>
  );
}
