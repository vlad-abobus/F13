import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'
import { Button, Input } from '../components/ui'

const registerSchema = z.object({
  username: z.string().min(3, 'Имя пользователя должно быть не менее 3 символов'),
  email: z.string().email('Неверный адрес электронной почты'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  confirmPassword: z.string(),
  captcha_token: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Регистрация
        </h1>
        <p className="text-gray-400">Создайте свой аккаунт</p>
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
            {...register('email')}
            label="Email"
            type="email"
            placeholder="Email"
            error={errors.email?.message}
          />

          <Input
            {...register('password')}
            label="Пароль"
            type="password"
            placeholder="Пароль"
            error={errors.password?.message}
          />

          <Input
            {...register('confirmPassword')}
            label="Подтвердите пароль"
            type="password"
            placeholder="Подтвердите пароль"
            error={errors.confirmPassword?.message}
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
            Зарегистрироваться
          </Button>
        </form>
      </div>
    </div>
  )
}
