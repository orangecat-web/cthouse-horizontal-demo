<script setup>
defineProps({
  pages: { type: Array, required: true },
  active: { type: Number, required: true },
})
const emit = defineEmits(['change'])
</script>

<template lang="pug">
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
    span(aria-hidden="true") {{ page.icon }}
</template>
