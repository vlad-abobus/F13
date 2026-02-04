import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useAuthStore } from '../store/authStore'
import QuoteDisplay from '../components/QuoteDisplay'

export default function GoonZone() {
  const { isAuthenticated } = useAuthStore()

  const { data: polls } = useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/polls')
      return response.data
    },
  })

  const { data: news } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/news')
      return response.data
    },
  })

  const { data: quote } = useQuery({
    queryKey: ['quote'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/quote')
      return response.data
    },
  })

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, option }: { pollId: string; option: string }) => {
      await apiClient.post(`/goonzone/polls/${pollId}/vote`, { option })
    },
  })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">GoonZone</h1>

      <QuoteDisplay autoRefresh={true} refreshInterval={60000} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Опитування</h2>
          <div className="space-y-4">
            {polls?.map((poll: any) => (
              <div key={poll.id} className="border-2 border-white p-4">
                <h3 className="font-bold mb-2">{poll.title}</h3>
                {poll.description && <p className="text-gray-400 mb-4">{poll.description}</p>}
                <div className="space-y-2">
                  {poll.options?.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => {
                        if (isAuthenticated) {
                          voteMutation.mutate({ pollId: poll.id, option })
                        }
                      }}
                      disabled={!isAuthenticated || voteMutation.isPending}
                      className="w-full text-left px-4 py-2 border-2 border-white hover:bg-white hover:text-black disabled:opacity-50"
                    >
                      {option} ({poll.votes?.[option] || 0})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4"></h2>
          <div className="space-y-4">
            {news?.map((item: any) => (
              <div key={item.id} className="border-2 border-white p-4">
                {item.is_pinned && <span className="text-yellow-400">📌 </span>}
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
