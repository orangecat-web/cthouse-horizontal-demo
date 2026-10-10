// 沿用 Orange Cat 實驗室的 600ms cosine 加減速；回傳清理函式，供元件移除或再次點擊時取消。
export function animateScrollToTop(duration = 600) {
  // 僅在瀏覽器明示減少動態時直接回頂；一般模式仍使用完整加減速動畫。
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => {}
  }
  const start = window.scrollY
  const scrollRoot = document.documentElement
  const previousBehavior = scrollRoot.style.scrollBehavior
  // 逐幀位置不可再套瀏覽器 smooth，否則兩層動畫互相延遲。
  scrollRoot.style.scrollBehavior = 'auto'
  let frame = 0
  let startedAt
  let cleaned = false
  const interruptKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
  function cleanup() {
    if (cleaned) return
    cleaned = true
    cancelAnimationFrame(frame)
    scrollRoot.style.scrollBehavior = previousBehavior
    window.removeEventListener('wheel', cleanup)
    window.removeEventListener('touchstart', cleanup)
    window.removeEventListener('pointerdown', cleanup)
    window.removeEventListener('keydown', onKey)
  }
  function onKey(event) { if (interruptKeys.includes(event.key)) cleanup() }
  function tick(timestamp) {
    startedAt ??= timestamp
    const progress = Math.min((timestamp - startedAt) / duration, 1)
    const eased = (1 - Math.cos(Math.PI * progress)) / 2
    window.scrollTo(0, start * (1 - eased))
    if (progress < 1) frame = requestAnimationFrame(tick)
    else cleanup()
  }
  // 使用者滾動、觸控或點擊其他控制時立即取消，不爭搶操作；所有監聽在結束時解除。
  window.addEventListener('wheel', cleanup, { passive: true })
  window.addEventListener('touchstart', cleanup, { passive: true })
  window.addEventListener('pointerdown', cleanup, { passive: true })
  window.addEventListener('keydown', onKey)
  frame = requestAnimationFrame(tick)
  return cleanup
}
