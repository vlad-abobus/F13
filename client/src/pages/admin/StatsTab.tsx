interface StatsTabProps {
  stats: {
    users?: { total?: number; banned?: number; muted?: number }
    posts?: { total?: number; pending_moderation?: number }
    comments?: { total?: number }
  } | undefined
}

export default function StatsTab({ stats }: StatsTabProps) {
  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-3"></div>
        <p>Загрузка статистики...</p>
      </div>
    )
  }

  const totalUsers = stats.users?.total || 0
  const bannedUsers = stats.users?.banned || 0
  const mutedUsers = stats.users?.muted || 0
  const bannedPercent = totalUsers > 0 ? (bannedUsers / totalUsers * 100).toFixed(1) : 0
  const mutedPercent = totalUsers > 0 ? (mutedUsers / totalUsers * 100).toFixed(1) : 0

  const totalPosts = stats.posts?.total || 0
  const pendingPosts = stats.posts?.pending_moderation || 0
  const pendingPercent = totalPosts > 0 ? (pendingPosts / totalPosts * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Users Statistics */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/30 rounded-2xl p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span>👥</span> Статистика користувачів
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Усього користувачів</div>
            <div className="text-4xl font-bold text-white mb-3">{totalUsers}</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-full"></div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Забанених</div>
              <span className="text-xs bg-red-600/30 text-red-300 px-2 py-1 rounded">{bannedPercent}%</span>
            </div>
            <div className="text-3xl font-bold text-red-400 mb-3">{bannedUsers}</div>
            <div className="h-2 bg-red-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${bannedPercent}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Приймирені</div>
              <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded">{mutedPercent}%</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-3">{mutedUsers}</div>
            <div className="h-2 bg-yellow-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600" style={{ width: `${mutedPercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-700/30 rounded-2xl p-6 backdrop-blur">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span>📝</span> Статистика контенту
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Усього постів</div>
            <div className="text-4xl font-bold text-white mb-3">{totalPosts}</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 w-full"></div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">На модерації</div>
              <span className={`text-xs px-2 py-1 rounded ${pendingPosts > 0 ? 'bg-yellow-600/30 text-yellow-300' : 'bg-green-600/30 text-green-300'}`}>
                {pendingPercent}%
              </span>
            </div>
            <div className={`text-3xl font-bold mb-3 ${pendingPosts > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {pendingPosts}
            </div>
            <div className="h-2 bg-yellow-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600" style={{ width: `${pendingPercent}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-2">Усього коментарів</div>
            <div className="text-3xl font-bold text-white mb-3">{stats.comments?.total || 0}</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Зведення</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Показник</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Значення</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                <td className="px-6 py-4 text-gray-300">Активні користувачі</td>
                <td className="px-6 py-4 text-right text-white font-bold">{totalUsers - bannedUsers - mutedUsers}</td>
              </tr>
              <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                <td className="px-6 py-4 text-gray-300">Затримки модерації</td>
                <td className="px-6 py-4 text-right text-yellow-400 font-bold">{pendingPosts}</td>
              </tr>
              <tr className="hover:bg-gray-800/50 transition">
                <td className="px-6 py-4 text-gray-300">Опубліковано сьогодні</td>
                <td className="px-6 py-4 text-right text-white font-bold">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
