export default function Donations() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Пожертвования
        </h1>
        <p className="text-gray-400">Поддержите развитие и помощь через ООН</p>
      </div>

      <div className="space-y-6">
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Сделайте пожертвование Организации Объединённых Наций
              </h2>
              <p className="text-gray-300 mb-6">
                Ваше пожертвование поддерживает важные инициативы ООН по всему миру.
              </p>
            </div>
            <a
              href="https://www.un.org/ru/about-us/how-to-donate-to-the-un-system"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              Перейти к пожертвованиям ООН →
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
