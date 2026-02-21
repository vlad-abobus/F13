import { Link } from 'react-router-dom'

export default function SelfBan() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4 text-white">Опаё</h1>
      <p className="text-gray-300 mb-4">
       Похоже ты выбрал сеппуку . Судя по страннице тебя сильно тригерит любой продукт при созданни которого юзали ИИ . Ты идешь сейчас же ныть на <a href="https://wirnty.pythonanywhere.com" target="_blank" className="text-blue-400 hover:underline">wirnty.pythonanywhere.com</a> и там сидишь, будем тут развиваться и мб будет крутая платформа а не превращаться в помойку. Прощай!
      </p>
      <p className="text-gray-400">Если передумал, или это пошло по ошибке, напиши админам .</p>
      <div className="mt-6">
        <Link to="/" className="px-4 py-2 bg-gray-800 text-white rounded-lg">На главную</Link>
      </div>
    </div>
  )
}
