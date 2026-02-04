import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function HtmlPageEditor() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedPage, setSelectedPage] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    language: 'ru',
    is_active: true,
  })

  const { data: pages } = useQuery({
    queryKey: ['html-pages'],
    queryFn: async () => {
      const response = await apiClient.get('/pages/list')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/pages', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['html-pages'] })
      setIsCreating(false)
      setFormData({ slug: '', title: '', content: '', language: 'ru', is_active: true })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/pages/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['html-pages'] })
      setSelectedPage(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pages/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['html-pages'] })
      setSelectedPage(null)
    },
  })

  const handleEdit = (page: any) => {
    setSelectedPage(page)
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      language: page.language,
      is_active: page.is_active,
    })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setSelectedPage(null)
    setFormData({
      slug: '',
      title: '',
      content: '',
      language: 'ru',
      is_active: true,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPage) {
      updateMutation.mutate({ id: selectedPage.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  if (user?.status !== 'admin') {
    return <div className="text-center py-8">Доступ заборонено</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Редактор HTML сторінок</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black"
        >
          Створити сторінку
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-2xl font-bold mb-4">Список сторінок</h2>
          <div className="space-y-2">
            {pages?.map((page: any) => (
              <div
                key={page.id}
                className={`border-2 border-white p-3 cursor-pointer hover:bg-white hover:text-black ${
                  selectedPage?.id === page.id ? 'bg-white text-black' : ''
                }`}
                onClick={() => handleEdit(page)}
              >
                <div className="font-bold">{page.title}</div>
                <div className="text-sm text-gray-400">{page.slug} ({page.language})</div>
                <div className="text-xs">
                  {page.is_active ? '✅ Активна' : '❌ Неактивна'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {(selectedPage || isCreating) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white"
                  required
                  disabled={!!selectedPage}
                />
              </div>

              <div>
                <label className="block mb-2">Заголовок</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Мова</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white"
                  disabled={!!selectedPage}
                >
                  <option value="ru">Русский</option>
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                  <option value="kz">Қазақ</option>
                </select>
              </div>

              <div>
                <label className="block mb-2">HTML Контент</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white font-mono"
                  rows={15}
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Активна
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedPage ? 'Оновити' : 'Створити'}
                </button>
                {selectedPage && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(selectedPage.id)}
                    className="px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    disabled={deleteMutation.isPending}
                  >
                    Видалити
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPage(null)
                    setIsCreating(false)
                  }}
                  className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black"
                >
                  Скасувати
                </button>
              </div>
            </form>
          )}

          {!selectedPage && !isCreating && (
            <div className="text-center py-8 text-gray-400">
              Виберіть сторінку для редагування або створіть нову
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
