# 中信房屋網站視覺提案 Demo

以 Vue 3、Vite、Pug 與縮排式 Sass 製作的網站視覺與互動作品，沿用自建 `00.template` 的開發基底，以 JSON 管理文案、圖片與導覽資料。

原提案未採用，目前作為作品集 Demo 持續整理。設計範圍只有「首頁」與「房屋物件內容頁」；首頁的五個橫向區塊不代表五個獨立網頁。

目前程式版號為 **1.1.0**，與 package.json、package-lock.json 根套件及頁面 DEMO 顯示同步。後續每批修改同步更新版號；版號更新與 Git 推送不表示網站或雲端環境已發布。

文件整理日期：2026-10-09（Asia/Taipei）。內容依本對話可見的 v1.0 更新快照、已確認規格，以及使用者提供的 Codex 環境回報整理；本次未直接讀取 Codex repository 的最新提交。接手時請先核對目前分支與原始碼，不能把這份交接文件當作最新程式驗證結果。

## 文件分工

| 文件 | 用途 |
| --- | --- |
| `README.md` | 專案介紹、啟動方式、規格、設計決策、目前狀態與待辦 |
| `AGENTS.md` | 開發與修改本專案時需遵循的規則 |
| `CHANGELOG.md` | 按版本記錄新增、修改與修復，不取代現況說明 |

開發筆記集中在本 README，目前不另設 `PROJECT_NOTES.md`。內容擴大後再按需要拆分，避免維護多份重複說明。

## 技術與啟動

- Vue 3 + Vite，使用 JavaScript 與 `<script setup>`。
- 畫面標記採 `<template lang="pug">`。
- 樣式採 `.sass` 縮排語法與 `@use` 模組。
- 文案、搜尋選項、圖片、導覽與側邊連結以 JSON 管理。
- Noto Sans TC 由 `@fontsource/noto-sans-tc` 本地載入；Google Material Symbols 是另一組遠端圖示字型。
- 不使用 jQuery。

在專案根目錄的 VS Code 終端機執行：

```bash
npm ci
npm run dev
```

初次安裝或沒有 `package-lock.json` 時，可改用 `npm install`。開啟終端機顯示的網址，預設開發埠為 5173；若埠被占用，以實際輸出為準。

```bash
npm run build
npm run preview
```

`build` 產生 `dist/`；`preview` 用來檢查正式建置產物。開發、預覽與正式部署是不同步驟。Vite 開發伺服器不是正式網站主機。

`vite.config.js` 使用 `base: './'`，方便部署到子目錄。`HomePage.vue` 依頁面網址與 Vite base 將圖片解析為完整網址，避免 CSS 背景的相對路徑指向 `assets/images/`。此專案沒有要求主機執行 Node.js 服務；正式建置的前端靜態檔可放到支援靜態檔案的主機。

部署時將 `dist/` **裡面的全部內容**上傳至網站目錄，例如 `/cthouse-horizontal-demo/`，包含 `index.html`、`assets/` 與 `images/`，不要只上傳 HTML 或 CSS。每次修改需重新 `npm run build` 再上傳；Git 推送不會自動更新這台網站伺服器。

## 資料夾規範與用途

後續 Vue／Vite／Pug／Sass 專案沿用以下分工；本次先整理此 repository，其他專案另行遷移。檔案依責任放置，各頁的完整畫面與樣式放在同一頁面資料夾，共用內容集中管理，不把新頁面檔案持續堆在 src 根目錄。

```text
cthouse-horizontal-demo/
├── index.html                 首頁 HTML 入口
├── property.html              物件頁 HTML 入口
├── src/
│   ├── entries/               Vue 掛載、字型與頁面樣式載入
│   │   ├── home.js
│   │   └── property.js
│   ├── pages/                 各頁完整畫面與該頁 Sass
│   │   ├── home/              HomePage.vue、style.sass
│   │   └── property/          PropertyPage.vue、style.sass
│   ├── components/            可重用元件；專屬元件按頁面分組
│   │   ├── PageRail.vue
│   │   └── property/          PropertyMedia.vue、PropertyIcon.vue
│   ├── data/                  文案、選項、連結與素材設定 JSON
│   ├── sass/                  共用字級、字型、mixin 與 Sass partial
│   ├── utils/                 不依賴畫面狀態的共用 JavaScript 工具
│   └── legacy/                目前保留的未使用舊檔；新功能不放這裡
├── public/
│   └── images/                原樣複製到 dist 的照片、Logo 等靜態圖片
├── dist/                      npm run build 產物，不手動修改、不提交
└── node_modules/              npm 安裝的依賴，不手動修改、不提交
```

