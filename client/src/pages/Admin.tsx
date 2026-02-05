import { Suspense, lazy, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import HtmlPageEditor from './HtmlPageEditor'

// Lazy load admin tab components
const MainTab = lazy(() => import('./admin/MainTab'))
const UsersTab = lazy(() => import('./admin/UsersTab'))
const PostsTab = lazy(() => import('./admin/PostsTab'))
const IPBansTab = lazy(() => import('./admin/IPBansTab'))
const StatsTab = lazy(() => import('./admin/StatsTab'))
const MikuTab = lazy(() => import('./admin/MikuTab'))

type TabType = 'main' | 'users' | 'posts' | 'ip-bans' | 'stats' | 'miku' | 'pages'

// Loading fallback for lazy components
const TabLoadingFallback = () => (
  <div className="border-2 border-white bg-black rounded-xl p-12 text-center">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
    <p className="text-gray-400">Загрузка...</p>
  </div>
)

export default function Admin() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('main')

  if (user?.status !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-2 border-white p-12 text-center rounded-xl">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-xl">Доступ запрещен</div>
        </div>
      </div>
    )
  }

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats')
      return response.data
    },
  })

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users')
      return response.data
    },
  })

  const { data: posts } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/posts?status=pending')
      return response.data
    },
  })

  const { data: ipBans } = useQuery({
    queryKey: ['admin-ip-bans'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/ip-bans')
      return response.data
    },
    enabled: activeTab === 'ip-bans',
  })

  const { data: mikuSettings } = useQuery({
    queryKey: ['admin-miku-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/miku-settings')
      return response.data
    },
    enabled: activeTab === 'miku',
  })

  // Mutations
  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/ban`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/unban`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const muteUserMutation = useMutation({
    mutationFn: async ({ userId, hours }: { userId: string; hours: number }) => {
      return apiClient.post(`/admin/users/${userId}/mute`, { hours })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const unmuteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/unmute`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const approvePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiClient.post(`/admin/posts/${postId}/approve`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const rejectPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiClient.post(`/admin/posts/${postId}/reject`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const createIPBanMutation = useMutation({
    mutationFn: async (data: { ip_address: string; reason: string; hours: number | null }) => {
      return apiClient.post('/admin/ip-bans', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ip-bans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const removeIPBanMutation = useMutation({
    mutationFn: async (banId: string) => {
      return apiClient.delete(`/admin/ip-bans/${banId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ip-bans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const updateMikuSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.put('/admin/miku-settings', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-miku-settings'] })
    },
  })

  const testMikuCommentMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/admin/miku-settings/test')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-miku-settings'] })
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="border-2 border-white bg-black rounded-xl mb-6 p-6">
        <h1 className="text-4xl font-bold mb-2">⚙️ Админ-панель</h1>
        <p className="text-gray-400">Управление системой и модерация</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-2 border-white bg-black rounded-xl overflow-hidden">
        <div className="flex flex-wrap gap-2 p-2">
          {(['main', 'users', 'posts', 'ip-bans', 'stats', 'miku', 'pages'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              {tab === 'main' && '📊 Главная'}
              {tab === 'users' && '👥 Пользователи'}
              {tab === 'posts' && '📝 Посты'}
              {tab === 'ip-bans' && '🚫 IP Баны'}
              {tab === 'stats' && '📈 Статистика'}
              {tab === 'miku' && '🎵 Miku Авто'}
              {tab === 'pages' && '📄 HTML страницы'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content with Suspense */}
      <Suspense fallback={<TabLoadingFallback />}>
        {activeTab === 'main' && <MainTab stats={stats} />}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            banUserMutation={banUserMutation}
            unbanUserMutation={unbanUserMutation}
            muteUserMutation={muteUserMutation}
            unmuteUserMutation={unmuteUserMutation}
          />
        )}
        {activeTab === 'posts' && (
          <PostsTab
            posts={posts}
            approvePostMutation={approvePostMutation}
            rejectPostMutation={rejectPostMutation}
          />
        )}
        {activeTab === 'ip-bans' && (
          <IPBansTab
            ipBans={ipBans}
            createIPBanMutation={createIPBanMutation}
            removeIPBanMutation={removeIPBanMutation}
          />
        )}
        {activeTab === 'stats' && <StatsTab stats={stats} />}
        {activeTab === 'miku' && (
          <MikuTab
            mikuSettings={mikuSettings}
            updateMikuSettingsMutation={updateMikuSettingsMutation}
            testMikuCommentMutation={testMikuCommentMutation}
          />
        )}
        {activeTab === 'pages' && <HtmlPageEditor />}
      </Suspense>
    </div>
  )
}
