/* Mei Good Life 全站風格
 * 每一頁都載入這個檔：米白底、一個可以選的主色、一個可以選的主題圖案。
 * 選擇記在這支手機（localStorage 'mgl-look'），所有頁面一起換。
 *
 * ▸ 新增主題圖案：把圖片放進 themes/ 資料夾，再在下面 PATTERNS 加一行。
 *   tile  ＝ 小圖一直重複鋪滿（適合碎花、點點這類紋樣），size 是一塊的寬度
 *   corner＝ 一張插畫放在右上角（適合單張圖），size 是圖的寬度
 */
(function () {
  var me = document.currentScript;
  var ROOT = (me && me.src || location.href).replace(/[^\/]*$/, '');
  var BLOOM = !!(me && me.dataset.app === 'bloom'); // 幸孕女子自己管顏色，這裡只畫圖案

  // 米白底：每個主題都一樣
  var BASE = { bg: '#F5F1E9', card: '#FFFCF7', ink: '#3A3631', sub: '#857E73', line: '#E6DFD3', on: '#FFFCF7' };

  // 主色：按鈕、選中的標籤、連結；soft 是很淡的同色底
  var COLORS = {
    forest:   { name: '森林綠', acc: '#455C4A', soft: '#E4E8DF' },
    mist:     { name: '霧藍',   acc: '#4C6577', soft: '#E2EAEE' },
    rose:     { name: '玫瑰奶茶', acc: '#8E5F58', soft: '#F1E2DD' },
    cream:    { name: '焦糖',   acc: '#8A6A3B', soft: '#F3EAD6' },
    amber:    { name: '琥珀金', acc: '#8C5F0F', soft: '#F3EAD0' },
    burgundy: { name: '酒紅',   acc: '#7A2E35', soft: '#F2E1DE' },
    indigo:   { name: '靛藍',   acc: '#253C66', soft: '#E1E7F1' },
    emerald:  { name: '祖母綠', acc: '#1F5C4A', soft: '#DEEBE3' }
  };

  // 主題圖案（例：{ id: 'daisy', name: '小雛菊', src: 'themes/daisy.png', mode: 'tile', size: 160 }）
  var PATTERNS = [
    { id: 'none', name: '素面' }
  ];

  var pat = function (id) { for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i].id === id) return PATTERNS[i]; return null; };

  function get() {
    var v = {};
    try { v = JSON.parse(localStorage.getItem('mgl-look') || '{}') || {}; } catch (e) {}
    return { c: COLORS[v.c] ? v.c : 'forest', p: pat(v.p) ? v.p : 'none' };
  }

  function apply() {
    var L = get(), r = document.documentElement;
    if (!BLOOM) {
      var c = COLORS[L.c], v = { acc: c.acc, soft: c.soft };
      for (var k in BASE) v[k] = BASE[k];
      for (var n in v) r.style.setProperty('--' + n, v[n]);
      r.dataset.theme = 'light'; // 關掉各頁原本的深色模式
      r.style.colorScheme = 'light';
      var m = document.querySelector('meta[name=theme-color]');
      if (m) m.content = BASE.bg;
    }
    r.dataset.look = L.c;
    deco(L);
    return L;
  }

  // 主題圖案畫在頁面最上方，往下慢慢淡掉，不會蓋住文字
  function deco(L) {
    if (!document.body) return;
    var d = document.getElementById('mgl-deco'), p = pat(L.p);
    if (!p || !p.src) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement('div'); d.id = 'mgl-deco'; d.setAttribute('aria-hidden', 'true'); document.body.prepend(d); }
    d.className = 'mgl-' + (p.mode || 'tile');
    d.style.backgroundImage = 'url("' + ROOT + p.src + '")';
    d.style.backgroundSize = (p.size || 160) + 'px auto';
  }

  function set(patch) {
    var L = get();
    for (var k in patch) L[k] = patch[k];
    try { localStorage.setItem('mgl-look', JSON.stringify(L)); } catch (e) {}
    L = apply();
    try { window.dispatchEvent(new CustomEvent('mgl-look', { detail: L })); } catch (e) {}
    return L;
  }

  // 選風格的視窗（每一頁都叫這個）
  function open() {
    var old = document.getElementById('mgl-pick');
    if (old) old.remove();
    var w = document.createElement('div');
    w.id = 'mgl-pick';
    w.innerHTML = '<div class="mgl-bk"></div><div class="mgl-pn" role="dialog" aria-label="風格"></div>';
    document.body.appendChild(w);
    var pn = w.querySelector('.mgl-pn');
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); };
    function draw() {
      var L = get();
      pn.innerHTML =
        '<div class="mgl-hd"><b>風格</b><button class="mgl-ok" data-x>完成</button></div>' +
        '<p class="mgl-tip">底色都是米白色，選一個主色和圖案，所有頁面會一起換。</p>' +
        '<div class="mgl-lb">主色</div><div class="mgl-cs" role="radiogroup" aria-label="主色">' +
        Object.keys(COLORS).map(function (k) {
          var c = COLORS[k];
          return '<button role="radio" aria-checked="' + (L.c === k) + '" data-c="' + k + '" class="' + (L.c === k ? 'on' : '') + '">' +
            '<i style="background:' + c.acc + '"></i><span>' + c.name + '</span></button>';
        }).join('') + '</div>' +
        '<div class="mgl-lb">主題圖案</div><div class="mgl-ps" role="radiogroup" aria-label="主題圖案">' +
        PATTERNS.map(function (p) {
          var bg = p.src ? 'background-image:url(&quot;' + ROOT + p.src + '&quot;);background-size:' + (p.mode === 'corner' ? 'contain' : Math.round((p.size || 160) / 2.5) + 'px auto') + ';' : '';
          return '<button role="radio" aria-checked="' + (L.p === p.id) + '" data-p="' + esc(p.id) + '" class="' + (L.p === p.id ? 'on' : '') + '">' +
            '<i class="' + (p.mode === 'corner' ? 'cn' : '') + '" style="' + bg + '"></i><span>' + esc(p.name) + '</span></button>';
        }).join('') + '</div>';
    }
    draw();
    var close = function () { w.remove(); };
    w.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (e.target.classList.contains('mgl-bk') || (b && b.hasAttribute('data-x'))) return close();
      if (!b) return;
      if (b.dataset.c) set({ c: b.dataset.c });
      else if (b.dataset.p) set({ p: b.dataset.p });
      draw();
    });
  }

  window.MGL_LOOK = { get: get, set: set, apply: apply, open: open, COLORS: COLORS, PATTERNS: PATTERNS, BASE: BASE };

  // 圓體字（jf 粉圓）
  if (!document.querySelector('link[href*="family=Huninn"]')) {
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Huninn&display=swap';
    document.head.appendChild(f);
  }

  if (!document.querySelector('link[href$="look.css"]')) {
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = ROOT + 'look.css';
    document.head.appendChild(css);
  }

  apply();
  if (!document.body) document.addEventListener('DOMContentLoaded', function () { deco(get()); });
  // 別的分頁換了風格，這頁也跟著換
  window.addEventListener('storage', function (e) { if (e.key === 'mgl-look') { var L = apply(); try { window.dispatchEvent(new CustomEvent('mgl-look', { detail: L })); } catch (x) {} } });
})();
