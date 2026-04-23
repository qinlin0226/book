import { useEffect, useMemo, useState } from 'react'
import ManagedUserModal from '../components/ManagedUserModal'
import ProfileView from '../components/ProfileView'
import { getProfileMetrics, READ_STATUS_META } from '../domain/librarySelectors'
import { buildManagedUserCards, getDisplayName, getProfileSummary } from '../domain/userSelectors'
import useLibraryWorkspace from '../hooks/useLibraryWorkspace'
import useSession from '../hooks/useSession'

const emptyManagedUserForm = {
  username: '',
  password: '',
  nickname: '',
  avatarUrl: '',
  role: 0,
  status: 1,
}

/**
 * 用户中心页面容器，负责资料表单与用户管理弹窗状态。
 *
 * @return JSX.Element
 */
function ProfilePageContainer() {
  const { session, isAdmin, actions: sessionActions } = useSession()
  const { profile, actions, home } = useLibraryWorkspace()
  const [profileForm, setProfileForm] = useState({ nickname: '', avatarUrl: '' })
  const [managedUserModalOpen, setManagedUserModalOpen] = useState(false)
  const [managedUserForm, setManagedUserForm] = useState(emptyManagedUserForm)
  const [editingManagedUserId, setEditingManagedUserId] = useState(null)

  const displayName = useMemo(() => getDisplayName(profile.profile, session), [profile.profile, session])
  const profileSummary = useMemo(() => getProfileSummary(profile.profile?.role ?? session?.role), [profile.profile?.role, session?.role])
  const profileMetrics = useMemo(() => getProfileMetrics(profile.records), [profile.records])
  const managedUserCards = useMemo(() => buildManagedUserCards(profile.managedUsers), [profile.managedUsers])
  const recommendedBooks = useMemo(
    () => (profile.recommendData.recommends.length ? profile.recommendData.recommends : home.books),
    [home.books, profile.recommendData.recommends],
  )

  useEffect(() => {
    setProfileForm({
      nickname: profile.profile?.nickname || '',
      avatarUrl: profile.profile?.avatarUrl || '',
    })
  }, [profile.profile])

  useEffect(() => {
    if (!session) {
      setManagedUserModalOpen(false)
      setEditingManagedUserId(null)
      setManagedUserForm(emptyManagedUserForm)
    }
  }, [session])

  /**
   * 更新个人资料表单。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  function updateProfileForm(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  /**
   * 提交个人资料。
   *
   * @param event 表单事件
   * @return Promise<void>
   */
  async function handleProfileSave(event) {
    event.preventDefault()
    await actions.saveProfile(profileForm)
  }

  /**
   * 重置用户管理表单并关闭弹窗。
   *
   * @return void
   */
  function resetManagedUserForm() {
    setEditingManagedUserId(null)
    setManagedUserForm(emptyManagedUserForm)
    setManagedUserModalOpen(false)
  }

  /**
   * 打开新建用户弹窗。
   *
   * @return void
   */
  function openCreateManagedUser() {
    setEditingManagedUserId(null)
    setManagedUserForm(emptyManagedUserForm)
    setManagedUserModalOpen(true)
  }

  /**
   * 打开编辑用户弹窗。
   *
   * @param user 用户信息
   * @return void
   */
  function editManagedUser(user) {
    setEditingManagedUserId(user.id)
    setManagedUserForm({
      username: user.username || '',
      password: '',
      nickname: user.nickname || '',
      avatarUrl: user.avatarUrl || '',
      role: user.role ?? 0,
      status: user.status ?? 1,
    })
    setManagedUserModalOpen(true)
  }

  /**
   * 更新用户管理表单。
   *
   * @param field 字段名
   * @param value 字段值
   * @return void
   */
  function updateManagedUserForm(field, value) {
    setManagedUserForm((current) => ({ ...current, [field]: value }))
  }

  /**
   * 提交用户管理表单。
   *
   * @param event 表单事件
   * @return Promise<void>
   */
  async function handleManagedUserSubmit(event) {
    event.preventDefault()

    const payload = {
      username: managedUserForm.username,
      password: managedUserForm.password,
      nickname: managedUserForm.nickname,
      avatarUrl: managedUserForm.avatarUrl,
      role: Number(managedUserForm.role),
      status: Number(managedUserForm.status),
    }

    await actions.submitManagedUser(payload, editingManagedUserId)
    resetManagedUserForm()
  }

  return (
    <>
      <ProfileView
        session={session}
        displayName={displayName}
        profile={profile.profile}
        profileSummary={profileSummary}
        profileMetrics={profileMetrics}
        records={profile.records}
        recommendedBooks={recommendedBooks}
        profileForm={profileForm}
        panelLoading={profile.panelLoading}
        statusMeta={READ_STATUS_META}
        actionBookId={profile.actionBookId}
        isAdmin={isAdmin}
        userAdminLoading={profile.userAdminLoading}
        managedUserCards={managedUserCards}
        sessionUserId={session?.userId}
        onProfileFormChange={updateProfileForm}
        onProfileSave={handleProfileSave}
        onDeleteRecord={actions.deleteRecord}
        onToggleRecordStatus={actions.toggleRecordStatus}
        onOpenAuth={sessionActions.openAuth}
        onOpenCreateManagedUser={openCreateManagedUser}
        onEditManagedUser={editManagedUser}
        onDeleteManagedUser={actions.deleteManagedUser}
      />

      <ManagedUserModal
        open={managedUserModalOpen}
        editingManagedUserId={editingManagedUserId}
        managedUserForm={managedUserForm}
        userAdminLoading={profile.userAdminLoading}
        onClose={resetManagedUserForm}
        onFormChange={updateManagedUserForm}
        onSubmit={handleManagedUserSubmit}
      />
    </>
  )
}

export default ProfilePageContainer
