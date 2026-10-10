// 圖片檔名相對於 public/images；依頁面解析完整網址，支援 CSS 與子目錄部署。
export function imageUrl(name) {
  const path = `${import.meta.env.BASE_URL}images/${encodeURI(name)}`
  return typeof document === 'undefined' ? path : new URL(path, document.baseURI).href
}
