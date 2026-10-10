<script setup>
// 側邊連結資料由 site.json 傳入。
defineProps({
  links: { type: Array, required: true },
})
</script>

<template lang="pug">
//- 側邊連結列：使用 a 前往各項 href
aside.page-rail(aria-label="快捷連結")
  div
    a(
      v-for="link in links"
      :key="link.id"
      :href="link.href"
      :aria-label="link.label"
    )
      span.material-symbols-outlined(aria-hidden="true") {{ link.icon }}
</template>