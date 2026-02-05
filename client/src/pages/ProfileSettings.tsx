import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import SafeImage from '../components/SafeImage'

const profileSchema = z.object({
  bio: z.string().max(500).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfileSettings() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const { data: profileUser } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${username}`)
      return response.data
    },
    enabled: !!username,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: profileUser?.bio || '',
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // Проект теперь на одном языке (русский)
      return apiClient.put('/users/profile', { ...data, language: 'ru' })
    },
    onSuccess: (response) => {
      updateUser(response.data)
      navigate(`/profile/${username}`)
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      // Загрузка через Cloudinary endpoint
      const formData = new FormData()
      formData.append('file', file)
      // Не задаём Content-Type вручную — axios сделает это автоматически с правильным boundary
      const uploadResponse = await apiClient.post('/upload', formData)
      // Обновляем аватар пользователя из secure_url Cloudinary
      const avatarUrl = uploadResponse.data.secure_url
      return apiClient.put('/users/profile', { avatar_url: avatarUrl })
    },
    onSuccess: (response) => {
      updateUser(response.data)
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    await updateProfileMutation.mutateAsync(data)
    if (avatarFile) {
      await uploadAvatarMutation.mutateAsync(avatarFile)
    }
  }

  if (user?.username !== username && user?.status !== 'admin') {
    return <div className="text-center py-8">Доступ запрещён</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Настройки профиля</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block mb-2">Аватар</label>
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-24 h-24 rounded-full" />
            ) : (
              <SafeImage
                src={profileUser?.avatar_url}
                alt="Current avatar"
                className="w-24 h-24 rounded-full object-cover"
                fallback={
                  <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold">
                    {profileUser?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                }
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="px-4 py-2 bg-black border-2 border-white text-white"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2">О себе</label>
          <textarea
            {...register('bio')}
            className="w-full px-4 py-2 bg-black border-2 border-white text-white min-h-[100px]"
            placeholder="О себе..."
          />
          {errors.bio && <p className="text-red-500 mt-1">{errors.bio.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || updateProfileMutation.isPending}
          className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 disabled:opacity-50"
        >
          {isSubmitting || updateProfileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
