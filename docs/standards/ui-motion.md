# 網頁互動標配

使用者已確認：GoTop 的平滑加減速與 Lightbox 的 JavaScript 動態效果是標配，不得省略。此規範要帶入後續新專案，不能依賴聊天紀錄或個別 agent 的記憶。

參考：<https://orangecat.com.tw/lab.html> 的 GoTop 與 **03 / MEDIA & LIGHTBOX**。

## GoTop

- 有回到頂部功能就必須有平滑加減速；預設 600ms cosine ease，公式 `(1 - cos(π × progress)) / 2`。
- 從當前捲動位置執行，不能直接跳到 0。重複點擊先取消舊動畫，再從當下位置重新開始。
- 滾輪、觸控、指標按下或捲動按鍵可取消，不能搶回使用者的操作；完成及元件解除時清理 RAF／事件。
- 不重複疊加瀏覽器 smooth 和逐幀 JS 捲動。

## Lightbox

- 必須使用 JavaScript 量測點擊來源，從縮圖位置放大進場；不能只呼叫 showModal、切換 display 或瞬間顯示大圖。
- 參考預設：媒體進場 1150ms，`cubic-bezier(.42, 0, .18, 1)`，外層淡入 500ms，關閉縮回／淡出 380ms，換圖淡入與比例過渡 420ms。
- 同一張圖關閉時回到原縮圖位置；換到其他圖後以中心縮回，避免飛向錯誤來源。
- 保留前後切換、鍵盤、Escape、背景關閉、縮圖、縮放／平移、手機滑動與輪播；新專案按媒體類型決定哪些控制適用，但進出場與換圖動畫不可省略。
- 關閉前播放離場動畫，再解除 dialog／捲動鎖定；快速操作、圖片失敗及元件移除要清理動畫、監聽和計時器。
- 保留原生焦點管理，關閉後回到觸發元素；動畫不能阻止 Escape 或正常操作。

## 驗證與使用者偏好

- 必須在瀏覽器確認有中間動畫畫面、來源位置正確、離場結束才關閉，以及快速切換／取消／手機操作；build 成功不能代替動態驗證。
- 尊重瀏覽器 `prefers-reduced-motion`：減少動態時可立即顯示／關閉，所有操作仍保留。這是使用者明示的系統偏好，不是省略一般模式的動畫。
- 文字尺寸、配色與控制項布局遵循各專案規範；本專案文字至少 16px。

## 新專案交接

1. 將本檔複製到新 repository 的 `docs/standards/ui-motion.md`。
2. 在新 repository 的 `AGENTS.md` 加入下方規則，並在 README 記錄規範與元件位置。
3. Vue／Vite 專案可參考此專案的 `src/utils/animated-scroll.js` 和 `src/components/property/PropertyLightbox.vue`；移植時包含相關樣式、圖示及資料欄位，驗證後才標記完成。
4. 接手既有專案時先讀既有規範及確認範圍，不在沒有任務授權時重寫其他專案。

可複製到 AGENTS.md：

> GoTop 的平滑加減速及 Lightbox 的 JavaScript 進出場／換圖動畫是所有網頁專案的標配，不得省略。實作及驗證依 `docs/standards/ui-motion.md`；新專案建立或移植時必須一併帶入規範，不能只留在聊天紀錄。
