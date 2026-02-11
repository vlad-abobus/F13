export default function Tech() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Техническая информация
        </h1>
        <p className="text-gray-400">Технологии и архитектура платформы чотам </p>
      </div>

      <div className="space-y-6">
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Frontend</h2>
          <p className="text-gray-300">
            React, TypeScript, Tailwind CSS. Современный, отзывчивый интерфейс с оптимальной производительностью и UX.
          </p>
        </section>

        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Backend</h2>
          <p className="text-gray-300">
            Node.js, Express, REST API. Масштабируемая архитектура с оптимизированной обработкой запросов.
          </p>
        </section>

        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">База данных</h2>
          <p className="text-gray-300">
            PostgreSQL. Надежное хранилище данных с поддержкой сложных запросов и транзакций.
          </p>
        </section>

        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">DevOps</h2>
          <p className="text-gray-300">
            Docker, CI/CD, GitHub Actions. Автоматизированное развертывание и мониторинг приложения.
          </p>
        </section>
      </div>
    </div>
  )
}
