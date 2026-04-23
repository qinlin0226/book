import { useSessionContext } from '../contexts/SessionContext'

/**
 * 会话层稳定接口。
 *
 * @return {object}
 */
function useSession() {
  return useSessionContext()
}

export default useSession
