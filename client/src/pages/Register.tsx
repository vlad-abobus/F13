import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  captcha_token: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState<string>('')
  const [captchaChallenge, setCaptchaChallenge] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('')
      const { confirmPassword, ...registerData } = data
      const submitData = { 
        ...registerData, 
        captcha_token: captchaSolution,
        captcha_question_id: captchaChallenge
      }
      const response = await apiClient.post('/auth/register', submitData)
      setAuth(response.data.user, response.data.access_token, response.data.refresh_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
      setCaptchaSolution('') // Reset captcha on error
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Реєстрація</h1>

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
          <label className="block mb-2">Email</label>
          <input
            {...register('email')}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white"
            type="email"
          />
          {errors.email && (
            <p className="text-red-500 mt-1">{errors.email.message}</p>
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

        <div>
          <label className="block mb-2">Confirm Password</label>
          <input
            {...register('confirmPassword')}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white"
            type="password"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 mt-1">{errors.confirmPassword.message}</p>
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
          {isSubmitting ? 'Реєстрація...' : 'Зареєструватися'}
        </button>
      </form>
    </div>
  )
}