| 位置 | 放什麼／怎麼維護 |
| --- | --- |
| repository 根目錄 | HTML 入口、Vite／套件設定、README、AGENTS、CHANGELOG；不堆放頁面元件與圖片 |
| `src/entries/` | 每個 HTML 對應一個掛載檔；只負責建立 App、載入字型與樣式 |
| `src/pages/<page>/` | 完整頁面 Vue 與 `style.sass`；頁面內互動及布局放這裡 |
| `src/components/` | 共用介面元件；只供單頁使用的元件放 `components/<page>/` |
| `src/data/` | 合法 JSON；可變文案、資料、圖片檔名與連結，說明放 `_comments` |
| `src/sass/` | 全站可共用的變數、字級函式、mixin、partial；不混入單頁大段布局 |
| `src/utils/` | 圖片 URL 等純工具，避免兩個頁面各複製同一段邏輯 |
| `src/legacy/` | 本專案既有舊版保留檔，目前是未載入的 `media.js`；不是新專案必建目錄 |
| `public/images/` | 靜態圖片；檔名優先使用小寫英數與連字號，新物件素材可按物件建立子目錄。既有圖片檔名保留 |
| `dist/`、`node_modules/` | 自動生成與安裝的內容，由 .gitignore 排除 |

設計稿與參考文件需要放入 repository 時，統一放 `docs/reference/`（有資料時再建立），不混在上線圖片裡。需要經 Vite 匯入處理的資源才建立 `src/assets/`；目前照片走 public/images，不另外維護重複素材目錄。新增真正共用的邏輯時才擴充其他資料夾，不預先建立空的 services／stores 等目錄。

## 專案位置

- 本機：`D:\00.orangeCatWork\01.httpdoc\cthouse-horizontal-demo`
- GitLab：<https://gitlab.com/orangecat1120/cthouse-horizontal-demo>
- GitHub：<https://github.com/orangecat-web/cthouse-horizontal-demo>

本機曾設定 `origin` 指向 GitLab、`github` 指向 GitHub；環境或 clone 方式不同時，遠端名稱可能不同。先用 `git remote -v` 確認，不假設一定有相同名稱。

## 設計來源與範圍

參考來源為 `首頁 v1.1.jpg`，動畫方向另參考 `首頁-v1.1move.jpg`。桌機設計以 1920 寬為基準。

本對話可見的首頁總圖尺寸為 2048 × 234。前四個場景的可見比例約可換算為 1920 × 960；這是從縮圖量測的比例，不是 PSD 的精確座標。細字、部分標誌和 QR 無法從縮圖辨識，目前不可宣稱逐像素還原。

設計稿若尚未放進 repository，Codex 無法僅靠檔名取得它。可放在 `docs/reference/`，或在任務中重新附上；放入後請在此記錄實際檔名。不要假設目前已有這個資料夾或檔案。

| 設計範圍 | 狀態 |
| --- | --- |
| 首頁：找屋、星級服務、品牌優勢、最新消息、聯絡資訊 | 可見 v1.0 快照有五區結構與互動程式，尚待瀏覽器視覺驗證 |
| 房屋物件內容頁 | 已建立獨立 property.html；依使用者指示先留圖片與媒體位置，正式資料待補 |
| 搜尋、會員、委託、消息等業務功能 | Demo 示意，尚未串接 API 或正式資料服務 |

## 房屋物件內容頁

入口為 **`property.html`**，例如正式主機的 `/cthouse-horizontal-demo/property.html`。與首頁採 Vite 靜態多頁建置，`npm run build` 同時產生 `dist/index.html` 與 `dist/property.html`；上傳完整 dist 內容即可，不需要伺服器做 SPA 路由改寫。上方 Nav 仍沿用使用者要求的空 href，沒有將「我要買屋」直接連到單一示意物件。

