import { describe, expect, it } from 'vitest';
import { resolveTheme, THEMES, THEME_IDS } from '../src/lib/theme';

const lum = (h: string) => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

describe('themes', () => {
  it('button text is readable on every theme', () => {
    for (const id of THEME_IDS) {
      const c = THEMES[id].c;
      expect(contrast(c.forest, c.paper), id + ' 按鈕').toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.ink, c.ivory), id + ' 內文').toBeGreaterThanOrEqual(7);
    }
  });
  it('has nine themes with complete palettes', () => {
    expect(THEME_IDS).toEqual(['forest', 'rose', 'mist', 'cream', 'burgundy', 'amber', 'indigo', 'emerald', 'night']);
    const keys = Object.keys(THEMES.forest.c).sort();
    for (const id of THEME_IDS) { expect(Object.keys(THEMES[id].c).sort()).toEqual(keys); expect(THEMES[id].chart.length).toBeGreaterThanOrEqual(6); }
  });
  it('resolves the chosen theme, falls back to forest', () => {
    expect(resolveTheme('rose', false, true)).toBe('rose');
    expect(resolveTheme(undefined, false, false)).toBe('forest');
    expect(resolveTheme('bogus', false, false)).toBe('forest');
  });
  it('auto night only when the phone is dark', () => {
    expect(resolveTheme('mist', true, true)).toBe('night');
    expect(resolveTheme('mist', true, false)).toBe('mist');
  });
});
