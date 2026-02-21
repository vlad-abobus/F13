import { Link } from 'react-router-dom'
import VerificationBadge from './VerificationBadge'

interface UserLabelProps {
  user?: any
  username?: string
  premium_code?: string
  large?: boolean
  toProfile?: boolean
}

export default function UserLabel({ user, username, premium_code, large, toProfile = true }: UserLabelProps) {
  const name = user?.username || username || 'Аноним'
  const code = (user?.premium_code || premium_code) as string | undefined
  const verificationType = user?.verification_type || user?.verification || 'none'
  const badge = user?.verification_badge

  const nameEl = (
    <span className={`${large ? 'text-3xl sm:text-4xl' : 'text-base'} font-bold text-white break-words`}>
      {name}
    </span>
  )

  return (
    <div className={`flex items-center gap-2 ${large ? 'flex-wrap' : ''}`}>
      {toProfile && user?.username ? (
        <Link to={`/profile/${user.username}`} className="hover:opacity-80 transition-opacity">
          {nameEl}
        </Link>
      ) : (
        nameEl
      )}

      {code && (
        <span className="ml-2 font-extrabold text-white uppercase text-sm" title={`Premium: ${code}`}>
          {code.slice(0, 3).toUpperCase()}
        </span>
      )}

      <VerificationBadge type={verificationType as any} badge={badge} />
    </div>
  )
}
