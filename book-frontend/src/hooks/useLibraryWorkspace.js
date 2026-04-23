import { useLibraryWorkspaceContext } from '../contexts/LibraryWorkspaceContext'

/**
 * 图书工作区稳定接口。
 *
 * @return {object}
 */
function useLibraryWorkspace() {
  return useLibraryWorkspaceContext()
}

export default useLibraryWorkspace
