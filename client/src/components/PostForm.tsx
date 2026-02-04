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
        setCaptchaError('Будь ласка, розв\'яжіть CAPTCHA')
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
        <p>Увійдіть, щоб створити пост</p>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-4 py-2 text-sm bg-white text-black font-bold hover:bg-gray-200"
        >
          📝 Створити пост
        </button>
      </div>
    )
  }

  return (
    <div className="border-2 border-white bg-black mb-6 rounded-xl overflow-hidden">
      <div 
        className="p-4 border-b-2 border-white bg-gradient-to-r from-gray-900 to-gray-800 cursor-pointer hover:from-gray-800 hover:to-gray-700 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">📝 Створити пост</h3>
          <span className="text-2xl">▲</span>
        </div>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        <div>
          <textarea
            {...register('content')}
            className="w-full px-4 py-3 bg-black border-2 border-white text-white min-h-[120px] text-lg focus:outline-none focus:border-gray-500 transition-colors resize-y"
            placeholder="Що у вас на думці?"
          />
          {errors.content && (
            <p className="text-red-400 mt-2 text-sm">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-300">
            📷 Додати зображення (необов'язково)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white file:mr-4 file:py-2 file:px-4 file:bg-white file:text-black file:border-0 file:cursor-pointer hover:file:bg-gray-200"
          />
          {imagePreview && (
            <div className="mt-4 border-2 border-white">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-h-64 object-contain" 
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t-2 border-white">
          <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors">
            <input 
              type="checkbox" 
              {...register('is_nsfw')}
              className="w-5 h-5 cursor-pointer"
            />
            <span className="text-sm">⚠️ NSFW</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors">
            <input 
              type="checkbox" 
              {...register('is_anonymous')}
              className="w-5 h-5 cursor-pointer"
            />
            <span className="text-sm">👤 Анонімний</span>
          </label>
        </div>

          {/* CAPTCHA */}
          <div className="pt-4 border-t-2 border-white">
            <label className="block mb-2 text-sm font-bold text-gray-300">
              🔒 CAPTCHA (захист від ботів)
            </label>
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

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !captchaSolution || !captchaQuestionId}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-white to-gray-200 text-black font-bold hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg rounded-lg shadow-lg"
            >
              {isSubmitting ? '⏳ Публікація...' : '📝 Опублікувати'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
