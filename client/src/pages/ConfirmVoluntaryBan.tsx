import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import apiClient from '../api/client'

export default function ConfirmVoluntaryBan() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!confirm('Ты че серьезно?')) return
    try {
      setLoading(true)
      await apiClient.post('/voluntary-ban')
      navigate('/self-ban')
    } catch (e) {
      console.error(e)
      navigate('/self-ban')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4 text-white">🛑 Фу это же ИИ</h1>
      <div className="prose prose-invert max-w-none text-left mx-auto">
        <p>
         Окаюсь, если тебя сильно бесит любой продукт с ИИ, и ты хочешь только ручную работу, то F13 - не твоя платформа. Не держим никого насильно.
        </p>
        <p>
          Можешь глючить на <a href="https://wirnty.pythonanywhere.com" target="_blank" className="text-blue-400 hover:underline">wirnty.pythonanywhere.com</a> сколько хочешь. А мы будем развивать свое, не превращаться в помойку.
        </p>
        <p>
          Или если просто хочешь отдохнуть, тоже окей. Никто не обижается.
        </p>
      </div>


      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg"
        >
          {loading ? 'Забиваем...' : 'Да, забей мне бан'}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
        >
          не, я остаюсь
        </button>
      </div>
    </div>
  )
}
