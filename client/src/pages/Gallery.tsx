import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SafeImage from '../components/SafeImage'

export default function Gallery() {
  const { isAuthenticated } = useAuthStore()
  const [category, setCategory] = useState<string>('')
  const [tag, setTag] = useState<string>('')
  const [showNsfw, setShowNsfw] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', category, tag, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (tag) params.append('tag', tag)
      params.append('page', page.toString())
      const response = await apiClient.get(`/gallery?${params.toString()}`)
      return response.data
    },
  })

  const { data: tags } = useQuery({
    queryKey: ['gallery-tags'],
    queryFn: async () => {
      const response = await apiClient.get('/gallery/tags')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Завантаження...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Галерея</h1>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Тег..."
            className="px-4 py-2 bg-black border-2 border-white text-white"
          />
          {isAuthenticated && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showNsfw}
                onChange={(e) => setShowNsfw(e.target.checked)}
              />
              Показати NSFW
            </label>
          )}
        </div>
      </div>

      <div className="columns-2 md:columns-4 gap-4">
        {data?.items
          ?.filter((item: any) => showNsfw || !item.is_nsfw)
          ?.map((item: any) => (
            <div key={item.id} className="mb-4 break-inside-avoid border-2 border-white">
              <SafeImage
                src={item.image_url}
                alt="Gallery item"
                className={`w-full ${item.is_nsfw && !showNsfw ? 'blur-sm' : ''}`}
              />
              {item.tags && item.tags.length > 0 && (
                <div className="p-2">
                  {item.tags.map((t: string, idx: number) => (
                    <span key={idx} className="text-xs text-gray-400 mr-2">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {data?.pagination && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.pagination.has_prev}
            className="px-4 py-2 border-2 border-white disabled:opacity-50"
          >
            Попередня
          </button>
          <span className="px-4 py-2">
            Страница {data.pagination.page} из {data.pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.pagination.has_next}
            className="px-4 py-2 border-2 border-white disabled:opacity-50"
          >
            Наступна
          </button>
        </div>
      )}
    </div>
  )
}
