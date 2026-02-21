import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import SafeImage from './SafeImage'

interface CollageItem {
  id: string
  image_url: string
  post_id?: string
  is_nsfw?: boolean
  tags?: string[]
}

interface CollageGalleryProps {
  items: CollageItem[]
  showNsfw: boolean
}

interface CaptchaQuestion {
  id: string
  question: string
}

export default function CollageGallery({ items, showNsfw }: CollageGalleryProps) {
  const navigate = useNavigate()
  const [reportItem, setReportItem] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaQuestion | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [expandedImage, setExpandedImage] = useState<CollageItem | null>(null)

  const { refetch: loadCaptcha } = useQuery({
    queryKey: ['report-captcha', reportItem],
    queryFn: async () => {
      if (!reportItem) return null
      const response = await apiClient.get('/captcha/question')
      setCaptcha(response.data)
      return response.data
    },
    enabled: false,
  })

  // Фильтруем элементы
  const filteredItems = items.filter((item) => showNsfw || !item.is_nsfw)

  if (filteredItems.length === 0) {
    return <div className="text-center py-8 text-gray-400">Нет изображений</div>
  }

  // Массив размеров для коллажа (col-span, row-span)
  const sizes = [
    { cols: 2, rows: 2 }, // большое 2x2
    { cols: 1, rows: 1 }, // маленькое 1x1
    { cols: 1, rows: 1 }, // маленькое 1x1
    { cols: 1, rows: 2 }, // вертикальное 1x2
    { cols: 2, rows: 1 }, // горизонтальное 2x1
    { cols: 1, rows: 1 }, // маленькое 1x1
    { cols: 1, rows: 1 }, // маленькое 1x1
    { cols: 2, rows: 1 }, // горизонтальное 2x1
    { cols: 1, rows: 1 }, // маленькое 1x1
    { cols: 1, rows: 2 }, // вертикальное 1x2
  ]

  const handleImageClick = (item: CollageItem) => {
    setExpandedImage(item)
  }

  const closeExpanded = () => {
    setExpandedImage(null)
  }

  const navigateToPost = (item: CollageItem) => {
    if (item.post_id) {
      navigate(`/post/${item.post_id}`)
      closeExpanded()
    }
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportItem || !reportReason.trim() || !captchaAnswer.trim()) return

    setIsReporting(true)
    try {
      await apiClient.post('/gallery/report', {
        gallery_id: reportItem,
        reason: reportReason,
        captcha_question_id: captcha?.id,
        captcha_answer: captchaAnswer,
      })
      alert('Дякуємо за звіт!')
      setReportItem(null)
      setReportReason('')
      setCaptchaAnswer('')
      setCaptcha(null)
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Помилка при відправці звіту')
    } finally {
      setIsReporting(false)
    }
  }

  const openReport = (itemId: string) => {
    setReportItem(itemId)
    loadCaptcha()
  }

  return (
    <>
      <div 
        className="grid gap-3 auto-rows-[250px] w-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        }}
      >
        {filteredItems.map((item, index) => {
          const sizeIndex = index % sizes.length
          const size = sizes[sizeIndex]

          return (
              <div
              key={item.id}
              className={`relative overflow-hidden rounded-lg border-2 border-white/30 hover:border-white/100 cursor-pointer group transition-all duration-300`}
              style={{
                gridColumn: `span ${Math.min(size.cols, 2)}`,
                gridRow: `span ${Math.min(size.rows, 2)}`,
              }}
            >
            {/* Фоновое изображение с blur */}
            <div className="absolute inset-0 bg-gray-900">
              <SafeImage
                src={item.image_url}
                alt="Gallery item"
                className={`w-full h-full object-cover filter blur-sm scale-110 ${
                  item.is_nsfw && !showNsfw ? 'blur-2xl' : ''
                }`}
              />
            </div>

            {/* Основное изображение с hover эффектом */}
            <div 
              className="relative w-full h-full overflow-hidden cursor-pointer"
              onClick={() => handleImageClick(item)}
            >
              <SafeImage
                src={item.image_url}
                alt="Gallery item"
                className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-125 ${
                  item.is_nsfw && !showNsfw ? 'blur-xl' : ''
                }`}
              />
            </div>

            {/* Overlay темный при наведении */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

            {/* Тег NSFW если нужен */}
            {item.is_nsfw && (
              <div className="absolute top-2 right-2 bg-red-600/80 px-2 py-1 rounded text-xs font-bold text-white">
                NSFW
              </div>
            )}

            {/* Теги изображения */}
            {item.tags && item.tags.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white/20 text-white px-2 py-1 rounded backdrop-blur-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded backdrop-blur-sm">
                      +{item.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Report и Search иконки */}
            <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openReport(item.id)
                }}
                className="bg-red-600/80 hover:bg-red-700 rounded-full p-2 backdrop-blur-sm transition"
                title="Поскаржитись"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageClick(item)
                }}
                className="bg-white/90 hover:bg-white rounded-full p-2 backdrop-blur-sm transition"
                title="Переглянути оригінал"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
      </div>

      {/* Report Modal */}
      {reportItem && captcha && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border-2 border-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Поскаржитись на зображення</h2>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Причина:</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-white/30 text-white rounded focus:border-white outline-none"
                  disabled={isReporting}
                >
                  <option value="">Виберіть причину...</option>
                  <option value="spam">Спам</option>
                  <option value="offensive">Образливий контент</option>
                  <option value="violence">Насилля</option>
                  <option value="misleading">Оманливий контент</option>
                  <option value="copyright">Порушення авторських прав</option>
                  <option value="other">Інше</option>
                </select>
              </div>

              {/* CAPTCHA */}
              <div className="border-2 border-white/30 p-3 rounded-lg bg-gray-800/50">
                <p className="text-white mb-2 font-medium text-sm">{captcha.question}</p>
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Відповідь..."
                  className="w-full px-3 py-2 bg-gray-700 border-2 border-white/30 text-white rounded text-sm focus:border-white outline-none"
                  disabled={isReporting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!reportReason.trim() || !captchaAnswer.trim() || isReporting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
                >
                  {isReporting ? 'Відправлення...' : 'Поскаржитись'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportItem(null)
                    setReportReason('')
                    setCaptchaAnswer('')
                    setCaptcha(null)
                  }}
                  disabled={isReporting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={closeExpanded}
        >
          <div 
            className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Основное изображение с плавным zoom */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
              <SafeImage
                src={expandedImage.image_url}
                alt="Expanded gallery item"
                className="w-full h-full object-contain transition-transform duration-700 ease-out hover:scale-110 cursor-zoom-in"
              />
            </div>

            {/* Закрыть кнопка */}
            <button
              onClick={closeExpanded}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition backdrop-blur-sm z-10"
              title="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Кнопки внизу */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
              {expandedImage.post_id && (
                <button
                  onClick={() => navigateToPost(expandedImage)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition backdrop-blur-sm"
                >
                  До посту
                </button>
              )}
              <button
                onClick={closeExpanded}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition backdrop-blur-sm"
              >
                Закрыть
              </button>
            </div>

            {/* Информация об изображении */}
            {(expandedImage.tags && expandedImage.tags.length > 0) && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 max-w-xs">
                <p className="text-xs text-gray-300 mb-2">Теги:</p>
                <div className="flex flex-wrap gap-2">
                  {expandedImage.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white/20 text-white px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>  )
}