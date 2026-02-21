import { Link, useNavigate } from 'react-router-dom'

export default function Documentation() {
  const navigate = useNavigate()
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Документация
        </h1>
        <p className="text-gray-400">Що це та чого це</p>
      </div>

      <div className="space-y-6">
        {/* Getting Started */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🚀 Начало работы</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              <strong>F13</strong> — платформа для свободного общения. Без цензури, без ботов (ну почти), без помойки. Люди пишут посты, комментят, прикольничают. На русском языке.
            </p>
            <h3>Основные возможности:</h3>
            <ul>
              <li>Создание постов и обмен контентом</li>
              <li>Лайки и комментарии к постам</li>
              <li>Профили с биографией и историей</li>
              <li>Браузерные Flash-игры</li>
              <li>MikuGPT — интеллектуальный бот</li>
              <li>Галерея изображений</li>
              <li>GoonZone — раздел в разработке</li>
              <li>Полная локализация на русском языке</li>
            </ul>
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

        {/* Posts */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">📝 Посты</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              В F13 можешь создавать <strong>посты</strong>, <strong>комментить</strong>, ставить <strong>лайки</strong>, <strong>репостить</strong> чужие посты. Как в Твиттере, но не так нудно.
            </p>
            <h3>Возможности создания постов:</h3>
            <ul>
              <li>Текстовый контент до <strong>5000 символов</strong></li>
              <li>Прикрепление изображений (автоматическая загрузка через Cloudinary)</li>
              <li>Теги для категоризации и поиска</li>
              <li>NSFW маркировка для взрослого контента</li>
              <li>Возможность анонимной публикации</li>
            </ul>
            <p>
              Для защиты от спама и ботов при создании поста требуется пройти <strong>CAPTCHA</strong>.
            </p>
          </div>
        </section>

        {/* Profiles */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">👤 Профили</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              Каждый пользователь имеет свой профиль, который содержит:
            </p>
            <h3>Элементы профиля:</h3>
            <ul>
              <li><strong>Аватар</strong> и <strong>биография</strong> — личная информация о пользователе</li>
              <li><strong>Стена</strong> — место для сообщений от других пользователей</li>
              <li><strong>История постов</strong> — все посты, созданные пользователем</li>
              <li><strong>Бейджи и награды</strong> — значки достижений и статус</li>
              <li><strong>Верификация</strong> — официальная отметка для известных пользователей</li>
            </ul>
            <p>
              Вы можете <strong>подписываться</strong> на других пользователей и видеть их посты в персональной ленте.
            </p>
          </div>
        </section>

        {/* GoonZone */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">📊 GoonZone</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              GoonZone — в разработке 
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Инфорамация скрыта в соотвествии с законами УК РФ . Украины . Казахстана .</li>
              <li>-</li>
              <li>-</li>
            </ul>
            <p className="mt-4">
              -
            </p>
          </div>
        </section>

        {/* MikuGPT */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🤖 MikuGPT</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              <strong>MikuGPT</strong> — интеллектуальный <strong>AI-ассистент</strong>, разработанный специально для платформы.
            </p>
            <p>
              Мику может <strong>отвечать на вопросы</strong>, <strong>поддерживать разговор</strong> и <strong>выражать эмоции</strong> через правильный подбор ответов. Это делает общение с ботом более естественным и интересным.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🔒 Безопасность</h2>
          <div className="prose prose-invert max-w-none">
            <p>
              На F13 стараемся защищать людей от спама и ботов. CAPTCHA, IP-баны, модерация. Да, это скучно, но нужно.
            </p>
            <h3>Система защиты:</h3>
            <ul>
              <li><strong>CAPTCHA</strong> для всех важных действий (создание постов, голосование, комментарии)</li>
              <li><strong>JWT токены</strong> для безопасной аутентификации пользователей</li>
              <li><strong>Модерация контента</strong> администраторами платформы</li>
              <li><strong>Автоматическая защита</strong> от спама и ботов</li>
              <li><strong>IP-баны</strong> для блокировки вредоносных пользователей</li>
            </ul>
          </div>
        </section>

        {/* Support */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">💬 Поддержка</h2>
          <div className="prose prose-invert max-w-none">
            <p>
             Если у вас возникли проблемы или вопросы, вот как получить помощь:
            </p>
            <h3>Способы получить поддержку:</h3>
            <ul>
              <li><strong>Обратиться к администраторам</strong> через их профили на платформе</li>
              <li>Ознакомиться с <Link to="/rules" className="text-white hover:underline">Правилами</Link> платформы</li>
              <li>Прочитать дополнительную информацию в разделе <Link to="/about" className="text-white hover:underline">О нас</Link></li>
              <li>Отправить отчёт через <Link to="/feedback" className="text-white hover:underline">форму обратной связи</Link></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
