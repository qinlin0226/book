/**
 * 登录注册弹窗，集中处理认证表单展示。
 *
 * @param props 组件参数
 * @return JSX.Element|null
 */
function AuthModal({ open, authMode, authForm, authLoading, onClose, onSwitchMode, onFormChange, onSubmit }) {
  if (!open) {
    return null
  }

  return (
    <div className="auth-layer" onClick={onClose}>
      <div className="auth-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="auth-header">
          <div>
            <span className="eyebrow">AUTH</span>
            <h3>{authMode === 'login' ? '进入你的书流账户' : '注册一个阅读身份'}</h3>
          </div>
          <button className="ghost-button small" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="auth-switch">
          <button className={authMode === 'login' ? 'active' : ''} onClick={() => onSwitchMode('login')}>
            登录
          </button>
          <button className={authMode === 'register' ? 'active' : ''} onClick={() => onSwitchMode('register')}>
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>用户名</span>
            <input value={authForm.username} onChange={(event) => onFormChange('username', event.target.value)} placeholder="zhangsan" />
          </label>
          <label>
            <span>密码</span>
            <input type="password" value={authForm.password} onChange={(event) => onFormChange('password', event.target.value)} placeholder="123456" />
          </label>
          {authMode === 'register' ? (
            <label>
              <span>昵称</span>
              <input value={authForm.nickname} onChange={(event) => onFormChange('nickname', event.target.value)} placeholder="给自己一个更像内容创作者的名字" />
            </label>
          ) : null}
          <button className="primary-button" disabled={authLoading}>
            {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并进入'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
