<script setup>
// 區域開價散佈圖：SVG 只繪製格線，所有軸字、點按鈕與提示都用 HTML 保留字級。
import { computed, ref } from 'vue'
const props = defineProps({ config: { type: Object, required: true } })
const selectedId = ref(null)
const visibleDemo = ref(true)
const visibleSubject = ref(true)
const visiblePoints = computed(() => props.config.points.filter(point => point.subject ? visibleSubject.value : visibleDemo.value))
const selectedPoint = computed(() => visiblePoints.value.find(point => point.id === selectedId.value))
const xPosition = area => (area - props.config.xDomain[0]) / (props.config.xDomain[1] - props.config.xDomain[0]) * 100
const yPosition = price => (1 - (price - props.config.yDomain[0]) / (props.config.yDomain[1] - props.config.yDomain[0])) * 100
</script>

<template lang="pug">
//- 可點選、滑鼠移入及鍵盤聚焦的開價資料點；圖例切換顯示 Demo 與本物件。
.price-scatter-chart
  p.chart-demo-label {{ config.demoLabel }}
  .chart-legend
    button(type="button" :aria-pressed="visibleDemo" @click="visibleDemo = !visibleDemo")
      i.legend-dot
      span {{ config.demoSeriesLabel }}
    button(type="button" :aria-pressed="visibleSubject" @click="visibleSubject = !visibleSubject")
      i.legend-dot.is-subject
      span {{ config.subjectSeriesLabel }}
  p.chart-y-title {{ config.yLabel }}
  .chart-plot
    svg.chart-grid(viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true")
      path(d="M0 0H100 M0 33.333H100 M0 66.667H100 M0 100H100 M0 0V100" fill="none" stroke="#e5e9e7" stroke-width=".3")
    span.chart-y-tick(v-for="tick in config.yTicks" :key="tick" :style="{ top: yPosition(tick) + '%' }") {{ tick }}
    span.chart-x-tick(v-for="tick in config.xTicks" :key="tick" :style="{ left: xPosition(tick) + '%' }") {{ tick }}
    button.chart-point(v-for="point in visiblePoints" :key="point.id" type="button" :class="{ 'is-subject': point.subject, 'is-selected': selectedId === point.id }" :style="{ left: xPosition(point.area) + '%', top: yPosition(point.unitPrice) + '%' }" :aria-label="point.label + '，' + point.area + ' 坪，每坪 ' + point.unitPrice + ' 萬元'" :aria-pressed="selectedId === point.id" @mouseenter="selectedId = point.id" @focus="selectedId = point.id" @click="selectedId = point.id")
    p.chart-empty(v-if="!visiblePoints.length") {{ config.emptyLabel }}
  p.chart-x-title {{ config.xLabel }}
  .chart-point-detail(role="status")
    template(v-if="selectedPoint")
      strong {{ selectedPoint.label }}
      span {{ selectedPoint.area }} 坪 · {{ selectedPoint.unitPrice }} 萬元／坪
    span(v-else) {{ config.hintLabel }}
</template>