依使用者附上的 1920 × 5218 長頁設計稿建立：白底導覽、標題與價格、左大右四小的五格相簿、物件摘要、雙欄詳細資料與右側經紀人諮詢卡、聯絡列與區塊錨點、介紹、VR、地圖與設施、行情與影音、四張推薦物件及灰底頁尾。聊天附件實際可見的是 754 × 2048 縮圖，未宣稱逐像素還原。手機保留全部內容，資料與媒體改成上下排列；Nav 可橫向捲動閱讀。

物件頁使用獨立 `src/entries/property.js` 與 `src/pages/property/style.sass`，不載入首頁攔截滾輪、拖曳或鍵盤切場景的行為。字級沿用 `_typography.sass`，新增 `property: 1410px` 設計寬度，所有文字至少 16px；布局仍用 rem 與比例。

### 替換資料與素材

全部可變內容放在 **`src/data/property.json`**。可辨識標題、物件編號與部分數字只作設計稿示意，非即時房源。地址、經紀人姓名／電話／店名、介紹與成交資料未確認，留 null 或空陣列，畫面顯示待補；請核對正式資料後替換。

| 要補的內容 | JSON 欄位 |
| --- | --- |
| 彩色 Logo | `brandLogo` |
| 五張物件照片 | `gallery[].image` |
| 物件資訊與介紹 | `title`、`address`、`price`、`details`、`introduction` |
| 經紀人頭像、聯絡資料、QR | `agent.avatar`、`agent`、`agent.qrCodes[].image` |
| VR、地圖與影音圖片／iframe | `media.vr`、`media.map`、`media.video` 的 `image`／`embedUrl` |
| 設施分類資料 | `environment.items`（`category`、`name`、`distance`） |
| 區域行情圖與說明 | `market.image`、`market.notes` |
| 四張推薦卡 | `recommendations[].image`／`title`／`subtitle`／`price`／`href` |
| 頁尾公司資訊與徽章 | `footer` |

圖片檔放 `public/images/`，JSON 填相對檔名，支援子資料夾；完整圖片網址由 `src/utils/images.js` 依部署目錄解析，避免再次誤向 assets/images 請求。照片、VR、地圖、影音、QR 與行情圖目前依使用者指示保留位置；沒有假地圖、假 QR、假成交曲線或擷取設計稿照片。正式 iframe 的網址填 `embedUrl`，無須將平台觀看頁網址冒充嵌入網址。

`public/images/property-agent.png` 是依使用者指示生成的虛構成年女性手繪動畫風格插畫，並非稿中或真實經紀人的照片。可在 `agent.avatar` 替換；彩色品牌 Logo 仍留空，不對首頁白色 Logo 套濾鏡。

相簿可開啟原生 dialog，支援上一張／下一張、方向鍵及 Escape；收藏只維持本次頁面狀態。預約看屋／房屋詢問表單只顯示 Demo 提示，沒有送出資料。貸款、降價通知、成交查詢尚未串接。區塊錨點、回頂部、複製連結與列印由瀏覽器執行。

正式建置及 Chromium 驗證通過：根目錄／子目錄入口、1920／1440／1024／768／390／320px 頁面無橫向溢出且文字至少 16px，生成頭像可載入，相簿、表單、錨點、收藏、複製及列印入口正常，無 JS 錯誤。已檢視桌機／手機截圖；首頁五區與背景圖片仍正常。

使用者提供的 <https://orangecat.com.tw/lab.html> 已確認使用 Vue 3 自製 WebGL 環景檢視器，可拖曳、縮放、全螢幕與切場景，需要 2:1 等距柱狀全景圖。本版僅保留 VR 區塊；後續拿到原元件及此房源全景素材再移植，尚未複製該網站程式或引用其他房間的照片。

## 已確認的首頁規格

### 上方導覽與標題

順序固定為：

1. 我要買屋
2. 我要租屋
3. 售屋委託
4. 成交行情
5. Logo
6. 服務據點
7. 關於中信
8. 徵才公告
9. 會員專區

Logo 包在首頁唯一的 H1，圖片需提供品牌名稱作為替代文字。「找到你的最適生活圈」為 H2；保留目前導覽中的「關於中信」。

上方八個文字項目都是其他頁面的 `a` 連結，網址填在 `site.json` 的 `navigation.primary[].href` 與 `navigation.company[].href`，與首頁五個場景分開。目前依使用者指示將網址留空待填，空值不輸出 `href`，避免意外重新載入或切換場景；填入後由瀏覽器正常導頁。Logo 使用 `navigation.homeHref: "./"` 回到目前部署目錄的首頁。

