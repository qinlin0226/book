import MetricCard from './MetricCard'
import { coverStyle } from '../utils/bookUi'

/**
 * 用户中心视图，负责资料编辑、阅读记录与用户管理展示。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function ProfileView({
  session,
  profile,
  displayName,
  profileSummary,
  profileMetrics,
  records,
  recommendedBooks,
  profileForm,
  panelLoading,
  statusMeta,
  actionBookId,
  isAdmin,
  userAdminLoading,
  managedUserCards,
  sessionUserId,
  onProfileFormChange,
  onProfileSave,
  onDeleteRecord,
  onToggleRecordStatus,
  onOpenAuth,
  onOpenCreateManagedUser,
  onEditManagedUser,
  onDeleteManagedUser,
}) {
  if (!session) {
    return (
      <section className="profile-stage">
        <div className="empty-state large">
          <h3>用户中心需要登录</h3>
          <p>登录之后可以看到你的身份卡、阅读进度和最近推荐。</p>
          <button className="primary-button" onClick={onOpenAuth}>
            现在登录
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-stage">
      <div className="profile-hero">
        <div className="avatar-shell">
          <div className="avatar" style={{ backgroundImage: coverStyle(profile?.avatarUrl, displayName) }}>
            {!profile?.avatarUrl ? displayName.slice(0, 1) : null}
          </div>
        </div>
        <div className="profile-copy">
          <span className="eyebrow">USER CENTER</span>
          <h3>{displayName}</h3>
          <p>{profileSummary}</p>
          <div className="metric-row">
            <MetricCard label="追更数" value={profileMetrics.followingCount} />
            <MetricCard label="已读完" value={profileMetrics.finishedCount} />
            <MetricCard label="阅读数" value={profileMetrics.readingCount} />
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <form className="profile-card profile-card-fixed profile-edit-card" onSubmit={onProfileSave}>
          <div className="section-title">
            <span className="section-dot" />
            <h3>编辑名片</h3>
          </div>
          <label>
            <span>昵称</span>
            <input value={profileForm.nickname} onChange={(event) => onProfileFormChange('nickname', event.target.value)} placeholder="你想让别人看到什么名字" />
          </label>
          <label>
            <span>头像链接</span>
            <input value={profileForm.avatarUrl} onChange={(event) => onProfileFormChange('avatarUrl', event.target.value)} placeholder="https://..." />
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
                      <button className="ghost-button small danger" onClick={() => onDeleteRecord(record)} disabled={actionBookId === record.bookId}>
                        删除
                      </button>
                      <button className="ghost-button small" onClick={() => onToggleRecordStatus(record)} disabled={actionBookId === record.bookId}>
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
                <button className="ghost-button small" type="button" onClick={onOpenCreateManagedUser}>
                  新增用户
                </button>
              </div>

              {userAdminLoading ? <div className="empty-inline">正在读取用户列表...</div> : null}

              {managedUserCards.length ? (
                <div className="user-card-strip">
                  {managedUserCards.map((user) => (
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
                        <span>{user.roleLabel}</span>
                        <span>{user.statusLabel}</span>
                        <span>{user.createTimeLabel}</span>
                      </div>
                      <div className="user-card-actions">
                        <button className="ghost-button small" type="button" onClick={() => onEditManagedUser(user)}>
                          修改
                        </button>
                        <button className="ghost-button small danger" type="button" onClick={() => onDeleteManagedUser(user)} disabled={userAdminLoading || user.id === sessionUserId}>
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
                {recommendedBooks.map((book) => (
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
    </section>
  )
}

export default ProfileView
