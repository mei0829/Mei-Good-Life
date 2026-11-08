// ---------- 顏色主題 ----------
// 所有顏色都在這裡；切換主題時把這些值寫進 CSS 變數，畫面（含圖表）就會一起換色。
export type ThemeId = 'forest' | 'rose' | 'mist' | 'cream' | 'burgundy' | 'amber' | 'indigo' | 'emerald';
export interface Palette {
  ivory: string; paper: string; forest: string; 'forest-deep': string; sage: string; 'sage-soft': string;
  oat: string; 'oat-soft': string; rose: string; 'rose-soft': string; ink: string; mute: string; line: string;
  alert: string; 'rose-ink': string; 'oat-ink': string;
}
export interface Theme { name: string; desc: string; dark?: boolean; c: Palette; chart: string[] }

const RAW: Record<ThemeId, Theme> = {
  forest: {
    name: '森林綠', desc: '日系森林與莫蘭迪色，沉穩安靜',
    c: { ivory: '#F5F1E9', paper: '#FFFCF7', forest: '#455C4A', 'forest-deep': '#34463A', sage: '#A8B5A0', 'sage-soft': '#E4E8DF', oat: '#D6C6AE', 'oat-soft': '#EDE5D8', rose: '#D8B7B0', 'rose-soft': '#F1E4E0', ink: '#343B34', mute: '#7D796E', line: '#E6E0D5', alert: '#A65B4F', 'rose-ink': '#8A5B53', 'oat-ink': '#7A6648' },
    chart: ['#455C4A', '#A8B5A0', '#D6C6AE', '#D8B7B0', '#7E8F78', '#B9A58A', '#C49A92', '#5F7565', '#CBBFA9'],
  },
  rose: {
    name: '玫瑰奶茶', desc: '乾燥玫瑰與奶茶色，溫柔有女人味',
    c: { ivory: '#F7F0EC', paper: '#FFFBF8', forest: '#8E5F58', 'forest-deep': '#74483F', sage: '#C9A79F', 'sage-soft': '#F1E2DD', oat: '#DCC5B5', 'oat-soft': '#F0E4DA', rose: '#C48F86', 'rose-soft': '#F5E3DF', ink: '#3E3433', mute: '#8A7B77', line: '#EADCD5', alert: '#A04E44', 'rose-ink': '#8A4F47', 'oat-ink': '#7C6250' },
    chart: ['#8E5F58', '#C9A79F', '#DCC5B5', '#C48F86', '#A9837B', '#E3CFC2', '#B97A70', '#74483F', '#D9BFB4'],
  },
  mist: {
    name: '霧藍', desc: '霧面藍灰，清爽冷靜',
    c: { ivory: '#F1F3F2', paper: '#FBFCFB', forest: '#4C6577', 'forest-deep': '#3B5161', sage: '#A3B8C4', 'sage-soft': '#E2EAEE', oat: '#CFC6B8', 'oat-soft': '#ECE8E1', rose: '#D3B4AE', 'rose-soft': '#F2E5E2', ink: '#2F3A40', mute: '#7D8790', line: '#DEE3E5', alert: '#A65B4F', 'rose-ink': '#86574F', 'oat-ink': '#6E6455' },
    chart: ['#4C6577', '#A3B8C4', '#CFC6B8', '#D3B4AE', '#7B93A3', '#B8AE9C', '#C49A92', '#3B5161', '#C9D4DA'],
  },
  cream: {
    name: '焦糖', desc: '奶油黃與焦糖色，溫暖柔和',
    c: { ivory: '#FBF6EA', paper: '#FFFDF7', forest: '#8A6A3B', 'forest-deep': '#6F532C', sage: '#B7C2A0', 'sage-soft': '#EDF0E2', oat: '#F0C978', 'oat-soft': '#F8EBCB', rose: '#E7B9A6', 'rose-soft': '#F8E6DD', ink: '#3F3A31', mute: '#8C8270', line: '#EDE4CF', alert: '#A65B4F', 'rose-ink': '#8E5844', 'oat-ink': '#7D6230' },
    chart: ['#8A6A3B', '#B7C2A0', '#F0C978', '#E7B9A6', '#A78A5C', '#D9C08F', '#C9967F', '#6F532C', '#E5D6B0'],
  },
  burgundy: {
    name: '酒紅', desc: '深勃艮第紅配奶茶米色，優雅成熟',
    c: { ivory: '#F6EFEA', paper: '#FFFBF8', forest: '#7A2E35', 'forest-deep': '#5E2229', sage: '#C98F8A', 'sage-soft': '#F2E1DE', oat: '#E2C9A8', 'oat-soft': '#F2E7D6', rose: '#B85C5C', 'rose-soft': '#F4E0DD', ink: '#3A2A2B', mute: '#8A7672', line: '#EADCD6', alert: '#A23B32', 'rose-ink': '#8C3A3A', 'oat-ink': '#7A5F3A' },
    chart: ['#7A2E35', '#C98F8A', '#E2C9A8', '#B85C5C', '#9E5A55', '#D8B48C', '#5E2229', '#E7C3BC', '#A6786A'],
  },
  amber: {
    name: '琥珀金', desc: '溫暖低調的金色，像午後陽光',
    c: { ivory: '#F8F3E6', paper: '#FFFCF4', forest: '#8C5F0F', 'forest-deep': '#6E4A0A', sage: '#D9B65E', 'sage-soft': '#F3EAD0', oat: '#E8D3A6', 'oat-soft': '#F4EBD7', rose: '#D9A17E', 'rose-soft': '#F6E5DA', ink: '#3B3426', mute: '#857A64', line: '#EBE1C9', alert: '#A5492F', 'rose-ink': '#8E5434', 'oat-ink': '#7A5B1C' },
    chart: ['#8C5F0F', '#D9B65E', '#E8D3A6', '#D9A17E', '#B08636', '#C9A86A', '#6E4A0A', '#EFDDB0', '#A88A5E'],
  },
  indigo: {
    name: '靛藍', desc: '深靛藍配霧灰，沉穩有質感',
    c: { ivory: '#F2F3F6', paper: '#FCFCFD', forest: '#253C66', 'forest-deep': '#1A2C4D', sage: '#8DA2C4', 'sage-soft': '#E1E7F1', oat: '#D6CFC0', 'oat-soft': '#ECE8E0', rose: '#C9A9A6', 'rose-soft': '#F1E5E3', ink: '#222A38', mute: '#747C8C', line: '#DDE1E8', alert: '#A4483C', 'rose-ink': '#7E4E48', 'oat-ink': '#6B5F48' },
    chart: ['#253C66', '#8DA2C4', '#D6CFC0', '#C9A9A6', '#5B7299', '#B7AE98', '#3E5A8C', '#C7D2E4', '#9C8F7C'],
  },
  emerald: {
    name: '祖母綠', desc: '寶石般的深綠，比森林綠更鮮明',
    c: { ivory: '#F1F4F0', paper: '#FBFCFA', forest: '#1F5C4A', 'forest-deep': '#154536', sage: '#7FAF98', 'sage-soft': '#DEEBE3', oat: '#D8CBB0', 'oat-soft': '#EEE8DA', rose: '#D2A79C', 'rose-soft': '#F3E3DE', ink: '#22312B', mute: '#6F7D75', line: '#DCE3DD', alert: '#A5483A', 'rose-ink': '#84493F', 'oat-ink': '#6E5E3E' },
    chart: ['#1F5C4A', '#7FAF98', '#D8CBB0', '#D2A79C', '#3F7E68', '#B9A983', '#A8CBB8', '#154536', '#C3D9CC'],
  },
};
// 全站統一米白底：每個主題只換主色和點綴色，底色、卡片、文字都一樣
export const CREAM = { ivory: '#F5F1E9', paper: '#FFFCF7', ink: '#3A3631', mute: '#857E73', line: '#E6DFD3' };
export const THEMES = Object.fromEntries(Object.entries(RAW).map(([k, t]) => [k, { ...t, c: { ...t.c, ...CREAM } }])) as Record<ThemeId, Theme>;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const isTheme = (x: unknown): x is ThemeId => typeof x === 'string' && x in THEMES;

