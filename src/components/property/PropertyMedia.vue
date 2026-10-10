<script setup>
// 可替換素材容器：image 放 public/images 檔名，embedUrl 放正式媒體嵌入網址；空值保留位置。
import { imageUrl } from '../../utils/images'
import PropertyIcon from './PropertyIcon.vue'
defineProps({
  image: { type: String, default: null },
  embedUrl: { type: String, default: null },
  label: { type: String, required: true },
  icon: { type: String, default: 'image' },
})
</script>

<template lang="pug">
//- 圖片、VR、地圖與影音共用佔位；提供素材後保留既有區塊比例。
.property-media
  iframe(v-if="embedUrl" :src="embedUrl" :title="label" loading="lazy" allow="fullscreen" allowfullscreen)
  img(v-else-if="image" :src="imageUrl(image)" :alt="label" loading="lazy")
  .media-placeholder(v-else)
    PropertyIcon(:name="icon")
    span {{ label }}
</template>
