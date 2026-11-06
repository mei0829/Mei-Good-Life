import { useEffect, useState } from 'react';
import { Check, ExternalLink, Plus } from 'lucide-react';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { data } from '../data/repo';
import { money, ymd } from '../lib/dates';
import { BENEFIT_SEED, BEN_CAT, BEN_STATUS, ITEM_CAT, ITEM_SEED } from '../content/prep';
import { EntityForm, useEditor, type Field } from '../components/form';
import { Badge, Chips, Empty, Figure, Note, PageHeader, Tabs, cx, useToast } from '../components/ui';

type Tab = 'items' | 'benefits';

// 第一次打開時放好預設清單（只放一次；之後刪光也不會再自動放回來）
let seeding = false;
async function seedOnce() {
  if (seeding) return; seeding = true;
  try {
    const s = await data.getSettings();
    if (s.prepSeeded) return;
    if (!(await data.table('items').list()).length) await data.bulkAdd('items', ITEM_SEED);
    if (!(await data.table('benefits').list()).length) await data.bulkAdd('benefits', BENEFIT_SEED);
    await data.saveSettings({ prepSeeded: true });
  } finally { seeding = false; }
}

export default function Prep() {
  const { sub, go, s } = useApp();
  const tab = (sub === 'benefits' ? 'benefits' : 'items') as Tab;
  useEffect(() => { if (!s.prepSeeded) seedOnce(); }, [s.prepSeeded]);
  return (
    <div>
      <PageHeader kicker="幸孕女子・用品與福利" title="寶寶準備" sub="寶寶要用的東西一樣一樣準備，能領的福利也別漏掉。" />
      <Tabs value={tab} onChange={t => go('prep', t)} items={[['items', '嬰兒用品'], ['benefits', '準媽媽福利']]} />
      {tab === 'items' ? <Items /> : <Benefits />}
    </div>
  );
}

const ITEM_FIELDS: Field[] = [
  { key: 'name', label: '品項', type: 'text', required: true },
  { key: 'cat', label: '分類', type: 'select', options: ITEM_CAT, half: true },
  { key: 'qty', label: '數量', type: 'text', half: true, hint: '例如：6 件' },
  { key: 'budget', label: '預算', type: 'number', unit: '元', half: true, min: 0 },
  { key: 'price', label: '實際花費', type: 'number', unit: '元', half: true, min: 0, hint: '買了再填' },
  { key: 'done', label: '已經準備好', type: 'check' },
  { key: 'src', label: '哪裡買／誰送的', type: 'text' },
  { key: 'note', label: '備註', type: 'textarea', hint: '品牌、尺寸、比價心得' },
];

