import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SafeImage from '../components/SafeImage'
import { showToast } from '../utils/toast'
import { logger } from '../utils/logger'
import { initializeGemini, sendGeminiMessage, sendGeminiMessageStreaming } from '../services/GeminiChat'

/**
 * MikuGPT Chat Interface
 * 
 * 🎭 EMOTION SYSTEM:
 * Мику вибирає емоцію на основі змісту її відповіді. Система працює так:
 * 
 * 1. AI генерує відповідь + прихований JSON з однією емоцією
 * 2. JSON має формат: {"emotion": "emotion_name"}
 * 3. Приклад респонсу:
 *    Привіт! Як справи? ♪
 *    [КОНЕЦ ВИДИМОГО ТЕКСТА]
 *    ```json
 *    {"emotion": "happy"}
 *    ```
 * 
 * 4. Frontend парсить JSON і витягує назву емоції
 * 5. На основі емоції завантажується зображення: /api/miku/emotion-image/{set}/{emotion}
 * 6. Користувач бачить тільки текст + відповідне зображення емоції
 * 
 * 40 доступних емоцій з miku_c папки:
 * aggressiv_comedy, angry_surprised, annoyed, blushing, celebrate, congratulations, 
 * crying, curios, defeated, fight, good_morning, good_night, happy_satisfaction, 
 * happy_wait, hi, hugging, im_counting_on_you, im_sorryyy, love, nice, ok, party, 
 * peeking, playful_pose, please, relieved, scared, shy_request, sleeping, sleepy, 
 * surprise, surprised, take_a_break, thank_you, thank_you_soooo_much, thinking, 
 * understood, victory, withdrawn, yeah
 */

