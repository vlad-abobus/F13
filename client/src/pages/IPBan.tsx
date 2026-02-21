import { useEffect, useState } from 'react'
import apiClient from '../api/client'

export default function IPBan() {
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBan() {
      try {
        const res = await apiClient.get('/ip-ban-info')
        setReason(res.data.reason || null)
      } catch (e) {
        setReason(null)
      }
    }
    fetchBan()
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4 text-white">🚫 Братан, ты поймал бан</h1>
      <div className="prose prose-invert max-w-none text-left mx-auto">
        <p>
          Твой IP в чёрном списке. Это сделали админы, не просто так.
        </p>
        {reason ? (
          <p className="text-lg font-semibold text-red-400 my-4">
            Причина: <span className="text-gray-200">{reason}</span>
          </p>
        ) : (
          <p className="text-gray-400 my-4">Причина не указана (но ты точно знаешь почему).</p>
        )}
        <p>
          Если думаешь что это ошибка или хочешь развану — напиши админам. Может быть они тебя послушают.
        </p>
      </div>
    </div>
  )
}
