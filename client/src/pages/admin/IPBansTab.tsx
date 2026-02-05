import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query'

interface IPBan {
  id: string
  ip_address: string
  reason?: string
  banned_until?: string
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
      <div className="border-2 border-white bg-black rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">🚫 Добавить IP бан</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-bold">IP адрес</label>
            <input
              type="text"
              value={banIP}
              onChange={(e) => setBanIP(e.target.value)}
              className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
              placeholder="127.0.0.1"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold">Причина</label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
              placeholder="Причина бана"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold">Часы (пусто = навсегда)</label>
            <input
              type="number"
              value={banHours || ''}
              onChange={(e) => setBanHours(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
              placeholder="24"
            />
          </div>
          <button
            onClick={handleCreateBan}
            disabled={!banIP || createIPBanMutation.isPending}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {createIPBanMutation.isPending ? '...' : '🚫 Забанить IP'}
          </button>
        </div>
      </div>

      <div className="border-2 border-white bg-black rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Активные IP баны</h2>
        <div className="space-y-3">
          {ipBans?.map((ban) => (
            <div key={ban.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{ban.ip_address}</div>
                  <div className="text-sm text-gray-400">
                    {ban.reason || 'Без причины'}
                    {ban.banned_until && ` | До: ${new Date(ban.banned_until).toLocaleString()}`}
                  </div>
                </div>
                <button
                  onClick={() => removeIPBanMutation.mutate(ban.id)}
                  className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                >
                  Снять бан
                </button>
              </div>
            </div>
          ))}
          {(!ipBans || ipBans.length === 0) && (
            <div className="text-center py-8 text-gray-400">Нет активных IP банов</div>
          )}
        </div>
      </div>
    </div>
  )
}
