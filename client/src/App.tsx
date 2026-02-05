import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ProfileSettings from './pages/ProfileSettings'
import MikuGPT from './pages/MikuGPT'
import GoonZone from './pages/GoonZone'
import Gallery from './pages/Gallery'
import FlashGames from './pages/FlashGames'
import Admin from './pages/Admin'
import Rules from './pages/Rules'
import Documentation from './pages/Documentation'
import About from './pages/About'
import Tech from './pages/Tech'
import Donations from './pages/Donations'
import { ToastContainer } from './utils/toast'

// Loading fallback component for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
      <p className="text-gray-400">Загрузка...</p>
    </div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastContainer />
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/miku" element={<MikuGPT />} />
                <Route path="/goonzone" element={<GoonZone />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/flash" element={<FlashGames />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/about" element={<About />} />
                <Route path="/tech" element={<Tech />} />
                <Route path="/donations" element={<Donations />} />
                <Route
                  path="/profile/:username"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:username/settings"
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
