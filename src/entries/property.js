// 物件頁獨立入口：只掛載直向閱讀的頁面，不註冊首頁橫向切換事件。
import { createApp } from 'vue'
import PropertyPage from '../pages/property/PropertyPage.vue'
import '@fontsource/noto-sans-tc/chinese-traditional-300.css'
import '@fontsource/noto-sans-tc/chinese-traditional-400.css'
import '@fontsource/noto-sans-tc/chinese-traditional-700.css'
import '../pages/property/style.sass'

createApp(PropertyPage).mount('#app')
