import { daysBetween, shift } from './dates';

/** 用末次月經（LMP）算孕週；醫師依超音波調整過的預產期優先 */
export interface PregInfo { lmp: string; edd: string; days: number; weeks: number; dayOfWeek: number; trimester: 1 | 2 | 3; left: number; progress: number; adjusted: boolean }
export function pregnancy(lmp: string | undefined, eddOverride: string | undefined, todayStr: string): PregInfo | null {
  if (!lmp && !eddOverride) return null;
  const edd = eddOverride || shift(lmp!, 280);
  // 有調整過的預產期：孕週以預產期反推
  const base = eddOverride ? shift(eddOverride, -280) : lmp!;
  const days = daysBetween(base, todayStr);
  if (days < 0) return null;
  const weeks = Math.floor(days / 7);
  return {
    lmp: base, edd, days, weeks, dayOfWeek: days % 7,
    trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3,
    left: daysBetween(todayStr, edd), progress: Math.min(1, days / 280), adjusted: !!eddOverride
  };
}
export const weekLabel = (p: PregInfo) => `${p.weeks} 週 ${p.dayOfWeek} 天`;
/** 孕週短寫：18 週 2 天 */
export const weekOf = (p: PregInfo) => `${p.weeks} 週 ${p.dayOfWeek} 天`;
export const TRI = { 1: '第一孕期', 2: '第二孕期', 3: '第三孕期' } as const;
