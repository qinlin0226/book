import { formatDate } from '../utils/bookUi'

/**
 * 获取用户展示名称。
 *
 * @param profile 用户资料
 * @param session 登录会话
 * @return string
 */
export function getDisplayName(profile, session) {
  return profile?.nickname || session?.nickname || '来访者'
}

/**
 * 根据角色字段生成顶部身份标题。
 *
 * @param role 角色值
 * @return string
 */
export function getRoleTitle(role) {
  return role === 1 ? '管理员身份' : '普通用户身份'
}

/**
 * 获取角色标签。
 *
 * @param role 角色值
 * @return string
 */
export function getRoleLabel(role) {
  return role === 1 ? '管理员' : '普通用户'
}

/**
 * 获取用户中心简介文案。
 *
 * @param role 角色值
 * @return string
 */
export function getProfileSummary(role) {
  return role === 1 ? '管理员开始你的工作吧' : '开始你的阅读之旅吧'
}

/**
 * 构造用户管理展示卡片数据。
 *
 * @param managedUsers 用户列表
 * @return Array
 */
export function buildManagedUserCards(managedUsers = []) {
  return managedUsers.map((user) => ({
    ...user,
    roleLabel: getRoleLabel(user.role),
    statusLabel: user.status === 1 ? '启用中' : '已禁用',
    createTimeLabel: formatDate(user.createTime),
  }))
}
