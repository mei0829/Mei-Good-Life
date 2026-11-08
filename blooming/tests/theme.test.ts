import { describe, expect, it } from 'vitest';
import { CREAM, resolveTheme, THEMES, THEME_IDS } from '../src/lib/theme';

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
  it('has eight cream-based themes with complete palettes', () => {
    expect(THEME_IDS).toEqual(['forest', 'rose', 'mist', 'cream', 'burgundy', 'amber', 'indigo', 'emerald']);
    const keys = Object.keys(THEMES.forest.c).sort();
    for (const id of THEME_IDS) { expect(Object.keys(THEMES[id].c).sort()).toEqual(keys); expect(THEMES[id].chart.length).toBeGreaterThanOrEqual(6); expect(THEMES[id].c.ivory).toBe(CREAM.ivory); }
  });
  it('prefers the site-wide choice, then the saved one, then forest', () => {
    expect(resolveTheme('rose', 'mist')).toBe('rose');
    expect(resolveTheme(undefined, 'mist')).toBe('mist');
    expect(resolveTheme('bogus', undefined)).toBe('forest');
    expect(resolveTheme(undefined, 'night')).toBe('forest');
  });
});
