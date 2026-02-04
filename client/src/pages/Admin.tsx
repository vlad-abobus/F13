import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import HtmlPageEditor from './HtmlPageEditor'
import SafeImage from '../components/SafeImage'

type TabType = 'main' | 'users' | 'posts' | 'ip-bans' | 'stats' | 'miku' | 'pages'

export default function Admin() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('main')
  const [muteHours, setMuteHours] = useState(24)
  const [banIP, setBanIP] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banHours, setBanHours] = useState<number | null>(null)
  
  // Miku settings
  const { data: mikuSettings } = useQuery({
    queryKey: ['admin-miku-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/miku-settings')
      return response.data
    },
    enabled: activeTab === 'miku',
  })
  
  const [mikuSettingsForm, setMikuSettingsForm] = useState({
    is_enabled: true,
    comment_interval_hours: 24,
    max_comments_per_day: 5,
    posts_age_days: 7,
    personality_override: '',
    enabled_days: '0123456',
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
  
  // Update form when settings load
  useEffect(() => {
    if (mikuSettings) {
      setMikuSettingsForm({
        is_enabled: mikuSettings.is_enabled,
        comment_interval_hours: mikuSettings.comment_interval_hours,
        max_comments_per_day: mikuSettings.max_comments_per_day,
        posts_age_days: mikuSettings.posts_age_days,
        personality_override: mikuSettings.personality_override || '',
        enabled_days: mikuSettings.enabled_days,
      })
    }
  }, [mikuSettings])

  if (user?.status !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-2 border-white p-12 text-center rounded-xl">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-xl">Доступ заборонено</div>
        </div>
      </div>
    )
  }

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
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/mute`, { hours: muteHours })
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
    mutationFn: async () => {
      return apiClient.post('/admin/ip-bans', {
        ip_address: banIP,
        reason: banReason,
        hours: banHours,
      })
    },
    onSuccess: () => {
      setBanIP('')
      setBanReason('')
      setBanHours(null)
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

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="border-2 border-white bg-black rounded-xl mb-6 p-6">
        <h1 className="text-4xl font-bold mb-2">⚙️ Адмін панель</h1>
        <p className="text-gray-400">Управління системою та модерація</p>
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
              {tab === 'main' && '📊 Головна'}
              {tab === 'users' && '👥 Користувачі'}
              {tab === 'posts' && '📝 Пости'}
              {tab === 'ip-bans' && '🚫 IP Бани'}
              {tab === 'stats' && '📈 Статистика'}
              {tab === 'miku' && '🎵 Міку Авто'}
              {tab === 'pages' && '📄 HTML Сторінки'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab */}
      {activeTab === 'main' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="border-2 border-white bg-black p-4 rounded-xl">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-3xl font-bold">{stats.users?.total || 0}</div>
            <div className="text-sm text-gray-400">Користувачів</div>
          </div>
          <div className="border-2 border-white bg-black p-4 rounded-xl">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-3xl font-bold">{stats.posts?.total || 0}</div>
            <div className="text-sm text-gray-400">Постів</div>
          </div>
          <div className="border-2 border-white bg-black p-4 rounded-xl">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-3xl font-bold">{stats.posts?.pending_moderation || 0}</div>
            <div className="text-sm text-gray-400">На модерації</div>
          </div>
          <div className="border-2 border-white bg-black p-4 rounded-xl">
            <div className="text-2xl mb-2">🚫</div>
            <div className="text-3xl font-bold">{stats.ip_bans?.active || 0}</div>
            <div className="text-sm text-gray-400">IP Банів</div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="border-2 border-white bg-black rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">👥 Користувачі</h2>
          <div className="space-y-3">
            {users?.map((u: any) => (
              <div key={u.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={u.avatar_url}
                      alt={u.username}
                      className="w-12 h-12 rounded-full object-cover"
                      fallback={
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                          {u.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                      }
                    />
                    <div>
                      <div className="font-bold text-lg">{u.username}</div>
                      <div className="text-sm text-gray-400">
                        {u.status} {u.is_banned && '| 🔴 Забанений'} {u.is_muted && '| 🔇 Замучений'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {u.is_banned ? (
                      <button
                        onClick={() => unbanUserMutation.mutate(u.id)}
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                      >
                        Розбанити
                      </button>
                    ) : (
                      <button
                        onClick={() => banUserMutation.mutate(u.id)}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                      >
                        Забанити
                      </button>
                    )}
                    {u.is_muted ? (
                      <button
                        onClick={() => unmuteUserMutation.mutate(u.id)}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                      >
                        Розмутити
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={muteHours}
                          onChange={(e) => setMuteHours(Number(e.target.value))}
                          className="w-20 px-2 py-2 bg-black border-2 border-white text-white rounded-lg"
                          placeholder="Години"
                        />
                        <button
                          onClick={() => muteUserMutation.mutate(u.id)}
                          className="px-4 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700"
                        >
                          Замутити
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="border-2 border-white bg-black rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">📝 Пости на модерацію</h2>
          <div className="space-y-3">
            {posts?.map((post: any) => (
              <div key={post.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
                <p className="mb-4">{post.content.substring(0, 200)}...</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => approvePostMutation.mutate(post.id)}
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                  >
                    ✅ Схвалити
                  </button>
                  <button
                    onClick={() => rejectPostMutation.mutate(post.id)}
                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                  >
                    ❌ Відхилити
                  </button>
                </div>
              </div>
            ))}
            {(!posts || posts.length === 0) && (
              <div className="text-center py-8 text-gray-400">Немає постів на модерацію</div>
            )}
          </div>
        </div>
      )}

      {/* IP Bans Tab */}
      {activeTab === 'ip-bans' && (
        <div className="space-y-6">
          <div className="border-2 border-white bg-black rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">🚫 Додати IP бан</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-bold">IP адреса</label>
                <input
                  type="text"
                  value={banIP}
                  onChange={(e) => setBanIP(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                  placeholder="127.0.0.1"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold">Причина</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                  placeholder="Причина бана"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold">Години (порожньо = назавжди)</label>
                <input
                  type="number"
                  value={banHours || ''}
                  onChange={(e) => setBanHours(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                  placeholder="24"
                />
              </div>
              <button
                onClick={() => createIPBanMutation.mutate()}
                disabled={!banIP || createIPBanMutation.isPending}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {createIPBanMutation.isPending ? '...' : '🚫 Забанити IP'}
              </button>
            </div>
          </div>

          <div className="border-2 border-white bg-black rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Активні IP бани</h2>
            <div className="space-y-3">
              {ipBans?.map((ban: any) => (
                <div key={ban.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{ban.ip_address}</div>
                      <div className="text-sm text-gray-400">
                        {ban.reason || 'Без причини'}
                        {ban.banned_until && ` | До: ${new Date(ban.banned_until).toLocaleString()}`}
                      </div>
                    </div>
                    <button
                      onClick={() => removeIPBanMutation.mutate(ban.id)}
                      className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                    >
                      Зняти бан
                    </button>
                  </div>
                </div>
              ))}
              {(!ipBans || ipBans.length === 0) && (
                <div className="text-center py-8 text-gray-400">Немає активних IP банів</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Miku Settings Tab */}
      {activeTab === 'miku' && (
        <div className="space-y-6">
          <div className="border-2 border-white bg-black rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">🎵 Налаштування автоматичного коментування Міку</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mikuSettingsForm.is_enabled}
                    onChange={(e) => setMikuSettingsForm({ ...mikuSettingsForm, is_enabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-bold">Увімкнути автоматичне коментування</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-bold">Інтервал між запусками (години)</label>
                  <input
                    type="number"
                    value={mikuSettingsForm.comment_interval_hours}
                    onChange={(e) => setMikuSettingsForm({ ...mikuSettingsForm, comment_interval_hours: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-bold">Максимум коментарів на день</label>
                  <input
                    type="number"
                    value={mikuSettingsForm.max_comments_per_day}
                    onChange={(e) => setMikuSettingsForm({ ...mikuSettingsForm, max_comments_per_day: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                    min="1"
                    max="50"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-bold">Коментувати пости за останні (дні)</label>
                  <input
                    type="number"
                    value={mikuSettingsForm.posts_age_days}
                    onChange={(e) => setMikuSettingsForm({ ...mikuSettingsForm, posts_age_days: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                    min="1"
                    max="30"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-bold">Перевизначити характер (порожньо = автоматично)</label>
                  <select
                    value={mikuSettingsForm.personality_override}
                    onChange={(e) => setMikuSettingsForm({ ...mikuSettingsForm, personality_override: e.target.value })}
                    className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                  >
                    <option value="">Автоматично (за днем тижня)</option>
                    <option value="Дередере">Дередере</option>
                    <option value="Цундере">Цундере</option>
                    <option value="Дандере">Дандере</option>
                    <option value="Яндере">Яндере</option>
                    <option value="Кудере">Кудере</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-bold">Дні тижня для коментування</label>
                <div className="flex flex-wrap gap-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, index) => (
                    <label key={index} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mikuSettingsForm.enabled_days.includes(String(index))}
                        onChange={(e) => {
                          const days = mikuSettingsForm.enabled_days.split('')
                          if (e.target.checked) {
                            if (!days.includes(String(index))) {
                              days.push(String(index))
                            }
                          } else {
                            const idx = days.indexOf(String(index))
                            if (idx > -1) {
                              days.splice(idx, 1)
                            }
                          }
                          setMikuSettingsForm({ ...mikuSettingsForm, enabled_days: days.sort().join('') })
                        }}
                        className="w-4 h-4"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => updateMikuSettingsMutation.mutate(mikuSettingsForm)}
                  disabled={updateMikuSettingsMutation.isPending}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateMikuSettingsMutation.isPending ? 'Збереження...' : '💾 Зберегти налаштування'}
                </button>
                
                <button
                  onClick={() => testMikuCommentMutation.mutate()}
                  disabled={testMikuCommentMutation.isPending || !mikuSettingsForm.is_enabled}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {testMikuCommentMutation.isPending ? 'Тестування...' : '▶️ Тестовий запуск'}
                </button>
              </div>
            </div>
          </div>
          
          {mikuSettings && (
            <div className="border-2 border-white bg-black rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">📊 Статистика</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Останній запуск</div>
                  <div className="font-bold">
                    {mikuSettings.last_run_at
                      ? new Date(mikuSettings.last_run_at).toLocaleString('uk-UA')
                      : 'Ніколи'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Останній результат</div>
                  <div className="font-bold">{mikuSettings.last_comments_count} коментарів</div>
                </div>
              </div>
            </div>
          )}
          
          {testMikuCommentMutation.data && (
            <div className="border-2 border-green-500 bg-green-900 bg-opacity-20 rounded-xl p-4">
              <div className="font-bold text-green-400">✅ {testMikuCommentMutation.data.data.message}</div>
              <div className="text-sm text-gray-400 mt-2">
                Характер: {testMikuCommentMutation.data.data.personality}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="border-2 border-white bg-black rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">📈 Статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-4">Користувачі</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Всього:</span>
                  <span className="font-bold">{stats.users?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Забанених:</span>
                  <span className="font-bold text-red-400">{stats.users?.banned || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Замучених:</span>
                  <span className="font-bold text-yellow-400">{stats.users?.muted || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Контент</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Всього постів:</span>
                  <span className="font-bold">{stats.posts?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>На модерації:</span>
                  <span className="font-bold text-yellow-400">{stats.posts?.pending_moderation || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Всього коментарів:</span>
                  <span className="font-bold">{stats.comments?.total || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && <HtmlPageEditor />}
    </div>
  )
}
