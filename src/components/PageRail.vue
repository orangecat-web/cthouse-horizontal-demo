<script setup>
// 左側頁籤只負責呈現：頁面資料與選中索引由 App.vue 傳入。
defineProps({
  pages: { type: Array, required: true },
  active: { type: Number, required: true },
})
// 點擊時送出 change(index)，實際切頁由父元件 goTo 處理。
const emit = defineEmits(['change'])
</script>

<template lang="pug">
//- 共用頁籤列：一筆 pages 資料對應一個按鈕；aria-current 標示當前頁。
aside.page-rail(aria-label="頁面切換")
  button(
    v-for="(page, index) in pages"
    :key="page.id"
    type="button"
    :class="{ selected: active === index }"
    :aria-label="`前往${page.label}`"
    :aria-current="active === index ? 'page' : undefined"
    @click="emit('change', index)"
  )
    //- 圖示來自 pages[].icon；按鈕已有朗讀名稱，因此圖示不重複朗讀。
    span(aria-hidden="true") {{ page.icon }}
</template>
