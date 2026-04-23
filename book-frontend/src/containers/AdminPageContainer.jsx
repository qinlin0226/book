import { useEffect, useMemo, useState } from 'react'
import AdminView from '../components/AdminView'
import { getAdminMetrics } from '../domain/librarySelectors'
import useLibraryWorkspace from '../hooks/useLibraryWorkspace'

const emptyBookForm = {
  title: '',
  author: '',
  coverUrl: '',
  description: '',
  category: '',
  publishYear: '',
}

/**
 * 管理台页面容器，负责图书表单草稿与编辑状态。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function AdminPageContainer({ isAdmin, editRequest }) {
  const { admin, actions } = useLibraryWorkspace()
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [editingBookId, setEditingBookId] = useState(null)

  const adminMetrics = useMemo(() => getAdminMetrics(admin.adminBooks), [admin.adminBooks])

  useEffect(() => {
    if (!editRequest?.book) {
      return
    }

    setEditingBookId(editRequest.book.id)
    setBookForm({
      title: editRequest.book.title || '',
      author: editRequest.book.author || '',
      coverUrl: editRequest.book.coverUrl || '',
      description: editRequest.book.description || '',
      category: editRequest.book.category || '',
      publishYear: editRequest.book.publishYear || '',
    })
  }, [editRequest])

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
   * 重置图书编辑表单。
   *
   * @return void
   */
  function resetBookForm() {
    setEditingBookId(null)
    setBookForm(emptyBookForm)
  }

  /**
   * 用当前图书填充编辑表单。
   *
   * @param book 图书信息
   * @return void
   */
  function editBook(book) {
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

  /**
   * 提交图书表单。
   *
   * @param event 表单事件
   * @return Promise<void>
   */
  async function handleBookSubmit(event) {
    event.preventDefault()

    const payload = {
      title: bookForm.title,
      author: bookForm.author,
      coverUrl: bookForm.coverUrl,
      description: bookForm.description,
      category: bookForm.category,
      publishYear: bookForm.publishYear ? Number(bookForm.publishYear) : null,
    }

    await actions.submitBook(payload, editingBookId)
    resetBookForm()
  }

  return (
    <AdminView
      isAdmin={isAdmin}
      adminMetrics={adminMetrics}
      adminBookItems={admin.adminBookItems}
      editingBookId={editingBookId}
      bookForm={bookForm}
      adminLoading={admin.adminLoading}
      actionBookId={admin.actionBookId}
      onBookFormChange={updateBookForm}
      onBookSubmit={handleBookSubmit}
      onResetBookForm={resetBookForm}
      onEditBook={editBook}
      onToggleBookStatus={actions.toggleBookStatus}
      onDeleteBook={actions.deleteBook}
    />
  )
}

export default AdminPageContainer
