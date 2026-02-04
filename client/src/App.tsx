import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { TranslationProvider } from './contexts/TranslationContext'
import { ToastContainer } from './utils/toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <BrowserRouter>
          <ToastContainer />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/miku" element={<MikuGPT />} />
              <Route path="/goonzone" element={<GoonZone />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/flash" element={<FlashGames />} />
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
          </Layout>
        </BrowserRouter>
      </TranslationProvider>
    </QueryClientProvider>
  )
}

export default App
