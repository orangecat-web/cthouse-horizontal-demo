<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PageRail from './components/PageRail.vue'
import site from './data/site.json'

const pages = site.pages
const active = ref(0)
const searchMode = ref(site.home.defaultMode)
const notice = ref('')
const current = computed(() => pages[active.value])
const imageUrl = (name) => `${import.meta.env.BASE_URL}images/${encodeURI(name)}`
const photoStyle = (key) => site.images[key] ? { '--panel-image': `url('${imageUrl(site.images[key])}')` } : undefined
let wheelTotal = 0
let lastWheelAt = 0
let lastPageChangeAt = -Infinity
let lastWheelDirection = 0
let noticeTimer
let touchX = 0
let touchY = 0

function compact() { return window.matchMedia('(max-width: 760px) and (pointer: coarse)').matches }
function goTo(index) {
  const next = Math.max(0, Math.min(index, pages.length - 1))
  active.value = next
  if (compact()) document.getElementById(pages[next].id)?.scrollIntoView({ behavior: 'smooth' })
}
function goToPage(id) {
  const index = pages.findIndex(page => page.id === id)
  if (index !== -1) goTo(index)
}
// 固定切頁間隔，不因持續收到滾輪事件而無限延長；反向滾動可立即返回。
function onWheel(event) {
  if (compact() || event.ctrlKey) return
  event.preventDefault()
  const axis = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
  const pixels = event.deltaMode === 1 ? axis * 16 : event.deltaMode === 2 ? axis * window.innerHeight : axis
  if (!pixels) return
  const direction = Math.sign(pixels)
  const now = performance.now()
  if (now - lastWheelAt > 200 || (wheelTotal && Math.sign(wheelTotal) !== direction)) wheelTotal = 0
  lastWheelAt = now
  if (now - lastPageChangeAt < 1000 && direction === lastWheelDirection) return
  wheelTotal += pixels
  if (Math.abs(wheelTotal) < 36) return
  lastPageChangeAt = now
  lastWheelDirection = direction
  goTo(active.value + direction)
  wheelTotal = 0
}
function onKey(event) {
  if (compact() || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return
  const direction = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0
  if (direction) { event.preventDefault(); goTo(active.value + direction) }
  else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); goTo(event.key === 'Home' ? 0 : pages.length - 1) }
}
function onTouchStart(event) { touchX = event.changedTouches[0].screenX; touchY = event.changedTouches[0].screenY }
function onTouchEnd(event) {
  if (compact()) return
  const dx = touchX - event.changedTouches[0].screenX
  const dy = touchY - event.changedTouches[0].screenY
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) goTo(active.value + Math.sign(dx))
}
function demoAction() {
  notice.value = site.messages.demoAction
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3000)
}
onMounted(() => { document.addEventListener('wheel', onWheel, { passive: false, capture: true }); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('wheel', onWheel, true); window.removeEventListener('keydown', onKey); clearTimeout(noticeTimer) })
</script>

