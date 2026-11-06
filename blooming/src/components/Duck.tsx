import { useId } from 'react';

/*
 * 柔和插畫風的柯爾鴨：沒有外框線，用漸層做出蓬鬆的立體感。
 * adult = 白色柯爾鴨；duckling = 奶茶色小鴨
 */
type Kind = 'adult' | 'duckling';
const PAL = {
  adult: { hi: '#FFFDF8', mid: '#F7F1E6', lo: '#E6D9C4', wing: '#F1E8DA', feather: '#E3D5BF', bill: ['#F7BC52', '#E8952F'], billLine: '#D9822A' },
  duckling: { hi: '#F8E8C9', mid: '#EFD6A8', lo: '#D9B783', wing: '#E8CB97', feather: '#D2AE76', bill: ['#C9AE88', '#A88B66'], billLine: '#94785A' },
};

export function Duck({ kind = 'adult', flip, className = '', title }: { kind?: Kind; flip?: boolean; className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const c = PAL[kind];
  const body = `b${id}`, bill = `k${id}`, shade = `s${id}`;
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <radialGradient id={body} cx="44%" cy="34%" r="70%">
          <stop offset="0" stopColor={c.hi} /><stop offset=".55" stopColor={c.mid} /><stop offset="1" stopColor={c.lo} />
        </radialGradient>
        <linearGradient id={bill} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.bill[0]} /><stop offset="1" stopColor={c.bill[1]} /></linearGradient>
        <radialGradient id={shade} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#7E8F78" stopOpacity=".32" /><stop offset="1" stopColor="#7E8F78" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={flip ? 'translate(120 0) scale(-1 1)' : undefined}>
        {/* 地上的影子 */}
        <ellipse cx="62" cy="106" rx="36" ry="6" fill={`url(#${shade})`} />
        {/* 腳 */}
        <g fill="#F2A23F">
          <path d="M52 96 l-1 7 l-7 3.5 q6 1 9-.5 q3 1.5 8 .5 l-6-3.5 l-.5-7z" />
          <path d="M70 96 l0 7 l-6 3.5 q6 1 9-.5 q3 1.5 8 .5 l-6.5-3.5 l-.5-7z" />
        </g>
        {/* 身體、尾巴、脖子、頭：同一個漸層，看起來是一整隻 */}
        <g fill={`url(#${body})`}>
          <path d="M84 70 Q101 54 103 64 Q104 78 88 88Z" />
          <ellipse cx="62" cy="78" rx="30" ry="23" />
          <path d="M34 50 Q35 70 46 78 L68 70 Q58 58 58 44Z" />
          <circle cx="45" cy="40" r="17.5" />
        </g>
        {/* 翅膀與羽毛 */}
        <path d="M58 70 Q74 60 90 70 Q86 86 66 90 Q54 86 58 70Z" fill={c.wing} />
        <g fill="none" stroke={c.feather} strokeWidth="1.3" strokeLinecap="round" opacity=".9">
          <path d="M66 76 q8-3 15 1" /><path d="M64 82 q8-2 14 1.5" /><path d="M70 87 q5-1 9 0" />
          <path d="M40 66 q3 2 6 1" /><path d="M43 72 q3 2 6 1" />
        </g>
        {/* 頭頂一點蓬鬆的毛 */}
        <path d="M43 23 q2-5 7-3" fill="none" stroke={c.feather} strokeWidth="1.6" strokeLinecap="round" />
        {/* 嘴巴 */}
        <path d="M31 41 Q19 41 15 46 Q15 50 21 51 Q28 52 33 49 Q36 45 31 41Z" fill={`url(#${bill})`} />
        <path d="M17 47.5 Q24 48.5 32 46.5" fill="none" stroke={c.billLine} strokeWidth=".9" strokeLinecap="round" opacity=".8" />
        <circle cx="23" cy="44.3" r=".9" fill={c.billLine} />
        {/* 眼睛 */}
        <circle cx="41" cy="36" r="2.7" fill="#2E2622" /><circle cx="41.9" cy="35.1" r=".85" fill="#fff" />
        {/* 臉頰 */}
        <ellipse cx="46" cy="45" rx="4" ry="2.4" fill="#F1C9BE" opacity=".45" />
      </g>
    </svg>
  );
}

/** 一大一小兩隻鴨子，用在空白狀態等地方 */
export function DuckPair({ className = '' }: { className?: string }) {
  return (
    <div className={'relative ' + className} aria-hidden="true">
      <Duck className="absolute left-0 bottom-0 w-[66%] h-auto" />
      <Duck kind="duckling" flip className="absolute right-0 bottom-0 w-[44%] h-auto" />
    </div>
  );
}
