import { useState, useEffect } from 'react'
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

interface MikuSettings {
  is_enabled: boolean
  comment_interval_hours: number
  max_comments_per_day: number
  posts_age_days: number
  personality_override: string
  enabled_days: string
  last_run_at?: string
  last_comments_count?: number
}

interface MikuTabProps {
  mikuSettings: UseQueryResult<MikuSettings, unknown>
  updateMikuSettingsMutation: UseMutationResult<any, unknown, MikuSettings, unknown>
  testMikuCommentMutation: UseMutationResult<any, unknown, void, unknown>
}

export default function MikuTab({
  mikuSettings,
  updateMikuSettingsMutation,
  testMikuCommentMutation,
}: MikuTabProps) {
  const [mikuSettingsForm, setMikuSettingsForm] = useState({
    is_enabled: true,
    comment_interval_hours: 24,
    max_comments_per_day: 5,
    posts_age_days: 7,
    personality_override: '',
    enabled_days: '0123456',
  })

  useEffect(() => {
    if (mikuSettings.data) {
      setMikuSettingsForm({
        is_enabled: mikuSettings.data.is_enabled,
        comment_interval_hours: mikuSettings.data.comment_interval_hours,
        max_comments_per_day: mikuSettings.data.max_comments_per_day,
        posts_age_days: mikuSettings.data.posts_age_days,
        personality_override: mikuSettings.data.personality_override || '',
        enabled_days: mikuSettings.data.enabled_days,
      })
    }
  }, [mikuSettings.data])

  return (
    <div className="space-y-6">
      <div className="border-2 border-white bg-black rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">🎵 Настройки авто-комментирования Miku</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mikuSettingsForm.is_enabled}
                onChange={(e) =>
                  setMikuSettingsForm({ ...mikuSettingsForm, is_enabled: e.target.checked })
                }
                className="w-5 h-5"
              />
              <span className="font-bold">Включить авто-комментирование</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-bold">Интервал между запусками (часы)</label>
              <input
                type="number"
                value={mikuSettingsForm.comment_interval_hours}
                onChange={(e) =>
                  setMikuSettingsForm({
                    ...mikuSettingsForm,
                    comment_interval_hours: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                min="1"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold">Максимум комментариев в день</label>
              <input
                type="number"
                value={mikuSettingsForm.max_comments_per_day}
                onChange={(e) =>
                  setMikuSettingsForm({
                    ...mikuSettingsForm,
                    max_comments_per_day: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold">Комментировать посты за последние (дни)</label>
              <input
                type="number"
                value={mikuSettingsForm.posts_age_days}
                onChange={(e) =>
                  setMikuSettingsForm({
                    ...mikuSettingsForm,
                    posts_age_days: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold">Переопределить характер (пусто = автоматически)</label>
              <select
                value={mikuSettingsForm.personality_override}
                onChange={(e) =>
                  setMikuSettingsForm({
                    ...mikuSettingsForm,
                    personality_override: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-black border-2 border-white text-white rounded-lg"
              >
                <option value="">Автоматически (по дню недели)</option>
                <option value="Дередере">Дередере</option>
                <option value="Цундере">Цундере</option>
                <option value="Дандере">Дандере</option>
                <option value="Яндере">Яндере</option>
                <option value="Кудере">Кудере</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold">Дни недели для комментирования</label>
            <div className="flex flex-wrap gap-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                <label key={index} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mikuSettingsForm.enabled_days.includes(String(index))}
                    onChange={(e) => {
                      const days = mikuSettingsForm.enabled_days.split('')
                      if (e.target.checked) {
                        if (!days.includes(String(index))) {
                          days.push(String(index))
                        }
                      } else {
                        const idx = days.indexOf(String(index))
                        if (idx > -1) {
                          days.splice(idx, 1)
                        }
                      }
                      setMikuSettingsForm({
                        ...mikuSettingsForm,
                        enabled_days: days.sort().join(''),
                      })
                    }}
                    className="w-4 h-4"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => updateMikuSettingsMutation.mutate(mikuSettingsForm)}
              disabled={updateMikuSettingsMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMikuSettingsMutation.isPending ? 'Сохранение...' : '💾 Сохранить настройки'}
            </button>

            <button
              onClick={() => testMikuCommentMutation.mutate()}
              disabled={testMikuCommentMutation.isPending || !mikuSettingsForm.is_enabled}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {testMikuCommentMutation.isPending ? 'Тестирование...' : '▶️ Тестовый запуск'}
            </button>
          </div>
        </div>
      </div>

      {mikuSettings.data && (
        <div className="border-2 border-white bg-black rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">📊 Статистика</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Последний запуск</div>
              <div className="font-bold">
                {mikuSettings.data.last_run_at
                  ? new Date(mikuSettings.data.last_run_at).toLocaleString('ru-RU')
                  : 'Никогда'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Последний результат</div>
              <div className="font-bold">{mikuSettings.data.last_comments_count || 0} комментариев</div>
            </div>
          </div>
        </div>
      )}

      {testMikuCommentMutation.data && (
        <div className="border-2 border-green-500 bg-green-900 bg-opacity-20 rounded-xl p-4">
          <div className="font-bold text-green-400">✅ {testMikuCommentMutation.data.data.message}</div>
          <div className="text-sm text-gray-400 mt-2">
            Характер: {testMikuCommentMutation.data.data.personality}
          </div>
        </div>
      )}
    </div>
  )
}
