// 植物線條插畫（SVG），取代照片：不用擔心版權，檔案也小
export function HeroArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="植物插畫" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EDE5D8" /><stop offset="1" stopColor="#E4E8DF" /></linearGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .28  0 0 0 0 .24  0 0 0 .06 0" /></filter>
      </defs>
      <rect width="400" height="300" fill="url(#sky)" />
      <circle cx="292" cy="96" r="54" fill="#D8B7B0" opacity=".55" />
      <path d="M0 236 C80 214 150 226 220 240 S340 250 400 232 V300 H0Z" fill="#D6C6AE" opacity=".55" />
      <path d="M0 262 C90 246 180 256 260 266 S360 270 400 262 V300 H0Z" fill="#A8B5A0" opacity=".45" />
      {/* 大葉子 */}
      <g fill="none" stroke="#455C4A" strokeWidth="1.6" strokeLinecap="round">
        <path d="M118 300 C116 240 124 180 150 118" />
        <path d="M150 118 C120 128 98 156 100 192 C128 182 146 154 150 118Z" fill="#455C4A" fillOpacity=".85" />
        <path d="M138 168 C168 156 194 160 214 182 C186 194 158 190 138 168Z" fill="#A8B5A0" />
        <path d="M128 214 C98 204 74 212 58 234 C86 242 112 236 128 214Z" fill="#455C4A" fillOpacity=".7" />
        <path d="M132 246 C160 236 186 242 200 262 C174 270 150 266 132 246Z" fill="#A8B5A0" fillOpacity=".9" />
        <path d="M100 192 L150 118 M138 168 L214 182 M128 214 L58 234 M132 246 L200 262" strokeWidth=".8" stroke="#F5F1E9" opacity=".7" />
      </g>
      {/* 細枝與小花 */}
      <g fill="none" stroke="#455C4A" strokeWidth="1.2" strokeLinecap="round">
        <path d="M262 300 C262 250 270 214 292 176" />
        <path d="M268 240 C252 232 244 220 242 206" /><path d="M276 214 C292 208 300 196 302 182" />
      </g>
      {[[242, 204], [302, 180], [292, 174], [250, 214]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map(a => <ellipse key={a} rx="3.2" ry="6" cy="-6" fill="#FFFCF7" stroke="#D8B7B0" strokeWidth=".8" transform={`rotate(${a})`} />)}
          <circle r="2" fill="#D6C6AE" />
        </g>
      ))}
      <g stroke="#888478" strokeWidth="1" fill="none" opacity=".5"><path d="M330 60 q8 -6 16 0 q8 -6 16 0" /><path d="M346 78 q6 -4 12 0 q6 -4 12 0" /></g>
      <rect width="400" height="300" filter="url(#grain)" />
    </svg>
  );
}

export function Sprig({ className = '', color = '#A8B5A0' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <path d="M10 54 C20 40 30 24 48 8" />
      {[[18, 42, -1], [24, 34, 1], [31, 26, -1], [38, 18, 1]].map(([x, y, s], i) => (
        <path key={i} d={`M${x} ${y} c${6 * s} -2 ${10 * s} -8 ${10 * s} -12 c${-6 * s} 1 ${-10 * s} 6 ${-10 * s} 12Z`} fill={color} fillOpacity=".35" />
      ))}
    </svg>
  );
}

/** 空狀態用的小插圖 */
export function EmptyArt({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="44" r="26" fill="#EDE5D8" />
      <path d="M40 70 V36" stroke="#455C4A" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M40 48 C30 46 24 38 24 30 C34 32 40 38 40 48Z" fill="#A8B5A0" />
      <path d="M40 40 C50 38 56 30 56 22 C46 24 40 30 40 40Z" fill="#455C4A" fillOpacity=".8" />
    </svg>
  );
}
