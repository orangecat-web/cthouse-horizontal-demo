# 中信房屋橫向互動提案 Demo

獨立的 Vue 3 + Vite 專案，以 `00.template` 的 Vue SFC、Pug、Sass `@use` 與共用 partials 作為基礎。原專案的 `SiteLayout` 與 `usePageScroll` 對應直向捲動，因此本作品另做橫向逐頁控制。

## 啟動

```bash
npm install
npm run dev
```

完成後開啟終端機顯示的本機網址。正式打包執行 `npm run build`，產物在 `dist/`。
若瀏覽器右下角沒有顯示 `DEMO 0.6`，請確認解壓的是更新版，並重新啟動開發伺服器。

## 操作

- 桌機：滑鼠滾輪或觸控板每秒最多切換一頁；快速連滾會繼續前進，反向滾動可立即返回。可點右下箭頭、首頁往右箭頭、左側工具列或上方導覽，也支援方向鍵、PageUp、PageDown、Home、End。
- 手機：改為直向閱讀，保留各區塊的內容與按鈕。
- 搜尋、消息與服務按鈕目前只展示介面，會提示資料尚未串接。

## 更換圖片

1. 將正式圖片放到 `public/images/`。
2. 修改 `src/data/site.json` 的 `images.home`、`images.service`、`images.assets`、`images.closing`，將 `null` 換成檔名，例如 `"home": "home.jpg"`。`closing` 同時用於最新消息及聯絡資訊。
3. 目前所有圖片區塊先以漸層色佔位，沒有把設計稿截圖當背景；正式圖片換上後，版面文字與動畫仍是獨立元件。

導覽列中央的 Logo 使用 `public/images/logo.png`，檔名由 `src/data/site.json` 的 `images.logo` 指定。此圖是透明底白色版，淺色頁面會自動以深色顯示。

導覽、頁面名稱、主要文案、搜尋選項與圖片檔名集中在 `src/data/site.json`，修改 JSON 後儲存，開發模式下瀏覽器會自動更新。JSON 字串需使用雙引號；修改後留意逗號。首頁標題、服務標題和各區文字可直接替換。主要內容與進場方向在 `src/App.vue`；場景樣式在 `src/style.sass`。`src/sass/` 的 partials 取自提供的 `00.template` 專案。場景依設計稿順序排列：首頁搜尋、星級服務、品牌優勢、最新消息、頁尾資訊；紅框區塊分別由下向上、由右向左或淡入。桌機以 1920px 提案為視覺基準，實際每頁寬度使用 `100vw`。部分小字在提供的總圖中無法辨認，目前使用示意文案，待原稿可用時可直接替換文字。右下角的 `DEMO 0.6` 可用來確認開啟的是本次版本。
