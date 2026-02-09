import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'
import { showToast } from '../utils/toast'

export default function Reports() {
  const { isAuthenticated } = useAuthStore()
  const [reason, setReason] = useState('')
  const [postId, setPostId] = useState('')
  const [commentId, setCommentId] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState<string | null>(null)
  const [captchaQuestionId, setCaptchaQuestionId] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) throw new Error('Требуется вход в аккаунт')
      if (!captchaSolution || !captchaQuestionId) {
        setCaptchaError('Пожалуйста, пройдите CAPTCHA')
        throw new Error('CAPTCHA required')
      }

      const response = await apiClient.post('/reports', {
        reason,
        post_id: postId || undefined,
        comment_id: commentId || undefined,
        captcha_question_id: captchaQuestionId,
        captcha_solution: captchaSolution,
      })
      return response.data
    },
    onSuccess: () => {
      showToast('Жалоба отправлена. Спасибо за отчет.', 'success')
      setReason('')
      setPostId('')
      setCommentId('')
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Не удалось отправить жалобу'
      showToast(msg, 'error')
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto border-2 border-white bg-black p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Жалобы и репорты</h1>
        <p className="text-gray-400">Войдите в аккаунт, чтобы отправлять жалобы и репорты об ошибках.</p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      showToast('Опишите проблему в поле описания', 'warning')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="border-2 border-white bg-black rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Жалоба / Репорт об ошибке</h1>
        <p className="text-gray-400 text-sm">Опишите проблему или ошибку. Отправка требует прохождения CAPTCHA и наличия аккаунта.</p>
      </div>

      <form onSubmit={handleSubmit} className="border-2 border-white bg-black rounded-xl p-6 space-y-4">
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">ID поста (опционально)</label>
          <input
            type="text"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg"
            placeholder="UUID поста"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">ID комментария (опционально)</label>
          <input
            type="text"
            value={commentId}
            onChange={(e) => setCommentId(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg"
            placeholder="UUID комментария"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">Описание проблемы</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg min-h-[140px]"
            placeholder="Опишите, что произошло и как это воспроизвести"
          />
        </div>

        <div className="pt-4 border-t border-gray-700">
          <label className="block mb-2 text-sm font-semibold text-gray-300">🔒 CAPTCHA (защита от ботов)</label>
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
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
            {captchaError && <p className="text-gray-300 mt-2 text-sm">{captchaError}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50"
        >
          {mutation.isPending ? 'Отправка...' : 'Отправить жалобу'}
        </button>
      </form>
    </div>
  )
}
