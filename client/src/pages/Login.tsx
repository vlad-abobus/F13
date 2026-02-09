import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'
import { Button, Input } from '../components/ui'

const loginSchema = z.object({
  username: z.string().min(1, 'Требуется имя пользователя'),
  password: z.string().min(1, 'Требуется пароль'),
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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Вход
        </h1>
        <p className="text-gray-400">Добро пожаловать обратно!</p>
      </div>

      {error && (
        <div className="bg-gray-800 border border-gray-600 text-white p-4 mb-6 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('username')}
            label="Имя пользователя"
            type="text"
            placeholder="Имя пользователя"
            error={errors.username?.message}
          />

          <Input
            {...register('password')}
            label="Пароль"
            type="password"
            placeholder="Пароль"
            error={errors.password?.message}
          />

          <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
            <label className="block mb-3 text-sm font-semibold text-gray-300">
              🔒 CAPTCHA (защита от ботов)
            </label>
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
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!captchaSolution}
          >
            Войти
          </Button>
        </form>
      </div>
    </div>
  )
}
