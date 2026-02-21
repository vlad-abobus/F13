import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query'
import SafeImage from '../../components/SafeImage'
import UserLabel from '../../components/UserLabel'

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
  premium_tag?: string
}

interface UsersTabProps {
  users: User[] | undefined
  banUserMutation: UseMutationResult<any, unknown, any, unknown>
  unbanUserMutation: UseMutationResult<any, unknown, string, unknown>
  muteUserMutation: UseMutationResult<any, unknown, { userId: string; hours: number; reason?: string }, unknown>
  unmuteUserMutation: UseMutationResult<any, unknown, string, unknown>
  makeAdminMutation: UseMutationResult<any, unknown, string, unknown>
  removeAdminMutation: UseMutationResult<any, unknown, string, unknown>
  warnUserMutation: UseMutationResult<any, unknown, { userId: string; reason: string }, unknown>
  kickUserMutation: UseMutationResult<any, unknown, { userId: string; hours: number; reason: string }, unknown>
  restrictPostingMutation: UseMutationResult<any, unknown, { userId: string; reason?: string }, unknown>
  allowPostingMutation: UseMutationResult<any, unknown, string, unknown>
  setPremiumMutation: UseMutationResult<any, unknown, { userId: string; tag: string | null }, unknown>
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
  setPremiumMutation,
}: UsersTabProps) {
  const [muteHours, setMuteHours] = useState(24)
  const [kickHours, setKickHours] = useState(24)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'banned' | 'muted' | 'admin'>('all')
  const [premiumTag, setPremiumTag] = useState('')

  const filteredUsers = users?.filter(u => {
    if (filterStatus === 'banned') return u.is_banned
    if (filterStatus === 'muted') return u.is_muted
    if (filterStatus === 'admin') return u.status === 'admin'
    return true
  }) || []

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 bg-gray-900/50 border border-gray-700 rounded-2xl p-4 backdrop-blur">
        {['all', 'banned', 'muted', 'admin'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === status
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {status === 'all' && `📋 Усі (${users?.length || 0})`}
            {status === 'banned' && `🔴 Забоненые (${users?.filter(u => u.is_banned).length || 0})`}
            {status === 'muted' && `🔇 Примиренные (${users?.filter(u => u.is_muted).length || 0})`}
            {status === 'admin' && `👑 Админусыы (${users?.filter(u => u.status === 'admin').length || 0})`}
          </button>
        ))}
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <div 
              key={u.id} 
              className="bg-gradient-to-r from-gray-900/50 to-gray-900/30 border border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden transition-all"
            >
              {/* User Header - Clickable */}
              <div
                className="cursor-pointer flex items-center justify-between px-6 py-4 hover:bg-gray-800/30 transition"
                onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <SafeImage
                    src={u.avatar_url}
                    alt={u.username}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                    fallback={
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white text-lg">
                        {u.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    }
                  />
                  <div className="flex-1">
                    <UserLabel user={u} />
                    <div className="text-sm text-gray-400 mt-1 flex gap-2 flex-wrap">
                      {u.is_banned && <span className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full text-xs">🔴 Забанен</span>}
                      {u.is_muted && <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full text-xs">🔇 Приглушен</span>}
                      {!u.can_post && <span className="bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded-full text-xs">🚫 Без постов</span>}
                      {u.status === 'admin' && <span className="bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full text-xs">👑 Админ</span>}
                      {u.premium_tag && <span className="bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded-full text-xs">💎 {u.premium_tag}</span>}
                      {u.warning_count > 0 && <span className="bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded-full text-xs">⚠️ {u.warning_count}</span>}
                    </div>
                  </div>
                </div>
                <div className={`text-2xl transition-transform ${expandedUser === u.id ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>

              {/* Expanded Actions */}
              {expandedUser === u.id && (
                <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 space-y-4">
                  {/* Row 1: Ban/Unban Section */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase">Статус бану</div>
                    <div className="grid grid-cols-2 gap-2">
                      {u.is_banned ? (
                        <button
                          onClick={() => unbanUserMutation.mutate(u.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          ✅ Розбанити
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt('Причина бана (опционально):', '')
                            if (reason === null) return
                            banUserMutation.mutate({ userId: u.id, reason })
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition"
                        >
                          🚫 Забанити
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const reason = prompt('Причина предупреждения:', 'Нарушение правил')
                          if (reason === null) return
                          warnUserMutation.mutate({ userId: u.id, reason })
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-lg transition"
                      >
                        ⚠️ Попередити ({u.warning_count})
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Mute/Silence Section */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase">Контроль чату</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {u.is_muted ? (
                        <button
                          onClick={() => unmuteUserMutation.mutate(u.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          🔊 Розмутити
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={muteHours}
                            onChange={(e) => setMuteHours(Number(e.target.value))}
                            min="1"
                            className="w-20 px-3 py-2.5 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:border-blue-500 outline-none"
                            placeholder="год"
                          />
                          <button
                            onClick={() => {
                              const reason = prompt('Причина мьюта (опционально):', '')
                              if (reason === null) return
                              muteUserMutation.mutate({ userId: u.id, hours: muteHours, reason })
                            }}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg transition"
                          >
                            🔇 Мютити
                          </button>
                        </div>
                      )}
                      {u.can_post ? (
                          <button
                            onClick={() => {
                              const reason = prompt('Причина ограничения постов (опционально):', '')
                              if (reason === null) return
                              restrictPostingMutation.mutate({ userId: u.id, reason })
                            }}
                          className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-lg transition"
                        >
                          🚫 Заборонити пости
                        </button>
                      ) : (
                        <button
                          onClick={() => allowPostingMutation.mutate(u.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          ✅ Дозволити пости
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Kick/Admin Section */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase">Управління</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={kickHours}
                          onChange={(e) => setKickHours(Number(e.target.value))}
                          min="1"
                          className="w-20 px-3 py-2.5 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:border-blue-500 outline-none"
                          placeholder="год"
                        />
                        <button
                          onClick={() => {
                            const reason = prompt('Причина кика (опционально):', '')
                            if (reason === null) return
                            kickUserMutation.mutate({ userId: u.id, hours: kickHours, reason })
                          }}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition"
                        >
                          ⏱️ Кік
                        </button>
                      </div>
                      {u.status === 'admin' ? (
                        <button
                          onClick={() => removeAdminMutation.mutate(u.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition"
                        >
                          👑 Забрати адміна
                        </button>
                      ) : (
                        <button
                          onClick={() => makeAdminMutation.mutate(u.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          👑 Видати адміна
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Premium Section */}
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <div className="text-xs font-semibold text-gray-400 uppercase">Премиум статус</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={premiumTag}
                        onChange={(e) => setPremiumTag(e.target.value.toUpperCase().slice(0, 3))}
                        maxLength={3}
                        className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:border-yellow-500 outline-none placeholder-gray-500"
                        placeholder="Тег (3 буквы)"
                      />
                      {u.premium_tag ? (
                        <button
                          onClick={() => setPremiumMutation.mutate({ userId: u.id, tag: null })}
                          disabled={setPremiumMutation.isPending}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition"
                        >
                          {setPremiumMutation.isPending ? '⏳' : '❌'} Убрать премиум
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (premiumTag.length === 3) {
                              setPremiumMutation.mutate({ userId: u.id, tag: premiumTag })
                              setPremiumTag('')
                            }
                          }}
                          disabled={setPremiumMutation.isPending || premiumTag.length !== 3}
                          className="px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition"
                        >
                          {setPremiumMutation.isPending ? '⏳' : '💎'} Выдать
                        </button>
                      )}
                    </div>
                    {u.premium_tag && (
                      <div className="text-sm text-yellow-300 italic">
                        Текущий премиум: <span className="font-bold">{u.premium_tag}</span>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes Display */}
                  {u.admin_notes && (
                    <div className="p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-xl">
                      <div className="font-bold text-yellow-400 text-sm mb-1">Нотатки адміна:</div>
                      <div className="text-gray-300 text-sm">{u.admin_notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">👤</div>
            <p>Користувачів не знайдено</p>
          </div>
        )}
      </div>
    </div>
  )
}
