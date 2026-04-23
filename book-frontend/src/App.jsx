import { useEffect, useMemo, useRef, useState } from 'react'
import { adminUserApi, authApi, bookApi, recommendApi, recordApi, userApi } from './api'
import AdminView from './components/AdminView'
import AuthModal from './components/AuthModal'
import HomeView from './components/HomeView'
import ManagedUserModal from './components/ManagedUserModal'
import ProfileView from './components/ProfileView'
import usePersistedSession from './hooks/usePersistedSession'

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
  const [session, setSession] = usePersistedSession(SESSION_KEY)
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
  const sessionToken = session?.token
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

  async function loadHome() {
    setHomeLoading(true)

    try {
      const publicList = await bookApi.list({ page: 1, size: 12 })
      setBooks(publicList.records || [])

      if (sessionToken) {
        const recommend = await recommendApi.list({ limit: RECOMMEND_LIMIT, token: sessionToken })
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
        userApi.getProfile({ token: sessionToken }),
        recordApi.list({ page: 1, size: 50, token: sessionToken }),
        recommendApi.list({ limit: RECOMMEND_LIMIT, token: sessionToken }),
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
      const pageData = await bookApi.list({ page: 1, size: 24, token: sessionToken })
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
      const userList = await adminUserApi.list({ token: sessionToken })
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
        await authApi.register({
          username: authForm.username,
          password: authForm.password,
          nickname: authForm.nickname,
        })
      }

      const loginData = await authApi.login({
        username: authForm.username,
        password: authForm.password,
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
      await userApi.updateProfile(profileForm, { token: sessionToken })
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
      await recordApi.create({ bookId: book.id }, { token: sessionToken })
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
      await recordApi.updateStatus(record.id, { readStatus: nextStatus }, { token: sessionToken })
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
      await recordApi.remove(record.id, { token: sessionToken })
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
        await bookApi.update(editingBookId, payload, { token: sessionToken })
      } else {
        await bookApi.create(payload, { token: sessionToken })
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
      await bookApi.updateStatus(book.id, { status: nextStatus }, { token: sessionToken })
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
      await bookApi.remove(book.id, { token: sessionToken })
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
        await adminUserApi.update(editingManagedUserId, payload, { token: sessionToken })
      } else {
        await adminUserApi.create(payload, { token: sessionToken })
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
      await adminUserApi.remove(user.id, { token: sessionToken })
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

  /**
   * 更新认证表单字段。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  function updateAuthForm(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }))
  }

  /**
   * 更新个人资料表单字段。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  function updateProfileForm(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  /**
   * 更新图书表单字段。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  function updateBookForm(field, value) {
    setBookForm((current) => ({ ...current, [field]: value }))
  }

  /**
   * 更新用户管理表单字段。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  function updateManagedUserForm(field, value) {
    setManagedUserForm((current) => ({ ...current, [field]: value }))
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
          <HomeView
            homeLoading={homeLoading}
            currentFeedBook={currentFeedBook}
            searchKeyword={searchKeyword}
            filteredFeaturedBooks={filteredFeaturedBooks}
            currentFeedIndex={currentFeedIndex}
            recordMap={recordMap}
            statusMeta={statusMeta}
            session={session}
            isAdmin={isAdmin}
            actionBookId={actionBookId}
            onFeedWheel={handleFeedWheel}
            onFeedTouchStart={handleFeedTouchStart}
            onFeedTouchEnd={handleFeedTouchEnd}
            onShiftFeed={shiftFeed}
            onToggleRecordStatus={toggleRecordStatus}
            onAddToReading={addToReading}
            onOpenAuth={() => setAuthOpen(true)}
            onEditBook={editBook}
          />
        ) : null}

        {activeTab === 'profile' ? (
          <ProfileView
            session={session}
            profile={profile}
            displayName={displayName}
            records={records}
            recommendData={recommendData}
            books={books}
            profileForm={profileForm}
            panelLoading={panelLoading}
            statusMeta={statusMeta}
            actionBookId={actionBookId}
            isAdmin={isAdmin}
            userAdminLoading={userAdminLoading}
            managedUsers={managedUsers}
            sessionUserId={session?.userId}
            onProfileFormChange={updateProfileForm}
            onProfileSave={handleProfileSave}
            onDeleteRecord={deleteRecord}
            onToggleRecordStatus={toggleRecordStatus}
            onOpenAuth={() => setAuthOpen(true)}
            onOpenCreateManagedUser={openCreateManagedUser}
            onEditManagedUser={editManagedUser}
            onDeleteManagedUser={deleteManagedUser}
          />
        ) : null}

        {activeTab === 'admin' ? (
          <AdminView
            isAdmin={isAdmin}
            adminBooks={adminBooks}
            editingBookId={editingBookId}
            bookForm={bookForm}
            adminLoading={adminLoading}
            actionBookId={actionBookId}
            onBookFormChange={updateBookForm}
            onBookSubmit={handleBookSubmit}
            onResetBookForm={resetBookForm}
            onEditBook={editBook}
            onToggleBookStatus={toggleBookStatus}
            onDeleteBook={deleteBook}
          />
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

      <AuthModal
        open={authOpen}
        authMode={authMode}
        authForm={authForm}
        authLoading={authLoading}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
        onFormChange={updateAuthForm}
        onSubmit={handleAuthSubmit}
      />

      <ManagedUserModal
        open={managedUserModalOpen}
        editingManagedUserId={editingManagedUserId}
        managedUserForm={managedUserForm}
        userAdminLoading={userAdminLoading}
        onClose={resetManagedUserForm}
        onFormChange={updateManagedUserForm}
        onSubmit={handleManagedUserSubmit}
      />
    </div>
  )
}

export default App
