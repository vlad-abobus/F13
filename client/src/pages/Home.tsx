import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import PostCard from '../components/PostCard'
import PostForm from '../components/PostForm'
import StatusDisplay from '../components/StatusDisplay'

type EmotionFilter = 'all' | 'HP' | 'AG' | 'NT'

export default function Home() {
  const [emotionFilter, setEmotionFilter] = useState<EmotionFilter>('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['posts', emotionFilter],
    queryFn: async () => {
      const params = emotionFilter === 'all' ? '' : `?emotion=${emotionFilter}`
      const response = await apiClient.get(`/posts${params}`)
      return response.data
    },
    refetchInterval: 30000, // 30 seconds
  })

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Emotion Filter Tabs (All / HP / AG / NT) */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 bg-black border border-white rounded-xl p-2">
          <button
            onClick={() => setEmotionFilter('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              emotionFilter === 'all'
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white/40 hover:border-white hover:text-gray-100'
            }`}
          >
            ВСЕ
          </button>
          <button
            onClick={() => setEmotionFilter('HP')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              emotionFilter === 'HP'
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white/40 hover:border-white hover:text-gray-100'
            }`}
          >
            HP 
          </button>
          <button
            onClick={() => setEmotionFilter('AG')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              emotionFilter === 'AG'
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white/40 hover:border-white hover:text-gray-100'
            }`}
          >
            AG 
          </button>
          <button
            onClick={() => setEmotionFilter('NT')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              emotionFilter === 'NT'
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white/40 hover:border-white hover:text-gray-100'
            }`}
          >
            NT 
          </button>
        </div>
      </div>

      <StatusDisplay />
      <PostForm onSuccess={() => refetch()} />

      {/* Posts List */}
      <div className="mt-8 space-y-6">
        {data?.posts?.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
        {(!data?.posts || data.posts.length === 0) && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-2xl p-12 text-center shadow-xl">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-xl text-gray-300 mb-2">Пока нет постов</div>
            <div className="text-sm text-gray-500">Создайте первый пост выше!</div>
          </div>
        )}
      </div>
    </div>
  )
}
