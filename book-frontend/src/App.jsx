import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
const SESSION_KEY = 'book-flow-session'
const RECOMMEND_LIMIT = 16

const emptyAuthForm = {
  username: '',
  password: '',
  nickname: '',
}

const emptyBookForm = {
  title: '',
  author: '',
  coverUrl: '',
  description: '',
  category: '',
  publishYear: '',
}

const emptyManagedUserForm = {
  username: '',
  password: '',
  nickname: '',
  avatarUrl: '',
  role: 0,
  status: 1,
}

const statusMeta = {
  0: { label: '已读完', className: 'done' },
  1: { label: '在追更', className: 'reading' },
}

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [session, setSession] = useState(() => {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [homeLoading, setHomeLoading] = useState(true)
  const [panelLoading, setPanelLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [actionBookId, setActionBookId] = useState(null)
  const [message, setMessage] = useState('')
  const [books, setBooks] = useState([])
  const [adminBooks, setAdminBooks] = useState([])
  const [recommendData, setRecommendData] = useState({ recommends: [], recentlyRead: [] })
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState([])
  const [profileForm, setProfileForm] = useState({ nickname: '', avatarUrl: '' })
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [editingBookId, setEditingBookId] = useState(null)
  const [managedUsers, setManagedUsers] = useState([])
  const [managedUserForm, setManagedUserForm] = useState(emptyManagedUserForm)
  const [editingManagedUserId, setEditingManagedUserId] = useState(null)
  const [managedUserModalOpen, setManagedUserModalOpen] = useState(false)
  const [userAdminLoading, setUserAdminLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0)
  const wheelLockRef = useRef(0)
  const touchStartYRef = useRef(null)

  const isAdmin = session?.role === 1
  const displayName = profile?.nickname || session?.nickname || '来访者'

  const featuredBooks = useMemo(() => {
    const source = session ? recommendData.recommends : books
    return source.slice(0, 6)
  }, [books, recommendData.recommends, session])

  const filteredFeaturedBooks = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) {
      return featuredBooks
    }

    return featuredBooks.filter((book) => {
      const haystack = [book.title, book.author, book.category, book.description].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [featuredBooks, searchKeyword])

  const recordMap = useMemo(() => {
    return new Map(records.map((record) => [record.bookId, record]))
  }, [records])

  const currentFeedBook = filteredFeaturedBooks[currentFeedIndex] || null

  useEffect(() => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [session])

  useEffect(() => {
    loadHome()
  }, [session])

  /**
   * 推荐流数据变化后，保持当前索引始终落在有效范围内。
   *
   * @return void
   */
  useEffect(() => {
    setCurrentFeedIndex((current) => {
      if (!filteredFeaturedBooks.length) {
        return 0
      }

      return Math.min(current, filteredFeaturedBooks.length - 1)
    })
  }, [filteredFeaturedBooks])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setRecords([])
      setAdminBooks([])
      setManagedUsers([])
      setProfileForm({ nickname: '', avatarUrl: '' })
      setBookForm(emptyBookForm)
      setManagedUserForm(emptyManagedUserForm)
      setEditingBookId(null)
      setEditingManagedUserId(null)
      setManagedUserModalOpen(false)
      if (activeTab !== 'home') {
        setActiveTab('home')
      }
      return
    }

    loadPanel()
    if (session.role === 1) {
      loadManagedUsers()
      loadAdminBooks()
    } else if (activeTab === 'admin') {
      setActiveTab('profile')
    }
  }, [session])

  useEffect(() => {
    if (!session) {
      return
    }

    if (activeTab === 'profile') {
      loadPanel()
      if (session.role === 1) {
        loadManagedUsers()
      }
    }

    if (activeTab === 'admin' && session.role === 1) {
      loadAdminBooks()
    }
  }, [activeTab, session])

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }

    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok || json.code !== 200) {
      throw new Error(json.message || '请求失败')
    }

    return json.data
  }

  async function loadHome() {
    setHomeLoading(true)

    try {
      const publicList = await request('/api/book?page=1&size=12')
      setBooks(publicList.records || [])

      if (session?.token) {
        const recommend = await request(`/api/recommend?limit=${RECOMMEND_LIMIT}`)
        setRecommendData(recommend)
      } else {
        setRecommendData({ recommends: [], recentlyRead: [] })
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setHomeLoading(false)
    }
  }

  async function loadPanel() {
    setPanelLoading(true)

    try {
      const [nextProfile, recordPage, recommend] = await Promise.all([
        request('/api/user/profile'),
        request('/api/record?page=1&size=50'),
        request(`/api/recommend?limit=${RECOMMEND_LIMIT}`),
      ])

      setProfile(nextProfile)
      setProfileForm({
        nickname: nextProfile.nickname || '',
        avatarUrl: nextProfile.avatarUrl || '',
      })
      setRecords(recordPage.records || [])
      setRecommendData(recommend)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setPanelLoading(false)
    }
  }

  async function loadAdminBooks() {
    setAdminLoading(true)

    try {
      const pageData = await request('/api/book?page=1&size=24')
      setAdminBooks(pageData.records || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setAdminLoading(false)
    }
  }

  /**
   * 管理员读取所有用户信息列表
   *
   * @return void
   */
  async function loadManagedUsers() {
    setUserAdminLoading(true)

    try {
      const userList = await request('/api/user/admin/list')
      setManagedUsers(userList || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUserAdminLoading(false)
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthLoading(true)
    setMessage('')

    try {
      if (authMode === 'register') {
        await request('/api/user/register', {
          method: 'POST',
          body: JSON.stringify({
            username: authForm.username,
            password: authForm.password,
            nickname: authForm.nickname,
          }),
        })
      }

      const loginData = await request('/api/user/login', {
        method: 'POST',
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password,
        }),
      })

      setSession(loginData)
      setAuthOpen(false)
      setAuthForm(emptyAuthForm)
      setMessage(authMode === 'register' ? '注册并登录成功' : '欢迎回来')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault()
    setPanelLoading(true)
    setMessage('')

    try {
      await request('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      })
      await loadPanel()
      setMessage('个人信息已更新')
    } catch (error) {
      setMessage(error.message)
      setPanelLoading(false)
    }
  }

  async function addToReading(book) {
    setActionBookId(book.id)
    setMessage('')

    try {
      await request('/api/record', {
        method: 'POST',
        body: JSON.stringify({ bookId: book.id }),
      })
      await Promise.all([loadPanel(), loadHome()])
      setMessage(`《${book.title}》已加入在读`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setActionBookId(null)
    }
  }

  async function toggleRecordStatus(record) {
    setActionBookId(record.bookId)
    setMessage('')

    try {
      const nextStatus = record.readStatus === 1 ? 0 : 1
      await request(`/api/record/${record.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ readStatus: nextStatus }),
      })
      await Promise.all([loadPanel(), loadHome()])
      setMessage(nextStatus === 1 ? '已标记为在读' : '已标记为读完')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setActionBookId(null)
    }
  }

  async function deleteRecord(record) {
    setActionBookId(record.bookId)
    setMessage('')

    try {
      await request(`/api/record/${record.id}`, {
        method: 'DELETE',
      })
      await Promise.all([loadPanel(), loadHome()])
      setMessage(`《${record.bookTitle}》已移出阅读记录`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setActionBookId(null)
    }
  }

  async function handleBookSubmit(event) {
    event.preventDefault()
    setAdminLoading(true)
    setMessage('')

    try {
      const payload = {
        title: bookForm.title,
        author: bookForm.author,
        coverUrl: bookForm.coverUrl,
        description: bookForm.description,
        category: bookForm.category,
        publishYear: bookForm.publishYear ? Number(bookForm.publishYear) : null,
      }

      if (editingBookId) {
        await request(`/api/book/${editingBookId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await request('/api/book', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await Promise.all([loadAdminBooks(), loadHome()])
      setBookForm(emptyBookForm)
      setEditingBookId(null)
      setMessage(editingBookId ? '图书已更新' : '新图书已发布')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setAdminLoading(false)
    }
  }

  async function toggleBookStatus(book) {
    setActionBookId(book.id)
    setMessage('')

    try {
      const nextStatus = book.status === 1 ? 0 : 1
      await request(`/api/book/${book.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      })
      await Promise.all([loadAdminBooks(), loadHome(), loadPanel()])
      setMessage(nextStatus === 1 ? '图书已上架' : '图书已下架')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setActionBookId(null)
    }
  }

  async function deleteBook(book) {
    setActionBookId(book.id)
    setMessage('')

    try {
      await request(`/api/book/${book.id}`, {
        method: 'DELETE',
      })
      await Promise.all([loadAdminBooks(), loadHome(), loadPanel()])
      if (editingBookId === book.id) {
        setEditingBookId(null)
        setBookForm(emptyBookForm)
      }
      setMessage(`《${book.title}》已删除`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setActionBookId(null)
    }
  }

  function editBook(book) {
    setActiveTab('admin')
    setEditingBookId(book.id)
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      coverUrl: book.coverUrl || '',
      description: book.description || '',
      category: book.category || '',
      publishYear: book.publishYear || '',
    })
  }

  function resetBookForm() {
    setEditingBookId(null)
    setBookForm(emptyBookForm)
  }

  function editManagedUser(user) {
    setEditingManagedUserId(user.id)
    setManagedUserForm({
      username: user.username || '',
      password: '',
      nickname: user.nickname || '',
      avatarUrl: user.avatarUrl || '',
      role: user.role ?? 0,
      status: user.status ?? 1,
    })
    setManagedUserModalOpen(true)
  }

  function openCreateManagedUser() {
    setEditingManagedUserId(null)
    setManagedUserForm(emptyManagedUserForm)
    setManagedUserModalOpen(true)
  }

  function resetManagedUserForm() {
    setEditingManagedUserId(null)
    setManagedUserForm(emptyManagedUserForm)
    setManagedUserModalOpen(false)
  }

  /**
   * 管理员提交用户新增或编辑
   *
   * @param event 表单事件
   * @return void
   */
  async function handleManagedUserSubmit(event) {
    event.preventDefault()
    setUserAdminLoading(true)
    setMessage('')

    try {
      const payload = {
        username: managedUserForm.username,
        password: managedUserForm.password,
        nickname: managedUserForm.nickname,
        avatarUrl: managedUserForm.avatarUrl,
        role: Number(managedUserForm.role),
        status: Number(managedUserForm.status),
      }

      if (editingManagedUserId) {
        await request(`/api/user/admin/${editingManagedUserId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await request('/api/user/admin', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await Promise.all([loadManagedUsers(), loadPanel()])
      resetManagedUserForm()
      setMessage(editingManagedUserId ? '用户信息已更新' : '新用户已添加')
    } catch (error) {
      setMessage(error.message)
      setUserAdminLoading(false)
    }
  }

  async function deleteManagedUser(user) {
    setUserAdminLoading(true)
    setMessage('')

    try {
      await request(`/api/user/admin/${user.id}`, {
        method: 'DELETE',
      })
      await Promise.all([loadManagedUsers(), loadPanel()])
      if (editingManagedUserId === user.id) {
        resetManagedUserForm()
      }
      setMessage(`用户 ${user.username} 已删除`)
    } catch (error) {
      setMessage(error.message)
      setUserAdminLoading(false)
    }
  }

  function logout() {
    setSession(null)
    setActiveTab('home')
    setMessage('已退出登录')
  }

  /**
   * 切换当前展示的大书卡片。
   *
   * @param step 滑动步长
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
   * 搜索栏提交时回到第一本匹配图书。
   *
   * @param event 表单事件
   * @return void
   */
  function handleSearchSubmit(event) {
    event.preventDefault()
    setCurrentFeedIndex(0)
  }

  /**
   * 使用滚轮模拟短视频上下切换。
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

  // 记录触摸起点，移动端可用上下滑手势切换图书。
  function handleFeedTouchStart(event) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null
  }

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

  const viewTitle =
    activeTab === 'home' ? '今天先读哪一本' : activeTab === 'profile' ? '你的阅读身份' : '图书管理台'
  const viewEyebrow = activeTab === 'home' ? '推荐流' : activeTab === 'profile' ? '用户中心' : 'ADMIN PANEL'

  return (
    <div className="app-shell">
      <div className="backdrop-glow glow-a" />
      <div className="backdrop-glow glow-b" />

      <aside className="left-rail">
        {/* 左侧占位空白格，与右侧空白格保持同高 */}
        <div className="side-blank-card" aria-hidden="true" />
      </aside>

      <main className="main-stage">
        <header className={`topbar ${activeTab === 'home' ? 'topbar-home' : ''}`}>
          {activeTab === 'home' ? (
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
          ) : (
            <div>
              <div className="eyebrow">{viewEyebrow}</div>
              <h2>{viewTitle}</h2>
            </div>
          )}

          <div className="topbar-actions">
            <button className={`ghost-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
              首页推荐
            </button>
            <button className={`ghost-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              用户中心
            </button>
            {isAdmin ? (
              <button className={`ghost-button ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                图书管理
              </button>
            ) : null}
            {session ? (
              <button className="primary-button slim" onClick={logout}>
                退出
              </button>
            ) : (
              <button className="primary-button slim" onClick={() => setAuthOpen(true)}>
                登录 / 注册
              </button>
            )}
          </div>
        </header>

        {message ? <div className="flash-bar">{message}</div> : null}

        {activeTab === 'home' ? (
          <section className="feed-stage" onWheel={handleFeedWheel} onTouchStart={handleFeedTouchStart} onTouchEnd={handleFeedTouchEnd}>
            {homeLoading ? (
              <div className="empty-state wide">正在拼接今日推荐流...</div>
            ) : !currentFeedBook ? (
              <div className="empty-state wide">{searchKeyword.trim() ? '没有搜到匹配的图书，换个关键词试试。' : '当前没有可展示的图书。'}</div>
            ) : (
              (() => {
                const book = currentFeedBook
                const record = recordMap.get(book.id)
                const readState = record ? statusMeta[record.readStatus] : null

                return (
                  <article className="feed-card feed-card-focus" key={book.id || currentFeedIndex}>
                    <div className="feed-cover" style={{ backgroundImage: coverStyle(book.coverUrl, book.title) }} />
                    <div className="feed-overlay" />
                    {/* 顶部元信息固定在卡片顶部，避免随底部内容高度变化而漂移。 */}
                    <div className="feed-topline">
                      <span>{book.category || '灵感专题'}</span>
                      <span>{book.publishYear || '新读物'}</span>
                    </div>
                    <div className="feed-nav">
                      <button className="feed-nav-button" onClick={() => shiftFeed(-1)} aria-label="切换到上一本">
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M5.2 12.6L10 7.8l4.8 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="feed-nav-button" onClick={() => shiftFeed(1)} aria-label="切换到下一本">
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M5.2 7.4L10 12.2l4.8-4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <div className="feed-content feed-content-focus">
                      <div className="feed-counter">{String(currentFeedIndex + 1).padStart(2, '0')} / {String(filteredFeaturedBooks.length).padStart(2, '0')}</div>
                      <h3>{book.title}</h3>
                      <p>{book.description || '适合在深夜刷到的那种书，几页就能进入状态。'}</p>
                      <div className="meta-row">
                        <span>{book.author || '匿名作者'}</span>
                        <span>{book.readCount || 0} 次触达</span>
                      </div>
                      <div className="action-row">
                        {session ? (
                          record ? (
                            <button
                              className={`status-pill ${readState?.className || ''}`}
                              onClick={() => toggleRecordStatus(record)}
                              disabled={actionBookId === book.id}
                            >
                              {actionBookId === book.id ? '更新中...' : readState?.label}
                            </button>
                          ) : (
                            <button className="primary-button" onClick={() => addToReading(book)} disabled={actionBookId === book.id}>
                              {actionBookId === book.id ? '加入中...' : '加入在读'}
                            </button>
                          )
                        ) : (
                          <button className="primary-button" onClick={() => setAuthOpen(true)}>
                            登录后追更
                          </button>
                        )}
                        {isAdmin ? (
                          <button className="ghost-button small" onClick={() => editBook(book)}>
                            直接编辑
                          </button>
                        ) : null}
                        <span className="swipe-note">上下滑动或滚轮切换下一本，像短视频一样看书。</span>
                      </div>
                    </div>
                  </article>
                )
              })()
            )}
          </section>
        ) : null}

        {activeTab === 'profile' ? (
          <section className="profile-stage">
            {!session ? (
              <div className="empty-state large">
                <h3>用户中心需要登录</h3>
                <p>登录之后可以看到你的身份卡、阅读进度和最近推荐。</p>
                <button className="primary-button" onClick={() => setAuthOpen(true)}>
                  现在登录
                </button>
              </div>
            ) : (
              <>
                <div className="profile-hero">
                  <div className="avatar-shell">
                    <div className="avatar" style={{ backgroundImage: coverStyle(profile?.avatarUrl, displayName) }}>
                      {!profile?.avatarUrl ? displayName.slice(0, 1) : null}
                    </div>
                  </div>
                  <div className="profile-copy">
                    <span className="eyebrow">USER CENTER</span>
                    <h3>{displayName}</h3>
                    <p>{profile?.role === 1 ? '管理员视角，能调状态、管书架。' : '你的阅读画像正在形成，推荐会越来越像你。'}</p>
                    <div className="metric-row">
                      <MetricCard label="在读书单" value={records.filter((item) => item.readStatus === 1).length} />
                      <MetricCard label="已读完" value={records.filter((item) => item.readStatus === 0).length} />
                      <MetricCard label="推荐命中" value={recommendData.recentlyRead.length} />
                    </div>
                  </div>
                </div>

                <div className="profile-grid">
                  <form className="profile-card profile-card-fixed profile-edit-card" onSubmit={handleProfileSave}>
                    <div className="section-title">
                      <span className="section-dot" />
                      <h3>编辑名片</h3>
                    </div>
                    <label>
                      <span>昵称</span>
                      <input value={profileForm.nickname} onChange={(event) => setProfileForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="你想让别人看到什么名字" />
                    </label>
                    <label>
                      <span>头像链接</span>
                      <input value={profileForm.avatarUrl} onChange={(event) => setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://..." />
                    </label>
                    <button className="primary-button" disabled={panelLoading}>
                      {panelLoading ? '保存中...' : '保存资料'}
                    </button>
                  </form>

                  <div className="profile-card profile-card-fixed profile-record-card">
                    <div className="section-title">
                      <span className="section-dot" />
                      <h3>最近阅读</h3>
                    </div>
                      <div className="record-list compact">
                       {records.length ? (
                         records.map((record) => {
                           const state = statusMeta[record.readStatus] || statusMeta[1]
                           return (
                            <div className="record-item" key={record.id}>
                              <div className="record-cover" style={{ backgroundImage: coverStyle(record.bookCover, record.bookTitle) }} />
                              <div className="record-copy">
                                <strong>{record.bookTitle}</strong>
                                <span>{state.label}</span>
                              </div>
                              <div className="record-actions">
                                <button className="ghost-button small danger" onClick={() => deleteRecord(record)} disabled={actionBookId === record.bookId}>
                                  删除
                                </button>
                                <button className="ghost-button small" onClick={() => toggleRecordStatus(record)} disabled={actionBookId === record.bookId}>
                                  切换
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="empty-inline">还没有阅读轨迹，去首页挑一本到书架里。</div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card profile-card-wide">
                    {isAdmin ? (
                      <>
                        <div className="profile-card-toolbar">
                          <div className="section-title no-margin">
                            <span className="section-dot" />
                            <h3>所有用户信息</h3>
                          </div>
                          <button className="ghost-button small" type="button" onClick={openCreateManagedUser}>
                            新增用户
                          </button>
                        </div>

                        {userAdminLoading ? <div className="empty-inline">正在读取用户列表...</div> : null}

                        {managedUsers.length ? (
                          <div className="user-card-strip">
                            {managedUsers.map((user) => (
                              <article className="user-card" key={user.id}>
                                <div className="user-card-head">
                                  <div className="user-card-avatar" style={{ backgroundImage: coverStyle(user.avatarUrl, user.nickname || user.username) }}>
                                    {!user.avatarUrl ? (user.nickname || user.username || 'U').slice(0, 1) : null}
                                  </div>
                                  <div className="user-card-copy">
                                    <strong>{user.nickname || user.username}</strong>
                                    <span>@{user.username}</span>
                                  </div>
                                </div>
                                <div className="user-card-meta">
                                  <span>{user.role === 1 ? '管理员' : '普通用户'}</span>
                                  <span>{user.status === 1 ? '启用中' : '已禁用'}</span>
                                  <span>{formatDate(user.createTime)}</span>
                                </div>
                                <div className="user-card-actions">
                                  <button className="ghost-button small" type="button" onClick={() => editManagedUser(user)}>
                                    修改
                                  </button>
                                  <button className="ghost-button small danger" type="button" onClick={() => deleteManagedUser(user)} disabled={userAdminLoading || user.id === session?.userId}>
                                    删除
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-inline">当前没有可管理的用户信息。</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="section-title">
                          <span className="section-dot" />
                          <h3>个性推荐</h3>
                        </div>
                        <div className="recommend-strip">
                          {(recommendData.recommends.length ? recommendData.recommends : books).map((book) => (
                            <div className="recommend-tile" key={book.id}>
                              <div className="recommend-cover" style={{ backgroundImage: coverStyle(book.coverUrl, book.title) }} />
                              <div>
                                <strong>{book.title}</strong>
                                <p>{book.author}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}

        {activeTab === 'admin' ? (
          <section className="admin-stage">
            {!isAdmin ? (
              <div className="empty-state large">
                <h3>管理员权限不可用</h3>
                <p>当前账号不是管理员，无法访问图书管理台。</p>
              </div>
            ) : (
              <>
                <div className="admin-hero">
                  <div>
                    <span className="eyebrow">EDITOR MODE</span>
                    <h3>像内容运营一样管理书库节奏</h3>
                    <p>新增、编辑、上架和删除都走真实后端接口。首页推荐流会立刻反映你的操作。</p>
                  </div>
                  <div className="metric-row">
                    <MetricCard label="总图书" value={adminBooks.length} />
                    <MetricCard label="已上架" value={adminBooks.filter((item) => item.status === 1).length} />
                    <MetricCard label="待调整" value={adminBooks.filter((item) => item.status !== 1).length} />
                  </div>
                </div>

                <div className="admin-grid">
                  <form className="profile-card admin-form-card admin-card-fixed" onSubmit={handleBookSubmit}>
                    <div className="section-title">
                      <span className="section-dot" />
                      <h3>{editingBookId ? '编辑图书' : '新增图书'}</h3>
                    </div>

                    <label>
                      <span>书名</span>
                      <input value={bookForm.title} onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))} placeholder="像爆款封面一样醒目" required />
                    </label>
                    <div className="field-grid">
                      <label>
                        <span>作者</span>
                        <input value={bookForm.author} onChange={(event) => setBookForm((current) => ({ ...current, author: event.target.value }))} placeholder="作者名" required />
                      </label>
                      <label>
                        <span>分类</span>
                        <input value={bookForm.category} onChange={(event) => setBookForm((current) => ({ ...current, category: event.target.value }))} placeholder="小说 / 商业 / 科技" required />
                      </label>
                    </div>
                    <div className="field-grid">
                      <label>
                        <span>出版年份</span>
                        <input value={bookForm.publishYear} onChange={(event) => setBookForm((current) => ({ ...current, publishYear: event.target.value }))} placeholder="2024" type="number" />
                      </label>
                      <label>
                        <span>封面链接</span>
                        <input value={bookForm.coverUrl} onChange={(event) => setBookForm((current) => ({ ...current, coverUrl: event.target.value }))} placeholder="https://..." />
                      </label>
                    </div>
                    <label>
                      <span>简介</span>
                      <textarea value={bookForm.description} onChange={(event) => setBookForm((current) => ({ ...current, description: event.target.value }))} placeholder="写一段让用户愿意停留的简介" rows="5" />
                    </label>

                    <div className="action-row">
                      <button className="primary-button" disabled={adminLoading}>
                        {adminLoading ? '提交中...' : editingBookId ? '保存修改' : '发布图书'}
                      </button>
                      {editingBookId ? (
                        <button className="ghost-button" type="button" onClick={resetBookForm}>
                          取消编辑
                        </button>
                      ) : null}
                    </div>
                  </form>

                  <div className="profile-card admin-list-card admin-card-fixed">
                    <div className="section-title">
                      <span className="section-dot" />
                      <h3>当前书库</h3>
                    </div>

                    {adminLoading ? <div className="empty-inline">正在读取图书清单...</div> : null}

                    <div className="admin-book-list">
                      {adminBooks.map((book) => (
                        <article className="admin-book-item" key={book.id}>
                          <div className="admin-book-left">
                            <div className="admin-book-cover" style={{ backgroundImage: coverStyle(book.coverUrl, book.title) }} />
                            <div className="admin-book-copy">
                              <div className="admin-book-heading">
                                <strong>{book.title}</strong>
                                <span className={`book-status ${book.status === 1 ? 'up' : 'down'}`}>{book.status === 1 ? '已上架' : '已下架'}</span>
                              </div>
                              <p>{book.author} · {book.category} · {book.publishYear || '年份待补'}</p>
                              <span>{book.description || '暂无简介'}</span>
                            </div>
                          </div>
                          <div className="admin-book-actions">
                            <button className="ghost-button small" onClick={() => editBook(book)}>
                              编辑
                            </button>
                            <button className="ghost-button small" onClick={() => toggleBookStatus(book)} disabled={actionBookId === book.id}>
                              {actionBookId === book.id ? '处理中...' : book.status === 1 ? '下架' : '上架'}
                            </button>
                            <button className="ghost-button small danger" onClick={() => deleteBook(book)} disabled={actionBookId === book.id}>
                              删除
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
      </main>

      <aside className="right-panel">
        {/* 右侧占位空白格，与左侧空白格保持同高 */}
        <div className="side-blank-card" aria-hidden="true" />
      </aside>

      <nav className="mobile-nav mobile-nav-three">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
          推荐
        </button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
          我的
        </button>
        {isAdmin ? (
          <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>
            管理
          </button>
        ) : null}
      </nav>

      {authOpen ? (
        <div className="auth-layer" onClick={() => setAuthOpen(false)}>
          <div className="auth-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="auth-header">
              <div>
                <span className="eyebrow">AUTH</span>
                <h3>{authMode === 'login' ? '进入你的书流账户' : '注册一个阅读身份'}</h3>
              </div>
              <button className="ghost-button small" onClick={() => setAuthOpen(false)}>
                关闭
              </button>
            </div>

            <div className="auth-switch">
              <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
                登录
              </button>
              <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
                注册
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <label>
                <span>用户名</span>
                <input value={authForm.username} onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))} placeholder="zhangsan" />
              </label>
              <label>
                <span>密码</span>
                <input type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} placeholder="123456" />
              </label>
              {authMode === 'register' ? (
                <label>
                  <span>昵称</span>
                  <input value={authForm.nickname} onChange={(event) => setAuthForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="给自己一个更像内容创作者的名字" />
                </label>
              ) : null}
              <button className="primary-button" disabled={authLoading}>
                {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并进入'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {managedUserModalOpen ? (
        <div className="auth-layer" onClick={resetManagedUserForm}>
          <div className="auth-sheet user-manage-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="auth-header">
              <div>
                <span className="eyebrow">USER ADMIN</span>
                <h3>{editingManagedUserId ? '修改用户信息' : '新增用户'}</h3>
              </div>
              <button className="ghost-button small" type="button" onClick={resetManagedUserForm}>
                关闭
              </button>
            </div>

            <form className="auth-form user-manage-modal-form" onSubmit={handleManagedUserSubmit}>
              <div className="field-grid user-manage-grid">
                <label>
                  <span>用户名</span>
                  <input value={managedUserForm.username} onChange={(event) => setManagedUserForm((current) => ({ ...current, username: event.target.value }))} placeholder="输入用户名" required />
                </label>
                <label>
                  <span>昵称</span>
                  <input value={managedUserForm.nickname} onChange={(event) => setManagedUserForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="输入昵称" />
                </label>
                <label>
                  <span>密码</span>
                  <input type="password" value={managedUserForm.password} onChange={(event) => setManagedUserForm((current) => ({ ...current, password: event.target.value }))} placeholder={editingManagedUserId ? '留空则不修改密码' : '输入登录密码'} required={!editingManagedUserId} />
                </label>
                <label>
                  <span>头像链接</span>
                  <input value={managedUserForm.avatarUrl} onChange={(event) => setManagedUserForm((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://..." />
                </label>
                <label>
                  <span>角色</span>
                  <select value={managedUserForm.role} onChange={(event) => setManagedUserForm((current) => ({ ...current, role: Number(event.target.value) }))}>
                    <option value={0}>普通用户</option>
                    <option value={1}>管理员</option>
                  </select>
                </label>
                <label>
                  <span>状态</span>
                  <select value={managedUserForm.status} onChange={(event) => setManagedUserForm((current) => ({ ...current, status: Number(event.target.value) }))}>
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </label>
              </div>
              <div className="action-row">
                <button className="primary-button" disabled={userAdminLoading}>
                  {userAdminLoading ? '处理中...' : editingManagedUserId ? '保存用户' : '创建用户'}
                </button>
                <button className="ghost-button" type="button" onClick={resetManagedUserForm}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function coverStyle(url, seed = '') {
  if (url) {
    return `linear-gradient(180deg, rgba(4,8,20,0.08), rgba(4,8,20,0.82)), url(${url})`
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

function formatDate(value) {
  if (!value) {
    return '创建时间待补'
  }

  return new Date(value).toLocaleDateString('zh-CN')
}

export default App
