import { useState, useEffect } from 'react'

export default function TestBanner() {
  const storageKey = 'f13_test_banner_dismissed'
  const [dismissed, setDismissed] = useState<boolean>(true)

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey)
      setDismissed(v === '1')
    } catch (e) {
      setDismissed(false)
    }
  }, [])

  if (dismissed) return null

  return (
    <div className="w-full bg-yellow-600 text-black text-sm py-2 px-4 flex items-center justify-between">
      <div>
        <strong>Тестовая версия</strong>: сайт может быть нестабильным. Здесь могут быть баги и тд. Сайт был професионально завайбкожен парнями из DeV13 специально для сообщества LK_13.
      </div>
      <button
        onClick={() => {
          try { localStorage.setItem(storageKey, '1') } catch (e) {}
          setDismissed(true)
        }}
        className="ml-4 px-3 py-1 bg-black text-white rounded"
      >
        Закрыть
      </button>
    </div>
  )
}
