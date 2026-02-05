import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from './SimpleCaptcha'

const postSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  tags: z.array(z.string()).optional(),
  is_nsfw: z.boolean().default(false),
  is_anonymous: z.boolean().default(false),
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
    
    // Check if we have a token before making the request
    if (!authState.accessToken && !authState.refreshToken) {
      console.error('No authentication token available. Please log in again.')
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return
    }
    
    try {
      let imageUrl = null

      if (imageFile) {
        // Завантаження через Cloudinary endpoint
        const formData = new FormData()
        formData.append('file', imageFile)
        // Не встановлюємо Content-Type вручну - axios зробить це автоматично з правильним boundary
        const uploadResponse = await apiClient.post('/upload', formData)
        // Використовуємо secure_url з Cloudinary
        imageUrl = uploadResponse.data.secure_url
      }

      if (!captchaSolution || !captchaQuestionId) {
        setCaptchaError('Пожалуйста, решите CAPTCHA')
        return
      }

      await apiClient.post('/posts/', {
        ...data,
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
      console.error('Failed to create post:', err)
      // If it's a 401 error and we don't have a refresh token, redirect to login
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
          <span className="text-xl">✍️</span>
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
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 text-white min-h-[140px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y rounded-xl placeholder:text-gray-500"
              placeholder="Что у вас на уме?"
            />
            {errors.content && (
              <p className="text-red-400 mt-2 text-sm">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-300 font-medium">
              Изображение (необязательно)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-xl file:mr-4 file:py-2 file:px-4 file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:cursor-pointer hover:file:bg-blue-700 transition-colors"
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
                className="w-4 h-4 cursor-pointer accent-red-500"
              />
              <span className="text-sm text-gray-300 group-hover:text-white">NSFW</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors group">
              <input 
                type="checkbox" 
                {...register('is_anonymous')}
                className="w-4 h-4 cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-300 group-hover:text-white">Анонімний</span>
            </label>
          </div>

          {/* CAPTCHA */}
          <div className="pt-4 border-t border-gray-700">
            <label className="block mb-3 text-sm font-semibold text-gray-300">
              🔒 CAPTCHA (защита от ботов)
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
                <p className="text-red-400 mt-2 text-sm">{captchaError}</p>
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
              {isSubmitting ? '⏳ Публикация...' : '📝 Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
