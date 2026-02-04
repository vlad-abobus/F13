interface Badge {
  id: string
  name: string
  description?: string
  icon: string
  rarity: 'common' | 'rare' | 'epic'
}

interface BadgeDisplayProps {
  badges: Badge[]
}

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) {
    return <p className="text-gray-400">Немає бейджів</p>
  }

  const rarityColors: Record<string, string> = {
    common: 'border-gray-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`border-2 ${rarityColors[badge.rarity] || 'border-white'} p-3 text-center`}
          title={badge.description || badge.name}
        >
          <div className="text-3xl mb-2">{badge.icon}</div>
          <div className="text-sm font-bold">{badge.name}</div>
          {badge.description && (
            <div className="text-xs text-gray-400 mt-1">{badge.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
