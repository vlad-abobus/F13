import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'
import { showToast } from '../utils/toast'

export default function MikuAdminRequest() {
  const { isAuthenticated } = useAuthStore()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [targetUsername, setTargetUsername] = useState('')
  const [postId, setPostId] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState<string | null>(null)
  const [captchaQuestionId, setCaptchaQuestionId] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [mikuResponse, setMikuResponse] = useState<null | {
    summary: string
    recommended_action: string
    severity: number
    notes?: string
  }>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Требуется вход в аккаунт')
      }
      if (!captchaSolution || !captchaQuestionId) {
        setCaptchaError('Пожалуйста, пройдите CAPTCHA')
        throw new Error('CAPTCHA required')
      }

      const response = await apiClient.post('/miku/admin-request', {
        subject,
        description,
        target_username: targetUsername || undefined,
        post_id: postId || undefined,
        captcha_token: captchaSolution,
        captcha_question_id: captchaQuestionId,
      })
      return response.data
    },
    onSuccess: (data) => {
      setMikuResponse(data.miku_decision)
      showToast('Запрос отправлен. MikuGPT подготовила рекомендацию.', 'success')
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Не удалось отправить запрос администрации'
      showToast(msg, 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      showToast('Заповніть тему і опис', 'warning')
      return
    }
    mutation.mutate()
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto border-2 border-white bg-black p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Запрос администрации через MikuGPT</h1>
        <p className="text-gray-400">Войдите, чтобы оставить запрос.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="border-2 border-white bg-black rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">🎵 Запрос администрации с помощью MikuGPT</h1>
        <p className="text-gray-400 text-sm">
          Опишите проблему, и MikuGPT подготовит краткое заключение и рекомендацию для администраторов. Окончательное
          решение остается за живой администрацией.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border-2 border-white bg-black rounded-xl p-6 space-y-4">
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">Тема</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg"
            placeholder="Например: Оскорбления в комментариях"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">
            Имя пользователя (если жалоба на конкретного)
          </label>
          <input
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg"
            placeholder="username (опционально)"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">
            ID поста (если известно)
          </label>
          <input
            type="text"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg"
            placeholder="UUID поста (опционально)"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-200">Описание ситуации</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-black border-2 border-white text-white rounded-lg min-h-[140px]"
            placeholder="Опишите, что произошло, с максимальным количеством деталей."
          />
        </div>

        <div className="pt-4 border-t border-gray-700">
          <label className="block mb-2 text-sm font-semibold text-gray-300">
            🔒 CAPTCHA (защита от ботов)
          </label>
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
          disabled={mutation.isPending || !subject.trim() || !description.trim()}
          className="w-full px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50"
        >
          {mutation.isPending ? 'Отправка...' : 'Отправить запрос'}
        </button>
      </form>

      {mikuResponse && (
        <div className="mt-6 border-2 border-white bg-black rounded-xl p-6">
          <h2 className="text-xl font-bold mb-3">Заключение MikuGPT для администраторов</h2>
          <p className="mb-2">
            <span className="font-semibold">Кратко:</span> {mikuResponse.summary || '—'}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Рекомендуемое действие:</span>{' '}
            {mikuResponse.recommended_action.toUpperCase()}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Серьезность:</span> {mikuResponse.severity}
          </p>
          {mikuResponse.notes && (
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-300">Заметки Miku:</span> {mikuResponse.notes}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Окончательное решение (бан/мут и т.д.) всегда принимает живая администрация.
          </p>
        </div>
      )}
    </div>
  )
}

