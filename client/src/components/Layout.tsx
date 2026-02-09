import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import SafeImage from './SafeImage'
import OtherMenu from './OtherMenu'
import TestBanner from './TestBanner'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white">
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-white hover:text-gray-300 transition-colors"
          >
            F13
          </Link>

          <nav className="flex items-center gap-6 flex-wrap">
            <Link to="/goonzone" className="hover:text-gray-300 transition-colors font-medium text-lg">
              GoonZone
            </Link>

            {isAuthenticated ? (
              <Link 
                to={`/profile/${user?.username}`} 
                className="hover:text-gray-300 transition-colors font-medium text-lg"
              >
                Профиль
              </Link>
            ) : null}

            <Link to="/gallery" className="hover:text-gray-300 transition-colors font-medium text-lg">
              Галерея
            </Link>

            <Link to="/reports" className="hover:text-gray-300 transition-colors font-medium text-lg">
              Репорти
            </Link>

            <Link to="/miku" className="hover:text-gray-300 transition-colors font-medium text-lg">
              MikuGPT
            </Link>

            <Link to="/flash" className="hover:text-gray-300 transition-colors font-medium text-lg">
              Игры
            </Link>

            <OtherMenu />
          </nav>
        </div>
      </header>

      <TestBanner />

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
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors">О сайте</Link>
            <Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Документация</Link>
            <Link to="/rules" className="text-gray-400 hover:text-white transition-colors">Правила</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
