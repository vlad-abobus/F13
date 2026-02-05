interface VerificationBadgeProps {
  type: 'blue' | 'purple' | 'red' | 'none'
  badge?: string
}

export default function VerificationBadge({ type, badge }: VerificationBadgeProps) {
  if (type === 'none') return null

  const colors: Record<string, { bg: string; text: string; label: string }> = {
    blue: {
      bg: 'bg-white',
      text: 'text-black',
      label: 'Верифікований',
    },
    purple: {
      bg: 'bg-gray-300',
      text: 'text-black',
      label: 'Особливий',
    },
    red: {
      bg: 'bg-gray-200',
      text: 'text-black',
      label: 'Премиум',
    },
  }

  const color = colors[type] || colors.blue

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 ${color.bg} ${color.text} text-xs font-bold border-2 border-white`}
      title={color.label}
    >
      ✓ {badge || ''}
    </span>
  )
}
