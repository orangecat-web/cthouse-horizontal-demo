<script setup>
// 物件頁：文案與素材由 property.json 管理，共用導覽連結沿用 site.json。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import site from '../../data/site.json'
import property from '../../data/property.json'
import PropertyMedia from '../../components/property/PropertyMedia.vue'
import PropertyIcon from '../../components/property/PropertyIcon.vue'
import PanoramaViewer from '../../components/property/PanoramaViewer.vue'
import DemoMap from '../../components/property/DemoMap.vue'
import PriceScatterChart from '../../components/property/PriceScatterChart.vue'
import { imageUrl } from '../../utils/images'
import { animateScrollToTop } from '../../utils/animated-scroll'

// 收藏及分頁僅維持本次頁面狀態；不代表後端或會員功能已串接。
const favorite = ref(false)
const inquiryTab = ref(0)
const environmentTab = ref(property.environment.tabs[0])
const environmentItems = computed(() => property.environment.items.filter(item => item.category === environmentTab.value))
const selectedFacilityId = ref(environmentItems.value[0]?.id || null)
watch(environmentTab, () => { selectedFacilityId.value = environmentItems.value[0]?.id || null })
// 推薦物件依桌機四張／手機兩張換組；只改此區資料，不切換整個物件頁。
const recommendationIndex = ref(0)
const recommendationCount = ref(4)
const visibleRecommendations = computed(() => property.recommendations.slice(recommendationIndex.value, recommendationIndex.value + recommendationCount.value))
const recommendationDialog = ref(null)
const selectedRecommendation = ref(null)
let recommendationMedia, cancelScroll
function updateRecommendationCount() {
  recommendationCount.value = recommendationMedia.matches ? 2 : 4
  recommendationIndex.value = Math.min(recommendationIndex.value, Math.max(0, property.recommendations.length - recommendationCount.value))
}
function turnRecommendations(direction) {
  recommendationIndex.value = Math.max(0, Math.min(property.recommendations.length - recommendationCount.value, recommendationIndex.value + direction))
}
// 正式 href 交給瀏覽器；未指定網址的 Demo 卡片開啟本地資訊預覽。
function onRecommendationClick(event, item) {
  if (item.href) return
  event.preventDefault()
  selectedRecommendation.value = item
  recommendationDialog.value.showModal()
}
const galleryDialog = ref(null)
const photoIndex = ref(0)
const currentPhoto = computed(() => property.gallery[photoIndex.value])
const notice = ref('')
let noticeTimer

// 共用前端提示：3 秒自動關閉，離開元件時清除計時器。
function showNotice(message = property.labels.demoAction) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 3000)
}
// 照片對話框使用原生 dialog，保留 Escape 關閉與焦點返回；未提供照片時仍顯示佔位。
function openGallery(index = 0) {
  photoIndex.value = index
  galleryDialog.value.showModal()
}
function turnPhoto(direction) {
  photoIndex.value = (photoIndex.value + direction + property.gallery.length) % property.gallery.length
}
function onGalleryKey(event) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    turnPhoto(event.key === 'ArrowRight' ? 1 : -1)
  }
}
// 空電話不導向假號碼；正式電話由使用者填入 agent 資料。
const phoneHref = (number) => number ? `tel:${number.replace(/[^\d+]/g, '')}` : undefined
// 列印與回頂部由瀏覽器執行，不攔截一般頁面的滾輪或觸控。
function printPage() { window.print() }
function scrollToTop() { cancelScroll?.(); cancelScroll = animateScrollToTop(600) }
// 僅將目前頁面連結寫入剪貼簿；無法使用時提供手動複製提示。
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    showNotice(property.labels.copySuccess)
  } catch {
    showNotice(property.labels.copyFailure)
  }
}
onMounted(() => {
  document.title = `${property.shortTitle}｜${site.brand.name} Demo`
  recommendationMedia = window.matchMedia('(max-width: 48rem)')
  updateRecommendationCount()
  recommendationMedia.addEventListener('change', updateRecommendationCount)
})
// 解除換組斷點監聽、回頂部動畫與提示計時器，避免離開頁面後仍執行。
onBeforeUnmount(() => {
  clearTimeout(noticeTimer)
  cancelScroll?.()
  recommendationMedia?.removeEventListener('change', updateRecommendationCount)
})
</script>

