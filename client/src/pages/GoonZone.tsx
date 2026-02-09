import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SimpleCaptcha from '../components/SimpleCaptcha'
import { format } from 'date-fns'

export default function GoonZone() {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [captchaState, setCaptchaState] = useState<{
    [pollId: string]: {
      solution: string | null
      questionId: string | null
      error: string | null
      show: boolean
    }
  }>({})

  // Получаем актуальные голосования и новости
  const { data: polls } = useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/polls')
      return response.data
    },
  })

  const { data: news } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/news')
      return response.data
    },
  })

  // Голосование по poll
  const voteMutation = useMutation({
    mutationFn: async ({ pollId, option }: { pollId: string; option: string }) => {
      const captcha = captchaState[pollId]
      if (!captcha?.solution || !captcha?.questionId) {
        throw new Error('CAPTCHA не пройдена')
      }
      await apiClient.post(`/goonzone/polls/${pollId}/vote`, {
        option,
        captcha_token: captcha.solution,
        captcha_question_id: captcha.questionId,
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['polls'] })
      setCaptchaState(prev => ({
        ...prev,
        [variables.pollId]: {
          solution: null,
          questionId: null,
          error: null,
          show: false,
        }
      }))
    },
    onError: (_error, variables) => {
      setCaptchaState(prev => ({
        ...prev,
        [variables.pollId]: {
          ...prev[variables.pollId],
          solution: null,
          questionId: null,
          error: 'Ошибка при голосовании. Проверьте CAPTCHA.',
          show: true,
        }
      }))
    },
  })

  // Обработка нажатия кнопки "Голосовать"
  const handleVote = (pollId: string, option: string) => {
    if (!isAuthenticated) {
      alert('Войдите, чтобы проголосовать')
      return
    }
    const captcha = captchaState[pollId]
    if (!captcha?.solution || !captcha?.questionId) {
      setCaptchaState(prev => ({
        ...prev,
        [pollId]: {
          ...prev[pollId],
          error: 'Пожалуйста, решите CAPTCHA',
          show: true,
          solution: null,
          questionId: null,
        }
      }))
      return
    }
    voteMutation.mutate({ pollId, option })
  }

  // Для поддержки разных комбинаций "Да/Нет" на русском/украинском
  const getVoteKeys = (poll: any) => {
    const options: string[] = poll?.options || []
    const yesKey = options.includes('Да')
      ? 'Да'
      : options.includes('Так')
        ? 'Так'
        : options[0] || 'Да'
    const noKey = options.includes('Нет')
      ? 'Нет'
      : options.includes('Ні')
        ? 'Ні'
        : options[1] || 'Нет'
    return { yesKey, noKey }
  }

  const getTotalVotes = (poll: any) => {
    let sum = 0
    Object.values(poll.votes || {}).forEach((v: any) => {
      sum += typeof v === 'number' ? v : 0
    })
    return sum
  }

  // Для отображения процентов
  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  // Чек: можно ли голосовать в данном poll
  const canVote = () => {
    return isAuthenticated && !voteMutation.isPending
  }

  // Есть ли результаты -- хотя бы 1 вариант набрал голос
  const hasResults = (poll: any) => getTotalVotes(poll) > 0

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          GoonZone
        </h1>
        <p className="text-gray-400">Голосования и новости</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Polls Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6 text-white">Голосования</h2>
          <div className="space-y-6">
            {polls?.length > 0 &&
              polls.map((poll: any) => {
                const { yesKey, noKey } = getVoteKeys(poll)
                const totalVotes = getTotalVotes(poll)
                const yesVotes = poll.votes?.[yesKey] || 0
                const noVotes = poll.votes?.[noKey] || 0
                const yesPercent = getPercentage(yesVotes, totalVotes)
                const noPercent = getPercentage(noVotes, totalVotes)
                const captcha = captchaState[poll.id] || { solution: null, questionId: null, error: null, show: false }
                const showCaptcha = captcha.show

                return (
                  <div key={poll.id} className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2 text-white">{poll.title}</h3>
                      {poll.description && (
                        <p className="text-gray-400 mb-4">{poll.description}</p>
                      )}
                      {poll.created_at && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(poll.created_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      )}
                    </div>

                    {/* Voting Options */}
                    <div className="space-y-3 mb-4">
                      <button
                        onClick={() => handleVote(poll.id, yesKey)}
                        disabled={!canVote()}
                        className="w-full text-left p-4 bg-gray-800/50 border border-gray-600 rounded-xl hover:bg-gray-700 hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white group-hover:text-gray-300">{yesKey === "Да" || yesKey === "Так" ? "✅ " + yesKey : yesKey}</span>
                          <span className="text-sm text-gray-400">{yesVotes} ({yesPercent}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-white h-full transition-all"
                            style={{ width: `${yesPercent}%` }}
                          />
                        </div>
                      </button>

                      <button
                        onClick={() => handleVote(poll.id, noKey)}
                        disabled={!canVote()}
                        className="w-full text-left p-4 bg-gray-800/50 border border-gray-600 rounded-xl hover:bg-gray-700 hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white group-hover:text-gray-300">{noKey === "Нет" || noKey === "Ні" ? "❌ " + noKey : noKey}</span>
                          <span className="text-sm text-gray-400">{noVotes} ({noPercent}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gray-400 h-full transition-all"
                            style={{ width: `${noPercent}%` }}
                          />
                        </div>
                      </button>
                      {/* Если есть другие варианты ответа */}
                      {poll.options &&
                        Array.isArray(poll.options) &&
                        (poll.options as string[])
                          .filter((opt: string) => !(opt === yesKey || opt === noKey))
                          .map((opt: string) => (
                            <button
                              key={opt}
                              onClick={() => handleVote(poll.id, opt)}
                              disabled={!canVote()}
                              className="w-full text-left p-4 bg-gray-800/50 border border-gray-600 rounded-xl hover:bg-gray-700 hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-white group-hover:text-gray-300">{opt}</span>
                                <span className="text-sm text-gray-400">{poll.votes?.[opt] || 0} ({getPercentage(poll.votes?.[opt] || 0, totalVotes)}%)</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gray-400 h-full transition-all"
                                  style={{ width: `${getPercentage(poll.votes?.[opt] || 0, totalVotes)}%` }}
                                />
                              </div>
                            </button>
                          ))}
                    </div>

                    {/* CAPTCHA Section */}
                    {showCaptcha && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <label className="block mb-3 text-sm font-semibold text-gray-300">
                          🔒 CAPTCHA (защита от ботов)
                        </label>
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                          <SimpleCaptcha
                            onSolution={(token, questionId) => {
                              setCaptchaState(prev => ({
                                ...prev,
                                [poll.id]: {
                                  ...prev[poll.id],
                                  solution: token,
                                  questionId,
                                  error: null,
                                  show: true,
                                }
                              }))
                            }}
                            onError={(error) => {
                              setCaptchaState(prev => ({
                                ...prev,
                                [poll.id]: {
                                  ...prev[poll.id],
                                  error,
                                  solution: null,
                                  questionId: null,
                                  show: true,
                                }
                              }))
                            }}
                          />
                          {captcha.error && (
                            <p className="text-gray-300 mt-2 text-sm">{captcha.error}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {!isAuthenticated && (
                      <p className="text-sm text-gray-500 text-center mt-4">
                        Войдите, чтобы проголосовать
                      </p>
                    )}

                    {/* Показываем результат голосования, если он есть */}
                    {hasResults(poll) && (
                      <div className="text-xs text-gray-400 text-center mt-3">
                        Всего голосов: {totalVotes}
                      </div>
                    )}
                  </div>
                )
              })
            }
            {(!polls || polls.length === 0) && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">📊</div>
                <div className="text-xl text-gray-400">Пока нет голосований</div>
              </div>
            )}
          </div>
        </div>

        {/* News Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">Информация скрыта в соответствии с законами УК РФ, Украины, Казахстана.</h2>
          <div className="space-y-4">
            {news?.map((item: any) => (
              <div key={item.id} className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-xl p-5 shadow-lg">
                {item.is_pinned && (
                  <span className="inline-block mb-2 text-gray-300 text-sm font-semibold">📌 Закреплено</span>
                )}
                <h3 className="font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.content}</p>
                {item.created_at && (
                  <p className="text-xs text-gray-500 mt-3">
                    {format(new Date(item.created_at), 'dd.MM.yyyy')}
                  </p>
                )}
              </div>
            ))}
            {(!news || news.length === 0) && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">📰</div>
                <div className="text-sm text-gray-400">Пока нет новостей</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
