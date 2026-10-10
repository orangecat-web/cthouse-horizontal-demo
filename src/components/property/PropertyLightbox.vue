<script setup>
// 參考實驗室 MediaLightbox：原生 dialog 管理焦點，WAAPI 處理來源位置進出場。
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import PropertyMedia from './PropertyMedia.vue'
import PropertyIcon from './PropertyIcon.vue'
import { imageUrl } from '../../utils/images'
const props = defineProps({ items: { type: Array, required: true }, labels: { type: Object, required: true }, ariaLabel: { type: String, default: '' }, closeLabel: { type: String, default: '' } })
const dialog = ref(null)
const shell = ref(null)
const motion = ref(null)
const stage = ref(null)
const index = ref(0)
const current = computed(() => props.items[index.value])
const currentLabel = computed(() => current.value?.label || current.value?.title || props.labels.photos)
const active = ref(false)
const ready = ref(false)
const closing = ref(false)
const thumbnails = ref(false)
const playing = ref(false)
const fullscreen = ref(false)
const view = reactive({ zoom: 1, x: 0, y: 0 })
const dragging = ref(false)
let origin, originalIndex, animations = [], operation = 0, interval, decodeTimer, drag, swipe, moved = false
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
function cancelAnimations() { animations.forEach(animation => animation.cancel()); animations = [] }
// 保存來源縮圖相對燈箱中心的偏移；換到其他照片後改為中心縮回，避免飛向不對應的縮圖。
function sourceTransform() {
  const target = motion.value.getBoundingClientRect()
  if (!origin?.isConnected || index.value !== originalIndex || !target.width || !target.height) return 'translate(0, 20px) scale(.32)'
  const source = (origin.querySelector('img, .property-media') || origin).getBoundingClientRect()
  // contain 的實際影像尺寸可能小於舞台；以影像比例計算，避免直幅／方形照片進場變形。
  const image = motion.value.querySelector('.lightbox-media:not(.lightbox-switch-leave-active) img')
  const fit = image?.naturalWidth ? Math.min(target.width / image.naturalWidth, target.height / image.naturalHeight) : 1
  const width = image?.naturalWidth ? image.naturalWidth * fit : target.width
  const height = image?.naturalHeight ? image.naturalHeight * fit : target.height
  return `translate(${source.left + source.width / 2 - target.left - target.width / 2}px, ${source.top + source.height / 2 - target.top - target.height / 2}px) scale(${Math.min(.32, source.width / width)}, ${Math.min(.32, source.height / height)})`
}
async function runAnimation(keyframes, duration, token) {
  cancelAnimations()
  if (reducedMotion()) return
  const [shellFrames, mediaFrames] = keyframes
  const batch = [dialog.value.animate(shellFrames, { duration: Math.min(duration, 500), easing: 'ease-in-out', fill: 'both' }), motion.value.animate(mediaFrames, { duration, easing: 'cubic-bezier(.42, 0, .18, 1)', fill: 'both' })]
  animations = batch
  await Promise.all(batch.map(animation => animation.finished.catch(() => {})))
  if (token === operation) cancelAnimations()
}
async function openAt(nextIndex = 0, trigger = null) {
  if (!props.items[nextIndex] || dialog.value.open || active.value) return
  const token = ++operation
  origin = trigger
  originalIndex = nextIndex
  index.value = nextIndex
  active.value = true
  ready.value = false
  closing.value = false
  resetView()
  await nextTick()
  dialog.value.showModal()
  // 等圖片解碼最多 700ms，佔位與慢連線也能開啟；解除元件時清理等待計時器。
  const image = motion.value.querySelector('img')
  if (image && !image.complete) await Promise.race([image.decode().catch(() => {}), new Promise(resolve => { decodeTimer = setTimeout(resolve, 700) })])
  clearTimeout(decodeTimer)
  if (token !== operation || !dialog.value?.open) return
  ready.value = true
  await nextTick()
  await runAnimation([[{ opacity: 0 }, { opacity: 1 }], [{ transform: sourceTransform(), opacity: .65 }, { transform: 'translate(0, 0) scale(1)', opacity: 1 }]], 1150, token)
}
function stopSlideshow() { clearInterval(interval); playing.value = false }
function resetView() { view.zoom = 1; view.x = 0; view.y = 0; drag = null; dragging.value = false }
async function close() {
  if (!dialog.value?.open || closing.value) return
  const token = ++operation
  cancelAnimations()
  stopSlideshow()
  if (document.fullscreenElement === shell.value) await document.exitFullscreen().catch(() => {})
  resetView()
  closing.value = true
  await nextTick()
  await runAnimation([[{ opacity: 1 }, { opacity: 0 }], [{ transform: 'translate(0, 0) scale(1)', opacity: 1 }, { transform: sourceTransform(), opacity: 0 }]], 380, token)
  if (token === operation) dialog.value?.close()
}
function onClosed() {
  operation++
  cancelAnimations()
  stopSlideshow()
  clearTimeout(decodeTimer)
  ready.value = active.value = closing.value = fullscreen.value = thumbnails.value = false
  resetView()
  origin?.focus({ preventScroll: true })
  origin = null
}
function select(nextIndex) {
  if (closing.value || nextIndex === index.value || !props.items[nextIndex]) return
  cancelAnimations()
  index.value = nextIndex
  resetView()
}
function turn(direction) { select((index.value + direction + props.items.length) % props.items.length) }
function toggleSlideshow() {
  if (playing.value) { stopSlideshow(); return }
  if (props.items.length < 2) return
  playing.value = true
  interval = setInterval(() => turn(1), 4000)
}
// 根據 contain 後的實際圖片尺寸限制平移，避免縮放後把照片拖離舞台。
function constrainPan() {
  const image = motion.value?.querySelector('.lightbox-media:not(.lightbox-switch-leave-active) img')
  if (!image?.naturalWidth || !stage.value) { view.x = view.y = 0; return }
  // client 尺寸不受進場 transform 影響，動畫期間操作縮放也能維持正確邊界。
  const fit = Math.min(motion.value.clientWidth / image.naturalWidth, motion.value.clientHeight / image.naturalHeight)
  const maxX = Math.max(0, (image.naturalWidth * fit * view.zoom - stage.value.clientWidth) / 2)
  const maxY = Math.max(0, (image.naturalHeight * fit * view.zoom - stage.value.clientHeight) / 2)
  view.x = Math.max(-maxX, Math.min(maxX, view.x))
  view.y = Math.max(-maxY, Math.min(maxY, view.y))
}
function zoom(amount) {
  if (!current.value.image || closing.value) return
  view.zoom = Math.max(1, Math.min(3, +(view.zoom + amount).toFixed(2)))
  if (view.zoom === 1) view.x = view.y = 0
  else constrainPan()
}
function startPointer(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  moved = false
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY }
  if (view.zoom <= 1) return
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: view.x, top: view.y }
  dragging.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
  event.preventDefault()
}
function movePointer(event) {
  if (swipe?.id === event.pointerId && Math.hypot(event.clientX - swipe.x, event.clientY - swipe.y) > 5) moved = true
  if (drag?.id !== event.pointerId) return
  view.x = drag.left + event.clientX - drag.x
  view.y = drag.top + event.clientY - drag.y
  constrainPan()
}
function endPointer(event) {
  if (event.type === 'pointerup' && view.zoom === 1 && event.pointerType !== 'mouse' && swipe?.id === event.pointerId) {
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1)
  }
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  drag = swipe = null
  dragging.value = false
}
function toggleZoom() { if (!moved && current.value.image) { view.zoom = view.zoom > 1 ? 1 : 2; view.x = view.y = 0 } }
function onKey(event) {
  if (event.target.closest('input, textarea, select')) return
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); turn(event.key === 'ArrowRight' ? 1 : -1) }
}
async function toggleFullscreen() {
  try {
    // Fullscreen API 不接受 dialog 本身，改由內層完整燈箱取得全螢幕。
    if (document.fullscreenElement === shell.value) await document.exitFullscreen()
    else await shell.value.requestFullscreen?.()
  } catch { /* dialog 原本已覆蓋整個視窗；不支援 API 仍可看圖。 */ }
}
function onFullscreenChange() { fullscreen.value = document.fullscreenElement === shell.value; resetView() }
onBeforeUnmount(() => {
  operation++
  cancelAnimations()
  stopSlideshow()
  clearTimeout(decodeTimer)
  dialog.value?.close()
})
defineExpose({ openAt, close })
</script>

