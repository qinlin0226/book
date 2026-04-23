const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

/**
 * 前端通用请求工具，统一处理鉴权、序列化与错误抛出。
 *
 * @param path 接口路径
 * @param options 请求配置
 * @return Promise<any>
 */
export async function request(path, options = {}) {
  const { token, headers: customHeaders, body, ...restOptions } = options
  const headers = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...restOptions,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok || json.code !== 200) {
    throw new Error(json.message || '请求失败')
  }

  return json.data
}
