import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Duck, PAGE_DUCK } from './Duck';
import { useApp } from '../app';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/** 頁面大標題：英文雜誌風標題＋中文副標 */
export function PageHeader({ title, kicker, sub, action }: { title: string; kicker: string; sub?: ReactNode; action?: ReactNode }) {
  const { route } = useApp();
  return (
    <header className="relative mb-6 md:mb-9 pt-2">
      {/* 每一頁有自己的一隻鴨子 */}
      <div className="flex items-end justify-between gap-4">
        <p className="eyebrow pb-1">{kicker}</p>
        <Duck {...PAGE_DUCK[route]} className="w-16 h-16 md:w-24 md:h-24 shrink-0 -mb-1" />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="serif text-[34px] md:text-[44px] leading-tight mt-1.5 text-forest tracking-[.02em]">{title}</h1>
        </div>
        {action}
      </div>
      {sub && <p className="text-[13.5px] text-mute mt-3 max-w-xl leading-relaxed">{sub}</p>}
    </header>
  );
}

/** 區段：細線分隔＋小標題（不是每個都做成卡片） */
export function Section({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('mb-9', className)}>
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 mb-4">
        <h2 className="serif text-[17px] text-forest tracking-[.02em] flex items-center gap-2"><span className="w-4 h-px bg-sage inline-block" aria-hidden="true" />{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: [T, string][] }) {
  return (
    <div className="flex gap-6 border-b border-line mb-7 overflow-x-auto no-scrollbar" role="tablist">
      {items.map(([k, n]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={cx('pb-2.5 -mb-px text-[14.5px] whitespace-nowrap border-b-2 transition', value === k ? 'border-forest text-forest' : 'border-transparent text-mute')}>{n}</button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: T[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
      {items.map(i => <button key={i} className={cx('chip', value === i && 'chip-on')} onClick={() => onChange(i)}>{i}</button>)}
    </div>
  );
}

function EmptyDuck() {
  const { route } = useApp();
  return <Duck {...PAGE_DUCK[route]} className="w-24 h-24 mx-auto mb-2" />;
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <EmptyDuck />
      <p className="serif text-[15px]">{title}</p>
      {hint && <p className="text-[13px] text-mute mt-1 max-w-sm mx-auto leading-relaxed">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** 數字＋說明（雜誌風大數字） */
export function Figure({ value, unit, label, tone = 'ink' }: { value: ReactNode; unit?: string; label: string; tone?: 'ink' | 'forest' | 'rose' | 'mute' }) {
  const c = { ink: 'text-ink', forest: 'text-forest', rose: 'text-[#9C6E66]', mute: 'text-mute' }[tone];
  return (
    <div>
      <div className={cx('num text-[26px] leading-tight', c)}>{value}{unit && <span className="text-[13px] text-mute ml-1">{unit}</span>}</div>
      <div className="text-[12px] text-mute mt-0.5">{label}</div>
    </div>
  );
}

export function Note({ children, tone = 'sage' }: { children: ReactNode; tone?: 'sage' | 'rose' | 'oat' }) {
  const c = { sage: 'bg-sage-soft', rose: 'bg-rose-soft', oat: 'bg-oat-soft' }[tone];
  return <div className={cx('rounded-[14px] px-4 py-3 text-[13px] leading-relaxed text-ink/80', c)}>{children}</div>;
}

export function Badge({ children, tone = 'sage' }: { children: ReactNode; tone?: 'sage' | 'rose' | 'oat' | 'forest' | 'line' }) {
  const c = { sage: 'bg-sage-soft text-forest', rose: 'bg-rose-soft text-[#8A5B53]', oat: 'bg-oat-soft text-[#7A6648]', forest: 'bg-forest text-paper', line: 'border border-line text-mute' }[tone];
  return <span className={cx('tag', c)}>{children}</span>;
}

/** 列表的一列：左邊日期欄，右邊內容（雜誌目錄風） */
export function Row({ left, title, meta, right, onClick, children }: { left?: ReactNode; title: ReactNode; meta?: ReactNode; right?: ReactNode; onClick?: () => void; children?: ReactNode }) {
  return (
    <button onClick={onClick} className="w-full text-left flex gap-4 py-3.5 border-b border-line last:border-0 group">
      {left && <div className="w-14 shrink-0 text-mute">{left}</div>}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3 items-baseline"><div className="text-[15px] group-hover:text-forest transition break-words min-w-0">{title}</div>{right && <div className="shrink-0 num text-[14px]">{right}</div>}</div>
        {meta && <div className="text-[12.5px] text-mute mt-0.5 break-words">{meta}</div>}
        {children}
      </div>
    </button>
  );
}
export function DateCell({ date }: { date: string }) {
  return <div className="leading-none"><div className="display text-[24px] text-ink">{+date.slice(8, 10)}<span className="text-[12px] text-mute ml-0.5">日</span></div><div className="text-[10.5px] mt-1 whitespace-nowrap">{+date.slice(0, 4)} 年 {+date.slice(5, 7)} 月</div></div>;
}

// ---------- 彈出視窗（手機從下面滑上來，電腦在中間）----------
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', k);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.focus(), 30);
    return () => { removeEventListener('keydown', k); document.body.style.overflow = o; };
  }, [open, onClose]);
  if (!open) return null;
  // 用 portal 放到 body 底下，才不會被頁面動畫的圖層蓋住（手機底部導覽列）
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#343B34]/30" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cx('relative bg-ivory w-full max-h-[92vh] overflow-y-auto rounded-t-[24px] md:rounded-[24px] outline-none fade-in', wide ? 'md:max-w-2xl' : 'md:max-w-lg')}>
        <div className="sticky top-0 z-10 bg-ivory/95 backdrop-blur flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
          <h3 className="serif text-[17px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 -mr-1.5 text-mute" aria-label="關閉"><X size={20} strokeWidth={1.5} /></button>
        </div>
        <div className="px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ---------- 提示訊息 ----------
const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('');
  const t = useRef<number>(0);
  const show = useCallback((m: string) => { setMsg(m); clearTimeout(t.current); t.current = window.setTimeout(() => setMsg(''), 2400); }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-[calc(88px+env(safe-area-inset-bottom))] md:bottom-8 z-[60] bg-ink text-paper text-[13.5px] px-4 py-2.5 rounded-full shadow-lg fade-in">{msg}</div>}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** 分數按鈕（例如經痛 0–10、睡眠品質 1–5） */
export function Scale({ value, onChange, min, max, labels }: { value?: number; onChange: (v?: number) => void; min: number; max: number; labels?: [string, string] }) {
  const n = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {n.map(i => <button type="button" key={i} onClick={() => onChange(value === i ? undefined : i)}
          className={cx('w-9 h-9 rounded-full border text-[13px] num transition', value === i ? 'bg-forest border-forest text-paper' : value != null && i < value ? 'bg-sage-soft border-sage-soft' : 'border-line bg-paper')}>{i}</button>)}
      </div>
      {labels && <div className="flex justify-between text-[11px] text-mute mt-1"><span>{labels[0]}</span><span>{labels[1]}</span></div>}
    </div>
  );
}
