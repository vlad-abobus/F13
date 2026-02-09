import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function OtherMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center justify-center shadow-lg"
      >
        ⋯
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-gray-900 border-2 border-white rounded-2xl shadow-xl min-w-[200px] z-50">
          <div className="p-2 space-y-1">
            {/* Main Routes */}
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              Главная
            </Link>

            <Link
              to="/documentation"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              Документация
            </Link>

            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              О сайте
            </Link>

            <Link
              to="/rules"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              Правила
            </Link>

            {/* Admin Links */}
            {isAuthenticated && user?.status === 'admin' && (
              <>
                <div className="border-t border-gray-700 my-1"></div>
                <Link
                  to="/miku-admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  Miku Админ
                </Link>

                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  Панель администратора
                </Link>
              </>
            )}

            {/* Auth Links */}
            <div className="border-t border-gray-700 my-1"></div>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
              >
                Выход
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
