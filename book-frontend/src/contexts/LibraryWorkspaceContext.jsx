import { createContext, useContext } from 'react'
import useLibraryWorkspaceController from '../hooks/useLibraryWorkspaceController'

const LibraryWorkspaceContext = createContext(null)

/**
 * 图书工作区上下文提供器，统一管理前端业务数据。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
export function LibraryWorkspaceProvider({ children }) {
  const value = useLibraryWorkspaceController()

  return <LibraryWorkspaceContext.Provider value={value}>{children}</LibraryWorkspaceContext.Provider>
}

/**
 * 读取图书工作区上下文。
 *
 * @return {object}
 */
export function useLibraryWorkspaceContext() {
  const context = useContext(LibraryWorkspaceContext)

  if (!context) {
    throw new Error('useLibraryWorkspace 必须在 LibraryWorkspaceProvider 内使用')
  }

  return context
}
