interface MainTabProps {
  stats: {
    users?: { total?: number }
    posts?: { total?: number; pending_moderation?: number }
    ip_bans?: { active?: number }
  } | undefined
}

export default function MainTab({ stats }: MainTabProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-400">Загрузка статистики...</div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="border-2 border-white bg-black p-4 rounded-xl">
        <div className="text-2xl mb-2">👥</div>
        <div className="text-3xl font-bold">{stats.users?.total || 0}</div>
        <div className="text-sm text-gray-400">Пользователей</div>
      </div>
      <div className="border-2 border-white bg-black p-4 rounded-xl">
        <div className="text-2xl mb-2">📝</div>
        <div className="text-3xl font-bold">{stats.posts?.total || 0}</div>
        <div className="text-sm text-gray-400">Постов</div>
      </div>
      <div className="border-2 border-white bg-black p-4 rounded-xl">
        <div className="text-2xl mb-2">⏳</div>
        <div className="text-3xl font-bold">{stats.posts?.pending_moderation || 0}</div>
        <div className="text-sm text-gray-400">На модерации</div>
      </div>
      <div className="border-2 border-white bg-black p-4 rounded-xl">
        <div className="text-2xl mb-2">🚫</div>
        <div className="text-3xl font-bold">{stats.ip_bans?.active || 0}</div>
        <div className="text-sm text-gray-400">IP банов</div>
      </div>
    </div>
  )
}
