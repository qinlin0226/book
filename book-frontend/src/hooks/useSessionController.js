import { useCallback, useMemo, useState } from 'react'
import { authApi } from '../api'
import usePersistedSession from './usePersistedSession'

const SESSION_KEY = 'book-flow-session'

const emptyAuthForm = {
  username: '',
  password: '',
  nickname: '',
}

/**
 * 会话控制器，统一处理登录、注册和退出。
 *
 * @return {object}
 */
function useSessionController() {
  const [session, setSession] = usePersistedSession(SESSION_KEY)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const isAdmin = session?.role === 1
  const sessionToken = session?.token

  /**
   * 打开认证弹窗。
   *
   * @return void
   */
  const openAuth = useCallback(() => {
    setAuthOpen(true)
  }, [])

  /**
   * 关闭认证弹窗。
   *
   * @return void
   */
  const closeAuth = useCallback(() => {
    setAuthOpen(false)
  }, [])

  /**
   * 切换认证模式。
   *
   * @param mode 认证模式
   * @return void
   */
  const switchAuthMode = useCallback((mode) => {
    setAuthMode(mode)
  }, [])

  /**
   * 更新认证表单字段。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  const updateAuthForm = useCallback((field, value) => {
    setAuthForm((current) => ({ ...current, [field]: value }))
  }, [])

  /**
   * 提交认证表单。
   *
   * @param event 表单事件
   * @return Promise<void>
   */
  const submitAuth = useCallback(
    async (event) => {
      event.preventDefault()
      setAuthLoading(true)

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
      } finally {
        setAuthLoading(false)
      }
    },
    [authForm, authMode, setSession],
  )

  /**
   * 退出当前登录会话。
   *
   * @return void
   */
  const logout = useCallback(() => {
    setSession(null)
  }, [setSession])

  return useMemo(
    () => ({
      session,
      sessionToken,
      isAdmin,
      authModal: {
        open: authOpen,
        authMode,
        authForm,
        authLoading,
      },
      actions: {
        openAuth,
        closeAuth,
        switchAuthMode,
        updateAuthForm,
        submitAuth,
        logout,
      },
    }),
    [authForm, authLoading, authMode, authOpen, isAdmin, logout, openAuth, closeAuth, session, sessionToken, submitAuth, switchAuthMode, updateAuthForm],
  )
}

export default useSessionController
