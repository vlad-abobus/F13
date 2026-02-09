import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import VerificationBadge from './VerificationBadge'
import CommentSection from './CommentSection'
import SafeImage from './SafeImage'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { showToast } from '../utils/toast'

interface PostCardProps {
  post: {
    id: string
    content: string
    image_url?: string
    is_nsfw?: boolean
    tags?: string[]
    likes_count: number
    comments_count: number
    created_at: string
    author?: {
      id: string
      username: string
      avatar_url?: string
      verification_type?: 'none' | 'blue' | 'purple' | 'red'
      verification_badge?: string
    }
    is_anonymous?: boolean
    moderation_warning?: string
    theme?: 'HP' | 'AG' | 'NT' | null
  }
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showNsfwContent, setShowNsfwContent] = useState(false)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = user?.status === 'admin'
  const isAuthor = user?.id === post.author?.id

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiClient.delete(`/posts/${postId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      showToast('Пост удален', 'info')
    },
    onError: () => {
      showToast('Ошибка при удалении поста', 'error')
    },
  })

  return (
    <article className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-gray-600 transition-all">
      {/* Author Header */}
      {!post.is_anonymous && post.author && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <Link 
              to={`/profile/${post.author.username}`} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 group"
            >
              <SafeImage
                src={post.author.avatar_url}
                alt={post.author.username}
                className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover group-hover:border-white transition-colors"
                fallback={
                  <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-white flex items-center justify-center font-bold text-black group-hover:border-white transition-colors">
                    {post.author.username.charAt(0).toUpperCase()}
                  </div>
                }
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white group-hover:text-gray-300 transition-colors">{post.author.username}</span>
                  <VerificationBadge
                    type={post.author.verification_type || 'none'}
                    badge={post.author.verification_badge}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(post.created_at), 'd MMM yyyy, HH:mm')}
                </div>
              </div>
            </Link>
            {(isAdmin || isAuthor) && (
              <button
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
                    deletePostMutation.mutate(post.id)
                  }
                }}
                disabled={deletePostMutation.isPending}
                className="px-3 py-1.5 text-gray-300 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg font-semibold disabled:opacity-50 transition-all"
                title={isAdmin ? 'Удалить пост (админ)' : 'Удалить пост'}
              >
                {deletePostMutation.isPending ? '...' : '🗑️'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {post.is_nsfw && !showNsfwContent ? (
          <div className="space-y-4">
            <div className="border-2 border-gray-600 bg-black text-gray-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <p className="font-semibold mb-1">NSFW контент</p>
                <p className="text-sm text-gray-200/80">
                  Эта запись отмечена как NSFW. Контент скрыт. Нажмите, чтобы показать на собственный риск.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNsfwContent(true)}
                className="mt-2 md:mt-0 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Показать
              </button>
            </div>

            {post.image_url && (
              <div className="rounded-xl overflow-hidden border border-gray-700 bg-black flex items-center justify-center h-64">
                <span className="text-sm text-gray-400 text-center px-4">
                  Изображение скрыто для NSFW-поста. Нажмите &quot;Показать&quot;, чтобы просмотреть.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-200">{post.content}</p>

            {/* Image */}
            {post.image_url && (
              <div>
                {post.is_nsfw && (
                  <div className="mb-2 px-3 py-1 bg-black border border-white text-white inline-block text-xs font-semibold rounded-lg">
                    ⚠️ NSFW изображение
                  </div>
                )}
                <div className="rounded-xl overflow-hidden border border-gray-700 bg-black">
                  <SafeImage
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-800/50 border border-gray-600 text-sm text-gray-300 rounded-lg hover:border-white hover:text-white transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-700">
          <button className="flex items-center gap-2 hover:text-gray-300 transition-colors group">
            <span className="text-xl group-hover:scale-110 transition-transform">❤️</span>
            <span className="font-semibold text-gray-300">{post.likes_count}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 hover:text-gray-300 transition-colors group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
            <span className="font-semibold text-gray-300">{post.comments_count}</span>
          </button>
          <div className="ml-auto flex items-center gap-4">
            {post.theme && (
              <span className="text-xs border border-white px-2 py-1 rounded-full text-gray-100 bg-black">
                {post.theme === 'HP' && 'HP 😊 Хеппі'}
                {post.theme === 'AG' && 'AG 😡 Ангрі'}
                {post.theme === 'NT' && 'NT 😐 Нейтрал'}
              </span>
            )}
            {post.is_anonymous && (
              <span className="text-sm text-gray-500">Анонимный пост</span>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
                    deletePostMutation.mutate(post.id)
                  }
                }}
                disabled={deletePostMutation.isPending}
                className="px-3 py-1.5 text-gray-300 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg font-semibold disabled:opacity-50 transition-all"
                title="Удалить пост (админ)"
              >
                {deletePostMutation.isPending ? '...' : '🗑️'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Warning */}
      {post.moderation_warning && (
        <div className="p-4 bg-gray-700/30 border-t border-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-gray-300 text-xl">⚠️</span>
            <p className="text-gray-200">{post.moderation_warning}</p>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-700 bg-gray-800/30">
          <CommentSection postId={post.id} />
        </div>
      )}
    </article>
  )
}
