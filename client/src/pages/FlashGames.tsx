import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'

declare global {
  interface Window {
    RufflePlayer?: any
  }
}

export default function FlashGames() {
  const { isAuthenticated } = useAuthStore()
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [showFlashMessage, setShowFlashMessage] = useState(true)

  const { data: games, isLoading } = useQuery({
    queryKey: ['flash-games'],
    queryFn: async () => {
      const response = await apiClient.get('/flash/games')
      return response.data
    },
  })

  const playMutation = useMutation({
    mutationFn: async (gameId: string) => {
      if (isAuthenticated) {
        await apiClient.post(`/flash/games/${gameId}/play`)
      }
    },
  })

  useEffect(() => {
    // Load Ruffle if not already loaded
    if (window.RufflePlayer) {
      return
    }

    // Use absolute URL to backend to avoid proxy issues
    const script = document.createElement('script')
    script.src = 'http://localhost:5000/ruffle/ruffle.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onerror = (error) => {
      console.error('Failed to load Ruffle player:', error)
      console.error('Make sure the Flask backend is running on http://localhost:5000')
    }
    script.onload = () => {
      console.log('Ruffle player loaded successfully')
    }
    document.body.appendChild(script)

    return () => {
      // Don't remove script on unmount to keep Ruffle loaded
    }
  }, [])

  const loadGame = async (game: any) => {
    console.log('Loading game:', game)
    setSelectedGame(game.id)
    playMutation.mutate(game.id)
  }

  // Load game when selectedGame changes and container is ready
  useEffect(() => {
    if (!selectedGame) {
      return
    }

    const game = games?.find((g: any) => g.id === selectedGame)
    if (!game) {
      return
    }

    let checkRuffleInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null

    // Wait for container to be ready
    const waitForContainer = setInterval(() => {
      if (!gameContainerRef.current) {
        return
      }

      clearInterval(waitForContainer)

      // Clear container and show loading
      gameContainerRef.current.innerHTML = '<p class="text-center py-8">Завантаження гри...</p>'

      // Function to actually load the game
      const actuallyLoadGame = () => {
        if (!gameContainerRef.current || !game) return
        
        try {
          if (!window.RufflePlayer) {
            console.error('RufflePlayer is not available')
            if (gameContainerRef.current) {
              gameContainerRef.current.innerHTML = '<p class="text-red-400 text-center py-8">Ruffle плеєр не завантажений. Перезавантажте сторінку.</p>'
            }
            return
          }

          const ruffle = window.RufflePlayer.newest({
            // Configure Ruffle to prevent external requests
            allowScriptAccess: false,
            allowNetworking: 'none',
            // Disable external trackers
            wmode: 'direct'
          })
          const player = ruffle.createPlayer()
          
          // Clear container and append player
          gameContainerRef.current.innerHTML = ''
          gameContainerRef.current.appendChild(player)
          
          // Set container and player styles for proper display
          if (gameContainerRef.current) {
            gameContainerRef.current.style.width = '100%'
            gameContainerRef.current.style.height = '600px'
            gameContainerRef.current.style.minHeight = '600px'
            gameContainerRef.current.style.display = 'flex'
            gameContainerRef.current.style.alignItems = 'center'
            gameContainerRef.current.style.justifyContent = 'center'
          }
          
          // Set player styles
          player.style.width = '100%'
          player.style.height = '100%'
          player.style.maxWidth = '100%'
          player.style.maxHeight = '100%'
          
          // Convert relative URL to absolute backend URL
          const swfUrl = game.swf_url.startsWith('http') 
            ? game.swf_url 
            : `http://localhost:5000${game.swf_url}`
          
          console.log('Loading SWF from:', swfUrl)
          
          // First verify the file exists by trying to fetch it
          fetch(swfUrl, { method: 'HEAD' })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`File not found: ${response.status} ${response.statusText}`)
              }
              console.log('SWF file verified, loading into Ruffle...')
              
              // Load game with proper options (as shown in the example)
              return player.load({
                url: swfUrl,
                autoplay: 'on',
                backgroundColor: '#000000',
                allowScriptAccess: false,
                allowNetworking: 'none'
              })
            })
            .then(() => {
              console.log('Game loaded successfully into Ruffle')
            })
            .catch((error: any) => {
              console.error('Failed to load game:', error)
              
              if (gameContainerRef.current) {
                gameContainerRef.current.innerHTML = `
                  <div class="text-red-400 text-center py-8">
                    <p>Помилка завантаження гри: ${error.message || 'Невідома помилка'}</p>
                    <p class="text-sm mt-2">URL: ${swfUrl}</p>
                    <p class="text-sm">Перевірте що файл існує на сервері</p>
                  </div>
                `
              }
            })
        } catch (error) {
          console.error('Failed to create Ruffle player:', error)
          if (gameContainerRef.current) {
            gameContainerRef.current.innerHTML = '<p class="text-red-400 text-center py-8">Помилка створення плеєра. Перевірте консоль.</p>'
          }
        }
      }

      // If Ruffle is already loaded, load immediately
      if (window.RufflePlayer) {
        actuallyLoadGame()
        return
      }

      // Otherwise wait for Ruffle to load
      checkRuffleInterval = setInterval(() => {
        if (window.RufflePlayer) {
          if (checkRuffleInterval) clearInterval(checkRuffleInterval)
          actuallyLoadGame()
        }
      }, 100)

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        if (checkRuffleInterval) clearInterval(checkRuffleInterval)
        if (!window.RufflePlayer && gameContainerRef.current) {
          gameContainerRef.current.innerHTML = '<p class="text-red-400 text-center py-8">Не вдалося завантажити Ruffle плеєр. Перевірте що файли в ruffle/ доступні.</p>'
        }
      }, 10000)
    }, 50)

    // Cleanup
    return () => {
      clearInterval(waitForContainer)
      if (checkRuffleInterval) clearInterval(checkRuffleInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [selectedGame, games])

  if (isLoading) {
    return <div className="text-center py-8">Завантаження ігор...</div>
  }

  const selectedGameData = games?.find((g: any) => g.id === selectedGame)

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Flash Ігри</h1>

      {showFlashMessage && (
        <div className="border-2 border-yellow-500 bg-yellow-900 bg-opacity-30 p-6 mb-6 rounded">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2 text-yellow-400">
                ⚠️ Потрібно встановити Flash Player
              </h2>
              <p className="mb-3">
                Flash Player — це простий спосіб запускати ваш улюблений Flash-контент в інтернеті за допомогою Ruffle. Грайте у Flash-ігри онлайн в будь-який час.
              </p>
              <p className="mb-3">
                Ви шанувальник класичних флеш-ігор? Скучаєте по захоплюючих онлайн-іграх, які дарували вам радість на довгі години? Flash Player поверне вам гострі відчуття від флеш-ігор прямо у ваш браузер, де б ви не знаходились!
              </p>
              <p className="mb-3">
                Емулятор Flash виявляє флеш-контент на веб-сторінці (який відображається у спливаючому вікні — зелений кружок), а потім замінює стандартні помилки відтворення флеш-файлів «Плагін Adobe Flash Player більше не підтримується» кнопкою «Грати», натиснувши на яку ви можете відкрити гру.
              </p>
              <p className="mb-3">
                Емулятор Flash Player, який використовує движок емуляції Ruffle, дозволяє відтворювати флеш-контент у веб-браузерах. Це включає флеш-ігри, відео та різні файли, перетворені у сумісний формат для безшовної інтеграції з браузером.
              </p>
              <div className="space-y-2">
                <p className="font-semibold">Як працює розширення:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4 text-sm">
                  <li>Перейдіть на сайт з флеш-іграми</li>
                  <li>Натисніть на логотип розширення</li>
                  <li>Перезавантажте веб-сторінку з флеш-грою</li>
                  <li>Натисніть кнопку «Грати»</li>
                  <li>Насолоджуйтесь флеш-грою!</li>
                </ol>
                <p className="mt-4">
                  <a 
                    href="https://chromewebstore.google.com/detail/flash-player-flash-emulat/nohenbjhjbaleokplonjkbmackfkpcne" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Встановити Flash Player для Chrome
                  </a>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Увага: Flash Player — це допоміжний інструмент для користувачів Google Chrome. Flash Player офіційно не пов'язаний з продуктами Adobe Flash Player або будь-якими іншими продуктами Adobe. Розширення повністю безкоштовне та просте у використанні.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFlashMessage(false)}
              className="ml-4 text-white hover:text-gray-300 text-2xl"
              aria-label="Закрити"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список ігор зліва */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Список ігор</h2>
          <div className="space-y-3">
            {games?.map((game: any) => (
              <div
                key={game.id}
                className={`border-2 p-4 cursor-pointer transition-colors ${
                  selectedGame === game.id
                    ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                    : 'border-white hover:bg-gray-900'
                }`}
                onClick={() => loadGame(game)}
              >
                <h3 className="text-lg font-bold mb-1">{game.title}</h3>
                {game.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">{game.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Гра справа */}
        <div className="lg:col-span-2">
          {selectedGame ? (
            <div className="border-2 border-white p-4">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">{selectedGameData?.title || 'Гра'}</h2>
                {selectedGameData?.description && (
                  <p className="text-gray-400 mb-4">{selectedGameData.description}</p>
                )}
              </div>
              <div 
                ref={gameContainerRef} 
                className="w-full bg-black border-2 border-gray-700 rounded overflow-hidden" 
                style={{ 
                  minHeight: '600px', 
                  height: '600px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative'
                }}
              />
            </div>
          ) : (
            <div className="border-2 border-white p-8 text-center">
              <p className="text-gray-400 text-lg">
                Виберіть гру зі списку зліва, щоб почати грати
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
