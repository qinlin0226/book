import { createContext, useContext } from 'react'
import useSessionController from '../hooks/useSessionController'

const SessionContext = createContext(null)

/**
 * 会话上下文提供器，统一向页面提供登录态与认证动作。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
export function SessionProvider({ children }) {
  const value = useSessionController()

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

/**
 * 读取会话上下文。
 *
 * @return {object}
 */
export function useSessionContext() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession 必须在 SessionProvider 内使用')
  }

  return context
}
