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
    return <div className="text-center py-8">Завантаження...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-2 border-white bg-gradient-to-r from-gray-900 to-black rounded-xl overflow-hidden">
          <button
            onClick={() => setFilter('new')}
            className={`flex-1 px-6 py-3 font-bold text-lg transition-colors ${
              filter === 'new'
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            🆕 Нові
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`flex-1 px-6 py-3 font-bold text-lg transition-colors ${
              filter === 'popular'
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            🔥 Популярні
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`flex-1 px-6 py-3 font-bold text-lg transition-colors ${
              filter === 'following'
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            👥 Підписки
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
          <div className="border-2 border-white p-12 text-center bg-black">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-xl text-gray-400">Поки що немає постів</div>
            <div className="text-sm text-gray-500 mt-2">Створіть перший пост вище!</div>
          </div>
        )}
      </div>
    </div>
  )
}
