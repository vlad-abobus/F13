import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'
import SafeImage from './SafeImage'
import { protectElement } from '../utils/copyProtection'

interface CaptchaProps {
  onVerify: (token: string, answer: string) => void
  onError?: (error: string) => void
}

export default function Captcha({ onVerify, onError }: CaptchaProps) {
  const [captchaData, setCaptchaData] = useState<{ token: string; image_url: string } | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const captchaRef = useRef<HTMLDivElement>(null)

  const loadCaptcha = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/captcha/generate')
      setCaptchaData(response.data)
      setAnswer('')
    } catch (error: any) {
      onError?.(error.response?.data?.error || 'Не удалось загрузить CAPTCHA')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  // Применяем защиту от копирования при загрузке капчи
  useEffect(() => {
    if (captchaRef.current && captchaData) {
      const cleanup = protectElement(captchaRef.current, {
        blockCopy: true,
        blockSelect: true,
        blockContextMenu: true,
        blockDrag: true,
        blockInspect: false // Инспектор на изображении разрешен
      })
      return cleanup
    }
  }, [captchaData])

  const handleSubmit = () => {
    if (!captchaData || !answer.trim()) {
      onError?.('Пожалуйста, введите ответ CAPTCHA')
      return
    }
    onVerify(captchaData.token, answer)
  }

  if (loading || !captchaData) {
    return <div className="p-4 border-2 border-white">Загружениe CAPTCHA...</div>
  }

  return (
    <div ref={captchaRef} className="border-2 border-white p-4">
      <div className="mb-4 select-none">
        <SafeImage
          src={captchaData.image_url}
          alt="CAPTCHA"
          className="border-2 border-white pointer-events-auto"
          onError={() => onError?.(('Не удалось загрузить изображение CAPTCHA'))}
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
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
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
