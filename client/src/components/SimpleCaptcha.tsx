import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'
import { protectElement } from '../utils/copyProtection'

interface SimpleCaptchaProps {
  onSolution: (solution: string, questionId: string) => void
  onError?: (error: string) => void
}

interface Question {
  id: string
  question: string
  answer: string
  type: 'math' | 'logic' | 'text'
}

export default function SimpleCaptcha({ onSolution, onError }: SimpleCaptchaProps) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const questionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadQuestion()
  }, [])

  // Применяем защиту от копирования к вопросу капчи
  useEffect(() => {
    if (questionRef.current && question) {
      const cleanup = protectElement(questionRef.current, {
        blockCopy: true,
        blockSelect: true,
        blockContextMenu: true,
        blockDrag: true,
        blockInspect: false
      })
      return cleanup
    }
  }, [question])

  const loadQuestion = async () => {
    try {
      setIsLoading(true)
      setError('')
      setIsVerified(false)
      const response = await apiClient.get('/captcha/question')
      setQuestion(response.data)
      setUserAnswer('')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load question'
      setError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!question || !userAnswer.trim()) {
      setError('Будь ласка, введіть відповідь')
      return
    }

    try {
      // Verify answer with backend
      const response = await apiClient.post('/captcha/verify', {
        question_id: question.id,
        answer: userAnswer.trim()
      })

      if (response.data.success) {
        // Answer is correct, call onSolution
        setIsVerified(true)
        setError('')
        onSolution(userAnswer.trim().toLowerCase(), question.id)
      } else {
        setError('Невірна відповідь. Спробуйте ще раз.')
        setUserAnswer('')
        loadQuestion()
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Помилка перевірки'
      setError(errorMsg)
      if (err.response?.status === 400) {
        // Wrong answer, reload question
        setUserAnswer('')
        loadQuestion()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="my-4 p-4 border-2 border-white bg-black">
        <div className="text-center text-gray-400">Завантаження капчі...</div>
      </div>
    )
  }

  if (error && !question) {
    return (
      <div className="my-4 p-4 border-2 border-gray-600 bg-black">
        <div className="text-gray-300 mb-2">{error}</div>
        <button
          type="button"
          onClick={loadQuestion}
          className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black"
        >
          Спробувати ще раз
        </button>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="my-3">
      <div ref={questionRef} className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">🔒</span>
            <div>
              <div className="text-sm text-gray-400 mb-1">Капча</div>
              <div 
                className="text-base font-medium text-gray-200 line-clamp-2"
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
              >
                {question.question}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Відповідь..."
              className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600 rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
              autoComplete="off"
              disabled={isVerified}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  handleVerify(e as any)
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerified}
              className="px-3 py-2 bg-gray-700/60 hover:bg-gray-600 text-white text-sm font-medium rounded border border-gray-600 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isVerified ? '✓' : 'OK'}
            </button>
          </div>
          
          {error && (
            <div className="text-red-400 text-xs">{error}</div>
          )}
          
          {isVerified && (
            <div className="text-green-400 text-xs">✓ Верифіковано</div>
          )}
          
          <button
            type="button"
            onClick={loadQuestion}
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Нове питання
          </button>
        </div>
      </div>
    </div>
  )
}
