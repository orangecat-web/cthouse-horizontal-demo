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

function compact() { return window.matchMedia('(max-width: 47.5rem) and (pointer: coarse)').matches }
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

<template lang="pug">
.site-shell(@touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd")
  header.site-header(:class="{ 'on-photo': active === 0, 'on-service': active === 1 }")
    nav.top-nav(aria-label="主要導覽")
      button(v-for="item in site.navigation.primary" :key="item.label" @click="goToPage(item.page)") {{ item.label }}
      button.brand(:aria-label="site.brand.name + '，回首頁'" @click="goTo(0)")
        img.brand-logo(:src="imageUrl(site.images.logo)" alt="" width="80" height="37")
      button(v-for="item in site.navigation.company" :key="item.label" @click="goToPage(item.page)") {{ item.label }}

  PageRail(:pages="pages" :active="active" @change="goTo")

  main.horizontal-track(:style="{ transform: 'translate3d(-' + (active * 100) + 'vw, 0, 0)' }")
    section#home.panel.panel-home(
      :class="{ 'is-active': active === 0 }"
      :style="photoStyle('home')"
      aria-labelledby="home-title"
    )
      .proposal-photo.home-photo(aria-hidden="true")
      .home-title.anim.rise
        h1#home-title {{ site.home.title }}
      .search-card.anim.rise.delay-1
        .search-tabs(role="group" aria-label="找屋方式")
          button(
            v-for="mode in site.home.modes"
            :key="mode"
            :class="{ chosen: searchMode === mode }"
            :aria-pressed="searchMode === mode"
            @click="searchMode = mode"
          ) {{ mode }}
        .search-options
          label(v-for="filter in site.home.filters" :key="filter.label")
            span {{ filter.label }}
            select(:aria-label="filter.label")
              option(v-for="option in filter.options" :key="option") {{ option }}
        .search-keyword
          input(aria-label="關鍵字" :placeholder="site.home.keywordPlaceholder")
          button(@click="demoAction") {{ site.home.searchButton }}
      button.slide-cue(aria-label="前往星級服務" @click="goTo(1)") →

    section#service.panel.panel-service(
      :class="{ 'is-active': active === 1 }"
      aria-labelledby="service-title"
    )
      .service-photo(:style="photoStyle('service')" aria-hidden="true")
      .service-copy
        h2#service-title.anim.from-right
          | {{ site.service.title[0] }}
          br
          | {{ site.service.title[1] }}
        ul.service-points.anim.from-right.delay-1
          li(v-for="point in site.service.points" :key="point") {{ point }}
      .service-bottom.anim.rise.delay-2
        .service-caption
          strong {{ site.service.caption }}
          span {{ site.service.subcaption }}
        button(@click="demoAction") {{ site.service.buttons[0] }}
        button.solid(@click="demoAction") {{ site.service.buttons[1] }}

    section#advantage.panel.panel-advantage(
      :class="{ 'is-active': active === 2 }"
      aria-labelledby="advantage-title"
    )
      .building-photo(:style="photoStyle('assets')" aria-hidden="true")
      .advantage-copy
        article.advantage-item.anim.from-right(
          v-for="(item, index) in site.advantage.items"
          :key="item.heading"
          :class="[['assets', 'advantage', 'benefit'][index], index ? 'delay-' + index : '']"
        )
          h3 {{ item.heading }}
          p {{ item.description }}
        button.witness.anim.fade.delay-3(@click="demoAction")
          | {{ site.advantage.witness[0] }}
          br
          | {{ site.advantage.witness[1] }}
        h2#advantage-title.advantage-slogan.anim.from-right.delay-4 {{ site.advantage.slogan }}

    section#news.panel.panel-news(
      :class="{ 'is-active': active === 3 }"
      aria-labelledby="news-title"
    )
      .news-title
        span {{ site.news.label }}
        h2#news-title {{ site.news.heading }}
      .news-content
        .faq.anim.rise
          button(v-for="question in site.news.questions" :key="question" @click="demoAction")
            span {{ question }}
            span ＋
        .news-date
          span {{ site.news.signature }}
          span {{ site.news.english }}
      .forest-photo(:style="photoStyle('closing')" aria-hidden="true")

    section#contact.panel.panel-contact(
      :class="{ 'is-active': active === 4 }"
      aria-labelledby="contact-title"
    )
      .contact-forest(:style="photoStyle('closing')" aria-hidden="true")
      .contact-card.anim.rise
        h2#contact-title {{ site.brand.name }}
        p {{ site.brand.english }}
        .qr-placeholder(aria-label="QR Code 示意位置") ▦
        p {{ site.contact.description }}
        .contact-icons(aria-label="社群與服務連結")
          span(v-for="(icon, index) in site.contact.socialIcons" :key="index") {{ icon }}
        small {{ site.contact.copyright }}

  .pager-controls
    span DEMO {{ site.version }} · {{ current.number }} / 0{{ pages.length }}
    div
      button(:disabled="active === 0" aria-label="上一頁" @click="goTo(active - 1)") ←
      button(:disabled="active === pages.length - 1" aria-label="下一頁" @click="goTo(active + 1)") →
  .toast(v-if="notice" role="status") {{ notice }}
</template>
