import { useEffect, useState } from 'react'

/**
 * 持久化登录会话状态，统一管理本地存储读写。
 *
 * @param storageKey 本地存储键名
 * @return {[any, Function]}
 */
function usePersistedSession(storageKey) {
  const [session, setSession] = useState(() => {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(session))
  }, [session, storageKey])

  return [session, setSession]
}

export default usePersistedSession
