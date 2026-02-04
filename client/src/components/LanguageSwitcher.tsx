import { useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'ru', name: 'Рус' },
    { code: 'uk', name: 'Укр' },
    { code: 'en', name: 'Eng' },
    { code: 'kz', name: 'Қаз' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 border-2 border-white hover:bg-white hover:text-black"
      >
        {languages.find(l => l.code === language)?.name || 'Ru'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-black border-2 border-white z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white hover:text-black"
              >
                {lang.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
