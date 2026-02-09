import { useState, useEffect } from 'react'
import { UseMutationResult } from '@tanstack/react-query'

interface MikuSettings {
  is_enabled: boolean
  max_comments_per_day: number
  personality_override: string
  last_run_at?: string
  last_comments_count?: number
}

interface MikuTabProps {
  mikuSettings: MikuSettings | undefined
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
    max_comments_per_day: 5,
    personality_override: '',
  })

  useEffect(() => {
    if (mikuSettings) {
      setMikuSettingsForm({
        is_enabled: mikuSettings.is_enabled,
        max_comments_per_day: mikuSettings.max_comments_per_day,
        personality_override: mikuSettings.personality_override || '',
      })
    }
  }, [mikuSettings])

  return (
    <div className="space-y-6">
      <div className="border-2 border-white bg-black rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">🎵 Налаштування авто-коментування Miku</h2>

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
              <span className="font-bold">Включити авто-коментування</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-bold">Максимум коментарів на день</label>
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
                max="20"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold">Хартер Miku</label>
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
                <option value="">Автоматично (по дню тижня)</option>
                <option value="Дередере">Дередере</option>
                <option value="Цундере">Цундере</option>
                <option value="Дандере">Дандере</option>
                <option value="Яндере">Яндере</option>
                <option value="Кудере">Кудере</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => updateMikuSettingsMutation.mutate(mikuSettingsForm)}
              disabled={updateMikuSettingsMutation.isPending}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              {updateMikuSettingsMutation.isPending ? 'Збереження...' : '💾 Зберегти'}
            </button>

            <button
              onClick={() => testMikuCommentMutation.mutate()}
              disabled={testMikuCommentMutation.isPending || !mikuSettingsForm.is_enabled}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              {testMikuCommentMutation.isPending ? 'Тестування...' : '▶️ Тест'}
            </button>
          </div>
        </div>
      </div>

      {mikuSettings && (
        <div className="border-2 border-white bg-black rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">📊 Статистика</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Последний запуск</div>
              <div className="font-bold">
                {mikuSettings.last_run_at
                  ? new Date(mikuSettings.last_run_at).toLocaleString('ru-RU')
                  : 'Никогда'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Последний результат</div>
              <div className="font-bold">{mikuSettings.last_comments_count || 0} комментариев</div>
            </div>
          </div>
        </div>
      )}

      {testMikuCommentMutation.data && (
        <div className="border-2 border-gray-600 bg-gray-900 bg-opacity-20 rounded-xl p-4">
          <div className="font-bold text-gray-200">✅ {testMikuCommentMutation.data.data.message}</div>
          <div className="text-sm text-gray-400 mt-2">
            Характер: {testMikuCommentMutation.data.data.personality}
          </div>
        </div>
      )}
    </div>
  )
}