export default function MikuGPT() {
  const { isAuthenticated } = useAuthStore()
  const [message, setMessage] = useState('')
  const [personality, setPersonality] = useState('Дередере')
  const [emotionSet, setEmotionSet] = useState('DEFAULT')
  const [flirtEnabled, setFlirtEnabled] = useState(false)
  const [nsfwEnabled, setNsfwEnabled] = useState(false)
  const [sexMode, setSexMode] = useState(false)
  const [rpEnabled, setRpEnabled] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string; emotion?: string }>>([])
  const [useGeminiDirect, setUseGeminiDirect] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Инициализация Gemini при подключении компонента
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        initializeGemini(apiKey)
        setUseGeminiDirect(true)
        logger.info('Gemini инициализирован для прямого чата на стороне клиента')
      } catch (error) {
        logger.error('Не удалось инициализировать Gemini:', error)
        setUseGeminiDirect(false)
      }
    } else {
      logger.warn('VITE_GEMINI_API_KEY не настроен, используется API бэкенда')
      setUseGeminiDirect(false)
    }
  }, [])

  // Автопрокрутка вниз при появлении новых сообщений
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

  // Разбор входящего фрагмента: пытаемся извлечь JSON-блоки с эмоцией и содержимым,
  // и возвращаем очищенное содержимое плюс необязательную эмоцию.
  const parseChunk = (text: string): { content: string; emotion?: string | null } => {
    // Попытка прямого разбора JSON, если фрагмент является объектом JSON
    const trimmed = text.trim()
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const obj = JSON.parse(trimmed)
        const content = (obj.content || obj.message || '').toString()
        const emotion = obj.emotion || null
        const cleanedContent = content.replace(/\*?думаю[.…]*\s*/gi, '').trim()
        return { content: cleanedContent || '', emotion }
      }
    } catch (e) {
      // Игнорируем ошибку разбора и переходим к попыткам на основе регулярных выражений
    }

    // Попытка найти подстроку JSON, которая содержит поле эмоции
    const jsonSubMatch = text.match(/\{[^}]*\"emotion\"[^}]*\}/s)
    if (jsonSubMatch) {
      try {
        const obj = JSON.parse(jsonSubMatch[0])
        const emotion = obj.emotion || null
        const content = (obj.content || obj.message || '').toString()
        // Удаляем подстроку JSON из исходного текста при отображении
        const cleaned = text.replace(jsonSubMatch[0], '').trim()
        const combined = content || cleaned
        const cleanedContent = combined.replace(/\*?думаю[.…]*\s*/gi, '').trim()
        return { content: cleanedContent || '', emotion }
      } catch (e) {
        // Если разбор не удается, продолжать нельзя
      }
    }

    // Запасной вариант: попытка извлечь эмоцию через регулярное выражение, но не показываем сырой JSON
    const emotionMatch = text.match(/\"emotion\"\s*:\s*\"([^\"]+)\"/)
    if (emotionMatch) {
      const emotion = emotionMatch[1]
      const cleaned = text.replace(/\{[^}]*\"emotion\"[^}]*\}/s, '').trim()
      const cleanedContent = cleaned.replace(/\*?думаю[.…]*\s*/gi, '').trim()
      return { content: cleanedContent, emotion }
    }

    // JSON не найден — удаляем маркеры размышления и возвращаем текст
    const cleanedText = text.replace(/\*?думаю[.…]*\s*/gi, '').trim()
    return { content: cleanedText, emotion: null }
  }

  const handleSend = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      showToast('Введите сообщение', 'warning')
      return
    }
    if (!isAuthenticated) {
      showToast('Войдите, чтобы общаться с MikuGPT', 'warning')
      return
    }
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)
      
      // Добавляем сообщение пользователя в чат
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: trimmedMessage },
      ])
      setMessage('')

      // Добавляем заполнитель для ответа Miku
      const assistantMessageIndex = chatHistory.length + 1
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: '', emotion: 'aggressiv_comedy' },
      ])

      // Сначала попытаемся использовать потоковое получение Gemini
      if (useGeminiDirect) {
        try {
          logger.info('Используем потоковое получение Gemini')
          const response = await sendGeminiMessageStreaming(
            trimmedMessage,
            personality,
            (chunk) => {
              // Обновляем последнее сообщение каждым фрагментом — разбираем и очищаем JSON-фрагменты
              setChatHistory((prev) => {
                const newHistory = [...prev]
                const lastMsg = newHistory[newHistory.length - 1]
                if (lastMsg.role === 'assistant') {
                  const parsed = parseChunk(chunk)
                  // Добавляем разобранное содержимое для сохранения ранее полученных фрагментов
                  if (parsed.content) {
                    lastMsg.content = lastMsg.content
                      ? `${lastMsg.content}${parsed.content}`
                      : parsed.content
                  }
                  if (parsed.emotion) {
                    lastMsg.emotion = parsed.emotion
                  }
                }
                return newHistory
              })
            },
            emotionSet,
            flirtEnabled,
            nsfwEnabled,
            sexMode,
            rpEnabled
          )
          
          // Обновляем с финальной эмоцией
          setChatHistory((prev) => {
            const newHistory = [...prev]
            const lastMsg = newHistory[newHistory.length - 1]
            if (lastMsg.role === 'assistant') {
              // Применяем финальное очищенное содержимое ответа (если есть) и эмоцию
              if (response.response) {
                lastMsg.content = response.response
              }
              lastMsg.emotion = response.emotion
            }
            return newHistory
          })
        } catch (error) {
          logger.warn('Потоковое получение Gemini не удалось, переход на бэкенд:', error)
          // Переходим на бэкенд
          await handleBackendChat(trimmedMessage, assistantMessageIndex)
        }
      } else {
        await handleBackendChat(trimmedMessage, assistantMessageIndex)
      }
    } catch (error: any) {
      logger.error('Ошибка чата MikuGPT:', error)
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Ошибка при отправке сообщения'
      showToast(errorMessage, 'error')
      
      // Заменяем последнее сообщение сообщением об ошибке
      setChatHistory((prev) => {
        const newHistory = [...prev]
        const lastMsg = newHistory[newHistory.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = 'Извини, сейчас не могу ответить ♪'
          lastMsg.emotion = 'aggressiv_comedy'
        }
        return newHistory
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackendChat = async (trimmedMessage: string, assistantMessageIndex: number) => {
    try {
      const response = await apiClient.post('/miku/chat', {
        message: trimmedMessage,
        personality,
        emotion_set: emotionSet,
        flirt_enabled: flirtEnabled,
        nsfw_enabled: nsfwEnabled,
        sex_mode: sexMode,
        rp_enabled: rpEnabled,
      })
      
      setChatHistory((prev) => {
        const newHistory = [...prev]
        const lastMsg = newHistory[newHistory.length - 1]
        if (lastMsg.role === 'assistant') {
          lastMsg.content = response.data.response
          lastMsg.emotion = response.data.emotion
        }
        return newHistory
      })
    } catch (error) {
      logger.error('Ошибка чата бэкенда:', error)
      throw error
    }
  }

  const currentEmotion = chatHistory[chatHistory.length - 1]?.emotion || 'aggressiv_comedy'
  const emotionImageUrl = `/api/miku/emotion-image/${emotionSet}/${currentEmotion}`
  const fallbackEmotion = 'aggressiv_comedy'
  const fallbackEmotionUrl = `/api/miku/emotion-image/${emotionSet}/${fallbackEmotion}`

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <div className="border-2 border-white p-4">
          <SafeImage
            src={emotionImageUrl}
            alt="Эмоция Мику"
            className="w-full mb-4 border-2 border-white"
            placeholder={fallbackEmotionUrl}
          />

          <div className="space-y-4">
            <div>
              <label className="block mb-2">Личность</label>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-white text-white"
              >
                <option>Дередере</option>
                <option>Цундере</option>
                <option>Дандере</option>
                <option>Яндере</option>
                <option>Агрессивный</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Набор эмоций</label>
              <select
                value={emotionSet}
                onChange={(e) => setEmotionSet(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-white text-white"
              >
                <option value="DEFAULT">Мику (40 эмоций)</option>
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
                checked={sexMode}
                onChange={(e) => setSexMode(e.target.checked)}
              />
              🔞 Режим 18+
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
              <p className="text-center text-gray-500">Начните разговор с MikuGPT ♪</p>
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
          <div className="bg-gray-800 text-white p-4 mb-4 border-2 border-white">
            Войдите, чтобы общаться с MikuGPT
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
            disabled={!isAuthenticated || isLoading}
            className="flex-1 px-4 py-2 bg-black border-2 border-white text-white"
            placeholder="Сообщение..."
          />
          <button
            onClick={handleSend}
            disabled={!isAuthenticated || isLoading || !message.trim()}
            className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}
