import type { ReactNode } from 'react';
import { BookOpen, Flower2, HeartPulse, Home, Leaf, Settings as Gear, Sprout, Wallet, type LucideIcon } from 'lucide-react';
import { useApp, STAGE_LABEL, type Route } from '../app';
import { cx } from './ui';

const NAV: [Route, string, string, LucideIcon][] = [
  ['home', 'Home', '首頁', Home],
  ['cycle', 'Cycle', '生理週期', Flower2],
  ['wellness', 'Wellness', '健康管理', Leaf],
  ['medical', 'Medical', '醫療管理', HeartPulse],
  ['lifestyle', 'Lifestyle', '生活管理', Sprout],
  ['finance', 'Finance', '財務與保險', Wallet],
  ['journal', 'Journal', '每日日記', BookOpen],
];
// 手機底部五個：Wellness、Medical、Lifestyle 合併成 Care
const CARE: Route[] = ['wellness', 'medical', 'lifestyle'];
const MOBILE: [Route, string, LucideIcon][] = [['home', '首頁', Home], ['cycle', '週期', Flower2], ['wellness', '照護', Leaf], ['journal', '日記', BookOpen], ['finance', '財務', Wallet]];

export function Shell({ children }: { children: ReactNode }) {
  const { route, go, s } = useApp();
  return (
    <div className="min-h-screen md:flex">
      {/* 電腦版：左側 Sidebar */}
      <aside className="hidden md:flex md:flex-col w-[240px] lg:w-[260px] shrink-0 sticky top-0 h-screen border-r border-line px-6 py-8">
        <button onClick={() => go('home')} className="text-left">
          <div className="display text-[28px] leading-none text-forest">Blooming<br />Days</div>
          <div className="display italic text-[13px] text-mute mt-2">A Journey of Wellness &amp; Motherhood</div>
        </button>
        <nav className="mt-10 flex-1 space-y-0.5" aria-label="主要功能">
          {NAV.map(([r, en, zh, I]) => (
            <button key={r} onClick={() => go(r)} aria-current={route === r ? 'page' : undefined}
              className={cx('w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-left transition', route === r ? 'bg-paper text-forest border border-line' : 'text-ink/80 hover:bg-paper/60 border border-transparent')}>
              <I size={18} strokeWidth={1.4} />
              <span className="display text-[17px] w-[72px]">{en}</span><span className="text-[12px] text-mute">{zh}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-line pt-4">
          <div className="eyebrow mb-2">Stage</div>
          <div className="serif text-[14px] text-forest">{STAGE_LABEL[s.stage]}</div>
          <button onClick={() => go('settings')} className={cx('mt-4 flex items-center gap-2 text-[13px]', route === 'settings' ? 'text-forest' : 'text-mute')}><Gear size={15} strokeWidth={1.4} />設定與備份</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* 手機版：頂部小標 */}
        <div className="md:hidden sticky top-0 z-30 bg-ivory/90 backdrop-blur pt-safe">
          <div className="flex items-center justify-between px-5 h-12 border-b border-line/70">
            <button onClick={() => go('home')} className="display text-[20px] text-forest">Blooming Days</button>
            <button onClick={() => go('settings')} aria-label="設定與備份" className={cx('p-2 -mr-2', route === 'settings' ? 'text-forest' : 'text-mute')}><Gear size={19} strokeWidth={1.4} /></button>
          </div>
          {CARE.includes(route) && (
            <div className="flex gap-1 px-5 py-2 border-b border-line/70" role="tablist" aria-label="照護">
              {NAV.filter(n => CARE.includes(n[0])).map(([r, en, zh]) => (
                <button key={r} role="tab" aria-selected={route === r} onClick={() => go(r)} className={cx('flex-1 rounded-full py-1.5 text-[13px]', route === r ? 'bg-forest text-paper' : 'text-mute')}>
                  <span className="display text-[15px] mr-1">{en}</span>{zh.slice(0, 2)}
                </button>
              ))}
            </div>
          )}
        </div>
        <main className="px-5 md:px-10 lg:px-14 pt-6 md:pt-10 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-16 max-w-[1080px] fade-in" key={route}>{children}</main>
      </div>

      {/* 手機版：底部固定導覽列 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-line pb-safe" aria-label="主要功能">
        <div className="grid grid-cols-5">
          {MOBILE.map(([r, zh, I]) => {
            const on = r === 'wellness' ? CARE.includes(route) : route === r;
            return (
              <button key={r} onClick={() => go(r)} aria-current={on ? 'page' : undefined} className={cx('flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[11px]', on ? 'text-forest' : 'text-mute')}>
                <I size={21} strokeWidth={on ? 1.7 : 1.3} />{zh}
                <span className={cx('w-1 h-1 rounded-full mt-0.5', on ? 'bg-forest' : 'bg-transparent')} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