Header 改用由上方黑色漸變至下方透明的垂直背景，Nav 文字與原始白色 Logo 固定白色；文字 hover 顯示 1px 白色底線，預留透明底線避免布局跳動。已移除原有混色與 Logo 變色濾鏡。

### 橫向切換與動畫

- 首頁以橫向軌道呈現各區；前四區各約一個視窗寬。
- 每次有效滾輪操作切換一區，同方向連續事件需限制切換頻率。
- 快速連滾不得造成永久鎖定；反方向滾動需能返回。
- 桌機按住滑鼠左鍵拖曳場景：往左拖前進、往右拖返回，放開時水平位移達 60px 且大於垂直位移才切換一區；不足門檻則回到原位。拖曳跟隨滑鼠並限制首尾邊界，表單、連結與按鈕不啟動拖曳。
- 手機仍採直向閱讀；滑鼠拖曳不取代既有滾輪、鍵盤、箭頭及觸控操作。
- 右下前後箭頭、首頁右滑箭頭與鍵盤共用切頁入口。
- 鍵盤支援方向鍵、PageUp、PageDown、空白鍵、Home、End；輸入欄位內不攔截這些按鍵。
- 場景切換要有滑動動畫；文字需保留原規劃的上移、左右進場或淡入，不可只切換顯示。
- 窄螢幕且符合粗略指標條件時改成直向閱讀。JS `compact()` 必須與 Sass 的手機條件同步。
- 有程式碼與函式模擬結果，不等於已驗證真實滑鼠、觸控板或手機操作。

### 四區布局校正的依據

以下為本對話產生的 v1.0 校正值，實際是否已納入 Codex 分支需核對程式：

| 區塊 | 校正重點 |
| --- | --- |
| `service` | 照片寬約 70%、高約 76%；標題跨照片右邊界；底部約 24% 是諮詢表單與按鈕列 |
| `advantage` | 左側全高窄圖、懸浮建築照片、三組錯位英文標題與中文內容、橘色圓形按鈕、跨圖標語 |
| `news` | 深色帶約 20.5%、白色內容約 58.7%、森林約 20.8%；NEWS 大字靠下並跨越深淺區 |
| `contact` | 灰底、資訊靠右、QR、標誌素材區與黑色按鈕；移除早期白色卡片外觀 |

末端灰色聯絡區在縮圖中約為 36.67vw。可見快照使用 `layout.contactWidthVw`，讓軌道最後停在右端並與前區森林連續呈現，避免多出空白。這是縮圖解讀，取得高解析原稿後需重新確認，不應當成不可修改的固定規格。

### 側邊欄與首頁區塊資料

兩者必須分開：

| 資料 | 用途 |
| --- | --- |
| `pages` | 可見快照中的首頁區塊資料，供切頁索引、區塊 ID 與右下頁碼使用 |
| `sidebarLinks` | 側邊 `<a>` 連結，包含 `id`、`label`、`href`、`icon` |

`PageRail.vue` 現在接收 `links`，使用 `<a>`，不是首頁切頁元件。不能只把 `pages` 改名成 `sidebarLinks`，否則 `site.pages`、切頁與頁碼會失去資料。

若將 `pages` 整理成 `sections`，需同步修改 JS、場景引用與 `_comments`，並驗證切頁；這項命名整理不代表已完成。上方 Nav 的 href 不依賴場景 ID。

Google 圖示的 `icon` 填名稱，例如 `home`、`bookmark_border`、`verified`，由 `.material-symbols-outlined` 顯示。未指定的目標網址保持待辦，不猜造路徑。空 `href` 不是已完成的連結，驗收前需逐項核對。

## 資料、圖片與樣式維護

主要資料在 `src/data/site.json`。標準 JSON 不支援 `//` 與尾端逗號；說明放在 `_comments`，畫面只讀取業務欄位。新增資料後需確認欄位名稱、陣列順序與 Vue 的使用方式同步。

圖片放在 `public/images/`，JSON 中填檔名；使用 `null` 保留佔位。不能把整張設計圖當成頁面背景來取代切版。