function Items() {
  const rows = (useTable('items') || []).sort((a, b) => a.createdAt - b.createdAt);
  const ed = useEditor();
  const toast = useToast();
  const [f, setF] = useState('全部');
  const done = rows.filter(r => r.done).length;
  const spent = rows.reduce((a, r) => a + (r.price || 0), 0);
  const left = rows.filter(r => !r.done).reduce((a, r) => a + (r.budget || 0), 0);
  const cats = [...ITEM_CAT.filter(c => rows.some(r => r.cat === c)), ...[...new Set(rows.map(r => r.cat || '其他'))].filter(c => !ITEM_CAT.includes(c))];
  const list = rows.filter(r => f === '全部' || (f === '還沒準備' && !r.done) || (f === '已準備' && r.done) || (r.cat || '其他') === f);
  const toggle = async (id: string, v: boolean, name: string) => { await data.table('items').update(id, { done: v }); toast(v ? `「${name}」準備好了` : `「${name}」改成還沒準備`); };
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 flex-1">
          <Figure value={`${done} / ${rows.length}`} label="已準備" tone="forest" />
          <Figure value={money(spent)} label="已花費" />
          <Figure value={money(left)} label="還沒準備的預算" />
        </div>
        <button className="btn-primary self-end" onClick={() => ed.add({ cat: ITEM_CAT.includes(f) ? f : '哺餵' })}><Plus size={16} />新增</button>
      </div>
      {rows.length > 0 && <div className="h-1.5 rounded-full bg-line mb-6 overflow-hidden"><div className="h-full bg-sage rounded-full transition-all" style={{ width: (rows.length ? done / rows.length * 100 : 0) + '%' }} /></div>}
      <Chips value={f} onChange={setF} items={['全部', '還沒準備', '已準備', ...cats]} />
      {list.length ? (
        <div className="grid md:grid-cols-2 gap-x-10">
          {cats.filter(c => list.some(r => (r.cat || '其他') === c)).map(c => {
            const g = list.filter(r => (r.cat || '其他') === c);
            return (
              <section key={c} className="mb-6">
                <h3 className="serif text-[16px] text-forest border-b border-line pb-1.5 mb-1 flex justify-between">{c}<span className="text-[12.5px] text-mute">{g.filter(r => r.done).length} / {g.length}</span></h3>
                {g.map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                    <button onClick={() => toggle(r.id, !r.done, r.name)} aria-pressed={!!r.done} aria-label={(r.done ? '改成還沒準備：' : '準備好了：') + r.name}
                      className={cx('w-7 h-7 rounded-full border grid place-items-center shrink-0 transition', r.done ? 'bg-forest border-forest text-paper' : 'border-oat text-transparent')}><Check size={15} strokeWidth={2.2} /></button>
                    <button onClick={() => ed.edit(r.id)} className="flex-1 min-w-0 text-left">
                      <div className={cx('text-[15px]', r.done && 'text-mute line-through decoration-line')}>{r.name}{r.qty && <span className="text-[12.5px] text-mute no-underline">・{r.qty}</span>}</div>
                      {(r.src || r.note) && <div className="text-[12px] text-mute truncate">{[r.src, r.note].filter(Boolean).join('・')}</div>}
                    </button>
                    <span className="num text-[13px] shrink-0">{r.price != null ? money(r.price) : r.budget != null ? <span className="text-mute">預算 {money(r.budget)}</span> : ''}</span>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      ) : <Empty title={rows.length ? '這個分類沒有東西' : '清單是空的'} hint="按「新增」加入要準備的東西。" />}
      <EntityForm table="items" title="嬰兒用品" fields={ITEM_FIELDS} {...ed} onClose={ed.close} />
    </>
  );
}

const BEN_FIELDS: Field[] = [
  { key: 'name', label: '福利名稱', type: 'text', required: true },
  { key: 'cat', label: '階段', type: 'select', options: BEN_CAT, half: true },
  { key: 'status', label: '狀態', type: 'select', options: BEN_STATUS, half: true },
  { key: 'amount', label: '領到的金額', type: 'number', unit: '元', half: true, min: 0 },
  { key: 'date', label: '申請／領取日期', type: 'date', half: true },
  { key: 'deadline', label: '申請期限', type: 'date', half: true, hint: '會出現在行事曆' },
  { key: 'where', label: '去哪裡申請', type: 'text' },
  { key: 'url', label: '相關網站', type: 'url', hint: '從瀏覽器網址列複製貼上' },
  { key: 'note', label: '怎麼申請、要準備什麼', type: 'textarea' },
];
const ST_TONE = { 已領取: 'sage', 已申請: 'oat', 還沒申請: 'line', 不適用: 'line' } as const;

function Benefits() {
  const rows = (useTable('benefits') || []).sort((a, b) => a.createdAt - b.createdAt);
  const ed = useEditor();
  const [f, setF] = useState('全部');
  const got = rows.filter(r => r.status === '已領取');
  const sum = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const cats = [...BEN_CAT.filter(c => rows.some(r => r.cat === c)), ...[...new Set(rows.map(r => r.cat || '其他'))].filter(c => !BEN_CAT.includes(c))];
  const list = rows.filter(r => f === '全部' || (r.cat || '其他') === f || (r.status || '還沒申請') === f);
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 flex-1">
          <Figure value={got.length} unit="項" label="已領取" tone="forest" />
          <Figure value={rows.filter(r => r.status === '已申請').length} unit="項" label="申請中" />
          <Figure value={money(sum)} label="領到的金額" />
        </div>
        <button className="btn-primary self-end" onClick={() => ed.add({ cat: BEN_CAT.includes(f) ? f : '孕期', status: '還沒申請' })}><Plus size={16} />新增</button>
      </div>
      <div className="mb-6"><Note tone="oat">這裡是常見的台灣準媽媽福利，金額和資格每年會調整。申請前請到衛生福利部、勞動部勞工保險局或戶籍地區公所確認最新規定。</Note></div>
      <Chips value={f} onChange={setF} items={['全部', ...cats, ...BEN_STATUS.filter(st => rows.some(r => (r.status || '還沒申請') === st))]} />
      {list.length ? cats.filter(c => list.some(r => (r.cat || '其他') === c)).map(c => (
        <section key={c} className="mb-7">
          <h3 className="serif text-[16px] text-forest border-b border-line pb-1.5 mb-1">{c}</h3>
          {list.filter(r => (r.cat || '其他') === c).map(r => {
            const st = (r.status || '還沒申請') as keyof typeof ST_TONE;
            return (
              <div key={r.id} className={cx('border-b border-line last:border-0', st === '不適用' && 'opacity-55')}>
              <button onClick={() => ed.edit(r.id)} className="w-full text-left py-3">
                <div className="flex justify-between gap-3 items-start">
                  <span className="text-[15px]">{r.name}</span>
                  <Badge tone={ST_TONE[st] || 'line'}>{st}</Badge>
                </div>
                {(r.amount != null || r.date) && <div className="text-[12.5px] text-forest mt-0.5">{[r.date && ymd(r.date), r.amount != null && money(r.amount)].filter(Boolean).join('・')}</div>}
                {r.deadline && st !== '已領取' && st !== '不適用' && <div className="text-[12.5px] text-oat-ink mt-0.5">申請期限 {ymd(r.deadline)}</div>}
                {r.where && st !== '不適用' && <div className="text-[12.5px] text-mute mt-0.5">📍 {r.where}</div>}
                {r.note && st !== '已領取' && st !== '不適用' && <p className="text-[12.5px] text-mute mt-1 leading-relaxed">{r.note}</p>}
              </button>
              {r.url && st !== '不適用' && <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-forest -mt-1.5 mb-3">相關網站<ExternalLink size={13} /></a>}
              </div>
            );
          })}
        </section>
      )) : <Empty title={rows.length ? '沒有符合的福利' : '清單是空的'} hint="按「新增」加入想申請的福利。" />}
      <EntityForm table="benefits" title="福利" fields={BEN_FIELDS} {...ed} onClose={ed.close} footnote="金額與資格以政府最新公告為準。" />
    </>
  );
}
