import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function About() {
  const [showWarning, setShowWarning] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Test Version Warning */}
      {showWarning && (
        <div className="mb-8 bg-gradient-to-r from-orange-900 via-red-900 to-red-800 border-2 border-orange-500 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-4xl">⚠️</div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Внимание: Тестовая версия</h2>
                <p className="text-gray-100 mb-3 text-lg">
                  Ты на <strong>бета-версии</strong> F13. 
                  Возможны ошибки, нестабильность и неожиданные изменения. 
                  Если нашёл баг или что-то сломалось — напиши мне, братан
                </p>
                <Link 
                  to="/feedback"
                  className="inline-block px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200"
                >
                  Отправить отчёт о баге →
                </Link>
              </div>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-gray-200 hover:text-white font-bold text-2xl flex-shrink-0 transition"
              aria-label="Закрыть предупреждение"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          О нас
        </h1>
        <p className="text-gray-400">Що таке F13</p>
      </div>

      <div className="space-y-6">
        {/* Main Info */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">О F13</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              <strong>F13</strong> — это мешанина Твиттера и Двача. Свобода слова без цензури и ботов. Мемы, дискуссии, срачи - все в кучу.
            </p>
            <p>
              Наша цель — платформа, где люди говорят правду, а не то что нужно алгоритму. Никаких фильтров, только модерация от спама.
            </p>
          </div>
        </section>

        <div className="mt-4">
          <button
            onClick={() => navigate('/confirm-ban')}
            className="px-4 py-2 mt-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg"
          >
            🚫 Фу это же ИИ (подтвердить)
          </button>
        </div>

        {/* Features */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Че можем?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-white mb-2">Микроблог</h3>
              <p className="text-sm text-gray-400">Пишите короткие посты и делитесь мыслями</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-white mb-2">Общение</h3>
              <p className="text-sm text-gray-400">Комментируйте, ставьте лайки и взаимодействуйте с контентом</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-semibold text-white mb-2">Развлечения</h3>
              <p className="text-sm text-gray-400">Играйте в Flash-игры и общайтесь с AI</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl mb-2">🖼️</div>
              <h3 className="font-semibold text-white mb-2">Галерея</h3>
              <p className="text-sm text-gray-400">Просматривайте и делитесь изображениями</p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Дополнительная информация</h2>
          <div className="space-y-4">
            <Link
              to="/tech"
              className="block p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-white transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-gray-300 mb-1">
                    🔧 Техническая информация
                  </h3>
                  <p className="text-sm text-gray-400">
                    Узнайте о технологиях и архитектуре платформы
                  </p>
                </div>
                <span className="text-gray-400 group-hover:text-white">→</span>
              </div>
            </Link>

            <Link
              to="/donations"
              className="block p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-white transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-gray-300 mb-1">
                    Донаты в ООН
                  </h3>
                  <p className="text-sm text-gray-400">
                    хз по приколу
                  </p>
                </div>
                <span className="text-gray-400 group-hover:text-white">→</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Контакты</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              Если у вас есть вопросы или предложения, вы можете связаться с нами через:
            </p>
            <ul>
              <li>Профили администраторов на платформе</li>
              <li>Систему сообщений на стене</li>
              <li>Раздел <Link to="/rules" className="text-white hover:underline">Правила</Link> для общих вопросов</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
