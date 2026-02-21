import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query'

interface IPBan {
  id: string
  ip_address: string
  reason?: string
  banned_until?: string
  is_voluntary?: boolean
}

interface IPBansTabProps {
  ipBans: IPBan[] | undefined
  createIPBanMutation: UseMutationResult<any, unknown, { ip_address: string; reason: string; hours: number | null }, unknown>
  removeIPBanMutation: UseMutationResult<any, unknown, string, unknown>
}

export default function IPBansTab({
  ipBans,
  createIPBanMutation,
  removeIPBanMutation,
}: IPBansTabProps) {
  const [banIP, setBanIP] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banHours, setBanHours] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'voluntary' | 'manual'>('all')

  const handleCreateBan = () => {
    createIPBanMutation.mutate(
      {
        ip_address: banIP,
        reason: banReason,
        hours: banHours,
      },
      {
        onSuccess: () => {
          setBanIP('')
          setBanReason('')
          setBanHours(null)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Create IP Ban Section */}
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-700/30 rounded-2xl p-6 backdrop-blur">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <span>🚫</span> Додати новий IP бан
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">IP адреса</label>
            <input
              type="text"
              value={banIP}
              onChange={(e) => setBanIP(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 focus:border-red-500 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
              placeholder="192.168.1.1"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">Причина</label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 focus:border-red-500 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
              placeholder="Спам, напади, тощо..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-300">Тривалість (години)</label>
              <input
                type="number"
                value={banHours || ''}
                onChange={(e) => setBanHours(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 focus:border-red-500 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
                placeholder="Пусто = навічно"
                min="1"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateBan}
                disabled={!banIP || createIPBanMutation.isPending}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                {createIPBanMutation.isPending ? '⏳ Обробка...' : '🚫 Забанити IP'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active IP Bans Section */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur">
        <div className="p-6 border-b border-gray-700 bg-gray-800/30">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📋</span> Активні IP бани
          </h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-gray-400 text-sm mt-2">{ipBans?.length || 0} активних банів</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Фільтр:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="bg-gray-800 text-white px-3 py-2 rounded">
                <option value="all">All</option>
                <option value="voluntary">Voluntary</option>
                <option value="manual">Manual/Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-6">
          {ipBans && ipBans.length > 0 ? (
            ipBans
              .filter((ban) => {
                if (filter === 'all') return true
                if (filter === 'voluntary') return !!(ban as any).is_voluntary
                return !(ban as any).is_voluntary
              })
              .map((ban, idx) => (
              <div 
                key={ban.id} 
                className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-red-600/50 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs bg-red-600/30 text-red-300 px-3 py-1 rounded-full font-mono">
                        #{idx + 1}
                      </span>
                      <code className="text-lg font-bold text-white bg-gray-700/50 px-3 py-1 rounded">
                        {ban.ip_address}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 text-sm">
                        💬 {ban.reason || 'Без причини'} { (ban as any).is_voluntary ? '• добровільний' : '' }
                      </span>
                      {ban.banned_until && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded">
                          ⏰ До: {new Date(ban.banned_until).toLocaleString('uk-UA')}
                        </span>
                      )}
                      {!ban.banned_until && (
                        <span className="text-xs bg-red-600/30 text-red-300 px-2 py-1 rounded">
                          ♾️ Навічно
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeIPBanMutation.mutate(ban.id)}
                    disabled={removeIPBanMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition"
                  >
                    {removeIPBanMutation.isPending ? '⏳' : '✅'} Видалити
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-gray-300">Немає активних IP банів</p>
              <p className="text-gray-500 text-sm mt-1">Мережа чистий простір 🌍</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
