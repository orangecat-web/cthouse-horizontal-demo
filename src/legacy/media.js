// 舊版圖片設定保留檔：目前 HomePage.vue 未匯入此檔，實際圖片請改 src/data/site.json 的 images。
// 圖片先留空，以純色佔位。將正式圖片放在 public/images/ 後填入檔名即可。
const image = (name) => `${import.meta.env.BASE_URL}images/${name}`

export const media = {
  home: null, // image('home.jpg'),
  service: null, // image('service.jpg'),
  assets: null, // image('assets.jpg'),
  closing: null, // image('closing.jpg'),
}
