// ---------- 顏色主題 ----------
// 所有顏色都在這裡；切換主題時把這些值寫進 CSS 變數，畫面（含圖表）就會一起換色。
export type ThemeId = 'forest' | 'rose' | 'mist' | 'cream' | 'night';
export interface Palette {
  ivory: string; paper: string; forest: string; 'forest-deep': string; sage: string; 'sage-soft': string;
  oat: string; 'oat-soft': string; rose: string; 'rose-soft': string; ink: string; mute: string; line: string;
  alert: string; 'rose-ink': string; 'oat-ink': string;
}
export interface Theme { name: string; desc: string; dark?: boolean; c: Palette; chart: string[] }

export const THEMES: Record<ThemeId, Theme> = {
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
    name: '鴨子奶黃', desc: '奶油黃與焦糖色，跟柯爾鴨最搭',
    c: { ivory: '#FBF6EA', paper: '#FFFDF7', forest: '#8A6A3B', 'forest-deep': '#6F532C', sage: '#B7C2A0', 'sage-soft': '#EDF0E2', oat: '#F0C978', 'oat-soft': '#F8EBCB', rose: '#E7B9A6', 'rose-soft': '#F8E6DD', ink: '#3F3A31', mute: '#8C8270', line: '#EDE4CF', alert: '#A65B4F', 'rose-ink': '#8E5844', 'oat-ink': '#7D6230' },
    chart: ['#8A6A3B', '#B7C2A0', '#F0C978', '#E7B9A6', '#A78A5C', '#D9C08F', '#C9967F', '#6F532C', '#E5D6B0'],
  },
  night: {
    name: '夜間', desc: '深色模式，晚上記錄不刺眼', dark: true,
    c: { ivory: '#1E221F', paper: '#272C28', forest: '#A8C0A6', 'forest-deep': '#C3D6C1', sage: '#6E8470', 'sage-soft': '#2F3A31', oat: '#8C7B60', 'oat-soft': '#3A352B', rose: '#C49A92', 'rose-soft': '#3E2F2D', ink: '#ECE8E0', mute: '#A39E92', line: '#3A403B', alert: '#E59484', 'rose-ink': '#E3B3A9', 'oat-ink': '#D9C39A' },
    chart: ['#A8C0A6', '#6E8470', '#8C7B60', '#C49A92', '#86A08A', '#B3A07E', '#D7AFA7', '#C3D6C1', '#5E6B60'],
  },
};
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const isTheme = (x: unknown): x is ThemeId => typeof x === 'string' && x in THEMES;

/** 實際要用的主題：開了「夜間模式跟著手機」且手機是深色，就用夜間 */
export const resolveTheme = (theme: unknown, auto: boolean | undefined, systemDark: boolean): ThemeId =>
  auto && systemDark ? 'night' : isTheme(theme) ? theme : 'forest';

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
