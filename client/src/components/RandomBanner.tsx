import { useMemo } from 'react'
import backImages from '../lib/backImages'

type Props = {
  className?: string
  overlay?: boolean
}

export default function RandomBanner({ className = 'h-44', overlay = true }: Props) {
  const img = useMemo(() => backImages[Math.floor(Math.random() * backImages.length)], [])

  return (
    <div
      className={`${className} relative bg-black bg-cover bg-center`}
      style={{ backgroundImage: `url(${img})` }}
    >
      {overlay && <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent"></div>}
    </div>
  )
}
