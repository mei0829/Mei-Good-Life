import { useId } from 'react';

/*
 * 柔和插畫風的柯爾鴨：沒有外框線，用漸層做出蓬鬆的立體感。
 * 每一頁用不同姿勢的鴨子，一隻一隻出現在各個版面。
 */
export type Pose = 'stand' | 'walk' | 'sit' | 'spread' | 'sleep' | 'lookUp' | 'preen';
export type Kind = 'adult' | 'duckling';
export type Prop = 'leaf' | 'flower' | 'egg' | 'heart';
export interface DuckSpec { pose?: Pose; kind?: Kind; prop?: Prop; flip?: boolean }

const PAL = {
  adult: { hi: '#FFFEFA', mid: '#F8F2E8', lo: '#E3D5BF', wing: '#F2E9DB', feather: '#DCCBB1', bill: ['#F8BE55', '#E8942E'], billLine: '#D47F27' },
  duckling: { hi: '#FAEBCD', mid: '#F0D7AA', lo: '#D6B37F', wing: '#E9CC99', feather: '#CDA971', bill: ['#CBB08A', '#A88B66'], billLine: '#8F7457' },
};

// 每個姿勢的骨架：身體、頭、脖子、嘴巴方向、翅膀、腳
type Geo = {
  body: [number, number, number, number, number]; // cx cy rx ry 旋轉
  tail: string; head: [number, number]; r: number; neck?: [number, number, number, number];
  bill: number; eye: 'open' | 'closed'; wing: 'fold' | 'spread' | 'none'; legs: 'stand' | 'walk' | 'none'; ground: number;
};
const GEO: Record<Pose, Geo> = {
  stand: { body: [64, 78, 29, 21, -8], tail: 'M84 70 Q100 55 103 64 Q104 77 89 87Z', head: [45, 40], r: 17, neck: [46, 46, 57, 70], bill: 0, eye: 'open', wing: 'fold', legs: 'stand', ground: 106 },
  walk: { body: [63, 76, 29, 20, -14], tail: 'M82 64 Q98 48 102 57 Q104 70 88 82Z', head: [40, 41], r: 17, neck: [42, 47, 55, 68], bill: 6, eye: 'open', wing: 'fold', legs: 'walk', ground: 106 },
  sit: { body: [62, 88, 32, 18, -3], tail: 'M86 82 Q102 70 104 78 Q104 90 90 96Z', head: [44, 54], r: 17, neck: [45, 60, 54, 82], bill: 0, eye: 'open', wing: 'fold', legs: 'none', ground: 106 },
  spread: { body: [64, 78, 29, 21, -8], tail: 'M84 70 Q100 55 103 64 Q104 77 89 87Z', head: [42, 38], r: 17, neck: [44, 44, 56, 70], bill: -6, eye: 'open', wing: 'spread', legs: 'stand', ground: 106 },
  sleep: { body: [60, 88, 33, 18, -2], tail: 'M86 82 Q102 72 104 80 Q103 91 90 96Z', head: [50, 74], r: 15.5, bill: 196, eye: 'closed', wing: 'fold', legs: 'none', ground: 106 },
  lookUp: { body: [65, 79, 28, 21, -10], tail: 'M85 71 Q101 56 103 66 Q104 79 89 88Z', head: [47, 34], r: 17, neck: [48, 40, 58, 70], bill: -32, eye: 'open', wing: 'fold', legs: 'stand', ground: 106 },
  preen: { body: [60, 84, 31, 19, -4], tail: 'M84 77 Q100 63 103 72 Q104 85 89 92Z', head: [72, 56], r: 16, neck: [62, 64, 60, 80], bill: 212, eye: 'open', wing: 'fold', legs: 'stand', ground: 106 },
};

