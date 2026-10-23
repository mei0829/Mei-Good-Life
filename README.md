# Mei Good Life

## 我的記帳

個人記帳網頁：信用卡、現金、固定收支、預算、股票、預存、代墊、獨立帳本、賺錢點子…

- 網址：https://mei0829.github.io/Mei-Good-Life/money.html
- 用 Google 帳號登入，資料存在 Firebase（雲端同步，跟原本 Uultra 版本共用同一份資料）。
- GitHub Pages 由 `.github/workflows/pages.yml` 部署，每小時也會更新「股價與新聞」用的 `news.json`。

從 mei0829/Uultra 搬過來。

## 首頁

打開 https://mei0829.github.io/Mei-Good-Life/ 會先看到首頁（`index.html`），每個生活項目是一張卡片：記帳（私人）、物品存放（家人共用），之後會加衣服穿搭、旅遊紀錄、社交點滴。

## 我的櫃子

記錄家裡每個櫃子、每一格放了什麼東西，可以跟家人共用。

- 網址：https://mei0829.github.io/Mei-Good-Life/cabinet.html
- 跟記帳用同一個帳號登入，但資料**不跟記帳放在一起**：存在「家庭空間」`families/{id}/data/cabinet`，成員都能看、能改，家人改了會即時更新。
- 在「⋯ 設定 → 家人共用」用 Email 邀請家人。管理員邀請時會順便把對方加進網站的邀請名單。
- 按住東西拖到別格就能換位置（手機要先按住一下再拖）；按住格子的名稱拖到別格，兩格會整格交換。每次變更都可以按「復原」。
- 可以搜尋東西在哪、分地點（書房、客廳…）、自訂每個櫃子的層數和每層格數、下載備份檔。

### 第一次使用前：開通家庭空間

到 Firebase 主控台 → Firestore Database → 規則，把 `firestore.rules` 的內容整份貼上取代原本的規則（原本的規則都已包含在裡面），按「發布」。
