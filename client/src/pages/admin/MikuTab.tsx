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
      {/* Miku Settings */}
      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-2xl p-6 backdrop-blur">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <span>🎵</span> Налаштування авто-коментування Miku
        </h2>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={mikuSettingsForm.is_enabled}
                  onChange={(e) =>
                    setMikuSettingsForm({ ...mikuSettingsForm, is_enabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-cyan-500"
                />
              </div>
              <span className="font-semibold text-white">Активувати авто-коментування Miku</span>
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${mikuSettingsForm.is_enabled ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}>
              {mikuSettingsForm.is_enabled ? '🟢 Вкл' : '🔴 Вимк'}
            </span>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Максимум коментарів на день</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={mikuSettingsForm.max_comments_per_day}
                  onChange={(e) =>
                    setMikuSettingsForm({
                      ...mikuSettingsForm,
                      max_comments_per_day: Number(e.target.value),
                    })
                  }
                  className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 focus:border-cyan-500 text-white rounded-lg focus:outline-none transition"
                  min="1"
                  max="50"
                />
                <span className="text-gray-400 text-sm">шт.</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Характер Miku</label>
              <select
                value={mikuSettingsForm.personality_override}
                onChange={(e) =>
                  setMikuSettingsForm({
                    ...mikuSettingsForm,
                    personality_override: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 focus:border-cyan-500 text-white rounded-lg focus:outline-none transition"
              >
                <option value="">🎲 Автоматично (по дню тижня)</option>
                <option value="Дередере">😊 Дередере</option>
                <option value="Цундере">😠 Цундере</option>
                <option value="Дандере">😢 Дандере</option>
                <option value="Яндере">💗 Яндере</option>
                <option value="Кудере">😌 Кудере</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={() => updateMikuSettingsMutation.mutate(mikuSettingsForm)}
              disabled={updateMikuSettingsMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
            >
              {updateMikuSettingsMutation.isPending ? '⏳ Збереження...' : '💾 Зберегти'}
            </button>

            <button
              onClick={() => testMikuCommentMutation.mutate()}
              disabled={testMikuCommentMutation.isPending || !mikuSettingsForm.is_enabled}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
            >
              {testMikuCommentMutation.isPending ? '⏳ Тестування...' : '▶️ Тестовий коментар'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {mikuSettings && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <span>📊</span> Статистика
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">🕐 Останній запуск</div>
              <div className="text-xl font-bold text-white">
                {mikuSettings.last_run_at
                  ? new Date(mikuSettings.last_run_at).toLocaleString('uk-UA')
                  : '⏳ Ніколи'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">📝 Коментарів останньої сесії</div>
              <div className="text-xl font-bold text-cyan-400">
                {mikuSettings.last_comments_count || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Result */}
      {testMikuCommentMutation.data && (
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-600/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">✅</div>
            <div className="flex-1">
              <div className="font-bold text-green-300 mb-2">{testMikuCommentMutation.data.data.message}</div>
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Характер: </span>
                <span className="font-bold text-cyan-300">{testMikuCommentMutation.data.data.personality}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
