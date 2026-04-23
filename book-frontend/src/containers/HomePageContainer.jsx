import { useEffect, useMemo, useRef, useState } from 'react'
import HomeView from '../components/HomeView'
import {
  createRecordMap,
  filterBooksByKeyword,
  getCurrentFeedState,
  getRandomizedShelfBooks,
  getShelfBooks,
} from '../domain/librarySelectors'
import useLibraryWorkspace from '../hooks/useLibraryWorkspace'
import useSession from '../hooks/useSession'
import useSideMarqueeHeightSync from '../hooks/useSideMarqueeHeightSync'

/**
 * 首页页面容器，负责组装推荐流数据、搜索与顶部交互。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function HomePageContainer({ onSwitchTab, onRequestEditBook }) {
  const { session, isAdmin, actions: sessionActions } = useSession()
  const { home, profile, actions } = useLibraryWorkspace()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0)
  const wheelLockRef = useRef(0)
  const touchStartYRef = useRef(null)

  const shelfBooks = useMemo(() => getShelfBooks(home.books), [home.books])
  const featuredBooks = useMemo(() => getRandomizedShelfBooks(shelfBooks), [shelfBooks])
  const filteredFeaturedBooks = useMemo(() => filterBooksByKeyword(featuredBooks, searchKeyword), [featuredBooks, searchKeyword])
  const recordMap = useMemo(() => createRecordMap(profile.records), [profile.records])
  const currentFeedBook = filteredFeaturedBooks[currentFeedIndex] || null
  const currentFeedState = useMemo(() => getCurrentFeedState(recordMap, currentFeedBook), [currentFeedBook, recordMap])

  useSideMarqueeHeightSync([home.homeLoading, filteredFeaturedBooks.length])

  useEffect(() => {
    setCurrentFeedIndex((current) => {
      if (!filteredFeaturedBooks.length) {
        return 0
      }

      return Math.min(current, filteredFeaturedBooks.length - 1)
    })
  }, [filteredFeaturedBooks])

  /**
   * 切换当前展示图书。
   *
   * @param step 切换步长
   * @return void
   */
  function shiftFeed(step) {
    if (filteredFeaturedBooks.length <= 1) {
      return
    }

    setCurrentFeedIndex((current) => {
      const nextIndex = current + step

      if (nextIndex < 0) {
        return filteredFeaturedBooks.length - 1
      }

      if (nextIndex >= filteredFeaturedBooks.length) {
        return 0
      }

      return nextIndex
    })
  }

  /**
   * 搜索提交后回到第一本匹配图书。
   *
   * @param event 表单事件
   * @return void
   */
  function handleSearchSubmit(event) {
    event.preventDefault()
    setCurrentFeedIndex(0)
  }

  /**
   * 使用滚轮切换主推荐。
   *
   * @param event 滚轮事件
   * @return void
   */
  function handleFeedWheel(event) {
    if (Math.abs(event.deltaY) < 24) {
      return
    }

    const now = Date.now()
    if (now - wheelLockRef.current < 420) {
      event.preventDefault()
      return
    }

    wheelLockRef.current = now
    event.preventDefault()
    shiftFeed(event.deltaY > 0 ? 1 : -1)
  }

  /**
   * 记录触摸起点。
   *
   * @param event 触摸事件
   * @return void
   */
  function handleFeedTouchStart(event) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null
  }

  /**
   * 根据触摸结束位置切换图书。
   *
   * @param event 触摸事件
   * @return void
   */
  function handleFeedTouchEnd(event) {
    const startY = touchStartYRef.current
    const endY = event.changedTouches[0]?.clientY ?? null
    touchStartYRef.current = null

    if (startY === null || endY === null) {
      return
    }

    const deltaY = startY - endY
    if (Math.abs(deltaY) < 48) {
      return
    }

    shiftFeed(deltaY > 0 ? 1 : -1)
  }

  return (
    <>
      <header className="topbar topbar-home">
        <form className="topbar-search" onSubmit={handleSearchSubmit}>
          <input
            className="search-field"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="搜索你感兴趣的内容"
            aria-label="搜索图书内容"
          />
          <button className="search-submit" type="submit">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M13.5 12.1l4 4-1.4 1.4-4-4v-.7l-.2-.2a5.8 5.8 0 111.6-1.6l.2.2h.7zM8.2 13a4.8 4.8 0 100-9.6 4.8 4.8 0 000 9.6z" fill="currentColor" />
            </svg>
            <span>搜索</span>
          </button>
        </form>

        <div className="topbar-actions">
          <button className="ghost-button active" onClick={() => onSwitchTab('home')}>
            首页推荐
          </button>
          <button className="ghost-button" onClick={() => onSwitchTab('profile')}>
            用户中心
          </button>
          {isAdmin ? (
            <button className="ghost-button" onClick={() => onSwitchTab('admin')}>
              图书管理
            </button>
          ) : null}
          {session ? (
            <button className="primary-button slim" onClick={sessionActions.logout}>
              退出
            </button>
          ) : (
            <button className="primary-button slim" onClick={sessionActions.openAuth}>
              登录 / 注册
            </button>
          )}
        </div>
      </header>

      <HomeView
        homeLoading={home.homeLoading}
        currentFeedBook={currentFeedBook}
        currentFeedRecord={currentFeedState.record}
        currentReadState={currentFeedState.readState}
        searchKeyword={searchKeyword}
        filteredFeaturedBooks={filteredFeaturedBooks}
        currentFeedIndex={currentFeedIndex}
        session={session}
        isAdmin={isAdmin}
        actionBookId={home.actionBookId}
        onFeedWheel={handleFeedWheel}
        onFeedTouchStart={handleFeedTouchStart}
        onFeedTouchEnd={handleFeedTouchEnd}
        onShiftFeed={shiftFeed}
        onToggleRecordStatus={actions.toggleRecordStatus}
        onAddToShelf={actions.addBookToShelf}
        onOpenAuth={sessionActions.openAuth}
        onEditBook={onRequestEditBook}
      />
    </>
  )
}

export default HomePageContainer
