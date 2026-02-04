import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  captcha_token: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState<string>('')
  const [captchaChallenge, setCaptchaChallenge] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      const submitData = { 
        ...data, 
        captcha_token: captchaSolution,
        captcha_question_id: captchaChallenge
      }
      const response = await apiClient.post('/auth/login', submitData)
      setAuth(response.data.user, response.data.access_token, response.data.refresh_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
      setCaptchaSolution('') // Reset captcha on error
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Вхід</h1>

      {error && (
        <div className="bg-red-900 text-white p-4 mb-4 border-2 border-white">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-2">Username</label>
          <input
            {...register('username')}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white"
            type="text"
          />
          {errors.username && (
            <p className="text-red-500 mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2">Password</label>
          <input
            {...register('password')}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white"
            type="password"
          />
          {errors.password && (
            <p className="text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <SimpleCaptcha
          onSolution={(solution, questionId) => {
            setCaptchaChallenge(questionId)
            setCaptchaSolution(solution)
          }}
          onError={(error) => {
            setError(error)
            setCaptchaSolution('')
          }}
        />

        <button
          type="submit"
          disabled={isSubmitting || !captchaSolution}
          className="w-full px-4 py-2 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
        >
          {isSubmitting ? 'Вхід...' : 'Увійти'}
        </button>
      </form>
    </div>
  )
}
