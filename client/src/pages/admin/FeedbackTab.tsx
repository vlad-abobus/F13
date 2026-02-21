import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query'

interface Feedback {
  id: string
  type: 'bug' | 'feature'
  title: string
  description: string
  email?: string
  created_at: string
}

interface FeedbackTabProps {
  feedbacks: Feedback[] | undefined
  deleteFeedbackMutation: UseMutationResult<any, unknown, string, unknown>
}

export default function FeedbackTab({
  feedbacks,
  deleteFeedbackMutation,
}: FeedbackTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'bug' | 'feature'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredFeedbacks = feedbacks?.filter(f => {
    if (filterType === 'all') return true
    return f.type === filterType
  }) || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU')
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 bg-gray-900/50 border border-gray-700 rounded-2xl p-4 backdrop-blur">
        {['all', 'bug', 'feature'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === type
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {type === 'all' && `📋 Все (${feedbacks?.length || 0})`}
            {type === 'bug' && `🐛 Баги (${feedbacks?.filter(f => f.type === 'bug').length || 0})`}
            {type === 'feature' && `💡 Идеи (${feedbacks?.filter(f => f.type === 'feature').length || 0})`}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((feedback, idx) => (
            <div
              key={feedback.id}
              className="bg-gradient-to-r from-gray-900/50 to-gray-900/30 border border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden transition-all"
            >
              {/* Header */}
              <div
                className="cursor-pointer flex items-center justify-between px-6 py-4 hover:bg-gray-800/30 transition"
                onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">
                    {feedback.type === 'bug' ? '🐛' : '💡'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{feedback.title}</div>
                    <div className="text-sm text-gray-400">
                      #{idx + 1} • {formatDate(feedback.created_at)}
                      {feedback.email && ` • ${feedback.email}`}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    feedback.type === 'bug'
                      ? 'bg-red-600/30 text-red-300'
                      : 'bg-blue-600/30 text-blue-300'
                  }`}>
                    {feedback.type === 'bug' ? 'БАГ' : 'ИДЕЯ'}
                  </span>
                </div>
                <div className={`text-2xl transition-transform ${expandedId === feedback.id ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === feedback.id && (
                <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 space-y-4">
                  {/* Description */}
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Описание</div>
                    <div className="text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                      {feedback.description}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">ID</div>
                      <code className="text-gray-300 bg-gray-900/50 px-2 py-1 rounded text-xs font-mono">
                        {feedback.id}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Email</div>
                      <div className="text-gray-300">
                        {feedback.email || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <button
                      disabled={true}
                      className="flex-1 px-4 py-2.5 bg-gray-600 text-gray-300 font-bold rounded-lg cursor-not-allowed opacity-50"
                    >
                      ✅ Отмечено
                    </button>
                    <button
                      onClick={() => deleteFeedbackMutation.mutate(feedback.id)}
                      disabled={deleteFeedbackMutation.isPending}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition"
                    >
                      {deleteFeedbackMutation.isPending ? '⏳' : '❌'} Удалить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-900/50 to-gray-900/30 border border-gray-700 rounded-2xl">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-300 font-medium">Нет отчетов</p>
            <p className="text-gray-500 text-sm mt-1">Все отчеты обработаны</p>
          </div>
        )}
      </div>
    </div>
  )
}
