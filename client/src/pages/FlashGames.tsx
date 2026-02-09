import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import { logger } from '../utils/logger'

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

    // Use relative URL to support both development and production
    const script = document.createElement('script')
    script.src = `${window.location.origin}/ruffle/ruffle.js`
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onerror = (error) => {
      logger.error('Failed to load Ruffle player:', error)
    }
    script.onload = () => {
      logger.debug('Ruffle player loaded successfully')
    }
    document.body.appendChild(script)

    return () => {
      // Don't remove script on unmount to keep Ruffle loaded
    }
  }, [])

  const loadGame = async (game: any) => {
    logger.debug('Loading game:', game)
    setSelectedGame(game.id)
    playMutation.mutate(game.id)
  }
  // Filter out unwanted games (Tetris, Snake, Pac-Man) by checking keywords
  const filteredGames = games?.filter((game: any) => {
    const title = (game.title || '').toLowerCase()
    const forbidden = ['tetris', 'snake', 'pac-man', 'pacman', 'pac man', 'pac']
    return !forbidden.some((kw) => title.includes(kw))
  })

  // Load game when selectedGame changes and container is ready
  useEffect(() => {
    if (!selectedGame) {
      return
    }

    const game = filteredGames?.find((g: any) => g.id === selectedGame)
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
      gameContainerRef.current.innerHTML = '<p class="text-center py-8">Загрузка игры...</p>'

      // Function to load iframe game (HTML5/WebGL)
      const loadIframeGame = () => {
        if (!gameContainerRef.current || !game.iframe_url) return
        
        try {
          gameContainerRef.current.innerHTML = ''
          const iframe = document.createElement('iframe')
          iframe.src = game.iframe_url.startsWith('http') ? game.iframe_url : `https:${game.iframe_url}`
          iframe.style.width = '100%'
          iframe.style.height = '600px'
          iframe.style.border = 'none'
          iframe.style.borderRadius = '4px'
          iframe.allowFullscreen = true
          gameContainerRef.current.appendChild(iframe)
          logger.debug('HTML5/WebGL game loaded via iframe')
        } catch (error) {
          logger.error('Failed to load iframe game:', error)
          if (gameContainerRef.current) {
            gameContainerRef.current.innerHTML = '<p class="text-gray-300 text-center py-8">Ошибка загрузки игры. Проверьте консоль.</p>'
          }
        }
      }

      // Function to actually load Ruffle game (Flash/SWF)
      const actuallyLoadGame = () => {
        if (!gameContainerRef.current || !game) return
        
        try {
          if (!window.RufflePlayer) {
            logger.error('RufflePlayer is not available')
            if (gameContainerRef.current) {
              gameContainerRef.current.innerHTML = '<p class="text-gray-300 text-center py-8">Ruffle плеер не загружен. Перезагрузите страницу.</p>'
            }
            return
          }

          const ruffle = window.RufflePlayer.newest({
            allowScriptAccess: false,
            allowNetworking: 'none',
            wmode: 'direct'
          })
          const player = ruffle.createPlayer()
          
          gameContainerRef.current.innerHTML = ''
          gameContainerRef.current.appendChild(player)
          
          if (gameContainerRef.current) {
            gameContainerRef.current.style.width = '100%'
            gameContainerRef.current.style.height = '600px'
            gameContainerRef.current.style.minHeight = '600px'
            gameContainerRef.current.style.display = 'flex'
            gameContainerRef.current.style.alignItems = 'center'
            gameContainerRef.current.style.justifyContent = 'center'
          }
          
          player.style.width = '100%'
          player.style.height = '100%'
          player.style.maxWidth = '100%'
          player.style.maxHeight = '100%'
          
          const swfUrl = game.swf_url.startsWith('http') 
            ? game.swf_url 
            : `${window.location.origin}${game.swf_url}`
          
          logger.debug('Loading SWF from:', swfUrl)
          
          fetch(swfUrl, { method: 'HEAD' })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`File not found: ${response.status} ${response.statusText}`)
              }
              logger.debug('SWF file verified, loading into Ruffle...')
              
              return player.load({
                url: swfUrl,
                autoplay: 'on',
                backgroundColor: '#000000',
                allowScriptAccess: false,
                allowNetworking: 'none'
              })
            })
            .then(() => {
              logger.debug('Game loaded successfully into Ruffle')
            })
            .catch((error: any) => {
              logger.error('Failed to load game:', error)
              
              if (gameContainerRef.current) {
                gameContainerRef.current.innerHTML = `
                  <div class="text-gray-300 text-center py-8">
                    <p>Ошибка загрузки игры: ${error.message || 'Неизвестная ошибка'}</p>
                    <p class="text-sm mt-2">URL: ${swfUrl}</p>
                    <p class="text-sm">Проверьте, что файл существует на сервере</p>
                  </div>
                `
              }
            })
        } catch (error) {
          logger.error('Failed to create Ruffle player:', error)
          if (gameContainerRef.current) {
            gameContainerRef.current.innerHTML = '<p class="text-gray-300 text-center py-8">Ошибка создания плеера. Проверьте консоль.</p>'
          }
        }
      }

      // Determine game type and load accordingly
      if (game.iframe_url) {
        // Load as iframe/HTML5/WebGL game
        loadIframeGame()
      } else if (game.swf_url) {
        // Load as Ruffle/Flash game
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
            gameContainerRef.current.innerHTML = '<p class="text-gray-300 text-center py-8">Не удалось загрузить Ruffle плеер. Проверьте, что файлы в ruffle/ доступны.</p>'
          }
        }, 10000)
      } else {
        if (gameContainerRef.current) {
          gameContainerRef.current.innerHTML = '<p class="text-gray-300 text-center py-8">Ошибка: нет URL для игры</p>'
        }
      }
    }, 50)

    // Cleanup
    return () => {
      clearInterval(waitForContainer)
      if (checkRuffleInterval) clearInterval(checkRuffleInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [selectedGame, filteredGames])

  if (isLoading) {
    return <div className="text-center py-8">Загрузка игр...</div>
  }

  const selectedGameData = filteredGames?.find((g: any) => g.id === selectedGame)

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Flash игры</h1>

      {showFlashMessage && (
        <div className="border-2 border-gray-600 bg-gray-800 bg-opacity-30 p-6 mb-6 rounded">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2 text-gray-300">
                ⚠️ Flash-контент запускается через Ruffle
              </h2>
              <p className="mb-3">
                Здесь Flash-игры запускаются через Ruffle (эмулятор Flash). Просто выберите игру слева — она откроется справа.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mt-2">
                  Примечание: для работы игр должен быть доступен Ruffle по адресу <code>/ruffle/ruffle.js</code>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFlashMessage(false)}
              className="ml-4 text-white hover:text-gray-300 text-2xl"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список игр слева */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Список игр</h2>
          <div className="space-y-3">
            {filteredGames?.map((game: any) => (
              <div
                key={game.id}
                className={`border-2 p-4 cursor-pointer transition-colors ${
                  selectedGame === game.id
                    ? 'border-gray-600 bg-gray-800 bg-opacity-30'
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

        {/* Игра справа */}
        <div className="lg:col-span-2">
          {selectedGame ? (
            <div className="border-2 border-white p-4">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">{selectedGameData?.title || 'Игра'}</h2>
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
                Выберите игру из списка слева, чтобы начать играть
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

