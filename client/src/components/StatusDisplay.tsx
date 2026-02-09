import { useQuery } from '@tanstack/react-query'
import SafeImage from './SafeImage'

export default function StatusDisplay() {
  const { data: activeUsers } = useQuery({
    queryKey: ['active-users'],
    queryFn: async () => {
      const response = await fetch('/api/users/active')
      if (!response.ok) return []
      return response.json()
    },
    refetchInterval: 5000, // Update every 5 seconds
  })

  if (!activeUsers || activeUsers.length === 0) {
    return null
  }

  const statusLabels: Record<string, string> = {
    GRY: '🎮 Играет',
    PST: '📝 У постах',
    MIK: '🤖 Говорит с мику',
  }

  return (
    <div className="border-2 border-white p-4 mb-6">
      <h3 className="text-lg font-bold mb-3">Активні користувачі</h3>
      <div className="space-y-2">
        {activeUsers.map((user: any) => (
          <div key={user.id} className="flex items-center gap-2">
            <SafeImage
              src={user.avatar_url}
              alt={user.username}
              className="w-6 h-6 rounded-full object-cover"
              fallback={
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                  {user.username?.charAt(0).toUpperCase() || '?'}
                </div>
              }
            />
            <span className="font-bold">{user.username}</span>
            <span className="text-sm text-gray-400">
              {statusLabels[user.activity_status] || user.activity_status}
            </span>
            {user.activity_data && (
              <span className="text-xs text-gray-500">({user.activity_data})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
