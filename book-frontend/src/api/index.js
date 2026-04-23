import { request } from './http'

/**
 * 认证接口集合，集中处理登录注册能力。
 *
 * @type {object}
 */
export const authApi = {
  /**
   * 用户注册。
   *
   * @param payload 注册参数
   * @return Promise<any>
   */
  register(payload) {
    return request('/api/user/register', {
      method: 'POST',
      body: payload,
    })
  },

  /**
   * 用户登录。
   *
   * @param payload 登录参数
   * @return Promise<any>
   */
  login(payload) {
    return request('/api/user/login', {
      method: 'POST',
      body: payload,
    })
  },
}

/**
 * 用户中心接口集合。
 *
 * @type {object}
 */
export const userApi = {
  /**
   * 读取当前用户资料。
   *
   * @param options 请求选项
   * @return Promise<any>
   */
  getProfile(options) {
    return request('/api/user/profile', options)
  },

  /**
   * 更新当前用户资料。
   *
   * @param payload 用户资料
   * @param options 请求选项
   * @return Promise<any>
   */
  updateProfile(payload, options) {
    return request('/api/user/profile', {
      ...options,
      method: 'PUT',
      body: payload,
    })
  },
}

/**
 * 图书相关接口集合。
 *
 * @type {object}
 */
export const bookApi = {
  /**
   * 按分页读取图书列表。
   *
   * @param params 分页参数
   * @return Promise<any>
   */
  list({ page, size, token }) {
    return request(`/api/book?page=${page}&size=${size}`, { token })
  },

  /**
   * 新增图书。
   *
   * @param payload 图书参数
   * @param options 请求选项
   * @return Promise<any>
   */
  create(payload, options) {
    return request('/api/book', {
      ...options,
      method: 'POST',
      body: payload,
    })
  },

  /**
   * 更新图书。
   *
   * @param bookId 图书ID
   * @param payload 图书参数
   * @param options 请求选项
   * @return Promise<any>
   */
  update(bookId, payload, options) {
    return request(`/api/book/${bookId}`, {
      ...options,
      method: 'PUT',
      body: payload,
    })
  },

  /**
   * 更新图书状态。
   *
   * @param bookId 图书ID
   * @param payload 状态参数
   * @param options 请求选项
   * @return Promise<any>
   */
  updateStatus(bookId, payload, options) {
    return request(`/api/book/${bookId}/status`, {
      ...options,
      method: 'PUT',
      body: payload,
    })
  },

  /**
   * 删除图书。
   *
   * @param bookId 图书ID
   * @param options 请求选项
   * @return Promise<any>
   */
  remove(bookId, options) {
    return request(`/api/book/${bookId}`, {
      ...options,
      method: 'DELETE',
    })
  },
}

/**
 * 阅读记录接口集合。
 *
 * @type {object}
 */
export const recordApi = {
  /**
   * 按分页读取阅读记录。
   *
   * @param params 分页与鉴权参数
   * @return Promise<any>
   */
  list({ page, size, token }) {
    return request(`/api/record?page=${page}&size=${size}`, { token })
  },

  /**
   * 新增阅读记录。
   *
   * @param payload 阅读记录参数
   * @param options 请求选项
   * @return Promise<any>
   */
  create(payload, options) {
    return request('/api/record', {
      ...options,
      method: 'POST',
      body: payload,
    })
  },

  /**
   * 更新阅读状态。
   *
   * @param recordId 记录ID
   * @param payload 状态参数
   * @param options 请求选项
   * @return Promise<any>
   */
  updateStatus(recordId, payload, options) {
    return request(`/api/record/${recordId}/status`, {
      ...options,
      method: 'PUT',
      body: payload,
    })
  },

  /**
   * 删除阅读记录。
   *
   * @param recordId 记录ID
   * @param options 请求选项
   * @return Promise<any>
   */
  remove(recordId, options) {
    return request(`/api/record/${recordId}`, {
      ...options,
      method: 'DELETE',
    })
  },
}

/**
 * 推荐接口集合。
 *
 * @type {object}
 */
export const recommendApi = {
  /**
   * 读取推荐列表。
   *
   * @param params 推荐参数
   * @return Promise<any>
   */
  list({ limit, token }) {
    return request(`/api/recommend?limit=${limit}`, { token })
  },
}

/**
 * 管理端用户接口集合。
 *
 * @type {object}
 */
export const adminUserApi = {
  /**
   * 读取全部用户列表。
   *
   * @param options 请求选项
   * @return Promise<any>
   */
  list(options) {
    return request('/api/user/admin/list', options)
  },

  /**
   * 新增管理用户。
   *
   * @param payload 用户参数
   * @param options 请求选项
   * @return Promise<any>
   */
  create(payload, options) {
    return request('/api/user/admin', {
      ...options,
      method: 'POST',
      body: payload,
    })
  },

  /**
   * 更新管理用户。
   *
   * @param userId 用户ID
   * @param payload 用户参数
   * @param options 请求选项
   * @return Promise<any>
   */
  update(userId, payload, options) {
    return request(`/api/user/admin/${userId}`, {
      ...options,
      method: 'PUT',
      body: payload,
    })
  },

  /**
   * 删除管理用户。
   *
   * @param userId 用户ID
   * @param options 请求选项
   * @return Promise<any>
   */
  remove(userId, options) {
    return request(`/api/user/admin/${userId}`, {
      ...options,
      method: 'DELETE',
    })
  },
}
