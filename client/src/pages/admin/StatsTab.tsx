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
      <div className="text-center py-8 text-gray-400">Загрузка статистики...</div>
    )
  }

  return (
    <div className="border-2 border-white bg-black rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-6">📈 Статистика</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-bold mb-4">Пользователи</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Всего:</span>
              <span className="font-bold">{stats.users?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Забаненных:</span>
              <span className="font-bold text-gray-300">{stats.users?.banned || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Замученных:</span>
              <span className="font-bold text-gray-300">{stats.users?.muted || 0}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Контент</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Всего постов:</span>
              <span className="font-bold">{stats.posts?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>На модерации:</span>
              <span className="font-bold text-gray-300">{stats.posts?.pending_moderation || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Всего комментариев:</span>
              <span className="font-bold">{stats.comments?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
