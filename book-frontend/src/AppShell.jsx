import { useEffect, useMemo, useState } from 'react'
import AuthModal from './components/AuthModal'
import SideBookMarquee from './components/SideBookMarquee'
import AdminPageContainer from './containers/AdminPageContainer'
import HomePageContainer from './containers/HomePageContainer'
import ProfilePageContainer from './containers/ProfilePageContainer'
import { getRoleTitle } from './domain/userSelectors'
import useLibraryWorkspace from './hooks/useLibraryWorkspace'
import useSession from './hooks/useSession'

/**
 * 应用壳层，负责全局布局、顶部导航与页面切换。
 *
 * @return JSX.Element
 */
function AppShell() {
  const [activeTab, setActiveTab] = useState('home')
  const [adminEditRequest, setAdminEditRequest] = useState(null)
  const { session, isAdmin, authModal, actions: sessionActions } = useSession()
  const { shell, profile } = useLibraryWorkspace()

  const roleTitle = useMemo(() => getRoleTitle(profile.profile?.role ?? session?.role), [profile.profile?.role, session?.role])
  const viewTitle = activeTab === 'profile' ? roleTitle : '图书管理台'
  const viewEyebrow = activeTab === 'profile' ? '用户中心' : 'ADMIN PANEL'

  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab(session ? 'profile' : 'home')
    }
  }, [activeTab, isAdmin, session])

  /**
   * 打开管理台并载入当前图书到编辑表单。
   *
   * @param book 图书信息
   * @return void
   */
  function handleRequestEditBook(book) {
    setAdminEditRequest({
      book,
      nonce: Date.now(),
    })
    setActiveTab('admin')
  }

  return (
    <div className="app-shell">
      <div className="backdrop-glow glow-a" />
      <div className="backdrop-glow glow-b" />

      <aside className="left-rail">
        {/* 左侧上架图书封面自动向下循环滚动。 */}
        <SideBookMarquee books={shell.sideBookGroups.left} side="left" />
      </aside>

      <main className="main-stage">
        {activeTab === 'home' ? (
          <HomePageContainer onSwitchTab={setActiveTab} onRequestEditBook={handleRequestEditBook} />
        ) : (
          <>
            <header className="topbar">
              <div>
                <div className="eyebrow">{viewEyebrow}</div>
                <h2>{viewTitle}</h2>
              </div>

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

            {activeTab === 'profile' ? <ProfilePageContainer /> : null}
            {activeTab === 'admin' ? <AdminPageContainer isAdmin={isAdmin} editRequest={adminEditRequest} /> : null}
          </>
        )}
      </main>

      <aside className="right-panel">
        {/* 右侧上架图书封面自动向下循环滚动，与左侧使用不同图书。 */}
        <SideBookMarquee books={shell.sideBookGroups.right} side="right" />
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
        open={authModal.open}
        authMode={authModal.authMode}
        authForm={authModal.authForm}
        authLoading={authModal.authLoading}
        onClose={sessionActions.closeAuth}
        onSwitchMode={sessionActions.switchAuthMode}
        onFormChange={sessionActions.updateAuthForm}
        onSubmit={sessionActions.submitAuth}
      />
    </div>
  )
}

export default AppShell
