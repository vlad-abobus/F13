import { Suspense, lazy, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'

// Lazy load admin tab components
const MainTab = lazy(() => import('./admin/MainTab'))
const UsersTab = lazy(() => import('./admin/UsersTab'))
const PostsTab = lazy(() => import('./admin/PostsTab'))
const IPBansTab = lazy(() => import('./admin/IPBansTab'))
const StatsTab = lazy(() => import('./admin/StatsTab'))
const MikuTab = lazy(() => import('./admin/MikuTab'))
const FeedbackTab = lazy(() => import('./admin/FeedbackTab'))

type TabType = 'main' | 'users' | 'posts' | 'ip-bans' | 'stats' | 'miku' | 'feedback'

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

  const { data: feedbacks } = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/feedback')
      return response.data
    },
    enabled: activeTab === 'feedback',
  })

  // Mutations
  const banUserMutation = useMutation({
    mutationFn: async (payload: { userId: string; reason?: string } | string) => {
      if (typeof payload === 'string') {
        return apiClient.post(`/admin/users/${payload}/ban`)
      }
      return apiClient.post(`/admin/users/${payload.userId}/ban`, { reason: payload.reason })
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
    mutationFn: async ({ userId, hours, reason }: { userId: string; hours: number; reason?: string }) => {
      return apiClient.post(`/admin/users/${userId}/mute`, { hours, reason })
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

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/make-admin`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/remove-admin`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const warnUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiClient.post(`/admin/users/${userId}/warn`, { reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const kickUserMutation = useMutation({
    mutationFn: async ({ userId, hours, reason }: { userId: string; hours: number; reason: string }) => {
      return apiClient.post(`/admin/users/${userId}/kick`, { hours, reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const restrictPostingMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiClient.post(`/admin/users/${userId}/restrict-posting`, { reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const allowPostingMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/allow-posting`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
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

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      return apiClient.delete(`/api/feedback/${feedbackId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] })
    },
  })

  const setPremiumMutation = useMutation({
    mutationFn: async ({ userId, tag }: { userId: string; tag: string | null }) => {
      return apiClient.post(`/admin/users/${userId}/premium`, { tag })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 border-b border-purple-500/30 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-5xl">⚙️</div>
            <div>
              <h1 className="text-4xl font-bold text-white">Панель адміністратора</h1>
              <p className="text-gray-400 text-sm">Управління системою та модерація контенту</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="mb-8 bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur">
          <div className="flex flex-wrap gap-1 p-3">
            {(['main', 'users', 'posts', 'ip-bans', 'stats', 'miku', 'feedback'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 font-semibold rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {tab === 'main' && '📊 Главная'}
                {tab === 'users' && '👥 Пользователи'}
                {tab === 'posts' && '📝 Посты'}
                {tab === 'ip-bans' && '🚫 IP Баны'}
                {tab === 'stats' && '📈 Статистика'}
                {tab === 'miku' && '🎵 Miku Авто'}
                {tab === 'feedback' && '💬 Отчеты'}
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
              makeAdminMutation={makeAdminMutation}
              removeAdminMutation={removeAdminMutation}
              warnUserMutation={warnUserMutation}
              kickUserMutation={kickUserMutation}
              restrictPostingMutation={restrictPostingMutation}
              allowPostingMutation={allowPostingMutation}
              setPremiumMutation={setPremiumMutation}
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
          {activeTab === 'feedback' && (
            <FeedbackTab
              feedbacks={feedbacks}
              deleteFeedbackMutation={deleteFeedbackMutation}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}
