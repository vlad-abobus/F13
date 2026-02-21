import { useState } from 'react'
import ReportForm from './ReportForm'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'
import { showToast } from '../utils/toast'
import SimpleCaptcha from './SimpleCaptcha'
import SafeImage from './SafeImage'
import UserLabel from './UserLabel'

interface CommentSectionProps {
  postId: string
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuthStore()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [captchaSolution, setCaptchaSolution] = useState<string | null>(null)
  const [captchaQuestionId, setCaptchaQuestionId] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const queryClient = useQueryClient()
  const [reportOpenMap, setReportOpenMap] = useState<Record<string, boolean>>({})

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/comments/post/${postId}`)
      return response.data
    },
  })

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parent_id?: string }) => {
      return apiClient.post('/comments', {
        post_id: postId,
        ...data,
        captcha_token: captchaSolution,
        captcha_question_id: captchaQuestionId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setNewComment('')
      setReplyingTo(null)
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
      setShowCaptcha(false)
      setShowCommentForm(false)
      showToast('Комментарий добавлен!', 'success')
    },
    onError: () => {
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
      showToast('Ошибка при добавлении комментария', 'error')
    },
  })

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiClient.post(`/comments/${commentId}/like`)
    },
    onSuccess: (data, commentId) => {
      // Toggle local state
      setLikedComments(prev => {
        const newSet = new Set(prev)
        if (newSet.has(commentId)) {
          newSet.delete(commentId)
        } else {
          newSet.add(commentId)
        }
        return newSet
      })
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      showToast('Лайк обновлен!', 'success')
    },
    onError: () => {
      showToast('Ошибка при обновлении лайка', 'error')
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiClient.delete(`/comments/${commentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      showToast('Комментарий удален', 'info')
    },
    onError: () => {
      showToast('Ошибка при удалении комментария', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    if (!captchaSolution || !captchaQuestionId) {
      setCaptchaError('Пожалуйста, решите CAPTCHA')
      setShowCaptcha(true)
      return
    }

    createCommentMutation.mutate({
      content: newComment,
      parent_id: replyingTo || undefined,
    })
  }

  const renderComment = (comment: any, depth = 0) => {
    const canDelete = isAuthenticated && (user?.id === comment.author?.id || user?.status === 'admin')
    const showReportForComment = !!reportOpenMap[comment.id]

    return (
      <div key={comment.id} className={`border-2 border-white p-4 mb-4 ${depth > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <SafeImage
            src={comment.author?.avatar_url}
            alt={comment.author?.username || 'User'}
            className="w-8 h-8 rounded-full object-cover"
            fallback={
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                {comment.author?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            }
          />
          <UserLabel user={comment.author} />
          <span className="text-sm text-gray-400">
            {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm')}
          </span>
        </div>

        <p className="mb-2 whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => likeCommentMutation.mutate(comment.id)}
            disabled={!isAuthenticated || likeCommentMutation.isPending}
            className="hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-1"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🥴</span>
            <span>{comment.likes_count}</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="hover:underline"
            >
              Ответить
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => deleteCommentMutation.mutate(comment.id)}
              className="text-gray-300 hover:underline"
            >
              Удалить
            </button>
          )}
          <button
            onClick={() => setReportOpenMap(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
            className="text-gray-300 hover:underline"
          >
            R
          </button>
        </div>

        {replyingTo === comment.id && (
          <form onSubmit={handleSubmit} className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-2 bg-black border-2 border-white text-white min-h-[60px]"
              placeholder="Ответ..."
            />
            
            {/* CAPTCHA for reply */}
            {showCaptcha && (
              <div className="mt-2">
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
            
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || createCommentMutation.isPending || !captchaSolution || !captchaQuestionId}
                className="px-4 py-1 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                Отправить
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null)
                  setNewComment('')
                  setCaptchaSolution(null)
                  setCaptchaQuestionId(null)
                  setCaptchaError(null)
                }}
                className="px-4 py-1 border-2 border-white hover:bg-white hover:text-black"
              >
                Отменить
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
        {showReportForComment && (
          <div className="mt-2">
            <ReportForm targetType="comment" targetId={comment.id} onClose={() => setReportOpenMap(prev => ({ ...prev, [comment.id]: false }))} onReported={() => setReportOpenMap(prev => ({ ...prev, [comment.id]: false }))} />
          </div>
        )}
      </div>
    )
  }

  const [showCommentForm, setShowCommentForm] = useState(false)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Комментарии</h2>
        {isAuthenticated && !showCommentForm && (
          <button
            onClick={() => setShowCommentForm(true)}
            className="px-3 py-1 text-sm bg-white text-black font-bold hover:bg-gray-200"
          >
            🗤 Комментировать
          </button>
        )}
      </div>

      {isAuthenticated && showCommentForm && (
        <form onSubmit={handleSubmit} className="mb-6 border-2 border-white p-4 bg-black">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white min-h-[100px]"
            placeholder="Комментарий..."
          />
          
          {/* CAPTCHA Section with Collapse */}
          <div className="mt-4 border-2 border-white bg-black">
            <div 
              className="p-3 border-b-2 border-white bg-gradient-to-r from-gray-900 to-gray-800 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-colors"
              onClick={() => setShowCaptcha(!showCaptcha)}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold"><img src="/icons/icons8-замок-50.png" alt="Lock" className="w-4 h-4 inline mr-1" /> CAPTCHA</span>
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
                  <p className="text-gray-300 mt-2 text-sm">{captchaError}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending || !captchaSolution || !captchaQuestionId}
              className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
            >
              {createCommentMutation.isPending ? 'Отправка...' : 'Комментировать'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCommentForm(false)
                setNewComment('')
                setCaptchaSolution(null)
                setCaptchaQuestionId(null)
                setCaptchaError(null)
                setShowCaptcha(false)
              }}
              className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black"
            >
              Отменить
            </button>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <p className="mb-4 text-gray-400">Войдите, чтобы комментировать</p>
      )}

      <div>
        {comments?.map((comment: any) => renderComment(comment))}
        {(!comments || comments.length === 0) && (
          <p className="text-gray-400">Нет комментариев</p>
        )}
      </div>
    </div>
  )
}