/** 全站共用的主色（首頁「風格」選的，存在 localStorage 'mgl-look'） */
export function sharedTheme(): ThemeId | undefined {
  try { const c = JSON.parse(localStorage.getItem('mgl-look') || 'null')?.c; return isTheme(c) ? c : undefined; } catch { return undefined; }
}

/** 實際要用的主題：先看全站共用的選擇，沒有就用這裡設定的，再沒有就森林綠 */
export const resolveTheme = (shared: unknown, theme: unknown): ThemeId =>
  isTheme(shared) ? shared : isTheme(theme) ? theme : 'forest';

/** 把主題寫進 CSS 變數；也記在這支手機，下次打開時不會先閃一下別的顏色 */
export function applyTheme(id: ThemeId) {
  const t = THEMES[id], r = document.documentElement;
  for (const [k, v] of Object.entries(t.c)) r.style.setProperty('--color-' + k, v);
  r.style.setProperty('--noise', t.dark ? 'transparent' : 'rgba(136,132,120,.035)');
  r.style.setProperty('--backdrop', t.dark ? 'rgba(0,0,0,.55)' : 'rgba(52,59,52,.3)');
  r.style.colorScheme = t.dark ? 'dark' : 'light';
  r.dataset.theme = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.c.ivory);
  try { localStorage.setItem('bd-theme', JSON.stringify({ id, c: t.c, dark: !!t.dark })); } catch { /* 無痕模式等情況存不了就算了 */ }
}

// 全站風格（../look.js）放在 window 上的工具
declare global {
  interface Window { MGL_LOOK?: { set: (p: { c?: string; p?: string }) => unknown; open: () => void } }
}
