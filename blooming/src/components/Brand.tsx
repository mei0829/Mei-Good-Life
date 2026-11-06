// 品牌名稱「幸孕女子」：活潑的手寫字體，每個字微微歪一點、高低錯開，像在跳舞
const CHARS: [string, number, number][] = [
  ['幸', -6, 0.04],
  ['孕', 4, -0.08],
  ['女', -3, 0.06],
  ['子', 7, -0.05],
];

export function Brand({ className = '', small }: { className?: string; small?: boolean }) {
  const k = small ? 0.5 : 1; // 小的時候歪得少一點，比較好讀
  return (
    <span className={'brand inline-flex items-baseline ' + className} aria-label="幸孕女子" role="img">
      {CHARS.map(([ch, deg, y], i) => (
        <span key={i} aria-hidden="true" className="inline-block" style={{ transform: `translateY(${y * k}em) rotate(${deg * k}deg)`, marginRight: i < 3 ? '.02em' : 0 }}>{ch}</span>
      ))}
    </span>
  );
}
