import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query'
import SafeImage from '../../components/SafeImage'

interface User {
  id: string
  username: string
  avatar_url?: string
  status: string
  is_banned: boolean
  is_muted: boolean
}

interface UsersTabProps {
  users: User[] | undefined
  banUserMutation: UseMutationResult<any, unknown, string, unknown>
  unbanUserMutation: UseMutationResult<any, unknown, string, unknown>
  muteUserMutation: UseMutationResult<any, unknown, { userId: string; hours: number }, unknown>
  unmuteUserMutation: UseMutationResult<any, unknown, string, unknown>
}

export default function UsersTab({
  users,
  banUserMutation,
  unbanUserMutation,
  muteUserMutation,
  unmuteUserMutation,
}: UsersTabProps) {
  const [muteHours, setMuteHours] = useState(24)

  return (
    <div className="border-2 border-white bg-black rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Пользователи</h2>
      <div className="space-y-3">
        {users?.map((u) => (
          <div key={u.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SafeImage
                  src={u.avatar_url}
                  alt={u.username}
                  className="w-12 h-12 rounded-full object-cover"
                  fallback={
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                      {u.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  }
                />
                <div>
                  <div className="font-bold text-lg">{u.username}</div>
                  <div className="text-sm text-gray-400">
                    {u.status} {u.is_banned && '| 🔴 Забанен'} {u.is_muted && '| 🔇 Замучен'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {u.is_banned ? (
                  <button
                    onClick={() => unbanUserMutation.mutate(u.id)}
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                  >
                    Разбанить
                  </button>
                ) : (
                  <button
                    onClick={() => banUserMutation.mutate(u.id)}
                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                  >
                    Забанить
                  </button>
                )}
                {u.is_muted ? (
                  <button
                    onClick={() => unmuteUserMutation.mutate(u.id)}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    Размутить
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={muteHours}
                      onChange={(e) => setMuteHours(Number(e.target.value))}
                      className="w-20 px-2 py-2 bg-black border-2 border-white text-white rounded-lg"
                      placeholder="Часы"
                    />
                    <button
                      onClick={() => muteUserMutation.mutate({ userId: u.id, hours: muteHours })}
                      className="px-4 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700"
                    >
                      Замутить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!users || users.length === 0) && (
          <div className="text-center py-8 text-gray-400">Нет пользователей</div>
        )}
      </div>
    </div>
  )
}
