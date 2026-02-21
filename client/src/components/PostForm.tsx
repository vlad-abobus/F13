import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from './SimpleCaptcha'
import { logger } from '../utils/logger'

const postSchema = z.object({
  content: z.string().min(1, 'Обязательно').max(5000, 'Слишком длинно'),
  tags: z.array(z.string()).optional(),
  is_nsfw: z.boolean().default(false),
  is_anonymous: z.boolean().default(false),
  emotion: z.enum(['HP', 'AG', 'NT']).default('NT'),
})

type PostForm = z.infer<typeof postSchema>

interface PostFormProps {
  onSuccess?: () => void
}

export default function PostForm({ onSuccess }: PostFormProps) {
  const { isAuthenticated } = useAuthStore()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [captchaSolution, setCaptchaSolution] = useState<string | null>(null)
  const [captchaQuestionId, setCaptchaQuestionId] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      emotion: 'NT',
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: PostForm) => {
    const authState = useAuthStore.getState()
    
    // Проверяем, есть ли токен аутентификации перед запросом
    if (!authState.accessToken && !authState.refreshToken) {
      logger.error('Необходима авторизация')
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return
    }
    
    try {
      let imageUrl = null

      if (imageFile) {
        // Загрузка через конечную точку Cloudinary
        const formData = new FormData()
        formData.append('file', imageFile)
        // Не устанавливаем Content-Type вручную - axios сделает это автоматически
        const uploadResponse = await apiClient.post('/upload', formData)
        // Используем secure_url из Cloudinary
        imageUrl = uploadResponse.data.secure_url
      }

      if (!captchaSolution || !captchaQuestionId) {
        setCaptchaError('Пожалуйста, решите CAPTCHA')
        return
      }

      const { emotion, ...rest } = data

      await apiClient.post('/posts/', {
        ...rest,
        theme: emotion,
        image_url: imageUrl,
        captcha_token: captchaSolution,
        captcha_question_id: captchaQuestionId,
      })

      reset()
      setImagePreview(null)
      setImageFile(null)
      setCaptchaSolution(null)
      setCaptchaQuestionId(null)
      setCaptchaError(null)
      setIsCollapsed(true)
      onSuccess?.()
    } catch (err: any) {
      logger.error('Ошибка поста:', err)
      // Если это ошибка 401 и у нас нет токена обновления, перенаправляем на вход
      if (err.response?.status === 401) {
        const authState = useAuthStore.getState()
        if (!authState.refreshToken) {
          authState.logout()
          window.location.href = '/login'
        }
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="border-2 border-white p-4 text-center">
        <p>Войдите, чтобы создать пост</p>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full px-6 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span className="text-xl"></span>
          <span>Создать пост</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 mb-6 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Создать пост</h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <textarea
              {...register('content')}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 text-white min-h-[60px] text-base focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all resize-y rounded-xl placeholder:text-gray-500"
              placeholder="Что у вас на уме?"
            />
            {errors.content && (
              <p className="text-gray-300 mt-2 text-sm">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-300 font-medium">
              Изображение
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-xl file:mr-4 file:py-2 file:px-4 file:bg-gray-700 file:text-white file:border-0 file:rounded-lg file:cursor-pointer hover:file:bg-gray-600 transition-colors"
              />
            </div>
            {imagePreview && (
              <div className="mt-4 rounded-xl overflow-hidden border border-gray-600">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-contain bg-gray-900" 
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors group">
              <input 
                type="checkbox" 
                {...register('is_nsfw')}
                className="w-4 h-4 cursor-pointer accent-white"
              />
              <span className="text-sm text-gray-300 group-hover:text-white">NSFW</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors group">
              <input 
                type="checkbox" 
                {...register('is_anonymous')}
                className="w-4 h-4 cursor-pointer accent-white"
              />
              <span className="text-sm text-gray-300 group-hover:text-white">Анонимный</span>
            </label>
          </div>

          {/* Emotion selection */}
          <div className="pt-4 border-t border-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-400">Настрій:</p>
            <div className="flex flex-wrap gap-3">
              <label className="px-4 py-2 bg-gray-700/40 border border-gray-600 rounded-lg text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-600/60 hover:border-gray-400 transition-all active:scale-95">
                <input
                  type="radio"
                  value="HP"
                  {...register('emotion')}
                  className="w-4 h-4 cursor-pointer accent-green-400"
                />
                <span className="text-lg">➕</span>
                <span className="text-gray-300">Позитив</span>
              </label>
              <label className="px-4 py-2 bg-gray-700/40 border border-gray-600 rounded-lg text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-600/60 hover:border-gray-400 transition-all active:scale-95">
                <input
                  type="radio"
                  value="AG"
                  {...register('emotion')}
                  className="w-4 h-4 cursor-pointer accent-red-400"
                />
                <span className="text-lg">➖</span>
                <span className="text-gray-300">Негатив</span>
              </label>
              <label className="px-4 py-2 bg-gray-700/40 border border-gray-600 rounded-lg text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-600/60 hover:border-gray-400 transition-all active:scale-95">
                <input
                  type="radio"
                  value="NT"
                  {...register('emotion')}
                  className="w-4 h-4 cursor-pointer accent-yellow-400"
                />
                <span className="text-lg">±</span>
                <span className="text-gray-300">Нейтраль</span>
              </label>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="pt-4 border-t border-gray-700">
            <label className="block mb-3 text-sm font-semibold text-gray-300">
              <img src="/icons/icons8-замок-50.png" alt="Lock" className="w-4 h-4 inline mr-1" /> CAPTCHA
            </label>
            <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
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
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !captchaSolution || !captchaQuestionId}
              className="flex-1 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSubmitting ? '⏳ Публикация...' : <><img src="/icons/icons8-документ-50.png" alt="Post" className="w-4 h-4 inline mr-1" /> Опубликовать</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
