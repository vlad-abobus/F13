import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import apiClient from '../api/client'

interface Rule {
  id: string | number
  title: string
  content: string
}

export default function Rules() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await apiClient.get('/goonzone/rules')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Загрузачка...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Правила сообщества</h1>
      <div className="space-y-6">
        {rules && rules.length > 0 ? (
          rules.map((rule: Rule) => (
            <div key={rule.id} className="border-2 border-white p-6">
              <h2 className="text-2xl font-bold mb-4">{rule.title}</h2>
              <ReactMarkdown className="prose prose-invert">{rule.content}</ReactMarkdown>
            </div>
          ))
        ) : (
          <div className="text-center py-8">Нема правил</div>
        )}
      </div>
    </div>
  )
}
export const defaultRules: Rule[] = [
  {
    id: 1,
    title: 'За своим состояниям позначай посты + - +/-',
    content: 'Если ноешь и агресив то ставь минус, если все ок то плюс, если не знаешь что ставить то +/-'
  },
  {
    id: 2,
    title: 'Без спаму',
    content: 'Спам я не люблю ) если любишь то спамь в личку друзьям, а не в общий канал лмао'
  },
  {
    id: 3,
    title: 'Свобода?',
    content: 'Ало свобода? Да да закон . Не нарушай законы . Теторизм и прочее это плохо а критиковать можно и нужно'
  },
  {
    id: 4,
    title: 'Все старшное это NFSW',
    content: 'Даже свой писю фоткай но NFSW потому что я не хочу видеть это '
  },
  {
    id: 5,
    title: 'Даем свободу)',
    content: 'Писюны , попы , комунизм , анархизм , инцелы , wirnty и другое єто все свобода , но не забывай ставить минус если тебе не нравится и плюс если нравится'
  }
]
