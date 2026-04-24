/**
 * 用户管理弹窗，负责新增和编辑用户信息。
 *
 * @param props 组件参数
 * @return JSX.Element|null
 */
function ManagedUserModal({
  open,
  editingManagedUserId,
  managedUserForm,
  userAdminLoading,
  onClose,
  onFormChange,
  onSubmit,
}) {
  if (!open) {
    return null
  }

  return (
    <div className="auth-layer" onClick={onClose}>
      <div className="auth-sheet user-manage-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="auth-header">
          <div>
            <span className="eyebrow">USER ADMIN</span>
            <h3>{editingManagedUserId ? '修改用户信息' : '新增用户'}</h3>
          </div>
          <button className="ghost-button small" type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <form className="auth-form user-manage-modal-form" onSubmit={onSubmit}>
          <div className="field-grid user-manage-grid">
            <label>
              <span>用户名</span>
              <input value={managedUserForm.username} onChange={(event) => onFormChange('username', event.target.value)} placeholder="输入用户名" required />
            </label>
            <label>
              <span>昵称</span>
              <input value={managedUserForm.nickname} onChange={(event) => onFormChange('nickname', event.target.value)} placeholder="输入昵称" />
            </label>
            <label>
              <span>密码</span>
              <input type="password" value={managedUserForm.password} onChange={(event) => onFormChange('password', event.target.value)} placeholder={editingManagedUserId ? '留空则不修改密码' : '输入登录密码'} required={!editingManagedUserId} />
            </label>
            <label>
              <span>头像链接</span>
              <input value={managedUserForm.avatarUrl} onChange={(event) => onFormChange('avatarUrl', event.target.value)} placeholder="/assets/avatars/dicebear-admin.svg" />
            </label>
            <label>
              <span>角色</span>
              <select value={managedUserForm.role} onChange={(event) => onFormChange('role', Number(event.target.value))}>
                <option value={0}>普通用户</option>
                <option value={1}>管理员</option>
              </select>
            </label>
            <label>
              <span>状态</span>
              <select value={managedUserForm.status} onChange={(event) => onFormChange('status', Number(event.target.value))}>
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </label>
          </div>
          <div className="action-row">
            <button className="primary-button" disabled={userAdminLoading}>
              {userAdminLoading ? '处理中...' : editingManagedUserId ? '保存用户' : '创建用户'}
            </button>
            <button className="ghost-button" type="button" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManagedUserModal
