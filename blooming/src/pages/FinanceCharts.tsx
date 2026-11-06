import { addMonths, format } from 'date-fns';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../app';
import { useTable } from '../data/hooks';
import { money, parse } from '../lib/dates';
import { Empty, Figure, Section } from '../components/ui';

// 費用圖表：花費分布、累積支出、檢查費用（補助與自付）、支出與補助對照
/** 圖例自己畫（中文、沒有多餘的英文標籤） */
const legend = (C: { ink: string }) => ({ payload }: any) => (
  <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] mt-2" style={{ color: C.ink }}>
    {(payload || []).map((p: any) => <li key={p.value} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />{p.value}</li>)}
  </ul>
);
const short = (v: number) => (v >= 10000 ? +(v / 10000).toFixed(1) + ' 萬' : v >= 1000 ? +(v / 1000).toFixed(1) + ' 千' : String(v));

export function FinanceCharts() {
  const { today, theme, s } = useApp();
  const C = theme.c;
  const exp = useTable('expenses') || [], plans = useTable('plans') || [], bens = useTable('benefits') || [], items = useTable('items') || [];
  const tt = { contentStyle: { borderRadius: 12, border: '1px solid ' + C.line, background: C.paper, color: C.ink, fontSize: 12 }, itemStyle: { color: C.ink } };
  const ax = { tick: { fontSize: 11, fill: C.mute }, tickLine: false };

  const total = exp.reduce((a, r) => a + r.amount, 0);
  const months = [...new Set(exp.map(r => r.date.slice(0, 7)))];
  const perMonth = months.length ? total / months.length : 0;
  const inStage = plans.filter(p => p.status !== '不需要' && (p.stage === 'preg') === (s.stage === 'pregnant'));
  const planEst = inStage.reduce((a, p) => a + Math.max(0, (p.cost || 0) - (p.subsidyAmt || 0)), 0);
  const gotBen = bens.reduce((a, b) => a + (b.amount || 0), 0) + plans.reduce((a, p) => a + (p.status === '已完成' ? p.subsidyAmt || 0 : 0), 0);

  // 1. 類別分布（全部時間）
  const byCat = Object.entries(exp.reduce<Record<string, number>>((m, r) => ({ ...m, [r.category]: (m[r.category] || 0) + r.amount }), {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  // 2. 累積支出（最近 12 個月）
  let acc = exp.filter(r => r.date < format(addMonths(parse(today.slice(0, 7) + '-01'), -11), 'yyyy-MM-dd')).reduce((a, r) => a + r.amount, 0);
  const cum = Array.from({ length: 12 }, (_, i) => {
    const m = format(addMonths(parse(today.slice(0, 7) + '-01'), i - 11), 'yyyy-MM');
    const v = exp.filter(r => r.date.startsWith(m)).reduce((a, r) => a + r.amount, 0); acc += v;
    return { m: +m.slice(5) + '月', 當月: v, 累積: acc };
  });
  // 3. 檢查費用：依階段（孕期）分組，補助與自付
  const group = (p: (typeof plans)[number]) => p.stage === 'pre' ? '備孕' : p.weekFrom == null ? '其他' : p.weekFrom < 14 ? '第一孕期' : p.weekFrom < 28 ? '第二孕期' : '第三孕期';
  const groups = ['備孕', '第一孕期', '第二孕期', '第三孕期', '其他'];
  const planBars = groups.map(g => {
    const ps = plans.filter(p => p.status !== '不需要' && group(p) === g);
    const sub = ps.reduce((a, p) => a + Math.min(p.cost || 0, p.subsidyAmt || 0), 0);
    return { g, 補助: sub, 自付預估: ps.reduce((a, p) => a + (p.cost || 0), 0) - sub, 實際花費: ps.reduce((a, p) => a + (p.paid || 0), 0) };
  }).filter(x => x.補助 || x.自付預估 || x.實際花費);
  const itemSpent = items.reduce((a, r) => a + (r.price || 0), 0);
  // 4. 支出與補助對照
  // 0 元也畫一小段，才看得到標籤
  const compare = [{ n: '孕期花費', v: total }, { n: '嬰兒用品', v: itemSpent }, { n: '補助與福利', v: gotBen }].map(x => ({ ...x, bar: x.v || Math.max(total, itemSpent, gotBen) * 0.004 }));

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-9">
        <Figure value={money(total)} label="累積支出" tone="forest" />
        <Figure value={money(perMonth)} label="平均每月" />
        <Figure value={money(planEst)} label="檢查預估自付" />
        <Figure value={money(gotBen)} label="已領補助與福利" tone="forest" />
      </div>

      <div className="grid lg:grid-cols-2 gap-x-10">
        <Section title="花費分布">
          {byCat.length ? (
            <div className="h-64" aria-label="花費類別圓環圖">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} isAnimationActive={false} stroke={C.paper}>
                    {byCat.map((_, i) => <Cell key={i} fill={theme.chart[i % theme.chart.length]} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={(v: any, n: any) => [money(v) + `（${Math.round(v / total * 100)}%）`, n]} />
                  <Legend content={legend(C)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty title="還沒有花費" hint="在「孕期花費」記一筆，就會出現圖表。" />}
        </Section>

        <Section title="累積支出">
          {total ? (
            <div className="h-64 -ml-3" aria-label="累積支出面積圖">
              <ResponsiveContainer>
                <ComposedChart data={cum}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="m" {...ax} axisLine={{ stroke: C.line }} />
                  <YAxis {...ax} axisLine={false} width={52} tickFormatter={short} />
                  <Tooltip {...tt} formatter={(v: any, n: any) => [money(v), n]} />
                  <Area type="monotone" dataKey="累積" stroke={C.forest} fill={C.sage} fillOpacity={0.35} strokeWidth={1.8} isAnimationActive={false} />
                  <Bar dataKey="當月" fill={C.oat} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty title="還沒有花費" />}
        </Section>

        <Section title="檢查費用：補助與自付">
          {planBars.length ? (<>
            <div className="h-64 -ml-3" aria-label="檢查費用長條圖">
              <ResponsiveContainer>
                <BarChart data={planBars}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="g" {...ax} axisLine={{ stroke: C.line }} />
                  <YAxis {...ax} axisLine={false} width={52} tickFormatter={short} />
                  <Tooltip {...tt} formatter={(v: any, n: any) => [money(v), n]} />
                  <Legend content={legend(C)} />
                  <Bar dataKey="補助" stackId="a" fill={C.sage} isAnimationActive={false} />
                  <Bar dataKey="自付預估" stackId="a" fill={C.oat} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="實際花費" fill={C.forest} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[12px] text-mute">資料來自「醫療管理 › 檢查規劃」裡填的預估費用、補助金額與實際花費。</p>
          </>) : <Empty title="檢查還沒有填費用" hint="到「醫療管理 › 檢查規劃」幫每個檢查填上預估費用和補助金額，就能看到哪個階段要自付多少。" />}
        </Section>

        <Section title="支出與補助對照">
          {compare.some(x => x.v) ? (
            <div className="h-56 -ml-3" aria-label="支出與補助對照長條圖">
              <ResponsiveContainer>
                <BarChart data={compare} layout="vertical" margin={{ left: 8, right: 84 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="n" width={84} tick={{ fontSize: 12, fill: C.ink }} tickLine={false} axisLine={false} />
                  <Tooltip {...tt} formatter={(_: any, __: any, it: any) => [money(it?.payload?.v ?? 0), '金額']} />
                  <Bar dataKey="bar" radius={[0, 6, 6, 0]} isAnimationActive={false} label={(pr: any) => <text x={pr.x + pr.width + 6} y={pr.y + pr.height / 2} dy={4} fontSize={12} fill={C.ink}>{money(compare[pr.index]?.v ?? 0)}</text>}>
                    {compare.map((x, i) => <Cell key={i} fill={x.n === '補助與福利' ? C.sage : i === 0 ? C.forest : C.oat} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Empty title="還沒有資料" />}
        </Section>
      </div>
    </div>
  );
}
