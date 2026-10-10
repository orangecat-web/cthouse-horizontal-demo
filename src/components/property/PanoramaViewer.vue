<script setup>
// 環景獨立元件：沿用實驗室的 WebGL 投影及手勢方式，素材與場景說明從 JSON 傳入。
import { computed, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import { PanoramaRenderer, projectPanoramaHotspot } from '../../utils/panorama-renderer'
import { imageUrl } from '../../utils/images'
import PropertyIcon from './PropertyIcon.vue'
const props = defineProps({ config: { type: Object, required: true } })
const root = ref(null)
const canvas = ref(null)
const sceneIndex = ref(0)
const menuOpen = ref(true)
const floorPlanOpen = ref(false)
const menuId = useId()
const floorPlanId = useId()
const size = reactive({ width: 0, height: 0 })
const floorPlan = computed(() => props.config.floorPlan?.sceneIds.includes(scene.value.id) ? props.config.floorPlan : null)
const hotspots = computed(() => loading.value || error.value ? [] : (scene.value.hotspots || []).flatMap(item => {
  if (!props.config.scenes.some(target => target.id === item.targetSceneId)) return []
  const position = projectPanoramaHotspot(item, view, size)
  return position ? [{ ...item, position }] : []
}))
const scene = computed(() => props.config.scenes[sceneIndex.value])
const view = reactive({ yaw: 0, pitch: 0, fov: 75 })
const loading = ref(true)
const error = ref('')
const rotating = ref(false)
const fullscreen = ref(false)
const fallbackFullscreen = ref(false)
let renderer, observer, image, frame = 0, loadSequence = 0, lastFrameAt = 0, savedOverflow, sceneAnimation
const pointers = new Map()
let pinchDistance = 0
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// 繪圖只在視角改變時排入一幀；自動旋轉才持續排幀，以時間差維持相同速度。
function scheduleDraw() {
  if (frame) return
  frame = requestAnimationFrame(timestamp => {
    frame = 0
    if (rotating.value && !loading.value && !error.value) {
      if (lastFrameAt) view.yaw = (view.yaw + Math.min(timestamp - lastFrameAt, 100) * .008) % 360
      lastFrameAt = timestamp
    } else lastFrameAt = 0
    size.width = canvas.value.clientWidth
    size.height = canvas.value.clientHeight
    renderer?.draw(view)
    if (rotating.value && !loading.value && !error.value) scheduleDraw()
  })
}
function resetView() {
  view.yaw = scene.value.initialYaw || 0
  view.pitch = scene.value.initialPitch || 0
  view.fov = 75
  rotating.value = false
  pointers.clear()
  pinchDistance = 0
  scheduleDraw()
}
// 共用選場景入口供選單、格局圖與空間熱點使用；收起選單讓畫面保留觀看空間。
function navigate(sceneId) {
  const target = props.config.scenes.findIndex(item => item.id === sceneId)
  if (target < 0) return
  menuOpen.value = false
  if (target !== sceneIndex.value) sceneIndex.value = target
}
function toggleFloorPlan() { floorPlanOpen.value = !floorPlanOpen.value; if (floorPlanOpen.value) menuOpen.value = false }
function toggleMenu() { menuOpen.value = !menuOpen.value; if (menuOpen.value) floorPlanOpen.value = false }
function cancelSceneAnimation() { sceneAnimation?.cancel(); sceneAnimation = null }
// 舊景淡出與新圖載入並行，完成後更新 GPU 再淡入；序號避免快速切換套入過時圖片。
function loadScene() {
  if (!renderer || !scene.value) return
  if (renderer.gl.isContextLost()) { loading.value = false; error.value = props.config.webglError; return }
  const sequence = ++loadSequence
  if (image) image.onload = image.onerror = null
  cancelSceneAnimation()
  stopRotation()
  pointers.clear()
  loading.value = true
  error.value = ''
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fade = renderer.hasImage && !reduced ? canvas.value.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }) : null
  sceneAnimation = fade
  const incoming = new Image()
  image = incoming
  incoming.onload = async () => {
    await fade?.finished.catch(() => {})
    if (sequence !== loadSequence) return
    try {
      renderer.setImage(incoming)
      resetView()
      renderer.draw(view)
      loading.value = false
      cancelSceneAnimation()
      if (!reduced) {
        const entering = canvas.value.animate([{ opacity: 0, transform: 'scale(1.035)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, easing: 'ease-out', fill: 'both' })
        sceneAnimation = entering
        entering.finished.catch(() => {}).then(() => { if (sequence === loadSequence) cancelSceneAnimation() })
      }
    } catch (failure) { cancelSceneAnimation(); loading.value = false; error.value = failure.message }
  }
  incoming.onerror = () => { if (sequence === loadSequence) { cancelSceneAnimation(); loading.value = false; error.value = props.config.loadError } }
  incoming.src = imageUrl(scene.value.image)
}
function initialize() {
  try { renderer?.destroy(); renderer = new PanoramaRenderer(canvas.value); loadScene() }
  catch { loading.value = false; error.value = props.config.webglError }
}
watch(sceneIndex, loadScene)
function stopRotation() { rotating.value = false; lastFrameAt = 0 }
function zoom(amount) { stopRotation(); view.fov = clamp(view.fov + amount, 35, 100); scheduleDraw() }
function onWheel(event) { if (loading.value || error.value) return; event.preventDefault(); zoom(event.deltaY > 0 ? 5 : -5) }
// 指標捕捉只在 canvas 上；單指／滑鼠拖曳轉視角，雙指用距離比例縮放。
function onPointerDown(event) {
  if (loading.value || error.value || (event.pointerType === 'mouse' && event.button !== 0)) return
  stopRotation()
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pointers.size === 2) {
    const [first, second] = [...pointers.values()]
    pinchDistance = Math.hypot(first.x - second.x, first.y - second.y)
  }
  canvas.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}
function onPointerMove(event) {
  const previous = pointers.get(event.pointerId)
  if (!previous) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pointers.size > 1) {
    const [first, second] = [...pointers.values()]
    const distance = Math.hypot(first.x - second.x, first.y - second.y)
    if (pinchDistance > 0 && distance > 0) view.fov = clamp(view.fov * pinchDistance / distance, 35, 100)
    pinchDistance = distance
  } else {
    const scale = view.fov / Math.max(canvas.value.clientHeight, 1)
    view.yaw = (view.yaw - (event.clientX - previous.x) * scale) % 360
    view.pitch = clamp(view.pitch + (event.clientY - previous.y) * scale, -80, 80)
  }
  scheduleDraw()
}
function onPointerEnd(event) {
  pointers.delete(event.pointerId)
  pinchDistance = 0
  if (canvas.value.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId)
}
function onKey(event) {
  if (event.target !== canvas.value || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(event.key)) return
  event.preventDefault()
  stopRotation()
  if (['+', '='].includes(event.key)) zoom(-5)
  else if (event.key === '-') zoom(5)
  else if (event.key === 'ArrowLeft') view.yaw -= 5
  else if (event.key === 'ArrowRight') view.yaw += 5
  else view.pitch = clamp(view.pitch + (event.key === 'ArrowUp' ? 5 : -5), -80, 80)
  scheduleDraw()
}
function toggleRotation() { rotating.value = !rotating.value; lastFrameAt = 0; scheduleDraw() }
// 使用 Fullscreen API；不支援時用固定定位替代，離開與解除元件都還原 body 捲動。
function closeFallback() {
  if (!fallbackFullscreen.value) return
  fallbackFullscreen.value = false
  document.body.style.overflow = savedOverflow, sceneAnimation
  fullscreen.value = false
  scheduleDraw()
}
async function toggleFullscreen() {
  if (fallbackFullscreen.value) { closeFallback(); return }
  try {
    if (document.fullscreenElement === root.value) await document.exitFullscreen()
    else if (root.value.requestFullscreen) await root.value.requestFullscreen()
    else throw new Error('Fullscreen unavailable')
  } catch {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fallbackFullscreen.value = true
    fullscreen.value = true
    scheduleDraw()
  }
}
function onFullscreenChange() { fullscreen.value = document.fullscreenElement === root.value; scheduleDraw() }
function onEscape(event) { if (event.key === 'Escape') closeFallback() }
function onContextLost(event) {
  event.preventDefault()
  loadSequence++
  if (image) image.onload = image.onerror = null
  cancelSceneAnimation()
  stopRotation()
  loading.value = false
  error.value = props.config.webglError
}
// 監聽元件尺寸與全螢幕狀態；圖像、RAF、observer、全域監聽及 GPU 資源全部清理。
onMounted(() => {
  initialize()
  observer = new ResizeObserver(scheduleDraw)
  observer.observe(root.value)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('keydown', onEscape)
})
onBeforeUnmount(() => {
  loadSequence++
  cancelSceneAnimation()
  if (image) image.onload = image.onerror = null
  closeFallback()
  cancelAnimationFrame(frame)
  observer?.disconnect()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('keydown', onEscape)
  renderer?.destroy()
})
</script>

