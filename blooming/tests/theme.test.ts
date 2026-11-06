import { describe, expect, it } from 'vitest';
import { resolveTheme, THEMES, THEME_IDS } from '../src/lib/theme';

describe('themes', () => {
  it('has five themes with complete palettes', () => {
    expect(THEME_IDS).toEqual(['forest', 'rose', 'mist', 'cream', 'night']);
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
