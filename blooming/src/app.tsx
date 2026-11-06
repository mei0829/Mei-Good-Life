import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSettings } from './data/hooks';
import { DEFAULT_SETTINGS } from './data/repo';
import type { Settings } from './data/types';
import { today } from './lib/dates';

export type Route = 'home' | 'cycle' | 'wellness' | 'medical' | 'lifestyle' | 'finance' | 'journal' | 'settings';
export const ROUTES: Route[] = ['home', 'cycle', 'wellness', 'medical', 'lifestyle', 'finance', 'journal', 'settings'];

interface Ctx { s: Settings; today: string; route: Route; sub: string; go: (r: Route, sub?: string) => void }
const AppCtx = createContext<Ctx>(null!);
export const useApp = () => useContext(AppCtx);

function readHash(): [Route, string] {
  const [r, sub = ''] = location.hash.replace(/^#\/?/, '').split('/');
  return [(ROUTES as string[]).includes(r) ? (r as Route) : 'home', sub];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const s = useSettings();
  const [[route, sub], setR] = useState(readHash);
  const [day, setDay] = useState(today());
  useEffect(() => {
    const h = () => { setR(readHash()); window.scrollTo({ top: 0 }); };
    addEventListener('hashchange', h);
    // 過了午夜，「今天」也要更新
    const t = setInterval(() => setDay(today()), 60_000);
    return () => { removeEventListener('hashchange', h); clearInterval(t); };
  }, []);
  const go = (r: Route, sb = '') => { location.hash = '/' + r + (sb ? '/' + sb : ''); };
  if (!s) return <div className="min-h-screen grid place-items-center text-mute brand text-2xl">Blooming Days</div>;
  return <AppCtx.Provider value={{ s: s || DEFAULT_SETTINGS, today: day, route, sub, go }}>{children}</AppCtx.Provider>;
}

export const STAGE_LABEL = { preconception: '備孕中', pregnant: '懷孕中', postpartum: '產後' } as const;