<template lang="pug">
//- 滿版燈箱：來源縮圖進出場、圖片淡入換張、工具列、縮圖清單與手機滑動。
dialog.property-lightbox(ref="dialog" :class="{ 'is-ready': ready, 'is-closing': closing }" :aria-label="ariaLabel || labels.photos" @cancel.prevent="close" @close="onClosed" @keydown="onKey" @fullscreenchange="onFullscreenChange")
  .lightbox-shell(v-if="active" ref="shell")
    .lightbox-toolbar
      p.lightbox-count(aria-live="polite") {{ index + 1 }} / {{ items.length }}
      .lightbox-actions
        button(type="button" :aria-label="thumbnails ? labels.hideThumbnails : labels.showThumbnails" :aria-pressed="thumbnails" @click="thumbnails = !thumbnails")
          PropertyIcon(name="thumbnails")
        button(type="button" :aria-label="labels.zoomInPhoto" :disabled="!current.image || view.zoom >= 3" @click="zoom(.25)")
          PropertyIcon(name="plus")
        button(type="button" :aria-label="labels.zoomOutPhoto" :disabled="!current.image || view.zoom <= 1" @click="zoom(-.25)")
          PropertyIcon(name="minus")
        button(type="button" :aria-label="playing ? labels.pauseSlideshow : labels.startSlideshow" :aria-pressed="playing" @click="toggleSlideshow")
          PropertyIcon(:name="playing ? 'pause' : 'play'")
        button(type="button" :aria-label="fullscreen ? labels.exitLightboxFullscreen : labels.lightboxFullscreen" @click="toggleFullscreen")
          PropertyIcon(name="fullscreen")
        button(type="button" :aria-label="closeLabel || labels.close" @click="close")
          PropertyIcon(name="close")
    .lightbox-stage(ref="stage" @click.self="close")
      .lightbox-motion(ref="motion")
        Transition(name="lightbox-switch")
          .lightbox-media(:key="current.id" :class="{ 'is-zoomed': view.zoom > 1, 'is-dragging': dragging }" @pointerdown="startPointer" @pointermove="movePointer" @pointerup="endPointer" @pointercancel="endPointer" @click="toggleZoom" @wheel.prevent="zoom($event.deltaY < 0 ? .25 : -.25)" @dragstart.prevent)
            PropertyMedia(:image="current.image" :label="currentLabel" :style="{ transform: 'translate3d(' + view.x + 'px,' + view.y + 'px,0) scale(' + view.zoom + ')' }")
      button.lightbox-arrow.lightbox-prev(type="button" :aria-label="labels.previousPhoto" @click="turn(-1)")
        PropertyIcon.chevron-back(name="chevron")
      button.lightbox-arrow.lightbox-next(type="button" :aria-label="labels.nextPhoto" @click="turn(1)")
        PropertyIcon(name="chevron")
    .lightbox-bottom
      .lightbox-thumbnails(v-if="thumbnails" :aria-label="labels.photos")
        button(v-for="(item, itemIndex) in items" :key="item.id" type="button" :aria-label="item.label || item.title" :aria-current="itemIndex === index ? 'true' : undefined" @click="select(itemIndex)")
          img(v-if="item.image" :src="imageUrl(item.image)" alt="")
          span(v-else) {{ item.label || item.title }}
      //- 媒體預覽可傳入說明 slot，共用所有動畫與控制，不另建瞬間顯示的燈箱。
      slot(name="caption" :item="current" :close="close")
        p.lightbox-caption {{ currentLabel }}
</template>