| 圖片欄位 | 用途 |
| --- | --- |
| `images.logo` | 導覽 Logo |
| `images.home` | 首頁照片 |
| `images.service` | 服務照片 |
| `images.assets` | 品牌優勢建築大圖 |
| `images.assetsEdge` | 品牌優勢左側窄圖 |
| `images.closing` | 消息右側森林，接續末端聯絡資訊 |
| `images.qrCode` | 聯絡區 QR 素材 |

QR、品牌標誌、下載徽章與無法辨識的細字仍需正式素材；佔位內容不代表正式功能、真實 QR 或已核對文案。

文字由 `src/sass/_typography.sass` 統一管理，使用 `type.size('body')` 等角色，不再逐項換算字級。角色表集中設定最小值與目標上限，公式為「目標字級 ÷ 設計寬度 × 100cqw」，再以 `clamp()` 限制範圍；內文及小字至少 16px，標題至少 24、32 或 48px，依角色區分。`page` 設計寬度是 1920px，`form` 是 1200px；實際 cqw 取最近的查詢容器，較窄的表單／聯絡尾段亦不會突破最小值。

上下限同時保留 rem 與 16px 的保護，使用者放大根字級時文字也會放大。根字級仍為 `93.75%`（預設下 `1rem = 15px`），僅作布局單位基準，不表示文字只有 15px。布局、欄位尺寸、間距與手機排列保留既有設定；字級提高後的換行或擠字，由後續版面調整處理。已移除舊的 `text-rem-scale` 字級斷點，手機同樣遵守 16px 下限。

### 程式閱讀索引

| 要修改的內容 | 檔案／搜尋名稱 |
| --- | --- |
| 主畫面與五區結構、標題層級 | `src/pages/home/HomePage.vue` |
| 房屋物件頁、媒體與版面 | `src/pages/property/PropertyPage.vue`、`src/components/property/PropertyMedia.vue`、`src/pages/property/style.sass` |
| 物件頁文案、素材及聯絡資料 | `src/data/property.json` |
| 首頁場景切換 | `goTo`、`trackOffset` |
| 上方頁面連結及 Logo 首頁網址 | `navigation.primary`、`navigation.company`、`navigation.homeHref` |
| 滾輪、鍵盤、觸控 | `onWheel`、`onKey`、`onTouchStart`、`onTouchEnd` |
| 全域事件註冊與清理 | `onMounted`、`onBeforeUnmount` |
| 側邊連結 | `src/components/PageRail.vue` |
| 文案、圖示名、圖片與導覽 | `src/data/site.json` |
| 版面、動畫、RWD | `src/pages/home/style.sass` |
| Sass 基底 | `src/sass/` |
| 應用掛載與本地字型 | `src/entries/home.js` |
| Vite 設定 | `vite.config.js` |

`src/legacy/media.js` 是舊版保留檔，可見快照的 `HomePage.vue` 未使用它；更換圖片應修改 `site.json.images`。

## Codex 環境交接：2026-10-09

以下為使用者貼回的 Codex 回報，本次未在該環境重新執行檢查。

| 項目 | 回報狀態 |
| --- | --- |
| 依賴安裝 | 通過 |
| 正式建置 | 通過 |
| 五個區塊渲染 | 通過 |
| 頁面／素材請求 | 通過 |
| 開發伺服器 | 已啟動；只代表回報當時狀態 |
| 專案原始碼 | 環境設定過程未修改 |
| `install_script`、`start_skill` | 草稿已儲存，尚待環境設定的檢閱與發布 |
| Google Fonts 網域設定 | 草稿已儲存；字型存取仍受網路政策阻擋 |
| 瀏覽器互動、視覺校對 | 尚未驗證 |

`install_script`、`start_skill` 在此是環境回報中的設定項目，不表示 repository 裡存在同名檔案。草稿已儲存也不代表設定已發布或已生效。

下一次接手依序處理：

1. 檢閱環境設定草稿，儲存變更並發布環境。
2. 在設定生效後重新確認 Google Fonts 樣式及實際字型檔能否存取。
3. 再確認側邊圖示真的顯示為圖形，而非 `home` 等文字。
4. 進行桌機／手機操作與視覺測試，記下尺寸、步驟及結果。

Google 遠端字型通常涉及 `fonts.googleapis.com`（樣式）及 `fonts.gstatic.com`（字型檔）；兩者是否可用需實際驗證。不要只因 npm 安裝成功、HTTP 頁面成功或建置通過就標記字型正常。

