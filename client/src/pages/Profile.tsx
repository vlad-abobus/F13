import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import VerificationBadge from '../components/VerificationBadge'
import BadgeDisplay from '../components/BadgeDisplay'
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
      showToast('Повідомлення додано на стіну!', 'success')
    },
    onError: () => {
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
      showToast('Помилка при додаванні повідомлення', 'error')
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
          <div className="text-xl">Завантаження профілю...</div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.username === username
  const postsCount = postsData?.pagination?.total || 0
  const createdDate = user.created_at ? new Date(user.created_at) : null

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header Section */}
      <div className="border-2 border-white bg-gradient-to-br from-gray-900 to-black mb-6 rounded-xl overflow-hidden shadow-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <SafeImage
                src={user.avatar_url}
                alt={user.username}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
                fallback={
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-800 flex items-center justify-center text-4xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                }
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold break-words">{user.username}</h1>
                <VerificationBadge
                  type={user.verification_type || 'none'}
                  badge={user.verification_badge}
                />
                {user.status === 'admin' && (
                  <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded">
                    АДМІН
                  </span>
                )}
              </div>

              {user.bio && (
                <p className="text-gray-300 mb-4 text-lg leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Постів: </span>
                  <span className="font-bold text-white">{postsCount}</span>
                </div>
                {createdDate && (
                  <div>
                    <span className="text-gray-400">Реєстрація: </span>
                    <span className="font-bold text-white">
                      {format(createdDate, 'd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <Link
                    to={`/profile/${username}/settings`}
                    className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                  >
                    ⚙️ Налаштування
                  </Link>
                ) : (
                  isAuthenticated && (
                    <button
                      onClick={() => followMutation.mutate(user.id)}
                      disabled={followMutation.isPending}
                      className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {followMutation.isPending ? '...' : '👤 Підписатися'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Badges Section */}
          {badges && badges.length > 0 && (
            <div className="pt-6 border-t-2 border-white">
              <h3 className="text-xl font-bold mb-4">🏆 Бейджі</h3>
              <BadgeDisplay badges={badges} />
            </div>
          )}
        </div>
      </div>

      {/* Wall Section */}
      {isAuthenticated && (
        <div className="border-2 border-white bg-black rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📝 Стіна</h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!wallPostContent.trim()) return
              
              if (!captchaSolution || !captchaQuestionId) {
                setCaptchaError('Будь ласка, розв\'яжіть CAPTCHA')
                setShowCaptcha(true)
                return
              }
              
              createWallPostMutation.mutate(wallPostContent)
            }}
            className="mb-6"
          >
            <textarea
              value={wallPostContent}
              onChange={(e) => setWallPostContent(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border-2 border-white text-white rounded-lg min-h-[100px] resize-none"
              placeholder={isOwnProfile ? 'Що у вас на думці?' : `Написати на стіні ${user.username}...`}
            />
            
            {/* CAPTCHA Section with Collapse */}
            <div className="mt-4 border-2 border-white bg-black rounded-lg overflow-hidden">
              <div 
                className="p-3 border-b-2 border-white bg-gradient-to-r from-gray-900 to-gray-800 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-colors"
                onClick={() => setShowCaptcha(!showCaptcha)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">🔒 CAPTCHA (захист від ботів)</span>
                  <span className="text-xl">{showCaptcha ? '▲' : '▼'}</span>
                </div>
              </div>
              {showCaptcha && (
                <div className="p-4">
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
                    <p className="text-red-400 mt-2 text-sm">{captchaError}</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!wallPostContent.trim() || createWallPostMutation.isPending || !captchaSolution || !captchaQuestionId}
              className="mt-3 px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50 rounded-lg"
            >
              {createWallPostMutation.isPending ? 'Відправка...' : 'Опублікувати'}
            </button>
          </form>

          {/* Wall Posts */}
          <div className="space-y-4">
            {wallPosts?.posts?.map((post: any) => (
              <div key={post.id} className="border-2 border-white bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <SafeImage
                    src={post.author?.avatar_url}
                    alt={post.author?.username || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    fallback={
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-700 flex items-center justify-center font-bold">
                        {post.author?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    }
                  />
                  <div className="flex-1">
                    <div className="font-bold">{post.author?.username || 'Анонім'}</div>
                    <div className="text-sm text-gray-400">
                      {format(new Date(post.created_at), 'dd.MM.yyyy HH:mm')}
                    </div>
                  </div>
                  {(currentUser?.id === post.author_id || currentUser?.id === user.id || currentUser?.status === 'admin') && (
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.delete(`/profile-posts/${post.id}`)
                          queryClient.invalidateQueries({ queryKey: ['profile-posts', username] })
                          showToast('Повідомлення видалено', 'info')
                        } catch {
                          showToast('Помилка при видаленні', 'error')
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap mb-3">{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="max-w-full rounded-lg mb-3" />
                )}
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.post(`/profile-posts/${post.id}/like`)
                        queryClient.invalidateQueries({ queryKey: ['profile-posts', username] })
                        showToast('Лайк додано!', 'success')
                      } catch {
                        showToast('Помилка', 'error')
                      }
                    }}
                    className="hover:underline"
                  >
                    ❤️ {post.likes_count}
                  </button>
                </div>
              </div>
            ))}
            {(!wallPosts?.posts || wallPosts.posts.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                Поки що немає повідомлень на стіні
              </div>
            )}
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Пости</h2>
          {postsCount > 0 && (
            <span className="text-gray-400 text-sm">Всього: {postsCount}</span>
          )}
        </div>

        <div className="space-y-4">
          {postsData?.posts?.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
          {(!postsData?.posts || postsData.posts.length === 0) && (
            <div className="border-2 border-white p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-xl text-gray-400 mb-2">Поки що немає постів</div>
              {isOwnProfile && (
                <Link
                  to="/"
                  className="text-white underline hover:text-gray-300"
                >
                  Створити перший пост
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
