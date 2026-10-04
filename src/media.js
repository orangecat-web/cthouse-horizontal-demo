// 圖片先留空，以純色佔位。將正式圖片放在 public/images/ 後填入檔名即可。
const image = (name) => `${import.meta.env.BASE_URL}images/${name}`

export const media = {
  home: null, // image('home.jpg'),
  service: null, // image('service.jpg'),
  assets: null, // image('assets.jpg'),
  closing: null, // image('closing.jpg'),
}
