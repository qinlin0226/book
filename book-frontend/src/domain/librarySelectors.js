/**
 * 阅读状态映射，统一提供标签与样式类名。
 */
export const READ_STATUS_META = {
  0: { label: '已读完', className: 'done' },
  1: { label: '在追更', className: 'reading' },
}

/**
 * 过滤出已上架图书。
 *
 * @param books 图书列表
 * @return Array
 */
export function getShelfBooks(books = []) {
  return books.filter((book) => book.status !== 0)
}

/**
 * 随机打乱图书列表，用于首页主推荐展示。
 *
 * @param books 图书列表
 * @return Array
 */
export function getRandomizedShelfBooks(books = []) {
  return [...books]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((first, second) => first.sort - second.sort)
    .map(({ item }) => item)
}

/**
 * 按关键字过滤图书。
 *
 * @param books 图书列表
 * @param keyword 搜索关键字
 * @return Array
 */
export function filterBooksByKeyword(books = [], keyword = '') {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return books
  }

  return books.filter((book) => {
    const haystack = [book.title, book.author, book.category, book.description].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(normalizedKeyword)
  })
}

/**
 * 将侧边封面流拆成左右两组，避免两侧重复。
 *
 * @param books 图书列表
 * @return {{left: Array, right: Array}}
 */
export function splitSideBookGroups(books = []) {
  return {
    left: books.filter((_, index) => index % 2 === 0),
    right: books.filter((_, index) => index % 2 === 1),
  }
}

/**
 * 生成阅读记录映射，方便按图书快速查找记录。
 *
 * @param records 阅读记录列表
 * @return Map
 */
export function createRecordMap(records = []) {
  return new Map(records.map((record) => [record.bookId, record]))
}

/**
 * 获取当前主推荐图书对应的阅读记录与状态文案。
 *
 * @param recordMap 阅读记录映射
 * @param currentFeedBook 当前图书
 * @return {{record: any, readState: any}}
 */
export function getCurrentFeedState(recordMap, currentFeedBook) {
  const record = currentFeedBook ? recordMap.get(currentFeedBook.id) : null
  const readState = record ? READ_STATUS_META[record.readStatus] : null

  return {
    record,
    readState,
  }
}

/**
 * 统计用户中心指标卡数据。
 *
 * @param records 阅读记录列表
 * @return {{followingCount: number, finishedCount: number, readingCount: number}}
 */
export function getProfileMetrics(records = []) {
  return {
    followingCount: records.filter((item) => item.readStatus === 1).length,
    finishedCount: records.filter((item) => item.readStatus === 0).length,
    readingCount: records.length,
  }
}

/**
 * 统计管理台指标卡数据。
 *
 * @param adminBooks 管理台图书列表
 * @return {{totalCount: number, upCount: number, pendingCount: number}}
 */
export function getAdminMetrics(adminBooks = []) {
  return {
    totalCount: adminBooks.length,
    upCount: adminBooks.filter((item) => item.status === 1).length,
    pendingCount: adminBooks.filter((item) => item.status !== 1).length,
  }
}

/**
 * 为管理台图书列表补齐展示所需状态信息。
 *
 * @param adminBooks 管理台图书列表
 * @return Array
 */
export function buildAdminBookItems(adminBooks = []) {
  return adminBooks.map((book) => ({
    ...book,
    statusLabel: book.status === 1 ? '已上架' : '已下架',
    statusClassName: book.status === 1 ? 'up' : 'down',
  }))
}
