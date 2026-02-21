import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'

interface GalleryUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CaptchaQuestion {
  id: string
  question: string
  type: string
}

export default function GalleryUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: GalleryUploadModalProps) {
  const { isAuthenticated } = useAuthStore()

  const [file, setFile] = useState<File | null>(null)
  const [isNsfw, setIsNsfw] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  
  // CAPTCHA states
  const [captchaQuestion, setCaptchaQuestion] = useState<CaptchaQuestion | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false)

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['gallery-tags'],
    queryFn: async () => {
      const response = await apiClient.get('/gallery/tags')
      return response.data
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !selectedTags.includes(trimmedTag) && trimmedTag.length > 0) {
      setSelectedTags((prev) => [...prev, trimmedTag])
      setTagInput('')
    }
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  // Load CAPTCHA question when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCaptchaQuestion()
    }
  }, [isOpen])

  // Close dropdown when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowTagDropdown(false)
      setTagInput('')
    }
  }, [isOpen])

  const loadCaptchaQuestion = async () => {
    setIsCaptchaLoading(true)
    try {
      const response = await apiClient.get('/captcha/question')
      setCaptchaQuestion(response.data)
      setCaptchaAnswer('')
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err)
    } finally {
      setIsCaptchaLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isAuthenticated) {
      setError('Потрібно увійти для завантаження')
      return
    }

    if (!file) {
      setError('Виберіть зображення')
      return
    }

    if (!captchaQuestion || !captchaAnswer) {
      setError('Відповідайте на CAPTCHA')
      return
    }

    setIsLoading(true)

    try {
      // First verify CAPTCHA
      const captchaVerifyResponse = await apiClient.post('/captcha/verify', {
        question_id: captchaQuestion.id,
        answer: captchaAnswer,
      })

      if (!captchaVerifyResponse.data.success) {
        setError('Неправильна відповідь на CAPTCHA')
        loadCaptchaQuestion()
        setIsLoading(false)
        return
      }

      // Proceed with upload
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await apiClient.post('/upload', formData)
      const imageUrl = uploadResponse.data.secure_url

      await apiClient.post('/gallery/upload', {
        image_url: imageUrl,
        is_nsfw: isNsfw,
        tags: selectedTags,
        captcha_question_id: captchaQuestion.id,
        captcha_token: captchaAnswer,
      })

      alert('Картинку додано до галереї!')
      setFile(null)
      setPreview('')
      setSelectedTags([])
      setTagInput('')
      setIsNsfw(false)
      setCaptchaAnswer('')
      onSuccess()
      onClose()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Помилка при завантаженні картинки'
      setError(errorMsg)
      loadCaptchaQuestion()
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Додати картинку до галереї</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-600/30 border-2 border-red-600 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Превью */}
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-white/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setPreview('')
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Видалити
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-white/50 rounded-lg p-8 text-center cursor-pointer hover:border-white/100 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-2"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-14-4l-4 4m0 0l-4-4m4 4v16"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-white font-medium">Клікніть або перетягніть картинку</p>
                  <p className="text-gray-400 text-sm">PNG, JPG, GIF до 10MB</p>
                </div>
              </label>
            )}

            {/* Теги */}
            <div>
              <label className="block text-white font-medium mb-2">Теги</label>
              
              {/* Обрані теги */}
              {selectedTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="hover:text-red-200 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Популярні теги */}
              {availableTags.length > 0 && (
                <div className="mb-3 p-3 bg-gray-800/50 border border-white/20 rounded">
                  <p className="text-xs text-gray-400 mb-2">Популярні теги:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 8).map((tag: string) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropdown з доступними тегами */}
              <div className="relative mb-3">
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-white/30 text-white rounded text-left flex justify-between items-center hover:border-white/50 transition"
                  disabled={isLoading}
                >
                  <span className="text-gray-400">
                    {selectedTags.length > 0
                      ? `Обрано ${selectedTags.length}`
                      : 'Усі теги...'}
                  </span>
                  <span className="text-lg">▼</span>
                </button>

                {showTagDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-white/30 rounded max-h-48 overflow-y-auto z-10">
                    {availableTags.length > 0 ? (
                      availableTags.map((tag: string) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`w-full text-left px-4 py-2 transition flex items-center gap-2 ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-600 text-white'
                              : 'text-white hover:bg-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            readOnly
                            className="w-4 h-4"
                          />
                          {tag}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-400 text-sm">
                        Немає доступних тегів
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Введение кастомного тега */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Введіть новий тег..."
                  className="flex-1 px-3 py-2 bg-gray-800 border-2 border-white/30 text-white rounded focus:border-white outline-none text-sm"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  disabled={!tagInput.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition font-medium text-sm"
                >
                  Додати
                </button>
              </div>

              <p className="text-gray-400 text-sm">
                Виберіть теги зі списку або введіть нові (Enter для додавання)
              </p>
            </div>

            {/* NSFW */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isNsfw}
                onChange={(e) => setIsNsfw(e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5"
              />
              <span className="text-white">Це NSFW контент</span>
            </label>

            {/* CAPTCHA */}
            {captchaQuestion && (
              <div className="border-2 border-white/30 p-4 rounded-lg bg-gray-800/50">
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <img
                    src="/icons/icons8-замок-50.png"
                    alt="Lock"
                    className="w-4 h-4"
                  />
                  CAPTCHA
                </label>
                <p className="text-white mb-3 font-medium">{captchaQuestion.question}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Введіть відповідь..."
                    className="flex-1 px-3 py-2 bg-gray-700 border-2 border-white/30 text-white rounded focus:border-white outline-none"
                    disabled={isLoading || isCaptchaLoading}
                  />
                  <button
                    type="button"
                    onClick={loadCaptchaQuestion}
                    disabled={isLoading || isCaptchaLoading}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition border-2 border-white/30"
                    title="Нове запитання"
                  >
                    🔄
                  </button>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={!file || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
              >
                {isLoading ? 'Завантаження...' : 'Додати'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
