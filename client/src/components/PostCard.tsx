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
      username: string
      avatar_url?: string
      verification_type?: string
    }
    is_anonymous?: boolean
  }
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
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
      showToast('Пост видалено', 'info')
    },
    onError: () => {
      showToast('Помилка при видаленні поста', 'error')
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
                  if (window.confirm('Ви впевнені, що хочете видалити цей пост?')) {
                    deletePostMutation.mutate(post.id)
                  }
                }}
                disabled={deletePostMutation.isPending}
                className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg font-semibold disabled:opacity-50 transition-all"
                title={isAdmin ? 'Видалити пост (адмін)' : 'Видалити пост'}
              >
                {deletePostMutation.isPending ? '...' : '🗑️'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <p className="mb-4 whitespace-pre-wrap text-base leading-relaxed text-gray-200">{post.content}</p>

        {/* Image */}
        {post.image_url && (
          <div className="mb-4">
            {post.is_nsfw && (
              <div className="mb-2 px-3 py-1 bg-yellow-900/50 border border-yellow-500 text-yellow-200 inline-block text-sm font-semibold rounded-lg">
                ⚠️ NSFW Контент
              </div>
            )}
            <div className="rounded-xl overflow-hidden border border-gray-700">
              <SafeImage
                src={post.image_url}
                alt="Post image"
                className={`w-full max-h-96 object-contain ${post.is_nsfw ? 'blur-sm' : ''}`}
              />
            </div>
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
            {post.is_anonymous && (
              <span className="text-sm text-gray-500">Анонімний пост</span>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm('Ви впевнені, що хочете видалити цей пост?')) {
                    deletePostMutation.mutate(post.id)
                  }
                }}
                disabled={deletePostMutation.isPending}
                className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg font-semibold disabled:opacity-50 transition-all"
                title="Видалити пост (адмін)"
              >
                {deletePostMutation.isPending ? '...' : '🗑️'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Warning */}
      {post.moderation_warning && (
        <div className="p-4 bg-yellow-900/50 border-t border-yellow-500">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <p className="text-yellow-200">{post.moderation_warning}</p>
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
