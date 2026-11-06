import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

// ---------- 日期：台灣常見格式（2026 年 11 月 6 日、星期五）----------
export const iso = (d: Date) => format(d, 'yyyy-MM-dd');
export const today = () => iso(new Date());
export const parse = (s: string) => parseISO(s);
export const shift = (s: string, n: number) => iso(addDays(parseISO(s), n));
export const daysBetween = (a: string, b: string) => differenceInCalendarDays(parseISO(b), parseISO(a));
const WD = '日一二三四五六';
/** 星期五 */
export const weekday = (s: string) => '星期' + WD[parseISO(s).getDay()];
/** 11 月 6 日 */
export const md = (s?: string) => (s ? `${+s.slice(5, 7)} 月 ${+s.slice(8, 10)} 日` : '');
/** 11 月 6 日（星期五） */
export const mdw = (s?: string) => (s ? `${md(s)}（${weekday(s)}）` : '');
/** 2026 年 11 月 6 日 */
export const ymd = (s?: string) => (s ? `${+s.slice(0, 4)} 年 ${md(s)}` : '');
/** 2026 年 11 月 */
export const ym = (s?: string) => (s ? `${+s.slice(0, 4)} 年 ${+s.slice(5, 7)} 月` : '');
/** 圖表座標軸用的短格式：11/6 */
export const mdShort = (s?: string) => (s ? `${+s.slice(5, 7)}/${+s.slice(8, 10)}` : '');
/** 2026 年 11 月 6 日 星期五 */
export const fullDate = (s: string) => `${ymd(s)} ${weekday(s)}`;
export const relDay = (s: string, base = today()) => {
  const n = daysBetween(base, s);
  return n === 0 ? '今天' : n === 1 ? '明天' : n === -1 ? '昨天' : n > 0 ? `${n} 天後` : `${-n} 天前`;
};
/** 金額：1,200 元 */
export const money = (n: number) => (n < 0 ? '-' : '') + Math.round(Math.abs(n)).toLocaleString('zh-TW') + ' 元';
/** 睡眠時數：跨夜也算得對 */
export function sleepHours(bed?: string, wake?: string): number | undefined {
  if (!bed || !wake) return undefined;
  const [bh, bm] = bed.split(':').map(Number), [wh, wm] = wake.split(':').map(Number);
  if ([bh, bm, wh, wm].some(isNaN)) return undefined;
  let m = wh * 60 + wm - (bh * 60 + bm); if (m <= 0) m += 1440;
  return Math.round(m / 6) / 10;
}
