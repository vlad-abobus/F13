import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LanguageSwitcher from './LanguageSwitcher'
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
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 bg-black border-b-2 border-white backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Freedom13
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/" className="hover:underline">Головна</Link>
            <Link to="/miku" className="hover:underline">MikuGPT</Link>
            <Link to="/goonzone" className="hover:underline">GoonZone</Link>
            <Link to="/gallery" className="hover:underline">Галерея</Link>
            <Link to="/flash" className="hover:underline">Ігри</Link>
            <Link to="/rules" className="hover:underline">Правила</Link>

            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <Link to={`/profile/${user?.username}`} className="hover:underline">
                  {user?.username}
                </Link>
                {user?.status === 'admin' && (
                  <Link to="/admin" className="hover:underline">Адмін</Link>
                )}
                <button onClick={handleLogout} className="hover:underline">
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Вхід</Link>
                <Link to="/register" className="hover:underline">Реєстрація</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t-2 border-white mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <SafeImage 
            src="/logo.png" 
            alt="Freedom13" 
            className="h-12 mx-auto mb-4" 
          />
          <p className="text-sm">Freedom13 © 2024</p>
        </div>
      </footer>
    </div>
  )
}