<template lang="pug">
//- 可操作的 360 環景：示範場景非此物件；JSON 換成正式 2:1 全景圖即可替換。
.panorama-viewer(ref="root" :class="{ 'is-fullscreen-fallback': fallbackFullscreen }" :data-scene="scene.id" :data-yaw="view.yaw" :data-pitch="view.pitch" :data-fov="view.fov")
  canvas.panorama-canvas(ref="canvas" tabindex="0" :aria-label="config.canvasLabel" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerEnd" @pointercancel="onPointerEnd" @lostpointercapture="onPointerEnd" @wheel="onWheel" @keydown="onKey" @webglcontextlost="onContextLost" @webglcontextrestored="initialize")
  //- 左上房間選單：與實驗室相同的浮動淺色選單，橘色標示目前場景。
  .panorama-scene-menu(:aria-label="config.sceneLabel")
    button.panorama-menu-toggle(type="button" :aria-expanded="menuOpen" :aria-controls="menuId" @click="toggleMenu")
      .panorama-menu-toggle-text
        small {{ menuOpen ? config.menuLabel + ' / ' + String(config.scenes.length).padStart(2, '0') : config.currentLocationLabel }}
        span {{ scene.label }}
      span.panorama-menu-chevron(aria-hidden="true") {{ menuOpen ? '⌃' : '⌄' }}
    .panorama-menu-list(v-show="menuOpen" :id="menuId")
      button.panorama-menu-option(v-for="item in config.scenes" :key="item.id" type="button" :aria-current="item.id === scene.id ? 'true' : undefined" :class="{ 'is-active': item.id === scene.id }" @click="navigate(item.id)") {{ item.label }}
  .panorama-topline {{ config.demoLabel }}
  //- 左下可展開格局圖：圖片與百分比熱區來源於 JSON，與選單／場景熱點共用 navigate。
  .panorama-floorplan(v-if="floorPlan" :class="{ 'is-open': floorPlanOpen }")
    button.panorama-floorplan-toggle(type="button" :aria-expanded="floorPlanOpen" :aria-controls="floorPlanId" @click="toggleFloorPlan")
      span {{ floorPlanOpen ? config.collapseFloorPlanLabel : config.expandFloorPlanLabel }}
      span(aria-hidden="true") {{ floorPlanOpen ? '⌄' : '⌃' }}
    .panorama-floorplan-content(v-show="floorPlanOpen" :id="floorPlanId")
      .panorama-floorplan-map
        img(:src="imageUrl(floorPlan.image)" :alt="floorPlan.alt")
        button.panorama-map-spot(v-for="spot in floorPlan.spots" :key="spot.id" type="button" :aria-label="spot.label" :aria-current="spot.sceneId === scene.id ? 'location' : undefined" :class="{ 'is-current': spot.sceneId === scene.id }" :style="{ left: spot.left + '%', top: spot.top + '%', width: spot.width + '%', height: spot.height + '%' }" @click="navigate(spot.sceneId)")
          span {{ spot.label }}
      p {{ floorPlan.caption }}
  //- 空間熱點依 yaw／pitch 投影到螢幕，背面或視野外不顯示，可從房間走到走廊並返回。
  button.panorama-hotspot(v-for="hotspot in hotspots" :key="hotspot.id" type="button" :style="hotspot.position" :aria-label="hotspot.label" @click="navigate(hotspot.targetSceneId)")
    span.panorama-hotspot-icon
      PropertyIcon(name="diagonal")
    span.panorama-hotspot-label {{ hotspot.label }}
  .panorama-status(v-if="loading || error" role="status")
    p {{ error || config.loadingLabel }}
    button(v-if="error" type="button" @click="initialize") {{ config.retryLabel }}
  .panorama-help {{ config.helpLabel }}
  .panorama-controls(role="group" :aria-label="config.controlsLabel")
    button(type="button" :aria-label="config.zoomInLabel" :title="config.zoomInLabel" :disabled="loading || !!error" @click="zoom(-5)")
      PropertyIcon(name="plus")
    button(type="button" :aria-label="config.zoomOutLabel" :title="config.zoomOutLabel" :disabled="loading || !!error" @click="zoom(5)")
      PropertyIcon(name="minus")
    button(type="button" :aria-label="config.rotateLabel" :title="config.rotateLabel" :aria-pressed="rotating" :disabled="loading || !!error" @click="toggleRotation")
      PropertyIcon(name="rotate")
    button(type="button" :aria-label="config.resetLabel" :title="config.resetLabel" :disabled="loading || !!error" @click="resetView")
      PropertyIcon(name="reset")
    button(type="button" :aria-label="config.fullscreenLabel" :title="config.fullscreenLabel" :aria-pressed="fullscreen" @click="toggleFullscreen")
      PropertyIcon(name="fullscreen")
</template>
