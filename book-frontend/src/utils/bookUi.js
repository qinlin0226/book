/**
 * 将远程图片地址映射为前端本地静态资源地址。
 *
 * @param url 原始图片地址
 * @return string
 */
export function resolveAssetUrl(url) {
  if (!url) {
    return ''
  }

  if (url.startsWith('/assets/')) {
    return url
  }

  try {
    const parsedUrl = new URL(url, 'http://localhost')

    if (parsedUrl.hostname === 'covers.openlibrary.org') {
      const match = parsedUrl.pathname.match(/\/b\/id\/(\d+)-L\.(jpg|jpeg|png|webp)$/i)

      if (match) {
        return `/assets/books/openlibrary-${match[1]}.${match[2].toLowerCase()}`
      }
    }

    if (parsedUrl.hostname === 'api.dicebear.com') {
      const seed = parsedUrl.searchParams.get('seed')

      if (seed) {
        const safeSeed = seed.replace(/[^a-zA-Z0-9_-]/g, '-')
        return `/assets/avatars/dicebear-${safeSeed}.svg`
      }
    }
  } catch (error) {
    return url
  }

  return url
}

/**
 * 生成图书或头像背景图样式。
 *
 * @param url 图片地址
 * @param seed 回退渐变种子
 * @return string
 */
export function coverStyle(url, seed = '') {
  const assetUrl = resolveAssetUrl(url)

  if (assetUrl) {
    return `linear-gradient(180deg, rgba(4,8,20,0.08), rgba(4,8,20,0.82)), url(${assetUrl})`
  }

  const tones = [
    'linear-gradient(135deg, #fd3a69, #ff8a34)',
    'linear-gradient(135deg, #6548ff, #00d0ff)',
    'linear-gradient(135deg, #2ecf92, #1245ff)',
    'linear-gradient(135deg, #f2c14e, #ef476f)',
  ]

  const index = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length
  return tones[index]
}

/**
 * 格式化日期显示文案。
 *
 * @param value 日期值
 * @return string
 */
export function formatDate(value) {
  if (!value) {
    return '创建时间待补'
  }

  return new Date(value).toLocaleDateString('zh-CN')
}
