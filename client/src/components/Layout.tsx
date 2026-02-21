import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import SafeImage from './SafeImage'
import OtherMenu from './OtherMenu'
import TestBanner from './TestBanner'
import EntranceWarning from './EntranceWarning'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function checkBan() {
      try {
        const res = await apiClient.get('/ip-ban-info')
        if (cancelled) return
        if (res.data?.banned) {
          navigate('/ip-ban')
        }
      } catch (e) {
        // ignore
      }
    }
    checkBan()
    return () => { cancelled = true }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white">
      <EntranceWarning />
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="hover:text-gray-300 transition-colors"
          >
            <SafeImage 
              src="/logo.png" 
              alt="Freedom13" 
              className="h-12 w-auto"
              loading="eager"
            />
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

            <Link to="/miku" className="hover:text-gray-300 transition-colors font-medium text-lg">
              MikuGPT
            </Link>

            <Link to="/flash" className="hover:text-gray-300 transition-colors font-medium text-lg">
              Игры
            </Link>

            <Link 
              to="/feedback" 
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-500 rounded-md transition-all text-sm text-red-300 hover:text-red-200 flex items-center gap-1"
              title="Сообщить о баге или предложить функцию"
            >
              🐛 Баг
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
          <p className="text-sm text-gray-400">Freedom13 © 2026</p>
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
