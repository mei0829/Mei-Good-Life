import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export const iso = (d: Date) => format(d, 'yyyy-MM-dd');
export const today = () => iso(new Date());
export const parse = (s: string) => parseISO(s);
export const shift = (s: string, n: number) => iso(addDays(parseISO(s), n));
export const daysBetween = (a: string, b: string) => differenceInCalendarDays(parseISO(b), parseISO(a));
const WD = '日一二三四五六';
export const md = (s?: string) => (s ? `${+s.slice(5, 7)}/${+s.slice(8, 10)}` : '');
export const mdw = (s?: string) => (s ? `${md(s)}（${WD[parseISO(s).getDay()]}）` : '');
export const ymd = (s?: string) => (s ? s.replace(/-/g, '.') : '');
export const enDate = (d = new Date()) => format(d, 'EEEE, MMMM d, yyyy');
export const relDay = (s: string, base = today()) => {
  const n = daysBetween(base, s);
  return n === 0 ? '今天' : n === 1 ? '明天' : n === -1 ? '昨天' : n > 0 ? `${n} 天後` : `${-n} 天前`;
};
export const money = (n: number) => (n < 0 ? '-' : '') + 'NT$ ' + Math.round(Math.abs(n)).toLocaleString('en-US');
/** 睡眠時數：跨夜也算得對 */
export function sleepHours(bed?: string, wake?: string): number | undefined {
  if (!bed || !wake) return undefined;
  const [bh, bm] = bed.split(':').map(Number), [wh, wm] = wake.split(':').map(Number);
  if ([bh, bm, wh, wm].some(isNaN)) return undefined;
  let m = wh * 60 + wm - (bh * 60 + bm); if (m <= 0) m += 1440;
  return Math.round(m / 6) / 10;
}