export function Duck({ pose = 'stand', kind = 'adult', prop, flip, className = '', title }: DuckSpec & { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const c = PAL[kind], g = GEO[pose];
  const fill = `url(#b${id})`;
  const [bx, by, brx, bry, brot] = g.body;
  const [hx, hy] = g.head;
  // 嘴巴：先畫在原點（朝左），再移到頭的位置並旋轉
  // 嘴巴朝後面時要上下翻轉，不然會顛倒
  const back = Math.abs(g.bill) > 90;
  const billAt = `translate(${hx} ${hy}) rotate(${g.bill})${back ? ' scale(1 -1)' : ''} translate(${-g.r + 3} 4)`;
  const eyeX = hx + (Math.abs(g.bill) > 90 ? 4 : -4), eyeY = hy - (pose === 'sleep' ? 1 : 4);
  return (
    <svg viewBox="0 0 120 120" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} overflow="visible">
      <defs>
        <radialGradient id={`b${id}`} gradientUnits="userSpaceOnUse" cx="50" cy="44" r="72">
          <stop offset="0" stopColor={c.hi} /><stop offset=".5" stopColor={c.mid} /><stop offset="1" stopColor={c.lo} />
        </radialGradient>
        <linearGradient id={`k${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.bill[0]} /><stop offset="1" stopColor={c.bill[1]} /></linearGradient>
        <radialGradient id={`s${id}`}><stop offset="0" stopColor="#7E8F78" stopOpacity=".3" /><stop offset="1" stopColor="#7E8F78" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={flip ? 'translate(120 0) scale(-1 1)' : undefined}>
        <ellipse cx="62" cy={g.ground} rx="38" ry="6" fill={`url(#s${id})`} />
        {prop === 'egg' && <g><ellipse cx="20" cy="95" rx="9.5" ry="12" fill="#EFE0C4" /><ellipse cx="19" cy="94" rx="8.3" ry="10.8" fill="#FAF2E2" /><ellipse cx="16.5" cy="89" rx="2.6" ry="3.6" fill="#fff" opacity=".9" /><circle cx="23" cy="99" r="1" fill="#D9C6A5" /><circle cx="18" cy="101" r=".8" fill="#D9C6A5" /></g>}
        {/* 張開的翅膀在身體後面 */}
        {g.wing === 'spread' && (
          <g fill={c.wing}>
            <path d="M66 66 Q74 30 104 12 Q108 26 100 40 Q110 40 108 50 Q100 60 88 64 Q96 66 92 74 Q80 76 70 74Z" />
            <g fill="none" stroke={c.feather} strokeWidth="1.2" strokeLinecap="round"><path d="M76 58 Q86 40 102 20" /><path d="M80 64 Q92 54 104 44" /><path d="M74 50 Q80 36 92 26" /></g>
          </g>
        )}
        {/* 腳 */}
        {g.legs !== 'none' && (
          <g fill="#F2A23F">
            {g.legs === 'stand' ? <>
              <path d="M54 95 l-1 8 l-7 3.5 q6 1 9-.5 q3 1.5 8 .5 l-6-3.5 l-.5-8z" />
              <path d="M70 95 l0 8 l-6 3.5 q6 1 9-.5 q3 1.5 8 .5 l-6.5-3.5 l-.5-8z" />
            </> : <>
              <path d="M52 92 l-6 10 l-7 2 q5 2 9 .5 q3 1.5 7 0 l-5-2.5 l5-9.5z" />
              <path d="M70 93 l6 7 l-3 5 q5 0 8-2 q2 2 6 1 l-6-4 l-6-8z" />
            </>}
          </g>
        )}
        {/* 身體、尾巴、脖子、頭：同一個漸層，看起來是一整隻 */}
        <g fill={fill}>
          <path d={g.tail} />
          <ellipse cx={bx} cy={by} rx={brx} ry={bry} transform={`rotate(${brot} ${bx} ${by})`} />
          {g.neck && <path d={`M${g.neck[0]} ${g.neck[1]} L${g.neck[2]} ${g.neck[3]}`} stroke={fill} strokeWidth="21" strokeLinecap="round" />}
          <circle cx={hx} cy={hy} r={g.r} />
        </g>
        {/* 收起來的翅膀 */}
        {g.wing === 'fold' && (
          <g transform={`rotate(${brot} ${bx} ${by})`}>
            <path d={`M${bx - 6} ${by - 7} Q${bx + 10} ${by - 17} ${bx + 26} ${by - 6} Q${bx + 22} ${by + 9} ${bx + 2} ${by + 12} Q${bx - 10} ${by + 7} ${bx - 6} ${by - 7}Z`} fill={c.wing} />
            <g fill="none" stroke={c.feather} strokeWidth="1.2" strokeLinecap="round"><path d={`M${bx + 2} ${by - 2} q8 -3 16 1`} /><path d={`M${bx} ${by + 4} q8 -2 15 2`} /><path d={`M${bx + 6} ${by + 9} q5 -1 9 0`} /></g>
          </g>
        )}
        {/* 胸口的蓬鬆毛 */}
        {pose !== 'sleep' && pose !== 'preen' && <g fill="none" stroke={c.feather} strokeWidth="1.1" strokeLinecap="round" opacity=".8"><path d={`M${bx - brx + 8} ${by - 6} q3 2 6 1`} /><path d={`M${bx - brx + 10} ${by} q3 2 6 1`} /></g>}
        {/* 頭頂的毛 */}
        <path d={`M${hx - 2} ${hy - g.r + 1} q2 -5 7 -3`} fill="none" stroke={c.feather} strokeWidth="1.5" strokeLinecap="round" />
        {/* 嘴巴 */}
        <g transform={billAt}>
          <path d="M4 -5 Q-5 -7 -12 -3 Q-16 1 -13 4.5 Q-5 8 5 4 Q7.5 -1 4 -5Z" fill={`url(#k${id})`} />
          <path d="M-12 1.5 Q-4 2.6 4 1" fill="none" stroke={c.billLine} strokeWidth=".9" strokeLinecap="round" opacity=".8" />
          <circle cx="-6" cy="-1.8" r=".85" fill={c.billLine} />
        </g>
        {/* 眼睛 */}
        {g.eye === 'open'
          ? <g><circle cx={eyeX} cy={eyeY} r="2.6" fill="#2E2622" /><circle cx={eyeX + .9} cy={eyeY - .9} r=".85" fill="#fff" /></g>
          : <path d={`M${eyeX - 3} ${eyeY + 1} q3 2.5 6 0`} fill="none" stroke="#2E2622" strokeWidth="1.3" strokeLinecap="round" />}
        <ellipse cx={hx + (Math.abs(g.bill) > 90 ? 5 : 1)} cy={hy + 5} rx="3.8" ry="2.3" fill="#F1C2B6" opacity=".45" />
        {/* 小道具 */}
        {prop === 'leaf' && <g transform="translate(20 92) rotate(-30)"><path d="M0 0 Q8 -12 20 -10 Q16 2 0 0Z" fill="#A8B5A0" /><path d="M0 0 Q10 -6 18 -9" stroke="#7E8F78" strokeWidth=".8" fill="none" /></g>}
        {prop === 'flower' && <g transform="translate(20 96)">{[0, 72, 144, 216, 288].map(a => <ellipse key={a} rx="3.2" ry="5.5" cy="-5" fill="#FFFCF7" transform={`rotate(${a})`} />)}<circle r="2.4" fill="#F2C46B" /><path d="M0 4 V12" stroke="#A8B5A0" strokeWidth="1.2" /></g>}
        {prop === 'heart' && <path d="M24 30 q-4 -6 -8 -2 q-3 4 8 11 q11 -7 8 -11 q-4 -4 -8 2Z" fill="#D8B7B0" />}
      </g>
    </svg>
  );
}

/** 一大一小兩隻鴨子 */
export function DuckPair({ className = '', big = { pose: 'stand' }, small = { pose: 'sit', kind: 'duckling' } }: { className?: string; big?: DuckSpec; small?: DuckSpec }) {
  return (
    <div className={'relative ' + className} aria-hidden="true">
      <Duck {...big} className="absolute left-0 bottom-0 w-[64%] h-auto" />
      <Duck {...small} flip={!small.flip} className="absolute right-0 bottom-0 w-[46%] h-auto" />
    </div>
  );
}

/** 每一頁自己的鴨子 */
export const PAGE_DUCK: Record<string, DuckSpec> = {
  cycle: { pose: 'preen', prop: 'flower' },
  wellness: { pose: 'stand', prop: 'leaf' },
  medical: { pose: 'lookUp' },
  lifestyle: { pose: 'walk' },
  finance: { pose: 'sit' },
  journal: { pose: 'sleep' },
  settings: { pose: 'sit', kind: 'duckling' },
  home: { pose: 'spread' },
};
