<script setup>
// 本地線條圖示避免依賴遠端圖示字型；名稱只用於選擇 UI 圖形。
defineProps({ name: { type: String, default: 'image' } })
const paths = {
  image: 'M3 4h18v16H3z M3 16l5-5 5 5 3-3 5 5 M16 8h.01',
  home: 'M3 11l9-8 9 8 M5 10v11h5v-7h4v7h5V10',
  heart: 'M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13z',
  phone: 'M5 3h4v18H5z M6 17h2 M14 5h6 M14 10h6 M14 15h6',
  call: 'M7 3l3 5-3 3c2 3 3 4 6 6l3-3 5 3-1 4C9 23 1 15 3 4z',
  pin: 'M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13z M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  bed: 'M3 18v-7h18v7 M3 14h18 M5 11V6h14v5 M7 8h4 M13 8h4 M3 18v3 M21 18v3',
  area: 'M3 21h18V3z M7 17v-2 M10 14v-2 M13 11V9 M16 8V6',
  floor: 'M3 21h6v-6h6V9h6V3 M3 3l18 18',
  calendar: 'M3 5h18v16H3z M3 10h18 M7 3v4 M17 3v4',
  layout: 'M3 3h18v18H3z M12 3v8h9 M3 13h9v8',
  share: 'M5 12l13-7 M5 12l13 7 M5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  print: 'M6 8V3h12v5 M6 17H3V8h18v9h-3 M6 14h12v7H6z',
  play: 'M9 5l12 7-12 7z',
  vr: 'M2 7h20v10h-6l-4-3-4 3H2z M6 10v3 M18 10v3',
  map: 'M2 5l6-3 8 3 6-3v17l-6 3-8-3-6 3z M8 2v17 M16 5v17',
  chart: 'M3 3v18h18 M6 15l5-5 4 2 6-7',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-3a8 8 0 0 1 16 0v3',
  chat: 'M3 3h18v14H8l-5 4z M7 8h10 M7 12h7',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  bell: 'M4 17h16l-2-3V9a6 6 0 0 0-12 0v5z M10 21h4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  arrow: 'M12 21V3 M5 10l7-7 7 7',
  chevron: 'M9 5l7 7-7 7',
  close: 'M5 5l14 14 M19 5L5 19',
  plus: 'M12 4v16 M4 12h16',
  minus: 'M4 12h16',
  fullscreen: 'M3 9V3h6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6',
  rotate: 'M20 8a9 9 0 1 0 1 7 M20 3v5h-5',
  reset: 'M4 8a9 9 0 1 1-1 7 M4 3v5h5',
}
</script>

<template lang="pug">
//- 通用 UI 圖示：裝飾性 SVG，按鈕名稱由外層文字或 aria-label 提供。
svg.property-icon(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true")
  path(:d="paths[name] || paths.image")
</template>
