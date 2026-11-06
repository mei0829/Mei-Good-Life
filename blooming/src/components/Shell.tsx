import type { ReactNode } from 'react';
import { Baby, BookOpen, Flower2, HeartPulse, Home, Leaf, Settings as Gear, Sprout, Wallet, type LucideIcon } from 'lucide-react';
import { Brand } from './Brand';
import { useApp, STAGE_LABEL, type Route } from '../app';
import { cx } from './ui';

const NAV: [Route, string, string, LucideIcon][] = [
  ['home', '首頁', '今日總覽', Home],
  ['cycle', '月經週期', '日曆與預測', Flower2],
  ['wellness', '健康管理', '身體・營養・睡眠', Leaf],
  ['medical', '醫療管理', '檢查與產檢', HeartPulse],
  ['lifestyle', '生活管理', '運動與飲食', Sprout],
  ['finance', '財務與保險', '花費與保單', Wallet],
  ['prep', '寶寶準備', '用品與福利', Baby],
  ['journal', '每日日記', '心情與身體', BookOpen],
];
// 手機底部五個：Wellness、Medical、Lifestyle 合併成 Care
const CARE: Route[] = ['wellness', 'medical', 'lifestyle'];
// 手機底部的「財務」也包含寶寶準備
const MONEY: Route[] = ['finance', 'prep'];
const MOBILE: [Route, string, LucideIcon][] = [['home', '首頁', Home], ['cycle', '週期', Flower2], ['wellness', '照護', Leaf], ['journal', '日記', BookOpen], ['finance', '財務', Wallet]];

export function Shell({ children }: { children: ReactNode }) {
  const { route, go, s } = useApp();
  return (
    <div className="min-h-screen md:flex">
      {/* 電腦版：左側 Sidebar */}
      <aside className="hidden md:flex md:flex-col w-[240px] lg:w-[260px] shrink-0 sticky top-0 h-screen border-r border-line px-6 py-8">
        <button onClick={() => go('home')} className="text-left">
          <Brand className="text-[30px] text-forest" />
          <div className="serif text-[12.5px] text-mute mt-2.5 leading-relaxed">在成為媽媽之前，<br />先好好照顧自己。</div>
        </button>
        <nav className="mt-10 flex-1 space-y-0.5" aria-label="主要功能">
          {NAV.map(([r, name, hint, I]) => (
            <button key={r} onClick={() => go(r)} aria-current={route === r ? 'page' : undefined}
              className={cx('w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-left transition', route === r ? 'bg-paper text-forest border border-line' : 'text-ink/80 hover:bg-paper/60 border border-transparent')}>
              <I size={18} strokeWidth={1.4} className="shrink-0" />
              <span className="flex flex-col leading-tight"><span className="serif text-[15px]">{name}</span><span className="text-[11px] text-mute mt-0.5">{hint}</span></span>
            </button>
          ))}
        </nav>
        <div className="border-t border-line pt-4">
          <div className="eyebrow mb-2">目前階段</div>
          <div className="serif text-[14px] text-forest">{STAGE_LABEL[s.stage]}</div>
          <button onClick={() => go('settings')} className={cx('mt-4 flex items-center gap-2 text-[13px]', route === 'settings' ? 'text-forest' : 'text-mute')}><Gear size={15} strokeWidth={1.4} />設定與備份</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* 手機版：頂部小標 */}
        <div className="md:hidden sticky top-0 z-30 bg-ivory/90 backdrop-blur pt-safe">
          <div className="flex items-center justify-between px-5 h-12 border-b border-line/70">
            <button onClick={() => go('home')} className="text-[21px] text-forest" aria-label="幸孕女子・回首頁"><Brand small /></button>
            <button onClick={() => go('settings')} aria-label="設定與備份" className={cx('p-2 -mr-2', route === 'settings' ? 'text-forest' : 'text-mute')}><Gear size={19} strokeWidth={1.4} /></button>
          </div>
          {CARE.includes(route) && (
            <div className="flex gap-1 px-5 py-2 border-b border-line/70" role="tablist" aria-label="照護">
              {NAV.filter(n => CARE.includes(n[0])).map(([r, name]) => (
                <button key={r} role="tab" aria-selected={route === r} onClick={() => go(r)} className={cx('flex-1 rounded-full py-1.5 text-[13px]', route === r ? 'bg-forest text-paper' : 'text-mute')}>
                  {name.slice(0, 2)}
                </button>
              ))}
            </div>
          )}
          {MONEY.includes(route) && (
            <div className="flex gap-1 px-5 py-2 border-b border-line/70" role="tablist" aria-label="財務與準備">
              {NAV.filter(n => MONEY.includes(n[0])).map(([r, name]) => (
                <button key={r} role="tab" aria-selected={route === r} onClick={() => go(r)} className={cx('flex-1 rounded-full py-1.5 text-[13px]', route === r ? 'bg-forest text-paper' : 'text-mute')}>
                  {name}
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
            const on = r === 'wellness' ? CARE.includes(route) : r === 'finance' ? MONEY.includes(route) : route === r;
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
