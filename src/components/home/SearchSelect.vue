<script setup>
// 首頁條件下拉：頁內清單避開原生彈出選單差異；選項與選值由父層注入。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
const props = defineProps({ label: { type: String, required: true }, options: { type: Array, required: true }, modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const root = ref(null), trigger = ref(null), list = ref(null), open = ref(false), highlighted = ref(0)
const id = useId()
const display = computed(() => props.options.includes(props.modelValue) ? props.modelValue : props.options[0] || '')
function close() { open.value = false }
async function show() {
  if (!props.options.length) return
  highlighted.value = Math.max(0, props.options.indexOf(display.value))
  open.value = true
  await nextTick()
  reveal()
}
function toggle() { if (open.value) close(); else show() }
function reveal() { list.value?.children[highlighted.value]?.scrollIntoView({ block: 'nearest' }) }
function choose(value) { emit('update:modelValue', value); close(); trigger.value?.focus({ preventScroll: true }) }
async function onKey(event) {
  // 按鈕預設 Enter／Space 會再次 click，因此在此統一處理並阻止重複切換。
  if (['Enter', ' '].includes(event.key)) {
    event.preventDefault()
    if (open.value) choose(props.options[highlighted.value]); else await show()
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    if (!open.value) { await show(); return }
    highlighted.value = event.key === 'Home' ? 0 : event.key === 'End' ? props.options.length - 1 : Math.max(0, Math.min(props.options.length - 1, highlighted.value + (event.key === 'ArrowDown' ? 1 : -1)))
    await nextTick(); reveal()
  } else if (event.key === 'Escape') { event.preventDefault(); close(); trigger.value?.focus({ preventScroll: true }) }
  else if (event.key === 'Tab') close()
}
function outside(event) {
  if (root.value?.contains(event.target)) return
  close()
  // 點回場景背景後釋放欄位焦點，讓背景滾輪可恢復切區塊。
  if (root.value?.contains(document.activeElement)) document.activeElement.blur()
}
function focusOut(event) { if (!root.value?.contains(event.relatedTarget)) close() }
// 每個下拉只註冊一次外部點擊監聽，解除元件時清理，避免重複開關及殘留焦點。
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>
<template lang="pug">
//- 原樣的底線欄位：按鈕為 combobox，浮層為 listbox；滑鼠／觸控直接選取。
.search-select(ref="root" @focusout="focusOut")
  button.search-select-trigger(ref="trigger" type="button" role="combobox" aria-haspopup="listbox" :aria-label="label" :aria-expanded="open" :aria-controls="id" :aria-activedescendant="open ? id + '-' + highlighted : undefined" :disabled="!options.length" @click="toggle" @keydown="onKey")
    span {{ display }}
    svg(viewBox="0 0 12 8" fill="none" aria-hidden="true")
      path(d="M2 2l4 4 4-4" stroke="currentColor" stroke-width="1.5")
  .search-select-list(v-if="open" ref="list" :id="id" role="listbox" :aria-label="label")
    button.search-select-option(v-for="(option, index) in options" :key="option" :id="id + '-' + index" type="button" role="option" tabindex="-1" :aria-selected="option === display" :class="{ 'is-highlighted': index === highlighted }" @pointerdown.prevent @mouseenter="highlighted = index" @click="choose(option)") {{ option }}
</template>
<style scoped lang="sass">
@use '../../sass/typography' as type
// 外觀沿用首頁搜尋欄位；只有展開清單新增白底，保持 16px 下限及手機可點選高度。
.search-select
  position: relative
  min-width: 0
  width: 100%
  font-size: inherit
.search-select-trigger
  display: flex
  align-items: center
  justify-content: space-between
  gap: .5rem
  min-width: 0
  width: 100%
  border: 0
  border-bottom: .066667rem solid #333
  padding: .266667rem 0 .533333rem
  background: transparent
  color: #333
  text-align: left
  font: inherit
  span
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
  svg
    width: .8rem
    height: .533333rem
    flex: 0 0 auto
  &:focus
    outline: none
.search-select-list
  position: absolute
  top: 100%
  left: 0
  z-index: 5
  width: max-content
  min-width: 100%
  max-width: 18rem
  max-height: 15rem
  overflow-y: auto
  overscroll-behavior: contain
  background: #fff
  border: .066667rem solid #ddd
  border-radius: .266667rem
  box-shadow: 0 .333333rem 1rem #0003
.search-select-option
  display: block
  width: 100%
  min-height: 2.666667rem
  padding: .533333rem .8rem
  border: 0
  background: white
  color: #333
  font-size: type.size('small')
  text-align: left
  white-space: nowrap
  &[aria-selected='true']
    font-weight: 700
  &.is-highlighted
    color: white
    background: #287a79
</style>
