import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

interface QuoteDisplayProps {
  type?: 'ironic' | 'motivational'
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function QuoteDisplay({
  type,
  autoRefresh = false,
  refreshInterval = 60000,
}: QuoteDisplayProps) {
  const { data: quote } = useQuery({
    queryKey: ['quote', type],
    queryFn: async () => {
      const response = await apiClient.get(`/goonzone/quote${type ? `?type=${type}` : ''}`)
      return response.data
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  })

  if (!quote) {
    return null
  }

  return (
    <div className="border-2 border-white p-6 text-center">
      <p className="text-lg italic mb-2">"{quote.text}"</p>
      <p className="text-sm text-gray-400">— {quote.type === 'ironic' ? 'Іронія' : 'Мотивація'}</p>
    </div>
  )
}
