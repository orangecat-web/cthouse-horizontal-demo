<script setup>
// 無地圖金鑰的 Demo 示意地圖：假設施與座標來自 JSON，非真實定位服務。
import { reactive, ref } from 'vue'
import PropertyIcon from './PropertyIcon.vue'
const props = defineProps({ items: { type: Array, required: true }, selectedId: { type: String, default: null }, config: { type: Object, required: true } })
const emit = defineEmits(['select'])
const stage = ref(null)
const view = reactive({ scale: 1, x: 0, y: 0 })
let drag
function zoom(amount) { view.scale = Math.max(1, Math.min(2.5, view.scale + amount)); if (view.scale === 1) reset() }
function reset() { view.scale = 1; view.x = 0; view.y = 0 }
// 在底圖拖曳，不從設施按鈕啟動；座標限制避免示意底圖完全離開容器。
function start(event) {
  if (event.target.closest('button') || (event.pointerType === 'mouse' && event.button !== 0)) return
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: view.x, top: view.y }
  stage.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}
function move(event) {
  if (!drag || drag.id !== event.pointerId) return
  const maxX = stage.value.clientWidth * (view.scale - 1) / 2
  const maxY = stage.value.clientHeight * (view.scale - 1) / 2
  view.x = Math.max(-maxX, Math.min(maxX, drag.left + event.clientX - drag.x))
  view.y = Math.max(-maxY, Math.min(maxY, drag.top + event.clientY - drag.y))
}
function end(event) {
  if (!drag || drag.id !== event.pointerId) return
  drag = null
  if (stage.value.hasPointerCapture(event.pointerId)) stage.value.releasePointerCapture(event.pointerId)
}
</script>

<template lang="pug">
//- 簡化底圖與 HTML 設施標記：文字不隨 SVG viewBox 縮小，保留 16px 下限。
.demo-map(:data-zoom="view.scale")
  .demo-map-stage(ref="stage" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end")
    .demo-map-world(:style="{ transform: 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.scale + ')' }")
      svg.demo-map-background(viewBox="0 0 900 480" preserveAspectRatio="none" aria-hidden="true")
        rect(width="900" height="480" fill="#f1eee7")
        path(d="M680 0L585 480H715L850 0Z" fill="#dbeaf0")
        path(d="M0 360C240 230 290 230 470 330L660 410V480H0Z" fill="#e0eadb")
        g(fill="#e4e0d7" stroke="#d9d4c8" stroke-width="2")
          rect(x="45" y="45" width="125" height="85" rx="5")
          rect(x="200" y="45" width="180" height="85" rx="5")
          rect(x="410" y="45" width="125" height="85" rx="5")
          rect(x="45" y="170" width="125" height="110" rx="5")
          rect(x="200" y="170" width="180" height="110" rx="5")
          rect(x="410" y="170" width="125" height="110" rx="5")
          rect(x="200" y="325" width="180" height="95" rx="5")
          rect(x="410" y="325" width="125" height="95" rx="5")
        g(fill="none" stroke="#fff" stroke-width="18")
          path(d="M0 150H630 M0 300H660 M185 0V480 M395 0V480 M550 0V480")
        path(d="M0 440C240 330 450 390 900 100" stroke="#f1d788" stroke-width="28" fill="none")
        path(d="M0 440C240 330 450 390 900 100" stroke="#fff5d4" stroke-width="17" fill="none")
      span.demo-road.demo-road-horizontal {{ config.roadLabel }}
      span.demo-road.demo-road-vertical {{ config.laneLabel }}
      span.demo-park {{ config.parkLabel }}
      button.demo-map-marker(v-for="(item, index) in items" :key="item.id" type="button" :class="{ 'is-selected': selectedId === item.id }" :style="{ left: item.x + '%', top: item.y + '%' }" :aria-label="item.name + '，' + item.distance" :aria-pressed="selectedId === item.id" @click="emit('select', item.id)") {{ index + 1 }}
      .demo-property-pin(:style="{ left: config.propertyPosition.x + '%', top: config.propertyPosition.y + '%' }")
        PropertyIcon(name="pin")
        span {{ config.propertyLabel }}
  .demo-map-zoom(role="group" :aria-label="config.controlsLabel")
    button(type="button" :aria-label="config.zoomInLabel" :disabled="view.scale >= 2.5" @click="zoom(.25)")
      PropertyIcon(name="plus")
    button(type="button" :aria-label="config.zoomOutLabel" :disabled="view.scale <= 1" @click="zoom(-.25)")
      PropertyIcon(name="minus")
    button(type="button" :aria-label="config.resetLabel" @click="reset")
      PropertyIcon(name="reset")
  p.demo-map-caption {{ config.demoLabel }}
</template>
