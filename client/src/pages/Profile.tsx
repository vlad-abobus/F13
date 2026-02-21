import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import RandomBanner from '../components/RandomBanner'
import { useAuthStore } from '../store/authStore'
import BadgeDisplay from '../components/BadgeDisplay'
import UserLabel from '../components/UserLabel'
import PostCard from '../components/PostCard'
import SafeImage from '../components/SafeImage'
import { format } from 'date-fns'
import { showToast } from '../utils/toast'
import SimpleCaptcha from '../components/SimpleCaptcha'

export default function Profile() {
  const { username } = useParams()
  const queryClient = useQueryClient()
  const { user: currentUser, isAuthenticated } = useAuthStore()

  const { data: user } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${username}`)
      return response.data
    },
  })

  const { data: postsData } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${username}/posts`)
      return response.data
    },
  })

  const { data: badges } = useQuery({
    queryKey: ['user-badges', username],
    queryFn: async () => {
      // TODO: Implement API endpoint for user badges
      return []
    },
  })

  const { data: wallPosts } = useQuery({
    queryKey: ['profile-posts', username],
    queryFn: async () => {
      const response = await apiClient.get(`/profile-posts/user/${username}`)
      return response.data
    },
  })

  const [wallPostContent, setWallPostContent] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState<string | null>(null)
  const [captchaQuestionId, setCaptchaQuestionId] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [showCaptcha, setShowCaptcha] = useState(false)

  const createWallPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.post(`/profile-posts/user/${username}`, { 
        content,
        captcha_token: captchaSolution,
        captcha_question_id: captchaQuestionId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-posts', username] })
      setWallPostContent('')
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
      setShowCaptcha(false)
      showToast('Добавлено!', 'success')
    },
    onError: () => {
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
      showToast('Ошибка', 'error')
    },
  })

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/follow`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
    },
  })

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-xl">Загрузка профиля...</div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.username === username
  const postsCount = postsData?.pagination?.total || 0
  const createdDate = user.created_at ? new Date(user.created_at) : null

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Telegram Profile Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 mb-6 rounded-2xl overflow-hidden shadow-2xl pb-8 pt-0">
        {/* Banner */}
        <RandomBanner className="h-44" />
        {/* Profile Core Info: Avatar, Name, Bio */}
        <div className="flex flex-col items-center -mt-24 px-6">
          {/* Avatar */}
          <div className="relative">
            <SafeImage
              src={user.avatar_url}
              alt={user.username}
              className="w-36 h-36 rounded-full border-4 border-gray-900 object-cover shadow-xl bg-white"
              fallback={
                <div className="w-36 h-36 rounded-full border-4 border-gray-900 bg-white flex items-center justify-center text-5xl font-bold text-black shadow-xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              }
            />
            {user.status === 'admin' && (
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gray-700 rounded-full border-4 border-gray-900 flex items-center justify-center text-white text-base font-bold shadow-lg">
                ⭐
              </div>
            )}
          </div>
          {/* Username + Verification */}
          <div className="flex flex-row items-center mt-5 gap-2 flex-wrap">
            <UserLabel user={user} large toProfile={false} />
          </div>
          {/* Bio */}
          {user.bio && (
            <p className="text-gray-300 mt-2 text-base text-center leading-relaxed max-w-2xl whitespace-pre-wrap">
              {user.bio}
            </p>
          )}
          {/* Stats: Posts, Регистрация */}
          <div className="flex gap-8 mt-5 text-sm text-center flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Постов:</span>
              <span className="font-semibold text-white">{postsCount}</span>
            </div>
            {createdDate && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">С нами с:</span>
                <span className="font-semibold text-white">
                  {format(createdDate, 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            {isOwnProfile ? (
              <Link
                to={`/profile/${username}/settings`}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-lg flex items-center gap-2"
              >
                <img src="/icons/icons8-настройки-50.png" alt="Settings" className="w-5 h-5" />
                Настройки
              </Link>
            ) : (
              isAuthenticated && (
                <button
                  onClick={() => followMutation.mutate(user.id)}
                  disabled={followMutation.isPending}
                  className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-lg disabled:opacity-50"
                >
                  {followMutation.isPending ? '...' : '👤 Подписаться'}
                </button>
              )
            )}
          </div>
          {/* Badges Section */}
          {badges && badges.length > 0 && (
            <div className="pt-6 w-full max-w-2xl mx-auto border-t border-gray-700 mt-7">
              <h3 className="text-lg font-semibold mb-4 text-white">🏆 Бейджи</h3>
              <BadgeDisplay badges={badges} />
            </div>
          )}
        </div>
      </div>

      {/* Write Message Form - Separate Section */}
      {isAuthenticated && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-white">✍️ Написать</h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!wallPostContent.trim()) return
              
              if (!captchaSolution || !captchaQuestionId) {
                setCaptchaError('Пожалуйста, решите CAPTCHA')
                setShowCaptcha(true)
                return
              }
              
              createWallPostMutation.mutate(wallPostContent)
            }}
            className="w-full"
          >
            <textarea
              value={wallPostContent}
              onChange={(e) => setWallPostContent(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 text-white rounded-xl min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder:text-gray-500"
              placeholder={isOwnProfile ? 'Что на уме?' : `Сообщение для ${user.username}...`}
            />
            
            {/* CAPTCHA Section with Collapse */}
            <div className="mt-4 bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => setShowCaptcha(!showCaptcha)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-300">🔒 CAPTCHA</span>
                  <span className="text-xl text-gray-400">{showCaptcha ? '▲' : '▼'}</span>
                </div>
              </div>
              {showCaptcha && (
                <div className="p-4 border-t border-gray-700">
                  <SimpleCaptcha
                    onSolution={(token, questionId) => {
                      setCaptchaSolution(token)
                      setCaptchaQuestionId(questionId)
                      setCaptchaError(null)
                    }}
                    onError={(error) => {
                      setCaptchaError(error)
                      setCaptchaSolution(null)
                      setCaptchaQuestionId(null)
                    }}
                  />
                  {captchaError && (
                    <p className="text-gray-300 mt-2 text-sm">{captchaError}</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!wallPostContent.trim() || createWallPostMutation.isPending || !captchaSolution || !captchaQuestionId}
              className="mt-3 px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all shadow-lg"
            >
              {createWallPostMutation.isPending ? 'Отправка...' : 'Опубликовать'}
            </button>
          </form>
        </div>
      )}

      {/* Wall Posts Section - Separate from Form */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-white">💬 Стена</h2>
        
        <div className="space-y-4">
            {wallPosts?.posts?.map((post: any) => (
              <div key={post.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <SafeImage
                    src={post.author?.avatar_url}
                    alt={post.author?.username || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover flex-shrink-0"
                    fallback={
                      <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-white flex items-center justify-center font-bold text-black flex-shrink-0">
                        {post.author?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UserLabel user={post.author} />
                      <span className="text-xs text-gray-500">
                        {format(new Date(post.created_at), 'dd.MM.yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{post.content}</p>
                    {post.image_url && (
                      <SafeImage
                        src={post.image_url}
                        alt="Post"
                        className="max-w-full rounded-lg mt-3"
                        loading="lazy"
                      />
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.post(`/profile-posts/${post.id}/like`)
                            queryClient.invalidateQueries({ queryKey: ['profile-posts', username] })
                            showToast('Лайк добавлен!', 'success')
                          } catch {
                            showToast('Ошибка', 'error')
                          }
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        ❤️ {post.likes_count}
                      </button>
                    </div>
                  </div>
                  {(currentUser?.id === post.author_id || currentUser?.id === user.id || currentUser?.status === 'admin') && (
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.delete(`/profile-posts/${post.id}`)
                          queryClient.invalidateQueries({ queryKey: ['profile-posts', username] })
                          showToast('Сообщение удалено', 'info')
                        } catch {
                          showToast('Ошибка', 'error')
                        }
                      }}
                      className="text-gray-400 hover:text-gray-300 text-sm p-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!wallPosts?.posts || wallPosts.posts.length === 0) && (
              <div className="text-center py-12 text-gray-400 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="text-4xl mb-3">💬</div>
                <div>Нет сообщений</div>
              </div>
            )}
        </div>
      </div>

      {/* Posts Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Посты</h2>
          {postsCount > 0 && (
            <span className="text-gray-400 text-sm">Всего: {postsCount}</span>
          )}
        </div>

        <div className="space-y-4">
          {postsData?.posts?.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
          {(!postsData?.posts || postsData.posts.length === 0) && (
            <div className="border-2 border-white p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-xl text-gray-400 mb-2">Нет постов</div>
              {isOwnProfile && (
                <Link
                  to="/"
                  className="text-white underline hover:text-gray-300"
                >
                  Создать первый пост
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