本對話可見快照的 Google Symbols 網址放在 `src/sass/_icons.sass`，由 `style.sass` 匯入。若 Codex 後續已改到 `index.html`，以目前原始碼為準，不因這份文件搬回舊入口；維持單一載入來源，避免重複引入。Noto Sans TC 的本地字型與 Google 圖示的遠端存取分開檢查。

## 檢查與驗收

每次修改依影響範圍完成必要檢查，並區分「編譯通過」「程式模擬」「實際瀏覽器驗證」。文件更新本身不需要重跑整站測試。

- JSON 可解析，資料引用無遺漏，`_comments` 不進入畫面。
- 正式建置通過；正式產物的資源路徑正確。
- Nav 順序正確；首頁只有一個 H1，主標語為 H2。
- 側邊欄是正確的 a 連結，與首頁切頁分開。
- 滾輪前進、返回、快速連滾與反向切換皆正常。
- 箭頭、鍵盤、輸入欄位及觸控行為正常，末端不露出空白。
- 場景滑動及指定文字進場效果可見。
- Google Symbols、Noto 各字重及圖片實際載入。
- 以 1920 桌機畫面對照設計稿，並測試手機直向閱讀。

## 待辦與限制

- 立即委託表單依清晰局部圖重排為四欄輸入、聯絡時間 checkbox、個資告知、驗證碼與送出按鈕；手機改為直向排列。
- 底列右側保留「經紀人快搜」與「聯絡在地服務據點」兩顆圓角按鈕，資料在 service.actions；本地 SVG 不依賴 Google 字型，點擊仍為 Demo 提示，手機置於表單下方。
- 表單資料由 src/data/site.json 的 service.inquiry 管理；contactTimes 是五個聯絡時段，privacyNotice 為使用者提供的原文。
- [ ] 補齊正式地區與加盟商選項；目前地區只有「臺北市全區」，加盟商只顯示選擇提示。
- 驗證碼與更新按鈕為前端 Demo，不提供真正安全驗證；送出仍僅顯示 Demo 提示。
- 表單正式建置通過，並以 Chromium 驗證 1920 × 960 桌機及 390 × 844 手機：四個欄位、五個 checkbox、更新驗證碼、告知文字與 Demo 送出均正常，表單沒有橫向溢出或 JS 錯誤；已檢視截圖，未宣稱全站逐像素一致。
- [ ] 發布 Codex 環境設定並重新確認 Google 字型存取。
- [ ] 完成真實瀏覽器的滾輪、鍵盤、觸控與圖示測試。
- [ ] 補高解析首頁原稿，逐區校對文字、圖片、尺寸與位置。
- [ ] 重新確認灰色尾段的寬度與最後切頁位置。
- [ ] 置換服務、建築、森林、QR、品牌標誌及下載徽章素材。
- [ ] 核對側邊 `href` 的真實目標；目前未填項目保留待辦。
- [ ] 核對房屋物件內容頁在 Codex 的狀態，按原稿製作與驗證。
- [ ] 核對實際分支與提交是否已包含本對話的 v1.0 布局更新。

搜尋、委託、驗證碼、消息與會員等目前為視覺示意；本文件不把它們當成正式業務功能。導覽採白色與漸層背景，不使用 Photoshop 差異化混色效果。

## 從這裡交接到 Codex

將本次三份文件放在目前 repository 根目錄，再提交到 Git。不要用較舊的完整 ZIP 覆蓋 Codex 已有的後續修改。

先檢查：

```bash
git status -sb
git branch --show-current
git remote -v
```

確認內容後只提交這次文件：

```bash
git add README.md AGENTS.md CHANGELOG.md
git commit -m "docs: add project handoff and development rules"
```

再依實際分支及遠端推送，不假設當前一定是 `main` 或 `work`。

Codex 接手提示可使用：

> 請先讀取 AGENTS.md、README.md 與 CHANGELOG.md，核對目前分支、工作目錄變更與實際程式。這是中信房屋兩頁提案 Demo；首頁五個橫向區塊與側邊外連分開。先確認已發布環境的 Google 字型存取，再驗證瀏覽器互動與視覺。若分支內容與交接文件不同，先說明差異，不用舊 ZIP 覆蓋新程式；完成後同步更新文件。
