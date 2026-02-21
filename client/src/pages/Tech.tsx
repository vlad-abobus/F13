import { useNavigate } from 'react-router-dom'

export default function Tech() {
  const navigate = useNavigate()
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Техническая информация
        </h1>
        <p className="text-gray-400">Технологии и архитектура платформы</p>
      </div>

      <div className="space-y-6">
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🔧 Як це зроблено</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              <strong>Backend:</strong> Python/Flask. БД - PostgreSQL или SQLite. Redis для кеша. JWT для авторизации.
            </p>
            <p>
              <strong>Frontend:</strong> React 18, TypeScript, Tailwind. Роутинг через React Router. Query для запросов.
            </p>
            <p>
              <strong>Безопасность:</strong> CAPTCHA для постов и лайков. Rate limiting от ботов. Content moderation. IP-баны.
            </p>
            <p>
              <strong>Деплой:</strong> Docker контейнеры. Nginx как reverse proxy. Для продакшена - полная цепочка.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/confirm-ban')}
              className="px-4 py-2 mt-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg"
            >
              🚫 Фу это же ИИ (подтвердить)
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
