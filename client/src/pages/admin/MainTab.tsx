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
      <div className="text-center py-12 text-gray-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-3"></div>
        <p>Загрузка статистики...</p>
      </div>
    )
  }

  const cardData = [
    {
      icon: '👥',
      title: 'Користувачів',
      value: stats.users?.total || 0,
      color: 'from-blue-600 to-blue-700',
      trend: '+12% цьогомісяця'
    },
    {
      icon: '📝',
      title: 'Всього постів',
      value: stats.posts?.total || 0,
      color: 'from-purple-600 to-purple-700',
      trend: '+8% цьогомісяця'
    },
    {
      icon: '⏳',
      title: 'На модерації',
      value: stats.posts?.pending_moderation || 0,
      color: 'from-yellow-600 to-yellow-700',
      trend: 'Потребує уваги',
      alert: (stats.posts?.pending_moderation || 0) > 0
    },
    {
      icon: '🚫',
      title: 'IP банів',
      value: stats.ip_bans?.active || 0,
      color: 'from-red-600 to-red-700',
      trend: 'Активних сьогодні'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.color} bg-opacity-10 border border-gray-700 hover:border-gray-600 rounded-2xl p-6 transition-all backdrop-blur`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{card.icon}</div>
              {card.alert && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
            </div>
            <div className="text-4xl font-bold text-white mb-2">{card.value}</div>
            <div className="text-sm text-gray-300 font-medium mb-1">{card.title}</div>
            <div className={`text-xs ${card.alert ? 'text-yellow-300' : 'text-gray-400'}`}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⚡</span> Швидкі дії
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/80 transition cursor-pointer">
              <span className="text-gray-300">Переглянути користувачів</span>
              <span className="text-gray-500">→</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/80 transition cursor-pointer">
              <span className="text-gray-300">Помодерувати пости</span>
              <span className="text-gray-500">→</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/80 transition cursor-pointer">
              <span className="text-gray-300">Керувати IP банами</span>
              <span className="text-gray-500">→</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>ℹ️</span> Інформація системи
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Версія</span>
              <span className="text-white font-bold">1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Статус</span>
              <span className="text-green-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Онлайн
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400">Оновлено</span>
              <span className="text-white">Щойно</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
