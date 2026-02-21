import { useState } from 'react'
import apiClient from '../api/client'
import SimpleCaptcha from './SimpleCaptcha'
import { showToast } from '../utils/toast'

interface ReportFormProps {
  targetType: 'post' | 'comment'
  targetId: string
  onClose?: () => void
  onReported?: () => void
}

export default function ReportForm({ targetType, targetId, onClose, onReported }: ReportFormProps) {
  const [reason, setReason] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState<string | null>(null)
  const [captchaQuestionId, setCaptchaQuestionId] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitReport = async () => {
    if (!reason.trim()) {
      setCaptchaError('Пожалуйста, укажите причину')
      return
    }
    if (!captchaSolution || !captchaQuestionId) {
      setCaptchaError('Пожалуйста, решите CAPTCHA')
      return
    }

    setIsSubmitting(true)
    try {
      const url = targetType === 'post' ? `/posts/${targetId}/report` : `/comments/${targetId}/report`
      await apiClient.post(url, {
        reason,
        captcha_token: captchaSolution,
        captcha_question_id: captchaQuestionId,
      })
      showToast('Жалоба отправлена', 'success')
      if (onReported) onReported()
      if (onClose) onClose()
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Ошибка'
      setCaptchaError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-2 p-3 border-2 border-white bg-black">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-3 py-2 bg-black border-2 border-white text-white min-h-[80px]"
        placeholder="Жалоба..."
      />

      <div className="mt-2">
        <SimpleCaptcha
          onSolution={(token, questionId) => {
            setCaptchaSolution(token)
            setCaptchaQuestionId(questionId)
            setCaptchaError(null)
          }}
          onError={(err) => {
            setCaptchaError(err)
            setCaptchaSolution(null)
            setCaptchaQuestionId(null)
          }}
        />
      </div>

      {captchaError && <p className="text-red-400 mt-2">{captchaError}</p>}

      <div className="flex gap-2 mt-3">
        <button
          onClick={submitReport}
          disabled={isSubmitting}
          className="px-3 py-1 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
        <button
          onClick={() => { if (onClose) onClose() }}
          className="px-3 py-1 border-2 border-white hover:bg-white hover:text-black"
        >
          Отменить
        </button>
      </div>
    </div>
  )
}
