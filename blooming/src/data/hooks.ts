import { useEffect, useState, useCallback } from 'react';
import { data } from './repo';
import type { Settings, TableName, Tables } from './types';

/** 讀資料，資料有變動就自動重新讀 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const [v, setV] = useState<T>();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  useEffect(() => {
    let alive = true;
    const go = () => run().then(r => { if (alive) setV(r); }).catch(e => console.error(e));
    go();
    const un = data.subscribe(go);
    return () => { alive = false; un(); };
  }, [run]);
  return v;
}
export const useTable = <K extends TableName>(name: K) => useQuery(() => data.table(name).list(), [name]) as Tables[K][] | undefined;
export const useSettings = () => useQuery(() => data.getSettings()) as Settings | undefined;