<template>
  <div class="site-shell" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
    <header class="site-header" :class="{ 'on-photo': active === 0, 'on-service': active === 1 }">
      <nav class="top-nav" aria-label="主要導覽"><button v-for="item in site.navigation.primary" :key="item.label" @click="goToPage(item.page)">{{ item.label }}</button></nav>
      <button class="brand" :aria-label="`${site.brand.name}，回首頁`" @click="goTo(0)"><img class="brand-logo" :src="imageUrl(site.images.logo)" alt="" width="80" height="37"></button>
      <nav class="top-nav" aria-label="公司導覽"><button v-for="item in site.navigation.company" :key="item.label" @click="goToPage(item.page)">{{ item.label }}</button></nav>
    </header>
    <PageRail :pages="pages" :active="active" @change="goTo" />
    <main class="horizontal-track" :style="{ transform: `translate3d(-${active * 100}vw, 0, 0)` }">
      <section id="home" class="panel panel-home" :class="{ 'is-active': active === 0 }" :style="photoStyle('home')" aria-labelledby="home-title">
        <div class="proposal-photo home-photo" aria-hidden="true"></div>
        <div class="home-title anim rise"><h1 id="home-title">{{ site.home.title }}</h1></div>
        <div class="search-card anim rise delay-1">
          <div class="search-tabs" role="group" aria-label="找屋方式"><button v-for="mode in site.home.modes" :key="mode" :class="{ chosen: searchMode === mode }" :aria-pressed="searchMode === mode" @click="searchMode = mode">{{ mode }}</button></div>
          <div class="search-options"><label v-for="filter in site.home.filters" :key="filter.label"><span>{{ filter.label }}</span><select :aria-label="filter.label"><option v-for="option in filter.options" :key="option">{{ option }}</option></select></label></div>
          <div class="search-keyword"><input aria-label="關鍵字" :placeholder="site.home.keywordPlaceholder"><button @click="demoAction">{{ site.home.searchButton }}</button></div>
        </div>
        <button class="slide-cue" aria-label="前往星級服務" @click="goTo(1)">→</button>
      </section>
      <section id="service" class="panel panel-service" :class="{ 'is-active': active === 1 }" aria-labelledby="service-title">
        <div class="service-photo" :style="photoStyle('service')" aria-hidden="true"></div>
        <div class="service-copy"><h2 id="service-title" class="anim from-right">{{ site.service.title[0] }}<br>{{ site.service.title[1] }}</h2><ul class="service-points anim from-right delay-1"><li v-for="point in site.service.points" :key="point">{{ point }}</li></ul></div>
        <div class="service-bottom anim rise delay-2"><div class="service-caption"><strong>{{ site.service.caption }}</strong><span>{{ site.service.subcaption }}</span></div><button @click="demoAction">{{ site.service.buttons[0] }}</button><button class="solid" @click="demoAction">{{ site.service.buttons[1] }}</button></div>
      </section>
      <section id="advantage" class="panel panel-advantage" :class="{ 'is-active': active === 2 }" aria-labelledby="advantage-title">
        <div class="building-photo" :style="photoStyle('assets')" aria-hidden="true"></div>
        <div class="advantage-copy"><article v-for="(item, index) in site.advantage.items" :key="item.heading" class="advantage-item anim from-right" :class="[['assets', 'advantage', 'benefit'][index], index ? `delay-${index}` : '']"><h3>{{ item.heading }}</h3><p>{{ item.description }}</p></article><button class="witness anim fade delay-3" @click="demoAction">{{ site.advantage.witness[0] }}<br>{{ site.advantage.witness[1] }}</button><h2 id="advantage-title" class="advantage-slogan anim from-right delay-4">{{ site.advantage.slogan }}</h2></div>
      </section>
      <section id="news" class="panel panel-news" :class="{ 'is-active': active === 3 }" aria-labelledby="news-title">
        <div class="news-title"><span>{{ site.news.label }}</span><h2 id="news-title">{{ site.news.heading }}</h2></div>
        <div class="news-content"><div class="faq anim rise"><button v-for="question in site.news.questions" :key="question" @click="demoAction"><span>{{ question }}</span><span>＋</span></button></div><div class="news-date"><span>{{ site.news.signature }}</span><span>{{ site.news.english }}</span></div></div>
        <div class="forest-photo" :style="photoStyle('closing')" aria-hidden="true"></div>
      </section>
      <section id="contact" class="panel panel-contact" :class="{ 'is-active': active === 4 }" aria-labelledby="contact-title">
        <div class="contact-forest" :style="photoStyle('closing')" aria-hidden="true"></div>
        <div class="contact-card anim rise"><h2 id="contact-title">{{ site.brand.name }}</h2><p>{{ site.brand.english }}</p><div class="qr-placeholder" aria-label="QR Code 示意位置">▦</div><p>{{ site.contact.description }}</p><div class="contact-icons" aria-label="社群與服務連結"><span v-for="(icon, index) in site.contact.socialIcons" :key="index">{{ icon }}</span></div><small>{{ site.contact.copyright }}</small></div>
      </section>
    </main>
    <div class="pager-controls"><span>DEMO {{ site.version }} · {{ current.number }} / 0{{ pages.length }}</span><div><button :disabled="active === 0" aria-label="上一頁" @click="goTo(active - 1)">←</button><button :disabled="active === pages.length - 1" aria-label="下一頁" @click="goTo(active + 1)">→</button></div></div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>
