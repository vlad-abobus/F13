import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SafeImage from '../components/SafeImage'
import { showToast } from '../utils/toast'

export default function MikuGPT() {
  const { isAuthenticated } = useAuthStore()
  const [message, setMessage] = useState('')
  const [personality, setPersonality] = useState('Дередере')
  const [emotionSet, setEmotionSet] = useState('A')
  const [flirtEnabled, setFlirtEnabled] = useState(false)
  const [nsfwEnabled, setNsfwEnabled] = useState(false)
  const [rpEnabled, setRpEnabled] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string; emotion?: string }>>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const { data: emotions } = useQuery({
    queryKey: ['emotions', emotionSet],
    queryFn: async () => {
      const response = await apiClient.get(`/miku/emotions?set=${emotionSet}`)
      return response.data
    },
  })

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => {
      if (!isAuthenticated) {
        throw new Error('Login required')
      }
      const response = await apiClient.post('/miku/chat', {
        message: msg,
        personality,
        emotion_set: emotionSet,
        flirt_enabled: flirtEnabled,
        nsfw_enabled: nsfwEnabled,
        rp_enabled: rpEnabled,
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: variables },
        { role: 'assistant', content: data.response, emotion: data.emotion },
      ])
      setMessage('')
    },
    onError: (error: any) => {
      console.error('MikuGPT chat error:', error)
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Помилка при відправці повідомлення'
      showToast(errorMessage, 'error')
      // Додати повідомлення про помилку в чат
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Вибач, зараз не можу відповісти ♪', emotion: 'happy_idle' },
      ])
    },
  })

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      showToast('Введіть повідомлення', 'warning')
      return
    }
    if (!isAuthenticated) {
      showToast('Увійдіть, щоб спілкуватися з MikuGPT', 'warning')
      return
    }
    if (chatMutation.isPending) {
      return
    }
    chatMutation.mutate(trimmedMessage)
  }

  const currentEmotion = chatHistory[chatHistory.length - 1]?.emotion || 'happy_idle'
  const emotionImageUrl = `/api/miku/emotion-image/${emotionSet}/${currentEmotion}`
  const fallbackEmotion = emotionSet === 'A' ? 'happy_idle' : 'smileR_M'
  const fallbackEmotionUrl = `/api/miku/emotion-image/${emotionSet}/${fallbackEmotion}`

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <div className="border-2 border-white p-4">
          <SafeImage
            src={emotionImageUrl}
            alt="Miku emotion"
            className="w-full mb-4 border-2 border-white"
            placeholder={fallbackEmotionUrl}
          />

          <div className="space-y-4">
            <div>
              <label className="block mb-2">Особистість</label>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-white text-white"
              >
                <option>Дередере</option>
                <option>Цундере</option>
                <option>Дандере</option>
                <option>Яндере</option>
                <option>Агресивний</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Набір емоцій</label>
              <select
                value={emotionSet}
                onChange={(e) => setEmotionSet(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-white text-white"
              >
                <option value="A">A (PNG)</option>
                <option value="B">B (JPG)</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={flirtEnabled}
                onChange={(e) => setFlirtEnabled(e.target.checked)}
              />
              Флирт / романтика
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={nsfwEnabled}
                onChange={(e) => setNsfwEnabled(e.target.checked)}
              />
              NSFW контент
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rpEnabled}
                onChange={(e) => setRpEnabled(e.target.checked)}
              />
              RP режим
            </label>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="border-2 border-white p-4 h-96 overflow-y-auto mb-4 flex flex-col">
          <div className="flex-1 flex flex-col justify-end">
            {chatHistory.length === 0 ? (
              <p className="text-center text-gray-500">Почніть розмову з MikuGPT ♪</p>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 border-2 border-white rounded-lg ${
                        msg.role === 'user' ? 'bg-white text-black' : 'bg-black text-white'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-yellow-900 text-white p-4 mb-4 border-2 border-white">
            Увійдіть, щоб спілкуватися з MikuGPT
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={!isAuthenticated || chatMutation.isPending}
            className="flex-1 px-4 py-2 bg-black border-2 border-white text-white"
            placeholder="Повідомлення..."
          />
          <button
            onClick={handleSend}
            disabled={!isAuthenticated || chatMutation.isPending || !message.trim()}
            className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            {chatMutation.isPending ? 'Відправка...' : 'Відправити'}
          </button>
        </div>
      </div>
    </div>
  )
}