<template lang="pug">
//- 直向物件頁：各區使用真實 DOM，圖片與媒體空值保留版面。
.property-page
  //- 白底導覽：沿用首頁的八項 a 連結；此頁 Logo 不占 H1。
  header.property-header
    nav.property-nav(aria-label="主要導覽")
      a(v-for="item in site.navigation.primary" :key="item.label" :href="item.href || undefined") {{ item.label }}
      a.property-brand(:href="site.navigation.homeHref" :aria-label="site.brand.name + '，回首頁'")
        img(v-if="property.brandLogo" :src="imageUrl(property.brandLogo)" :alt="site.brand.name")
        span.brand-placeholder(v-else) {{ site.brand.name }}
          small {{ property.labels.logo }}
      a(v-for="item in site.navigation.company" :key="item.label" :href="item.href || undefined") {{ item.label }}

  //- 左側快捷連結：同首頁資料，圖示改用本地 SVG 以免遠端字型影響版面。
  aside.property-rail(aria-label="快捷連結")
    a(v-for="link in site.sidebarLinks" :key="link.id" :href="link.href || undefined" :aria-label="link.label" :title="link.label")
      PropertyIcon(:name="link.icon === 'notifications_active' ? 'bell' : link.icon")

  main
    //- 頂部物件摘要：麵包屑、標題、地址、售價；以縮圖可辨識資料作為 Demo。
    .property-container.property-overview
      .property-breadcrumb-row
        nav.property-breadcrumbs(aria-label="所在位置")
          a(:href="site.navigation.homeHref") {{ site.brand.name }}
          span(v-for="crumb in property.breadcrumbs" :key="crumb") {{ crumb }}
        .property-tools
          button(type="button" :aria-label="property.labels.copy" :title="property.labels.copy" @click="copyLink")
            PropertyIcon(name="share")
          button(type="button" :aria-label="property.labels.print" :title="property.labels.print" @click="printPage")
            PropertyIcon(name="print")
          button(type="button" :aria-label="favorite ? property.labels.favorited : property.labels.favorite" :aria-pressed="favorite" @click="favorite = !favorite")
            PropertyIcon(name="heart" :class="{ 'is-favorited': favorite }")
      .property-title-row
        div
          h1 {{ property.title }}
            span.property-number （{{ property.id }}）
          p.property-address {{ property.address || property.labels.pending }}
        p.property-price
          strong {{ property.price }}
          span {{ property.priceUnit }}

      //- 五格相簿：左側主圖跨兩列，右側四張；素材 null 保留位置與可預覽入口。
      .property-gallery
        button.gallery-tile(v-for="(photo, index) in property.gallery" :key="photo.id" type="button" :aria-label="photo.label + '，開啟照片'" @click="openGallery(index)")
          PropertyMedia(:image="photo.image" :label="photo.label")
        .gallery-actions
          button(type="button" @click="showNotice()")
            PropertyIcon(name="layout")
            span {{ property.labels.layout }}
          button(type="button" @click="openGallery(0)")
            PropertyIcon(name="image")
            span {{ property.labels.photos }}
      .property-summary-row
        ul.property-summary
          li(v-for="item in property.summary" :key="item.label")
            PropertyIcon(:name="item.icon")
            div
              span {{ item.label }}：{{ item.value || property.labels.pending }}
              small(v-if="item.note") {{ item.note }}
        .property-quick-actions
          button(v-for="label in property.quickActions" :key="label" type="button" @click="showNotice()") {{ label }}

    //- 詳細資料與經紀人卡：左側雙欄定義列表，右側聯絡資訊、QR 與 Demo 表單。
    section#details.property-container.property-details(aria-labelledby="details-heading")
      h2#details-heading.property-section-heading {{ property.labels.detailHeading }}
      .property-details-layout
        dl.property-facts
          div(v-for="item in property.details" :key="item.label")
            dt {{ item.label }}
            dd {{ item.value || property.labels.pending }}
        aside#inquiry.property-agent-card(:aria-label="property.labels.agent")
          .agent-profile
            PropertyMedia.agent-avatar(:image="property.agent.avatar" :label="property.agent.avatarAlt" icon="user")
            .agent-name
              p {{ property.agent.store || property.labels.pending }}
              h3 {{ property.agent.name || property.labels.agent }}
            .agent-qr-group
              PropertyMedia.agent-qr(v-for="qr in property.agent.qrCodes" :key="qr.label" :image="qr.image" :label="qr.label")
          .agent-phones
            a(:href="phoneHref(property.agent.mobile)")
              PropertyIcon(name="phone")
              span {{ property.agent.mobile || property.labels.pending }}
            a(:href="phoneHref(property.agent.phone)")
              PropertyIcon(name="call")
              span {{ property.agent.phone || property.labels.pending }}
          .agent-address
            PropertyIcon(name="pin")
            div
              p {{ property.agent.company || property.labels.pending }}
              p {{ property.agent.address || property.labels.pending }}
          .inquiry-tabs(role="tablist" :aria-label="property.labels.agent")
            button(v-for="(tab, index) in property.inquiry.tabs" :key="tab" :id="'inquiry-tab-' + index" type="button" role="tab" :aria-selected="inquiryTab === index" aria-controls="property-inquiry-form" :class="{ 'is-selected': inquiryTab === index }" @click="inquiryTab = index") {{ tab }}
          form#property-inquiry-form.property-inquiry(role="tabpanel" :aria-labelledby="'inquiry-tab-' + inquiryTab" @submit.prevent="showNotice(property.labels.demoInquiry)")
            .inquiry-fields
              input(type="text" name="name" autocomplete="name" :placeholder="property.inquiry.namePlaceholder" :aria-label="property.inquiry.namePlaceholder" required)
              input(type="tel" name="phone" autocomplete="tel" :placeholder="property.inquiry.phonePlaceholder" :aria-label="property.inquiry.phonePlaceholder" required)
            label.inquiry-time
              span {{ property.inquiry.timeLabel }}
              select(name="time")
                option(v-for="time in property.inquiry.times" :key="time") {{ time }}
            button.property-submit(type="submit") {{ property.inquiry.submitLabel }}
            p.inquiry-privacy {{ property.inquiry.privacyNotice }}

    //- 捲動聯絡列與區塊導覽：一般頁面錨點，不註冊首頁的滾輪／拖曳攔截。
    .property-contact-strip
      .property-container
        .contact-strip-main
          p {{ property.shortTitle }}
            span （{{ property.id }}）
            strong {{ property.price }}
            small {{ property.priceUnit }}
          .contact-strip-actions
            a(:href="phoneHref(property.agent.mobile)")
              PropertyIcon(name="phone")
              span {{ property.agent.mobile || property.labels.pending }}
            button(type="button" :aria-pressed="favorite" :aria-label="favorite ? property.labels.favorited : property.labels.favorite" @click="favorite = !favorite")
              PropertyIcon(name="heart" :class="{ 'is-favorited': favorite }")
            a.contact-agent-link(href="#inquiry") {{ property.labels.agent }}
        nav.property-section-nav(aria-label="物件內容區塊")
          a(v-for="section in property.sections" :key="section.id" :href="'#' + section.id") {{ section.label }}

    .property-container
      //- 物件介紹：分別保留簡介與特色，無法辨識的文案不自行補造。
      section#introduction.property-introduction(aria-label="物件介紹")
        p.introduction-notice {{ property.introduction.notice || property.labels.pending }}
        div(v-for="section in property.introduction.sections" :key="section.heading")
          h2 {{ section.heading }}：
          template(v-if="section.paragraphs.length")
            p(v-for="paragraph in section.paragraphs" :key="paragraph") {{ paragraph }}
          p(v-else) {{ property.labels.pending }}

      //- VR 大幅橫向區塊：正式 iframe 優先，否則顯示可操作的本地示範環景。
      section#vr.property-section(aria-labelledby="vr-heading")
        h2#vr-heading.property-section-heading {{ property.media.vr.label }}
        PropertyMedia.property-vr(v-if="property.media.vr.embedUrl" :embed-url="property.media.vr.embedUrl" :label="property.media.vr.label" icon="vr")
        PanoramaViewer.property-vr(v-else :config="property.media.vr")

      //- 交通與環境設施：正式地圖優先，Demo 底圖與右側分類清單互相選取設施。
      section#environment.property-section(aria-labelledby="environment-heading")
        h2#environment-heading.property-section-heading {{ property.media.map.label }}
        .property-environment-layout
          PropertyMedia.property-map(v-if="property.media.map.image || property.media.map.embedUrl" :image="property.media.map.image" :embed-url="property.media.map.embedUrl" :label="property.labels.map" icon="map")
          DemoMap.property-map(v-else :items="environmentItems" :selected-id="selectedFacilityId" :config="property.environment.map" @select="selectedFacilityId = $event")
          .property-environment-list
            label.environment-category
              span.sr-only {{ property.media.map.label }}
              select(v-model="environmentTab")
                option(v-for="tab in property.environment.tabs" :key="tab") {{ tab }}
            ul(v-if="environmentItems.length" :aria-label="property.labels.facilityListLabel")
              li(v-for="(item, index) in environmentItems" :key="item.id")
                button(type="button" :class="{ 'is-selected': selectedFacilityId === item.id }" :aria-pressed="selectedFacilityId === item.id" @click="selectedFacilityId = item.id")
                  span.facility-number {{ index + 1 }}
                  span.facility-name {{ item.name }}
                  span.facility-distance {{ item.distance }}
            p(v-else) {{ property.labels.environmentPlaceholder }}
            small.facility-demo-label {{ property.environment.demoLabel }}

      //- 區域行情與影音並排：圖表使用明確標示的 Demo 開價，影音仍保留素材位置。
      .property-insights
        section#market.property-section(aria-labelledby="market-heading")
          h2#market-heading.property-section-heading {{ property.labels.marketHeading }}
          PriceScatterChart.property-market(:config="property.market")
          .market-notes
            p(v-for="note in property.market.notes" :key="note") {{ note }}
            p(v-if="!property.market.notes.length") {{ property.labels.pending }}
        section#video.property-section(aria-labelledby="video-heading")
          h2#video-heading.property-section-heading {{ property.media.video.label }}
          PropertyMedia.property-video(:image="property.media.video.image" :embed-url="property.media.video.embedUrl" :label="property.media.video.label" icon="play")

      //- 推薦物件：假資料可換組與預覽，卡片地址／格局靠左、紅色價格與灰色單位靠右。
      section#recommendations.property-section.property-recommendations(aria-labelledby="recommendations-heading")
        h2#recommendations-heading.property-section-heading {{ property.labels.recommendationHeading }}
        p.recommendation-demo-label {{ property.labels.recommendationDemoLabel }}
        .recommendation-grid
          a.recommendation-card(v-for="item in visibleRecommendations" :key="item.id" :href="item.href || undefined" :tabindex="item.href ? undefined : 0" :role="item.href ? undefined : 'button'" @click="onRecommendationClick($event, item)" @keydown.enter="onRecommendationClick($event, item)" @keydown.space="onRecommendationClick($event, item)")
            PropertyMedia(:image="item.image" :label="property.labels.recommendationImage")
            h3 {{ item.title || property.labels.recommendationTitle }}
            .recommendation-meta
              .recommendation-copy
                p {{ item.address || item.subtitle || property.labels.pending }}
                p {{ item.layout }}｜{{ item.area }}
              p.recommendation-price
                strong {{ item.price || property.labels.recommendationPrice }}
                span(v-if="item.price") {{ property.priceUnit }}
        .recommendation-pager
          button(type="button" :aria-label="property.labels.previousRecommendation" :disabled="recommendationIndex === 0" @click="turnRecommendations(-1)")
            PropertyIcon.chevron-back(name="chevron")
          button(type="button" :aria-label="property.labels.nextRecommendation" :disabled="recommendationIndex >= property.recommendations.length - recommendationCount" @click="turnRecommendations(1)")
            PropertyIcon(name="chevron")

  //- 右側快捷工具：待補 QR 保留位置，諮詢與回頂部使用錨點。
  aside.property-floating-tools(aria-label="物件快捷工具")
    PropertyMedia.floating-qr(:image="property.agent.qrCodes[1].image" :label="property.agent.qrCodes[1].label")
    a(href="#inquiry" :aria-label="property.labels.agent")
      PropertyIcon(name="chat")
    a(href="#top" :aria-label="property.labels.toTop" @click.prevent="scrollToTop")
      PropertyIcon(name="arrow")

  //- 頁尾：上方導覽、灰底公司資訊與品牌素材，保留位置不偽造正式徽章。
  footer.property-footer
    nav.property-footer-nav.property-container(aria-label="頁尾導覽")
      a(v-for="item in [...site.navigation.primary, ...site.navigation.company]" :key="item.label" :href="item.href || undefined") {{ item.label }}
    .property-footer-body
      .property-container.footer-columns
        .footer-info
          .footer-brand
            img(v-if="property.brandLogo" :src="imageUrl(property.brandLogo)" :alt="site.brand.name")
            span(v-else) {{ site.brand.name }}
          .footer-company
            p(v-for="line in property.footer.companyLines" :key="line") {{ line }}
            p(v-if="!property.footer.companyLines.length") {{ property.labels.companyPlaceholder }}
          .footer-service
            p(v-for="line in property.footer.serviceLines" :key="line") {{ line }}
            p(v-if="!property.footer.serviceLines.length") {{ property.labels.servicePlaceholder }}
        .footer-partners
          .partner-logo-row
            PropertyMedia(v-for="(image, index) in property.footer.partnerLogos" :key="index" :image="image" :label="property.labels.partner")
          .property-downloads
            a(v-for="item in property.footer.downloads" :key="item.label" :href="item.href || undefined")
              img(v-if="item.image" :src="imageUrl(item.image)" :alt="item.label")
              span(v-else) {{ item.label }}
      p.property-copyright © {{ site.brand.name }} · DEMO {{ site.version }}

  //- 原生照片對話框：素材待補時可先確認照片順序、版面及按鈕操作。
  dialog.property-gallery-dialog(ref="galleryDialog" @keydown="onGalleryKey" @click="event => { if (event.target === galleryDialog) galleryDialog.close() }")
    .gallery-dialog-toolbar
      p {{ currentPhoto.label }} · {{ photoIndex + 1 }} / {{ property.gallery.length }}
      button(type="button" :aria-label="property.labels.close" @click="galleryDialog.close()")
        PropertyIcon(name="close")
    PropertyMedia(:image="currentPhoto.image" :label="currentPhoto.label")
    .gallery-dialog-controls
      button(type="button" :aria-label="property.labels.previousPhoto" @click="turnPhoto(-1)")
        PropertyIcon.chevron-back(name="chevron")
      button(type="button" :aria-label="property.labels.nextPhoto" @click="turnPhoto(1)")
        PropertyIcon(name="chevron")
  p.property-toast(v-if="notice" role="status") {{ notice }}
  //- 推薦物件 Demo 預覽：原生 dialog 保留 Escape 與焦點返回，正式連結不攔截。
  dialog.property-recommendation-dialog(ref="recommendationDialog")
    template(v-if="selectedRecommendation")
      .recommendation-dialog-toolbar
        p {{ property.labels.recommendationPreview }} · {{ property.labels.recommendationDemoLabel }}
        button(type="button" :aria-label="property.labels.closeRecommendation" @click="recommendationDialog.close()")
          PropertyIcon(name="close")
      PropertyMedia(:image="selectedRecommendation.image" :label="property.labels.recommendationImage")
      h2 {{ selectedRecommendation.title }}
      p {{ selectedRecommendation.address }}
      p {{ selectedRecommendation.layout }}｜{{ selectedRecommendation.area }}
      p.recommendation-price
        strong {{ selectedRecommendation.price }}
        span {{ property.priceUnit }}
      a.contact-agent-link(href="#inquiry" @click="recommendationDialog.close()") {{ property.labels.inquireRecommendation }}
</template>
