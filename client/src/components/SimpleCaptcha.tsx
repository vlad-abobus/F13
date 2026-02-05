import { useState, useEffect } from 'react'
import apiClient from '../api/client'

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

  useEffect(() => {
    loadQuestion()
  }, [])

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
      <div className="my-4 p-4 border-2 border-red-500 bg-black">
        <div className="text-red-500 mb-2">{error}</div>
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
    <div className="my-4 p-4 border-2 border-white bg-black">
      <div className="mb-3">
        <div className="text-sm text-gray-400 mb-2">Капча</div>
        <div className="text-lg font-bold">{question.question}</div>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Введіть відповідь"
            className="flex-1 px-3 py-2 bg-black border-2 border-white text-white focus:outline-none focus:border-gray-400"
            autoComplete="off"
            disabled={isVerified}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                handleVerify(e as any)
              }
            }}
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerified}
            className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerified ? '✓ Перевірено' : 'Перевірити'}
          </button>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        {isVerified && (
          <div className="text-green-500 text-sm">✓ Капча пройдена успішно!</div>
        )}
        
        <button
          type="button"
          onClick={loadQuestion}
          className="text-sm text-gray-400 hover:text-white underline"
        >
          Оновити питання
        </button>
      </div>
    </div>
  )
}
