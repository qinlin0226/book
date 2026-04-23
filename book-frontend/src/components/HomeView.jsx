import { coverStyle } from '../utils/bookUi'

/**
 * 首页推荐视图，负责展示推荐流和快捷操作。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function HomeView({
  homeLoading,
  currentFeedBook,
  currentFeedRecord,
  currentReadState,
  searchKeyword,
  filteredFeaturedBooks,
  currentFeedIndex,
  session,
  isAdmin,
  actionBookId,
  onFeedWheel,
  onFeedTouchStart,
  onFeedTouchEnd,
  onShiftFeed,
  onToggleRecordStatus,
  onAddToShelf,
  onOpenAuth,
  onEditBook,
}) {
  return (
    <section className="feed-stage" onWheel={onFeedWheel} onTouchStart={onFeedTouchStart} onTouchEnd={onFeedTouchEnd}>
      {homeLoading ? (
        <div className="empty-state wide">正在拼接今日推荐流...</div>
      ) : !currentFeedBook ? (
        <div className="empty-state wide">{searchKeyword.trim() ? '没有搜到匹配的图书，换个关键词试试。' : '当前没有可展示的图书。'}</div>
      ) : (
        <article className="feed-card feed-card-focus" key={currentFeedBook.id || currentFeedIndex}>
          <div className="feed-cover" style={{ backgroundImage: coverStyle(currentFeedBook.coverUrl, currentFeedBook.title) }} />
          <div className="feed-overlay" />
          {/* 顶部元信息固定在卡片顶部，避免随底部内容高度变化而漂移。 */}
          <div className="feed-topline">
            <span>{currentFeedBook.category || '灵感专题'}</span>
            <span>{currentFeedBook.publishYear || '新读物'}</span>
          </div>
          <div className="feed-nav">
            <button className="feed-nav-button" onClick={() => onShiftFeed(-1)} aria-label="切换到上一本">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.2 12.6L10 7.8l4.8 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="feed-nav-button" onClick={() => onShiftFeed(1)} aria-label="切换到下一本">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.2 7.4L10 12.2l4.8-4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="feed-content feed-content-focus">
            {/* 焦点卡片直接展示书名，去掉序号减少视觉压力 */}
            <h3>{currentFeedBook.title}</h3>
            <p>{currentFeedBook.description || '适合在深夜刷到的那种书，几页就能进入状态。'}</p>
            <div className="meta-row">
              <span>{currentFeedBook.author || '匿名作者'}</span>
              <span>热度值{currentFeedBook.readCount || 0} </span>
            </div>
            <div className="action-row feed-action-row">
              {session ? (
                currentFeedRecord ? (
                  <button
                    className={`status-pill ${currentReadState?.className || ''} feed-action-button`}
                    onClick={() => onToggleRecordStatus(currentFeedRecord)}
                    disabled={actionBookId === currentFeedBook.id}
                  >
                    {actionBookId === currentFeedBook.id ? '更新中...' : currentReadState?.label}
                  </button>
                ) : (
                  <button className="primary-button feed-action-button" onClick={() => onAddToShelf(currentFeedBook)} disabled={actionBookId === currentFeedBook.id}>
                    {actionBookId === currentFeedBook.id ? '加入中...' : '加入书架'}
                  </button>
                )
              ) : (
                <button className="primary-button feed-action-button" onClick={onOpenAuth}>
                  登录后加入书架
                </button>
              )}
              {isAdmin ? (
                <button className="ghost-button small feed-action-button" onClick={() => onEditBook(currentFeedBook)}>
                  直接编辑
                </button>
              ) : null}
            </div>
          </div>
        </article>
      )}
    </section>
  )
}

export default HomeView
