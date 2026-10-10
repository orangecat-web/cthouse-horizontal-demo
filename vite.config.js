import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

// 開發與建置設定：Vue SFC 由 vue 插件處理，Pug 在 template lang="pug" 中編譯。
export default defineConfig({
  plugins: [vue()],
  // 使用相對資源路徑，方便將 Demo 部署到網站子目錄。
  base: "./",
  // 靜態多頁入口：首頁與物件頁各有 HTML，子目錄主機不需 SPA 路由改寫。
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        property: fileURLToPath(new URL("./property.html", import.meta.url)),
      },
    },
  },
  // 開發伺服器設定
  server: {
    port: 5175,
    strictPort: true, // 被占用時直接提示，避免自動換到其他 port
  },
});
