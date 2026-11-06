// 每日一句：依日期輪替
export const QUOTES: [string, string][] = [
  ['Bloom where you are planted.', '在此刻的地方，好好綻放。'],
  ['Slow down. Everything you need will come to you.', '慢一點也沒關係，該來的都會來。'],
  ['Taking care of yourself is part of the journey.', '照顧好自己，本來就是這段旅程的一部分。'],
  ['Small steps every day.', '每天一小步，就已經很好。'],
  ['Your body is doing its best. So are you.', '身體正在努力，你也是。'],
  ['Rest is productive, too.', '好好休息，也是一種前進。'],
  ['Let today be gentle.', '讓今天溫柔一點。'],
  ['Trust the timing of your life.', '相信屬於你的時間。'],
  ['Nourish, breathe, bloom.', '吃好、呼吸、慢慢綻放。'],
  ['You are already enough.', '你已經足夠好了。'],
  ['Every season has its flowers.', '每個季節，都有它的花。'],
  ['A calm heart grows beautiful things.', '安穩的心，會長出美好的東西。'],
  ['Be kind to the woman in the mirror.', '對鏡子裡的自己溫柔一點。'],
  ['Joy is in the little rituals.', '喜悅藏在每天的小儀式裡。'],
];
export const quoteOf = (dateStr: string) => {
  const n = dateStr.split('-').reduce((a, b) => a * 31 + +b, 7);
  return QUOTES[Math.abs(n) % QUOTES.length];
};
