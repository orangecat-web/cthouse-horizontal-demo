// 應用入口：建立 Vue 主畫面，並載入全站字型與樣式。
import { createApp } from "vue";
import App from "./App.vue";
// 本地繁中字型：100 極細、200、300、400 與 700，供各區字重使用。
import "@fontsource/noto-sans-tc/chinese-traditional-100.css";
import "@fontsource/noto-sans-tc/chinese-traditional-200.css";
import "@fontsource/noto-sans-tc/chinese-traditional-300.css";
import "@fontsource/noto-sans-tc/chinese-traditional-400.css";
import "@fontsource/noto-sans-tc/chinese-traditional-700.css";
// 全站 Sass：共用基底、五個場景、進場動畫與手機版。
import "./style.sass";

// 掛載到 index.html 的 #app。
createApp(App).mount("#app");
