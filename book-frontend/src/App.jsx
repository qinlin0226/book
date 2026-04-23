import AppShell from './AppShell'
import { LibraryWorkspaceProvider } from './contexts/LibraryWorkspaceContext'
import { SessionProvider } from './contexts/SessionContext'

/**
 * 应用入口，负责装配会话层与业务数据层。
 *
 * @return JSX.Element
 */
function App() {
  return (
    <SessionProvider>
      <LibraryWorkspaceProvider>
        <AppShell />
      </LibraryWorkspaceProvider>
    </SessionProvider>
  )
}

export default App
