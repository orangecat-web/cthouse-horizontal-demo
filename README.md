# 中信房屋橫向互動提案 Demo

獨立的 Vue 3 + Vite 專案，以 `00.template` 的 Vue SFC、Pug、Sass `@use` 與共用 partials 作為基礎。原專案的 `SiteLayout` 與 `usePageScroll` 對應直向捲動，因此本作品另做橫向逐頁控制。

## 啟動

```bash
npm install
npm run dev
```

完成後開啟終端機顯示的本機網址。正式打包執行 `npm run build`，產物在 `dist/`。
若瀏覽器右下角沒有顯示 `DEMO 0.9`，請確認解壓的是更新版，並重新啟動開發伺服器。

## 操作

- 桌機：滑鼠滾輪或觸控板每秒最多切換一頁；快速連滾會繼續前進，反向滾動可立即返回。可點右下箭頭、首頁往右箭頭、左側工具列或上方導覽，也支援方向鍵、PageUp、PageDown、Home、End。
- 手機：改為直向閱讀，保留各區塊的內容與按鈕。
- 搜尋、消息與服務按鈕目前只展示介面，會提示資料尚未串接。

## 更換圖片

1. 將正式圖片放到 `public/images/`。
2. 修改 `src/data/site.json` 的 `images.home`、`images.service`、`images.assets`、`images.closing`，將 `null` 換成檔名，例如 `"home": "home.jpg"`。`closing` 同時用於最新消息及聯絡資訊。
3. 目前首頁已使用 `bg_index.webp`，其餘未設定圖片的區塊以漸層色佔位，沒有把設計稿截圖當背景；正式圖片換上後，版面文字與動畫仍是獨立元件。

導覽列中央的 Logo 使用 `public/images/logo.png`，檔名由 `src/data/site.json` 的 `images.logo` 指定。此圖是透明底白色版，淺色頁面會自動以深色顯示。

## 尺寸單位

樣式尺寸統一使用 `rem`。此上傳版未指定根字級，因此一般瀏覽器設定下 `1rem = 16px`，預設文字也是 `1rem`。開發偏好仍以 `1rem = 15px` 為目標；本次補註解保留上傳版尺寸。各區明確設定的標題與小字尺寸維持原設計比例。Media query 的 `rem` 依瀏覽器初始字級換算，原有的 760px 與 1100px 斷點不變。若未來要調整整體大小，可修改 `src/style.sass` 的 `:root`；共用文字尺寸設定在 `src/sass/_function.sass`。

導覽、頁面名稱、主要文案、搜尋選項與圖片檔名集中在 `src/data/site.json`，修改 JSON 後儲存，開發模式下瀏覽器會自動更新。JSON 字串需使用雙引號；修改後留意逗號。首頁標題、服務標題和各區文字可直接替換。主要內容與進場方向在 `src/App.vue`；場景樣式在 `src/style.sass`。`src/sass/` 的 partials 取自提供的 `00.template` 專案。場景依設計稿順序排列：首頁搜尋、星級服務、品牌優勢、最新消息、頁尾資訊；紅框區塊分別由下向上、由右向左或淡入。桌機以 1920px 提案為視覺基準，實際每頁寬度使用 `100vw`。部分小字在提供的總圖中無法辨認，目前使用示意文案，待原稿可用時可直接替換文字。右下角的 `DEMO 0.9` 可用來確認開啟的是本次版本。


## DEMO 0.9：程式閱讀索引

| 要修改的部分 | 檔案／搜尋字詞 |
| --- | --- |
| 五個畫面區塊 | `src/App.vue` 的 `01 首頁`～`05 聯絡資訊` |
| 滾輪與快速回滾 | `src/App.vue` 的 `onWheel` |
| 鍵盤／觸控切頁 | `src/App.vue` 的 `onKey`、`onTouchStart`、`onTouchEnd` |
| 共用切頁入口 | `src/App.vue` 的 `goTo`、`goToPage` |
| 事件註冊與解除 | `src/App.vue` 的 `onMounted`、`onBeforeUnmount` |
| 左側頁籤 | `src/components/PageRail.vue` |
| 場景滑動／文字進場 | `src/style.sass` 的 `橫向軌道`、`文字進場` |
| 文案／搜尋選項／圖片 | `src/data/site.json`；先閱讀 `_comments` |
| Google 圖示網址 | `src/sass/_icons.sass` 的 `@import` |
| 啟動與字型載入 | `src/main.js` |

### 後續專案的註解規範

- Vue／Pug：各畫面區塊與重要子區塊標註中文名稱、資料來源及動畫方向；Pug 用 `//-`，避免註解輸出到畫面。
- JS：說明狀態用途、函式責任、事件、計時器、特殊判斷與解除監聽；參數限制或單位需寫清楚。
- Sass：標註共用基底、每個場景、動畫、RWD 及各 partial 用途。
- JSON：維持標準 `.json`，使用 `_comments` 說明區；渲染時只讀業務欄位，不把說明資料當內容。
- 註解必須隨功能變動同步更新；說明用途與原因，不逐行翻譯簡單語法。

同樣規範已寫入 `AGENTS.md`，供後續開發與 AI 修改時遵循。

### 左側 Google 圖示

`pages[].icon` 填 Google Material Symbols Outlined 的圖示名稱（如 `home`），由 `PageRail.vue` 的 `.material-symbols-outlined` 顯示。字型網址維持在 `src/sass/_icons.sass`，圖示大小在 `src/style.sass` 的 `.page-rail .material-symbols-outlined` 調整。
