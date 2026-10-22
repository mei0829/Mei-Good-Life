#!/usr/bin/env python3
"""抓統一發票中獎號碼，存成 invoice.json 給記帳網頁對獎用。

在 GitHub Actions 跟新聞一起每小時跑（瀏覽器不能直接抓財政部網站，所以由伺服器先抓好）。
只用 Python 內建模組。財政部網頁的格式可能會改，所以同時試好幾個網址，
每一期都要找得到特別獎、特獎和 3 組頭獎才算數；全部都抓不到就不寫檔，網頁會顯示「還沒有號碼」。
"""
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
URLS = [
    'https://invoice.etax.nat.gov.tw/invoice.xml',     # RSS：最近幾期
    'https://invoice.etax.nat.gov.tw/index.html',      # 最新一期
    'https://invoice.etax.nat.gov.tw/lastNumber.html',  # 上一期
]
# 「114年07-08月」「114 年 7 ~ 8 月」這類寫法
PERIOD = re.compile(r'(1\d{2})\s*年\s*0?(\d{1,2})\s*(?:月)?\s*[-~～－至、]\s*0?(\d{1,2})\s*月')
LABELS = ['特別獎', '特獎', '頭獎', '二獎', '三獎', '四獎', '五獎', '六獎', '增開六獎', '領獎', '注意']


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'zh-TW'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
    for enc in ('utf-8', 'big5'):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return raw.decode('utf-8', 'ignore')


def flat(s):
    """去掉 HTML 標籤。號碼常被拆成好幾個 <span>（後三碼標紅色），所以 span 直接接起來，區塊標籤才換行。"""
    s = html.unescape(html.unescape(s))
    s = re.sub(r'<!\[CDATA\[|\]\]>', '', s)
    s = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', s)
    s = re.sub(r'(?i)</?(p|div|tr|td|th|li|br|h\d|table|tbody|section|item|title|description)\b[^>]*>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    return s


def after(text, label):
    """label 後面到下一個獎項名稱之間的文字。"""
    i = text.find(label)
    if i < 0:
        return ''
    rest = text[i + len(label):]
    ends = [rest.find(l) for l in LABELS if l != label and rest.find(l) > 0]
    return rest[:min(ends)] if ends else rest[:300]


def parse_block(text):
    sp = re.findall(r'(?<!\d)\d{8}(?!\d)', after(text, '特別獎'))
    gr = re.findall(r'(?<!\d)\d{8}(?!\d)', after(text, '特獎'))
    fi = re.findall(r'(?<!\d)\d{8}(?!\d)', after(text, '頭獎'))
    ex = re.findall(r'(?<!\d)\d{3}(?!\d)', after(text, '增開六獎'))
    if not sp or not gr or len(fi) < 3:
        return None
    return {'special': sp[0], 'grand': gr[0], 'first': fi[:3], 'extra': ex[:6]}


def parse(raw):
    text = flat(raw)
    marks = list(PERIOD.finditer(text))
    out = {}
    for k, m in enumerate(marks):
        y, a, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if a % 2 == 0 or b != a + 1 or not 1 <= a <= 11:
            continue
        end = marks[k + 1].start() if k + 1 < len(marks) else len(text)
        r = parse_block(text[m.end():end])
        if r:
            key = f'{y + 1911}-{a:02d}'  # 西元年-單月，例如 2025-07 代表 7～8 月
            out.setdefault(key, dict(r, label=f'{y} 年 {a}～{b} 月'))
    return out


def main(path):
    periods, ok = {}, []
    for u in URLS:
        try:
            got = parse(get(u))
        except Exception as e:  # noqa: BLE001 抓不到就換下一個網址
            print(f'skip {u}: {e}', file=sys.stderr)
            continue
        print(f'{u}: {sorted(got)}', file=sys.stderr)
        if got:
            ok.append(u)
        for k, v in got.items():
            periods.setdefault(k, v)
    if not periods:
        print('沒有抓到任何一期的中獎號碼', file=sys.stderr)
        return 1
    data = {'t': int(datetime.now(timezone.utc).timestamp()), 'src': ok,
            'periods': dict(sorted(periods.items(), reverse=True))}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'寫入 {len(periods)} 期：{", ".join(periods)}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'invoice.json'))
