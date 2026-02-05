import { Link } from 'react-router-dom'

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Документация
        </h1>
        <p className="text-gray-400">Кто мы ? И че делаем ? </p>
      </div>

      <div className="space-y-6">
        {/* Getting Started */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🚀 Начало работы</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              F13 то же что Freedom13 . Незавасимый проект предоставящий свободу выражения и много еще чего епта и мы тут это делаем 
            </p>
            <div>
              <h3 className="font-semibold text-white mb-2">Основные возможности:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Всякие посты и тд</li>
                <li>Лайки и коменты</li>
                <li>Профили</li>
                <li>Браузерные игрушки</li>
                <li>MikuGPT </li>
                <li>Галерея картинок ( нфсв с мику)</li>
                <li>goonzone- в разработке</li>
                <li>тут тока русский ! </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">📝 Посты</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              делаешь посты, коменты, лайки, репосты, и тд:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Текст до 5000 символов</li>
              <li>Изображения (автозагрузка через Cloudinary)</li>
              <li>Теги для категоризации</li>
              <li>NSFW маркировка для взрослого контента</li>
              <li>Анонимные посты</li>
            </ul>
            <p className="mt-4">
              Для создания поста нужно пройти CAPTCHA. Чтобы не было спама и ботов.
            </p>
          </div>
        </section>

        {/* Profiles */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">👤 Профили</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              У каждого юзера есть профиль с:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Аватаром и биографией</li>
              <li>Стеной для сообщений</li>
              <li>Историей постов</li>
              <li>Бейджами и наградами</li>
              <li>Верификацией (для известных пользователей)</li>
            </ul>
            <p className="mt-4">
              Вы можете подписываться на других юзеров и получать их посты в ленте.
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
          <div className="space-y-4 text-gray-300">
            <p>
              MikuGPT — тот клевый бот который я сделал летом.
            </p>
            <p>
              Мику может отвечать на ваши вопросы, поддерживать разговор и выражать эмоции
              через емоции.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🔒 Безпека</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              Мы сделали крутую защиту от спамеров и плохишей (я был таким знаю за что говорю)
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>CAPTCHA для всех важных действий (создание постов, голосование)</li>
              <li>JWT токены для аутентификации</li>
              <li>Модерация контента администраторами</li>
              <li>Защита от спама и ботов</li>
            </ul>
          </div>
        </section>

        {/* API */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🔌 API</h2>
          <div className="space-y-4 text-gray-300">
            <p>
               Инфорамация скрыта в соотвествии с законами Росийской Федерации ,  Украины . Казахстана .
            </p>
            <p>
              Основные endpoints:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-gray-800 px-2 py-1 rounded">-</code></li>
              <li><code className="bg-gray-800 px-2 py-1 rounded">/api/users</code> — </li>
              <li><code className="bg-gray-800 px-2 py-1 rounded">/api/goonzone</code> — </li>
              <li><code className="bg-gray-800 px-2 py-1 rounded">/api/gallery</code> — </li>
            </ul>
          </div>
        </section>

        {/* Support */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">💬 Поддержка</h2>
          <div className="space-y-4 text-gray-300">
            <p>
             Если чота фигня пиши в лс админам или в группу в тг :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Обратиться к администраторам через профиль</li>
              <li>Посмотреть <Link to="/rules" className="text-white hover:underline">Правила</Link> платформы</li>
              <li>Перейти в <Link to="/about" className="text-white hover:underline">О нас</Link> для дополнительной информации</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
