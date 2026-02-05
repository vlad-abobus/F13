import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import PostCard from '../components/PostCard'
import PostForm from '../components/PostForm'
import StatusDisplay from '../components/StatusDisplay'

type FilterType = 'new' | 'popular' | 'following'

export default function Home() {
  const [filter, setFilter] = useState<FilterType>('new')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['posts', filter],
    queryFn: async () => {
      const response = await apiClient.get(`/posts?filter=${filter}`)
      return response.data
    },
    refetchInterval: 30000, // 30 seconds
  })

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden p-1">
          <button
            onClick={() => setFilter('new')}
            className={`flex-1 px-6 py-3 font-semibold text-base transition-all rounded-lg ${
              filter === 'new'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            🆕 Новые
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`flex-1 px-6 py-3 font-semibold text-base transition-all rounded-lg ${
              filter === 'popular'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            🔥 Популярные
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`flex-1 px-6 py-3 font-semibold text-base transition-all rounded-lg ${
              filter === 'following'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            👥 Подписки
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
