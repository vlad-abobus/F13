import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import CollageGallery from '../components/CollageGallery'
import GalleryUploadModal from '../components/GalleryUploadModal'

export default function Gallery() {
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [category] = useState<string>('')
  const [tagInput, setTagInput] = useState<string>('') // Temp input value
  const [tag, setTag] = useState<string>('') // Query parameter
  const [showNsfw, setShowNsfw] = useState(false)
  const [page, setPage] = useState(1)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Debounce tag input to only query after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setTag(tagInput)
      setPage(1) // Reset to page 1 when tag changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [tagInput])

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

  if (isLoading) {
    return <div className="text-center py-8">Завантаження...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Галерея</h1>
        {isAuthenticated && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Додати до галереї
          </button>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
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

      <CollageGallery 
        items={data?.items || []} 
        showNsfw={showNsfw}
      />

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

      <GalleryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['gallery'] })}
      />
    </div>
  )
}
