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
  can_post: boolean
  warning_count: number
  admin_notes?: string
}

interface UsersTabProps {
  users: User[] | undefined
  banUserMutation: UseMutationResult<any, unknown, string, unknown>
  unbanUserMutation: UseMutationResult<any, unknown, string, unknown>
  muteUserMutation: UseMutationResult<any, unknown, { userId: string; hours: number }, unknown>
  unmuteUserMutation: UseMutationResult<any, unknown, string, unknown>
  makeAdminMutation: UseMutationResult<any, unknown, string, unknown>
  removeAdminMutation: UseMutationResult<any, unknown, string, unknown>
  warnUserMutation: UseMutationResult<any, unknown, { userId: string; reason: string }, unknown>
  kickUserMutation: UseMutationResult<any, unknown, { userId: string; hours: number; reason: string }, unknown>
  restrictPostingMutation: UseMutationResult<any, unknown, { userId: string; reason: string }, unknown>
  allowPostingMutation: UseMutationResult<any, unknown, string, unknown>
}

export default function UsersTab({
  users,
  banUserMutation,
  unbanUserMutation,
  muteUserMutation,
  unmuteUserMutation,
  makeAdminMutation,
  removeAdminMutation,
  warnUserMutation,
  kickUserMutation,
  restrictPostingMutation,
  allowPostingMutation,
}: UsersTabProps) {
  const [muteHours, setMuteHours] = useState(24)
  const [kickHours, setKickHours] = useState(24)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  return (
    <div className="border-2 border-white bg-black rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Управління користувачами</h2>
      <div className="space-y-3">
        {users?.map((u) => (
          <div key={u.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
            {/* User Header - Clickable */}
            <div
              className="cursor-pointer flex items-center justify-between hover:bg-gray-800 p-2 rounded"
              onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
            >
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
                    {u.status} {u.is_banned && '🔴'} {u.is_muted && '🔇'} {!u.can_post && '🚫'} {u.warning_count > 0 && `⚠️ ${u.warning_count}`}
                  </div>
                </div>
              </div>
              <div className="text-xl">{expandedUser === u.id ? '▼' : '▶'}</div>
            </div>

            {/* Expanded Actions */}
            {expandedUser === u.id && (
              <div className="mt-4 space-y-3 border-t border-gray-700 pt-3">
                {/* Row 1: Ban/Unban, Warn, Kick */}
                <div className="grid grid-cols-3 gap-2">
                  {u.is_banned ? (
                    <button
                      onClick={() => unbanUserMutation.mutate(u.id)}
                      className="px-3 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-600 text-sm"
                    >
                      ✅ Разбанить
                    </button>
                  ) : (
                    <button
                      onClick={() => banUserMutation.mutate(u.id)}
                      className="px-3 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-600 text-sm"
                    >
                      🚫 Забанить
                    </button>
                  )}
                  <button
                    onClick={() => warnUserMutation.mutate({ userId: u.id, reason: 'Warning' })}
                    className="px-3 py-2 bg-yellow-700 text-white font-bold rounded hover:bg-yellow-600 text-sm"
                  >
                    ⚠️ Warn ({u.warning_count})
                  </button>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={kickHours}
                      onChange={(e) => setKickHours(Number(e.target.value))}
                      className="w-12 px-2 py-2 bg-black border border-white text-white rounded text-sm"
                      placeholder="h"
                    />
                    <button
                      onClick={() => kickUserMutation.mutate({ userId: u.id, hours: kickHours, reason: 'Kick' })}
                      className="flex-1 px-3 py-2 bg-purple-700 text-white font-bold rounded hover:bg-purple-600 text-sm"
                    >
                      ⏱️ Kick
                    </button>
                  </div>
                </div>

                {/* Row 2: Mute/Unmute, Post Restriction */}
                <div className="grid grid-cols-2 gap-2">
                  {u.is_muted ? (
                    <button
                      onClick={() => unmuteUserMutation.mutate(u.id)}
                      className="px-3 py-2 bg-blue-700 text-white font-bold rounded hover:bg-blue-600 text-sm"
                    >
                      🔊 Размутить
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={muteHours}
                        onChange={(e) => setMuteHours(Number(e.target.value))}
                        className="w-12 px-2 py-2 bg-black border border-white text-white rounded text-sm"
                        placeholder="h"
                      />
                      <button
                        onClick={() => muteUserMutation.mutate({ userId: u.id, hours: muteHours })}
                        className="flex-1 px-3 py-2 bg-blue-700 text-white font-bold rounded hover:bg-blue-600 text-sm"
                      >
                        🔇 Мут
                      </button>
                    </div>
                  )}
                  {u.can_post ? (
                    <button
                      onClick={() => restrictPostingMutation.mutate({ userId: u.id, reason: 'Restriction' })}
                      className="px-3 py-2 bg-orange-700 text-white font-bold rounded hover:bg-orange-600 text-sm"
                    >
                      🚫 Запретить писать
                    </button>
                  ) : (
                    <button
                      onClick={() => allowPostingMutation.mutate(u.id)}
                      className="px-3 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-600 text-sm"
                    >
                      ✅ Разрешить писать
                    </button>
                  )}
                </div>

                {/* Row 3: Admin Management */}
                <div className="grid grid-cols-2 gap-2">
                  {u.status === 'admin' ? (
                    <button
                      onClick={() => removeAdminMutation.mutate(u.id)}
                      className="px-3 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-600 text-sm"
                    >
                      👑 Убрать админку
                    </button>
                  ) : (
                    <button
                      onClick={() => makeAdminMutation.mutate(u.id)}
                      className="px-3 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-600 text-sm"
                    >
                      👑 Выдать админку
                    </button>
                  )}
                  <button
                    className="px-3 py-2 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 text-sm"
                  >
                    📝 Ноты
                  </button>
                </div>

                {/* Admin Notes Display */}
                {u.admin_notes && (
                  <div className="p-2 bg-gray-800 rounded text-sm border-l-2 border-yellow-500">
                    <div className="font-bold text-yellow-400">Ноты:</div>
                    <div className="text-gray-300">{u.admin_notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {(!users || users.length === 0) && (
          <div className="text-center py-8 text-gray-400">Нет пользователей</div>
        )}
      </div>
    </div>
  )
}
