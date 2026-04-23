import { useEffect } from 'react'

/**
 * 同步侧边封面流高度，让其底部与首页主推荐齐平。
 *
 * @param dependencies 触发同步的依赖列表
 * @return void
 */
function useSideMarqueeHeightSync(dependencies = []) {
  useEffect(() => {
    /**
     * 计算并写入侧栏高度变量。
     *
     * @return void
     */
    function syncSideMarqueeHeight() {
      const feedStage = document.querySelector('.feed-stage')
      const sideMarquee = document.querySelector('.side-book-marquee')

      if (!feedStage || !sideMarquee) {
        return
      }

      const feedRect = feedStage.getBoundingClientRect()
      const sideRect = sideMarquee.getBoundingClientRect()
      const nextHeight = Math.max(320, feedRect.bottom - sideRect.top)

      document.documentElement.style.setProperty('--side-blank-height', `${nextHeight}px`)
    }

    const frameId = window.requestAnimationFrame(syncSideMarqueeHeight)
    window.addEventListener('resize', syncSideMarqueeHeight)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', syncSideMarqueeHeight)
    }
  }, dependencies)
}

export default useSideMarqueeHeightSync
