import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          О нас
        </h1>
        <p className="text-gray-400">Узнайте больше о платформе Freedom13</p>
      </div>

      <div className="space-y-6">
        {/* Main Info */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">О Freedom13</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Freedom13 — современная социальная платформа, созданная для объединения людей и идей.
              Мы стремимся дать пользователям свободное пространство для выражения мыслей, обмена контентом
              и общения.
            </p>
            <p>
              Наша миссия — создать открытую и безопасную платформу, где каждый может найти своё место
              и делиться тем, что ему интересно.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Наши возможности</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-white mb-2">Микроблог</h3>
              <p className="text-sm text-gray-400">Создавайте посты, делитесь мыслями и идеями</p>
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
                    💝 Пожертвования
                  </h3>
                  <p className="text-sm text-gray-400">
                    Поддержите развитие платформы
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
          <div className="space-y-4 text-gray-300">
            <p>
              Если у вас есть вопросы или предложения, вы можете связаться с нами через:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
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
