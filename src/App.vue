<script setup>
// 主畫面：五個場景共用此元件；文案與圖片設定由 site.json 提供。
// Vue 工具、頁籤元件與網站資料
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PageRail from './components/PageRail.vue'
import site from './data/site.json'

// 頁面狀態：active 是從 0 開始的索引；current 供右下頁碼顯示。
const pages = site.pages
const active = ref(0)
// 首頁搜尋模式與 Demo 提示訊息；目前尚未串接房屋搜尋 API。
const searchMode = ref(site.home.defaultMode)
const notice = ref('')
// 示意驗證碼獨立於 JSON 初始值；只更新顯示，不作安全驗證或送出資料。
const inquiryCaptcha = ref(site.service.inquiry.captcha)
function refreshInquiryCaptcha() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  // 首字元往下一個候選移動，確保更新後與上一組不同。
  const first = alphabet[(alphabet.indexOf(inquiryCaptcha.value[0]) + 1) % alphabet.length]
  inquiryCaptcha.value = first + Array.from({ length: 3 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}
const current = computed(() => pages[active.value])
// 原圖末端灰色聯絡區較窄；最後一頁停在軌道右端，讓森林與聯絡資訊連續呈現。
const trackOffset = computed(() => Math.min(active.value * 100, (pages.length - 2) * 100 + site.layout.contactWidthVw))
// 圖片位置依 Vite base 組合，支援子目錄部署；空圖片保留 Sass 漸層佔位。
const imageUrl = (name) => `${import.meta.env.BASE_URL}images/${encodeURI(name)}`
const photoStyle = (key) => site.images[key] ? { '--panel-image': `url('${imageUrl(site.images[key])}')` } : undefined
// 滾輪累積量、時間與方向：限制同方向切頁頻率，反向時可立即返回。
let wheelTotal = 0
let lastWheelAt = 0
let lastPageChangeAt = -Infinity
let lastWheelDirection = 0
// 提示的自動關閉計時器，以及觸控手勢的起始座標。
let noticeTimer
let touchX = 0
let touchY = 0

// 與 style.sass 的手機斷點相同：窄螢幕且使用粗略指標時改成直向閱讀。
function compact() { return window.matchMedia('(max-width: 47.5rem) and (pointer: coarse)').matches }
// 所有切頁操作共用此入口；限制索引範圍，手機則捲到對應 section。
function goTo(index) {
  const next = Math.max(0, Math.min(index, pages.length - 1))
  active.value = next
  if (compact()) document.getElementById(pages[next].id)?.scrollIntoView({ behavior: 'smooth' })
}
// 上方導覽以 JSON 的 page/id 找到頁面，再交給 goTo 切換。
function goToPage(id) {
  const index = pages.findIndex(page => page.id === id)
  if (index !== -1) goTo(index)
}
// 固定切頁間隔，不因持續收到滾輪事件而無限延長；反向滾動可立即返回。
function onWheel(event) {
  if (compact() || event.ctrlKey) return
  event.preventDefault()
  // 取較大的滾動軸，讓滑鼠滾輪與橫向觸控板都能操作。
  const axis = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
  // deltaMode 可能以像素、行或頁表示；先統一成像素尺度。
  const pixels = event.deltaMode === 1 ? axis * 16 : event.deltaMode === 2 ? axis * window.innerHeight : axis
  if (!pixels) return
  const direction = Math.sign(pixels)
  const now = performance.now()
  // 停頓超過 200ms 或改變方向後，重新累積，避免沿用上一個手勢。
  if (now - lastWheelAt > 200 || (wheelTotal && Math.sign(wheelTotal) !== direction)) wheelTotal = 0
  lastWheelAt = now
  // 1000ms 配合場景滑動時間；不因連續事件延長等待，避免快速滾動卡住。
  if (now - lastPageChangeAt < 1000 && direction === lastWheelDirection) return
  wheelTotal += pixels
  // 累積超過 36 才切一頁，過濾細小的觸控板抖動。
  if (Math.abs(wheelTotal) < 36) return
  lastPageChangeAt = now
  lastWheelDirection = direction
  goTo(active.value + direction)
  wheelTotal = 0
}
// 鍵盤切頁：方向鍵、PageUp/Down、空白鍵、Home/End；輸入欄位內不攔截。
function onKey(event) {
  if (compact() || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return
  const direction = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0
  if (direction) { event.preventDefault(); goTo(active.value + direction) }
  else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); goTo(event.key === 'Home' ? 0 : pages.length - 1) }
}
// 記下觸控起點；桌機橫向模式下，水平滑動超過 60 才切頁。
function onTouchStart(event) { touchX = event.changedTouches[0].screenX; touchY = event.changedTouches[0].screenY }
function onTouchEnd(event) {
  if (compact()) return
  const dx = touchX - event.changedTouches[0].screenX
  const dy = touchY - event.changedTouches[0].screenY
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) goTo(active.value + Math.sign(dx))
}
// 尚未串接的搜尋／服務／消息按鈕：顯示 JSON 設定的提示，3 秒後關閉。
function demoAction() {
  notice.value = site.messages.demoAction
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3000)
}
// 元件掛載：passive: false 允許阻止原生捲動，capture 讓整個畫面都可接收滾輪。
onMounted(() => {
  document.addEventListener('wheel', onWheel, { passive: false, capture: true })
  window.addEventListener('keydown', onKey)
})
// 元件移除：解除全域監聽與計時器，避免再次掛載時事件重複執行。
onBeforeUnmount(() => {
  document.removeEventListener('wheel', onWheel, true)
  window.removeEventListener('keydown', onKey)
  clearTimeout(noticeTimer)
})
</script>

