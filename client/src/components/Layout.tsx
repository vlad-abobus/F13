import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import SafeImage from './SafeImage'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white">
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-all">
            Freedom13
          </Link>

          <nav className="flex items-center gap-4 flex-wrap">
            <Link to="/" className="hover:text-gray-300 transition-colors font-medium">Главная</Link>
            <Link to="/miku" className="hover:text-gray-300 transition-colors font-medium">MikuGPT</Link>
            <Link to="/goonzone" className="hover:text-gray-300 transition-colors font-medium">GoonZone</Link>
            <Link to="/gallery" className="hover:text-gray-300 transition-colors font-medium">Галерея</Link>
            <Link to="/flash" className="hover:text-gray-300 transition-colors font-medium">Игры</Link>
            <Link to="/documentation" className="hover:text-gray-300 transition-colors font-medium">Документация</Link>
            <Link to="/about" className="hover:text-gray-300 transition-colors font-medium">О нас</Link>
            <Link to="/rules" className="hover:text-gray-300 transition-colors font-medium">Правила</Link>

            {isAuthenticated ? (
              <>
                <Link to={`/profile/${user?.username}`} className="hover:text-gray-300 transition-colors font-medium">
                  {user?.username}
                </Link>
                {user?.status === 'admin' && (
                  <Link to="/admin" className="hover:text-gray-300 transition-colors font-medium">Админ</Link>
                )}
                <button onClick={handleLogout} className="hover:text-gray-300 transition-colors font-medium">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300 transition-colors font-medium">Вход</Link>
                <Link to="/register" className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold">
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-gray-700 mt-auto py-8 bg-gray-900/50">
        <div className="container mx-auto px-4 text-center">
          <SafeImage 
            src="/logo.png" 
            alt="Freedom13" 
            className="h-12 mx-auto mb-4"
            loading="eager"
          />
          <p className="text-sm text-gray-400">Freedom13 © 2024</p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors">О нас</Link>
            <Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Документация</Link>
            <Link to="/rules" className="text-gray-400 hover:text-white transition-colors">Правила</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
