import { useState } from 'react'

export default function Feedback() {
  const [formData, setFormData] = useState({
    type: 'bug',
    title: '',
    description: '',
    email: '',
    captcha: '',
    captchaAnswer: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha())

  function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Verify CAPTCHA
    if (formData.captcha.toUpperCase() !== captchaCode) {
      setError('Неправильная проверка капчи. Попробуйте ещё раз.')
      setCaptchaCode(generateCaptcha())
      setFormData(prev => ({ ...prev, captcha: '' }))
      setLoading(false)
      return
    }

    // Validate form
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Пожалуйста, заполните все обязательные поля.')
      setLoading(false)
      return
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Пожалуйста, введите корректный email.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
          email: formData.email || null,
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          type: 'bug',
          title: '',
          description: '',
          email: '',
          captcha: '',
          captchaAnswer: ''
        })
        setCaptchaCode(generateCaptcha())
      } else {
        setError('Ошибка при отправке. Попробуйте позже.')
      }
    } catch (err) {
      setError('Ошибка подключения. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Обратная связь
        </h1>
        <p className="text-gray-400">Сообщайте о багах и предлагайте новые функции</p>
      </div>

      {submitted && (
        <div className="mb-8 bg-green-900/30 border border-green-500 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">✓</span>
            <h2 className="text-xl font-bold text-green-400">Спасибо!</h2>
          </div>
          <p className="text-gray-200">
            Ваше сообщение успешно отправлено. Мы благодарны за помощь в улучшении платформы!
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            Отправить ещё
          </button>
        </div>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-8 shadow-xl space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Тип сообщения *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="bug"
                  checked={formData.type === 'bug'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-gray-300 group-hover:text-white transition">
                  🐛 Отчёт о баге
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="feature"
                  checked={formData.type === 'feature'}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-gray-300 group-hover:text-white transition">
                  💡 Предложение функции
                </span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Заголовок *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Краткое описание проблемы или идеи"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Описание *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Подробно опишите проблему или вашу идею..."
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition resize-none"
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Email (необязательно)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Укажите email, если хотите получить ответ
            </p>
          </div>

          {/* CAPTCHA */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <label className="block text-white font-semibold mb-3">
              Проверка капчи *
            </label>
            <div className="mb-4">
              <div className="bg-gray-600 px-4 py-3 rounded-lg text-center font-mono text-2xl tracking-widest text-white border-2 border-gray-500 mb-3 select-none">
                {captchaCode}
              </div>
              <button
                type="button"
                onClick={() => setCaptchaCode(generateCaptcha())}
                className="w-full px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition mb-3"
              >
                🔄 Другой код
              </button>
              <input
                type="text"
                name="captcha"
                value={formData.captcha}
                onChange={handleChange}
                placeholder="Введите код"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition uppercase"
                maxLength={6}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition duration-200 shadow-lg"
          >
            {loading ? 'Отправляется...' : 'Отправить сообщение'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            * - обязательные поля
          </p>
        </form>
      )}
    </div>
  )
}
