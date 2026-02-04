import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import SafeImage from './SafeImage'

interface CaptchaProps {
  onVerify: (token: string, answer: string) => void
  onError?: (error: string) => void
}

export default function Captcha({ onVerify, onError }: CaptchaProps) {
  const [captchaData, setCaptchaData] = useState<{ token: string; image_url: string } | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const loadCaptcha = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/captcha/generate')
      setCaptchaData(response.data)
      setAnswer('')
    } catch (error: any) {
      onError?.(error.response?.data?.error || 'Failed to load CAPTCHA')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  const handleSubmit = () => {
    if (!captchaData || !answer.trim()) {
      onError?.('Please enter CAPTCHA answer')
      return
    }
    onVerify(captchaData.token, answer)
  }

  if (loading || !captchaData) {
    return <div className="p-4 border-2 border-white">Завантаження CAPTCHA...</div>
  }

  return (
    <div className="border-2 border-white p-4">
      <div className="mb-4">
        <SafeImage
          src={captchaData.image_url}
          alt="CAPTCHA"
          className="border-2 border-white"
          onError={() => onError?.('Failed to load CAPTCHA image')}
        />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="flex-1 px-4 py-2 bg-black border-2 border-white text-white"
          placeholder="Введіть відповідь"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200"
        >
          Перевірити
        </button>
        <button
          onClick={loadCaptcha}
          className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black"
          title="Оновити CAPTCHA"
        >
          🔄
        </button>
      </div>
    </div>
  )
}
