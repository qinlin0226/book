import MetricCard from './MetricCard'
import { coverStyle } from '../utils/bookUi'

/**
 * 管理台视图，负责图书维护表单与列表展示。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function AdminView({
  isAdmin,
  adminBooks,
  editingBookId,
  bookForm,
  adminLoading,
  actionBookId,
  onBookFormChange,
  onBookSubmit,
  onResetBookForm,
  onEditBook,
  onToggleBookStatus,
  onDeleteBook,
}) {
  if (!isAdmin) {
    return (
      <section className="admin-stage">
        <div className="empty-state large">
          <h3>管理员权限不可用</h3>
          <p>当前账号不是管理员，无法访问图书管理台。</p>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-stage">
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
        <form className="profile-card admin-form-card admin-card-fixed" onSubmit={onBookSubmit}>
          <div className="section-title">
            <span className="section-dot" />
            <h3>{editingBookId ? '编辑图书' : '新增图书'}</h3>
          </div>

          <label>
            <span>书名</span>
            <input value={bookForm.title} onChange={(event) => onBookFormChange('title', event.target.value)} placeholder="像爆款封面一样醒目" required />
          </label>
          <div className="field-grid">
            <label>
              <span>作者</span>
              <input value={bookForm.author} onChange={(event) => onBookFormChange('author', event.target.value)} placeholder="作者名" required />
            </label>
            <label>
              <span>分类</span>
              <input value={bookForm.category} onChange={(event) => onBookFormChange('category', event.target.value)} placeholder="小说 / 商业 / 科技" required />
            </label>
          </div>
          <div className="field-grid">
            <label>
              <span>出版年份</span>
              <input value={bookForm.publishYear} onChange={(event) => onBookFormChange('publishYear', event.target.value)} placeholder="2024" type="number" />
            </label>
            <label>
              <span>封面链接</span>
              <input value={bookForm.coverUrl} onChange={(event) => onBookFormChange('coverUrl', event.target.value)} placeholder="https://..." />
            </label>
          </div>
          <label>
            <span>简介</span>
            <textarea value={bookForm.description} onChange={(event) => onBookFormChange('description', event.target.value)} placeholder="写一段让用户愿意停留的简介" rows="5" />
          </label>

          <div className="action-row">
            <button className="primary-button" disabled={adminLoading}>
              {adminLoading ? '提交中...' : editingBookId ? '保存修改' : '发布图书'}
            </button>
            {editingBookId ? (
              <button className="ghost-button" type="button" onClick={onResetBookForm}>
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
                  <button className="ghost-button small" onClick={() => onEditBook(book)}>
                    编辑
                  </button>
                  <button className="ghost-button small" onClick={() => onToggleBookStatus(book)} disabled={actionBookId === book.id}>
                    {actionBookId === book.id ? '处理中...' : book.status === 1 ? '下架' : '上架'}
                  </button>
                  <button className="ghost-button small danger" onClick={() => onDeleteBook(book)} disabled={actionBookId === book.id}>
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminView
