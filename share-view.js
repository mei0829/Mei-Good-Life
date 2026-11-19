// 旅遊行程的唯讀分享：打開 trip.html?s=分享代碼 時用這個，不用登入。
// 讀 Firestore 的 shares/{代碼}（只能用完整代碼讀一筆、不能列出全部），對方一改就即時更新。
import { firebaseConfig } from './firebase-config.js';

const V = '12.18.0', CDN = `https://www.gstatic.com/firebasejs/${V}/`;
const box = document.getElementById('auth');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const msg = t => { box.innerHTML = `<div id="authwrap"><h1>旅遊行程</h1><div class="card"><div class="sub">${esc(t)}</div></div></div>`; };

let started = false;
msg('載入中…');
try {
  const [appm, fsm] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-firestore.js')]);
  const fs = fsm.getFirestore(appm.initializeApp(firebaseConfig));
  fsm.onSnapshot(fsm.doc(fs, 'shares', window.SHARE), x => {
    const d = x.exists() ? x.data() : null;
    let trip = null;
    try { if (d && !d.off && d.j) trip = JSON.parse(d.j); } catch (e) { trip = null; }
    if (!trip) {
      if (!started) return msg('這個分享連結已經關閉或不存在，請跟分享的人要新的連結。');
      return window.onShared && window.onShared(null);
    }
    window.SHARED = { trip, t: +d.t || 0 };
    if (!started) {
      started = true; box.innerHTML = '';
      const s = document.createElement('script'); s.textContent = document.getElementById('app-src').textContent; document.body.appendChild(s);
    } else if (window.onShared) window.onShared(window.SHARED);
  }, () => msg(navigator.onLine ? '讀不到這個分享（連結可能打錯，或分享還沒開通）。' : '沒有網路，連上網路後重新整理。'));
} catch (e) { msg('無法載入，請確認網路後重新整理。'); }