<template lang="pug">
//- 整頁容器：接收觸控手勢；以下 //- 為 Pug 原始碼註解，不會產生畫面元素。
.site-shell(@touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd")
  //- 共用導覽：兩組連結與中央 Logo；依目前頁面切換明暗配色。
  header.site-header(:class="{ 'on-photo': active === 0, 'on-service': active === 1 }")
    nav.top-nav(aria-label="主要導覽")
      button(v-for="item in site.navigation.primary" :key="item.label" @click="goToPage(item.page)") {{ item.label }}
      //- 網站唯一 H1：品牌 Logo；品牌文字作為圖片替代文字。
      h1.brand-heading
        button.brand(:aria-label="site.brand.name + '，回首頁'" @click="goTo(0)")
          img.brand-logo(:src="imageUrl(site.images.logo)" :alt="site.brand.name" width="80" height="37")
      button(v-for="item in site.navigation.company" :key="item.label" @click="goToPage(item.page)") {{ item.label }}

  //- 側邊欄：連結到其他頁面
  PageRail(:links="site.sidebarLinks")

  //- 橫向場景軌道：每頁佔 100vw；active 改變位移，滑動動畫由 Sass 控制。
  main.horizontal-track(:style="{ transform: 'translate3d(-' + trackOffset + 'vw, 0, 0)' }")
    //- 01 首頁／找屋介面：背景、主標題、搜尋卡片及下一頁箭頭。
    section#home.panel.panel-home(
      :class="{ 'is-active': active === 0 }"
      :style="photoStyle('home')"
      aria-labelledby="home-title"
    )
      //- 首頁背景：圖片由 images.home 指定；純裝飾不需螢幕閱讀器朗讀。
      .proposal-photo.home-photo(aria-hidden="true")
      //- 首頁主標題：rise 從下方進場；is-active 控制顯示。
      .home-title.anim.rise
        h2#home-title {{ site.home.title }}
      //- 首頁搜尋卡片：從下方延遲進場。
      .search-card.anim.rise.delay-1
        //- 找屋模式：點選後更新 searchMode 與 chosen 外觀。
        .search-tabs(role="group" aria-label="找屋方式")
          button(
            v-for="mode in site.home.modes"
            :key="mode"
            :class="{ chosen: searchMode === mode }"
            :aria-pressed="searchMode === mode"
            @click="searchMode = mode"
          ) {{ mode }}
        //- 條件下拉：由 home.filters 產生，目前僅呈現介面。
        .search-options
          label(v-for="filter in site.home.filters" :key="filter.label")
            span {{ filter.label }}
            select(:aria-label="filter.label")
              option(v-for="option in filter.options" :key="option") {{ option }}
        //- 關鍵字與搜尋按鈕：點擊顯示 Demo 提示。
        .search-keyword
          input(aria-label="關鍵字" :placeholder="site.home.keywordPlaceholder")
          button(@click="demoAction") {{ site.home.searchButton }}
      //- 首頁向右箭頭：前往第 02 頁星級服務。
      button.slide-cue(aria-label="前往星級服務" @click="goTo(1)") →

    //- 02 星級服務：左側照片、右側服務文案、底部行動按鈕。
    section#service.panel.panel-service(
      :class="{ 'is-active': active === 1 }"
      aria-labelledby="service-title"
    )
      //- 服務照片：由 images.service 指定。
      .service-photo(:style="photoStyle('service')" aria-hidden="true")
      //- 服務標題與服務項目：from-right 從右方進場。
      .service-copy
        h2#service-title.anim.from-right
          | {{ site.service.title[0] }}
          br
          | {{ site.service.title[1] }}
        ul.service-points.anim.from-right.delay-1
          li(v-for="(point, index) in site.service.points" :key="point")
            span.material-symbols-outlined(aria-hidden="true") {{ site.service.pointIcons[index] }}
            span {{ point }}
      //- 底部立即委託：四欄輸入、聯絡時間與個資告知在左，驗證碼在右，保留向上進場動畫。
      .service-bottom.anim.rise.delay-2
        .inquiry-label {{ site.service.inquiry.label }}
        form.inquiry-form(@submit.prevent="demoAction")
          //- 第一列：姓名、手機、地區與加盟商；隱藏名稱仍提供 label 關聯。
          label.inquiry-name
            span.inquiry-field-label {{ site.service.inquiry.nameLabel }}
            input(:placeholder="site.service.inquiry.namePlaceholder" autocomplete="name")
          label.inquiry-phone
            span.inquiry-field-label {{ site.service.inquiry.phoneLabel }}
            input(type="tel" :placeholder="site.service.inquiry.phonePlaceholder" autocomplete="tel")
          label.inquiry-region
            span.inquiry-field-label {{ site.service.inquiry.regionLabel }}
            select(name="inquiryRegion")
              option(v-for="region in site.service.inquiry.regions" :key="region" :value="region") {{ region }}
          label.inquiry-dealer
            span.inquiry-field-label {{ site.service.inquiry.dealerLabel }}
            select(name="inquiryDealer" :value="''")
              option(value="" disabled) {{ site.service.inquiry.dealerPlaceholder }}
              option(v-for="dealer in site.service.inquiry.dealers" :key="dealer" :value="dealer") {{ dealer }}
          //- 左下方：聯絡時間可複選，各 checkbox 分別包在 label 內，避免多個控制項共用名稱。
          .inquiry-details
            .inquiry-times(role="group" :aria-label="site.service.inquiry.timeLabel")
              span {{ site.service.inquiry.timeLabel }}
              label(v-for="time in site.service.inquiry.contactTimes" :key="time")
                input(type="checkbox" name="inquiryContactTime" :value="time")
                span {{ time }}
            p.inquiry-privacy-notice {{ site.service.inquiry.privacyNotice }}
          //- 右下方：驗證碼僅為 Demo；更新按鈕不提交表單。
          .inquiry-code
            span.captcha(aria-label="驗證碼示意" aria-live="polite") {{ inquiryCaptcha }}
            label
              span.inquiry-field-label {{ site.service.inquiry.codeLabel }}
              input(:placeholder="site.service.inquiry.codePlaceholder" autocomplete="off")
            button.captcha-refresh(type="button" @click="refreshInquiryCaptcha") {{ site.service.inquiry.refreshLabel }}
          button.inquiry-submit(type="submit")
            span.inquiry-submit-arrow(aria-hidden="true") ↑
            span {{ site.service.inquiry.submitLabel }}

    //- 03 品牌優勢：建築照片、三組優勢文案、見證按鈕及底部標語。
    section#advantage.panel.panel-advantage(
      :class="{ 'is-active': active === 2 }"
      aria-labelledby="advantage-title"
    )
      //- 左側窄圖：原圖在建築大圖左側另有一條全高素材。
      .advantage-strip(:style="photoStyle('assetsEdge')" aria-hidden="true")
      //- 建築照片：由 images.assets 指定。
      .building-photo(:style="photoStyle('assets')" aria-hidden="true")
      //- 優勢文案：前三筆依序使用 assets／advantage／benefit 定位與進場延遲。
      .advantage-copy
        article.advantage-item.anim.from-right(
          v-for="(item, index) in site.advantage.items"
          :key="item.heading"
          :class="[['assets', 'advantage', 'benefit'][index], index ? 'delay-' + index : '']"
        )
          h3 {{ item.heading }}
          .advantage-subtitle {{ item.subtitle }}
          .advantage-rule(aria-hidden="true")
          p {{ item.description }}
        //- 見證圓形按鈕：fade 使用縮放加淡入。
        button.witness.anim.fade.delay-3(@click="demoAction")
          | {{ site.advantage.witness[0] }}
          br
          | {{ site.advantage.witness[1] }}
          span.witness-arrow(aria-hidden="true") →
        //- 品牌主標語：從右方延遲進場。
        h2#advantage-title.advantage-slogan.anim.from-right.delay-4 {{ site.advantage.slogan }}

    //- 04 最新消息：左側 NEWS 標題、中間問題列表、右侧森林圖片。
    section#news.panel.panel-news(
      :class="{ 'is-active': active === 3 }"
      aria-labelledby="news-title"
    )
      //- 左側深色帶與底部 NEWS 跨色標題；中文標籤落在白色區域。
      .news-band(aria-hidden="true")
      .news-title
        span {{ site.news.label }}
        h2#news-title {{ site.news.heading }}
      //- 三列消息與日期：位於白色欄頂部；點擊顯示 Demo 提示。
      .news-content
        .faq.anim.rise
          button(v-for="(question, index) in site.news.questions" :key="question" @click="demoAction")
            .news-entry
              time(v-if="site.news.dates[index]") {{ site.news.dates[index] }}
              span {{ question }}
            span.news-arrow(aria-hidden="true") →
        button.news-more(@click="demoAction") {{ site.news.moreLabel }}
      //- 消息森林圖片：與聯絡頁共用 images.closing。
      .forest-photo(:style="photoStyle('closing')" aria-hidden="true")

    //- 05 聯絡資訊／頁尾：森林、品牌資訊卡、QR 示意、社群與版權。
    section#contact.panel.panel-contact(
      :class="{ 'is-active': active === 4 }"
      :style="{ '--contact-width': site.layout.contactWidthVw + 'vw' }"
      aria-labelledby="contact-title"
    )
      //- 森林已位於消息頁末端；此灰色區域接續其右側，不重複放第二張森林圖。
      h2#contact-title.sr-only {{ site.brand.name }}
      .contact-social-top(aria-label="社群與服務")
        button(v-for="icon in site.contact.topIcons" :key="icon" :aria-label="icon" @click="demoAction")
          span.material-symbols-outlined(aria-hidden="true") {{ icon }}
      //- 原圖資訊靠右排列，沒有白色卡片邊框；QR 和素材區可由 JSON 替換。
      .contact-card.anim.rise
        img.qr-image(v-if="site.images.qrCode" :src="imageUrl(site.images.qrCode)" alt="中信房屋 QR Code")
        .qr-placeholder(v-else aria-label="QR Code 素材待置換") ▦
        .contact-copy
          p(v-for="line in site.contact.lines" :key="line") {{ line }}
        .partner-logos(aria-label="關係品牌素材待置換")
          span(v-for="label in site.contact.partnerLabels" :key="label") {{ label }}
        .download-links
          button(v-for="label in site.contact.downloads" :key="label" @click="demoAction") {{ label }}
        small {{ site.contact.copyright }}

  //- 右下控制列：DEMO 版本、當前頁碼與前後頁按鈕。
  .pager-controls
    span DEMO {{ site.version }} · {{ current.number }} / 0{{ pages.length }}
    div
      button(:disabled="active === 0" aria-label="上一頁" @click="goTo(active - 1)") ←
      button(:disabled="active === pages.length - 1" aria-label="下一頁" @click="goTo(active + 1)") →
  //- 全站 Demo 提示：notice 有內容才顯示，role=status 提供訊息通知。
  .toast(v-if="notice" role="status") {{ notice }}
</template>
