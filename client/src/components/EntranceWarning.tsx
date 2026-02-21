import { useState, useEffect } from 'react'

export default function EntranceWarning() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)

  useEffect(() => {
    // Check if already acknowledged in this session
    const sessionKey = 'f13_entrance_warning_acknowledged'
    const acknowledged = sessionStorage.getItem(sessionKey)
    
    if (acknowledged === '1') {
      setHasAcknowledged(true)
    } else {
      // Show warning on first load
      setIsVisible(true)
    }
  }, [])

  const handleAcknowledge = () => {
    sessionStorage.setItem('f13_entrance_warning_acknowledged', '1')
    setHasAcknowledged(true)
    setIsVisible(false)
  }

  if (!isVisible || hasAcknowledged) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-red-600 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6 border-b-2 border-red-600">
          <div className="flex items-center gap-4">
            <span className="text-5xl"></span>
            <div>
              <h1 className="text-3xl font-bold text-white">Кароче!</h1>
              <p className="text-red-200 text-sm mt-1">Информейшн</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6">
          <div className="space-y-4">
            <p className="text-lg text-gray-100 leading-relaxed">
              Ты зашел на <strong>тестовую версию</strong>  <strong>F13</strong>.
            </p>

            <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-red-300 flex items-center gap-2">
                <span>⚡</span> Важно знать:
              </p>
              <ul className="space-y-2 text-gray-300 ml-6">
                <li>• Сайт может быть <strong>нестабилен</strong> и содержать ошибки</li>
                <li>• Сайт был создан парнями из <strong>DeV13</strong> для <strong>LK_13</strong></li>
                <li>• Могут быть баги и непредсказуемое поведение лол</li>
                <li>• Все будем фиксить если вы раскажете</li>
                <li>• Наслаждайтесь</li>
              </ul>
            </div>

            <p className="text-gray-400 text-sm italic">
              Если ты обнаружил ошибачку, пожалуйста, <a href="/feedback" className="text-blue-400 hover:text-blue-300 underline">сообщи тута</a>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 px-8 py-6 border-t border-gray-700 flex gap-4 justify-end">
          <button
            onClick={handleAcknowledge}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition duration-200 shadow-lg"
          >
            Я понимаю ✓
          </button>
        </div>
      </div>
    </div>
  )
}
