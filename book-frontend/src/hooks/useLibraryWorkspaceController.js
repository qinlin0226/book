import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminUserApi, bookApi, recommendApi, recordApi, userApi } from '../api'
import { buildAdminBookItems, getShelfBooks, splitSideBookGroups } from '../domain/librarySelectors'
import useSession from './useSession'

const RECOMMEND_LIMIT = 16
const HOME_BOOK_LIMIT = 100
const emptyRecommendData = { recommends: [], recentlyRead: [] }

/**
 * 图书工作区控制器，统一编排首页、用户中心和管理台数据。
 *
 * @return {object}
 */
function useLibraryWorkspaceController() {
  const { session, sessionToken, isAdmin } = useSession()
  const [books, setBooks] = useState([])
  const [adminBooks, setAdminBooks] = useState([])
  const [recommendData, setRecommendData] = useState(emptyRecommendData)
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState([])
  const [managedUsers, setManagedUsers] = useState([])
  const [homeLoading, setHomeLoading] = useState(true)
  const [panelLoading, setPanelLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [userAdminLoading, setUserAdminLoading] = useState(false)
  const [actionBookId, setActionBookId] = useState(null)

  /**
   * 读取首页所需的公共图书与推荐数据。
   *
   * @return Promise<void>
   */
  const refreshHome = useCallback(async () => {
    setHomeLoading(true)

    try {
      const publicList = await bookApi.list({ page: 1, size: HOME_BOOK_LIMIT })
      setBooks(publicList.records || [])

      if (sessionToken) {
        const recommend = await recommendApi.list({ limit: RECOMMEND_LIMIT, token: sessionToken })
        setRecommendData(recommend)
      } else {
        setRecommendData(emptyRecommendData)
      }
    } finally {
      setHomeLoading(false)
    }
  }, [sessionToken])

  /**
   * 读取用户中心资料、阅读记录和推荐数据。
   *
   * @return Promise<void>
   */
  const refreshPanel = useCallback(async () => {
    if (!sessionToken) {
      setProfile(null)
      setRecords([])
      setRecommendData(emptyRecommendData)
      return
    }

    setPanelLoading(true)

    try {
      const [nextProfile, recordPage, recommend] = await Promise.all([
        userApi.getProfile({ token: sessionToken }),
        recordApi.list({ page: 1, size: 50, token: sessionToken }),
        recommendApi.list({ limit: RECOMMEND_LIMIT, token: sessionToken }),
      ])

      setProfile(nextProfile)
      setRecords(recordPage.records || [])
      setRecommendData(recommend)
    } finally {
      setPanelLoading(false)
    }
  }, [sessionToken])

  /**
   * 读取管理台图书数据。
   *
   * @return Promise<void>
   */
  const refreshAdminBooks = useCallback(async () => {
    if (!sessionToken || !isAdmin) {
      setAdminBooks([])
      return
    }

    setAdminLoading(true)

    try {
      const pageData = await bookApi.list({ page: 1, size: 24, token: sessionToken })
      setAdminBooks(pageData.records || [])
    } finally {
      setAdminLoading(false)
    }
  }, [isAdmin, sessionToken])

  /**
   * 读取用户管理列表。
   *
   * @return Promise<void>
   */
  const refreshManagedUsers = useCallback(async () => {
    if (!sessionToken || !isAdmin) {
      setManagedUsers([])
      return
    }

    setUserAdminLoading(true)

    try {
      const userList = await adminUserApi.list({ token: sessionToken })
      setManagedUsers(userList || [])
    } finally {
      setUserAdminLoading(false)
    }
  }, [isAdmin, sessionToken])

  useEffect(() => {
    refreshHome()
  }, [refreshHome])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setRecords([])
      setAdminBooks([])
      setManagedUsers([])
      return
    }

    refreshPanel()

    if (isAdmin) {
      refreshAdminBooks()
      refreshManagedUsers()
    } else {
      setAdminBooks([])
      setManagedUsers([])
    }
  }, [isAdmin, refreshAdminBooks, refreshManagedUsers, refreshPanel, session])

  /**
   * 保存用户资料。
   *
   * @param profileForm 用户资料表单
   * @return Promise<void>
   */
  const saveProfile = useCallback(
    async (profileForm) => {
      if (!sessionToken) {
        return
      }

      setPanelLoading(true)

      try {
        await userApi.updateProfile(profileForm, { token: sessionToken })
        await refreshPanel()
      } finally {
        setPanelLoading(false)
      }
    },
    [refreshPanel, sessionToken],
  )

  /**
   * 将图书加入书架。
   *
   * @param book 图书信息
   * @return Promise<void>
   */
  const addBookToShelf = useCallback(
    async (book) => {
      if (!sessionToken) {
        return
      }

      setActionBookId(book.id)

      try {
        await recordApi.create({ bookId: book.id }, { token: sessionToken })
        await Promise.all([refreshPanel(), refreshHome()])
      } finally {
        setActionBookId(null)
      }
    },
    [refreshHome, refreshPanel, sessionToken],
  )

  /**
   * 切换阅读状态。
   *
   * @param record 阅读记录
   * @return Promise<void>
   */
  const toggleRecordStatus = useCallback(
    async (record) => {
      if (!sessionToken) {
        return
      }

      setActionBookId(record.bookId)

      try {
        const nextStatus = record.readStatus === 1 ? 0 : 1
        await recordApi.updateStatus(record.id, { readStatus: nextStatus }, { token: sessionToken })
        await Promise.all([refreshPanel(), refreshHome()])
      } finally {
        setActionBookId(null)
      }
    },
    [refreshHome, refreshPanel, sessionToken],
  )

  /**
   * 删除阅读记录。
   *
   * @param record 阅读记录
   * @return Promise<void>
   */
  const deleteRecord = useCallback(
    async (record) => {
      if (!sessionToken) {
        return
      }

      setActionBookId(record.bookId)

      try {
        await recordApi.remove(record.id, { token: sessionToken })
        await Promise.all([refreshPanel(), refreshHome()])
      } finally {
        setActionBookId(null)
      }
    },
    [refreshHome, refreshPanel, sessionToken],
  )

  /**
   * 提交图书编辑数据。
   *
   * @param payload 图书表单数据
   * @param editingBookId 编辑中的图书ID
   * @return Promise<void>
   */
  const submitBook = useCallback(
    async (payload, editingBookId) => {
      if (!sessionToken) {
        return
      }

      setAdminLoading(true)

      try {
        if (editingBookId) {
          await bookApi.update(editingBookId, payload, { token: sessionToken })
        } else {
          await bookApi.create(payload, { token: sessionToken })
        }

        await Promise.all([refreshAdminBooks(), refreshHome()])
      } finally {
        setAdminLoading(false)
      }
    },
    [refreshAdminBooks, refreshHome, sessionToken],
  )

  /**
   * 切换图书上下架状态。
   *
   * @param book 图书信息
   * @return Promise<void>
   */
  const toggleBookStatus = useCallback(
    async (book) => {
      if (!sessionToken) {
        return
      }

      setActionBookId(book.id)

      try {
        const nextStatus = book.status === 1 ? 0 : 1
        await bookApi.updateStatus(book.id, { status: nextStatus }, { token: sessionToken })
        await Promise.all([refreshAdminBooks(), refreshHome(), refreshPanel()])
      } finally {
        setActionBookId(null)
      }
    },
    [refreshAdminBooks, refreshHome, refreshPanel, sessionToken],
  )

  /**
   * 删除图书。
   *
   * @param book 图书信息
   * @return Promise<void>
   */
  const deleteBook = useCallback(
    async (book) => {
      if (!sessionToken) {
        return
      }

      setActionBookId(book.id)

      try {
        await bookApi.remove(book.id, { token: sessionToken })
        await Promise.all([refreshAdminBooks(), refreshHome(), refreshPanel()])
      } finally {
        setActionBookId(null)
      }
    },
    [refreshAdminBooks, refreshHome, refreshPanel, sessionToken],
  )

  /**
   * 提交用户管理表单。
   *
   * @param payload 用户表单数据
   * @param editingManagedUserId 编辑中的用户ID
   * @return Promise<void>
   */
  const submitManagedUser = useCallback(
    async (payload, editingManagedUserId) => {
      if (!sessionToken) {
        return
      }

      setUserAdminLoading(true)

      try {
        if (editingManagedUserId) {
          await adminUserApi.update(editingManagedUserId, payload, { token: sessionToken })
        } else {
          await adminUserApi.create(payload, { token: sessionToken })
        }

        await Promise.all([refreshManagedUsers(), refreshPanel()])
      } finally {
        setUserAdminLoading(false)
      }
    },
    [refreshManagedUsers, refreshPanel, sessionToken],
  )

  /**
   * 删除用户。
   *
   * @param user 用户信息
   * @return Promise<void>
   */
  const deleteManagedUser = useCallback(
    async (user) => {
      if (!sessionToken) {
        return
      }

      setUserAdminLoading(true)

      try {
        await adminUserApi.remove(user.id, { token: sessionToken })
        await Promise.all([refreshManagedUsers(), refreshPanel()])
      } finally {
        setUserAdminLoading(false)
      }
    },
    [refreshManagedUsers, refreshPanel, sessionToken],
  )

  const sideBookGroups = useMemo(() => splitSideBookGroups(getShelfBooks(books)), [books])
  const adminBookItems = useMemo(() => buildAdminBookItems(adminBooks), [adminBooks])

  return useMemo(
    () => ({
      shell: {
        sideBookGroups,
      },
      home: {
        books,
        homeLoading,
        actionBookId,
      },
      profile: {
        profile,
        records,
        recommendData,
        books,
        panelLoading,
        actionBookId,
        managedUsers,
        userAdminLoading,
      },
      admin: {
        adminBooks,
        adminBookItems,
        adminLoading,
        actionBookId,
      },
      actions: {
        refreshHome,
        refreshPanel,
        refreshAdminBooks,
        refreshManagedUsers,
        saveProfile,
        addBookToShelf,
        toggleRecordStatus,
        deleteRecord,
        submitBook,
        toggleBookStatus,
        deleteBook,
        submitManagedUser,
        deleteManagedUser,
      },
    }),
    [
      actionBookId,
      addBookToShelf,
      adminBookItems,
      adminBooks,
      adminLoading,
      books,
      deleteBook,
      deleteManagedUser,
      deleteRecord,
      homeLoading,
      managedUsers,
      panelLoading,
      profile,
      records,
      recommendData,
      refreshAdminBooks,
      refreshHome,
      refreshManagedUsers,
      refreshPanel,
      saveProfile,
      sideBookGroups,
      submitBook,
      submitManagedUser,
      toggleBookStatus,
      toggleRecordStatus,
      userAdminLoading,
    ],
  )
}

export default useLibraryWorkspaceController
