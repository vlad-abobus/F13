import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import apiClient from '../api/client'

export default function Rules() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/rules')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Завантаження...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Правила спільноти</h1>
      <div className="space-y-6">
        {rules?.map((rule: any) => (
          <div key={rule.id} className="border-2 border-white p-6">
            <h2 className="text-2xl font-bold mb-4">{rule.title}</h2>
            <ReactMarkdown className="prose prose-invert">{rule.content}</ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  )
}
