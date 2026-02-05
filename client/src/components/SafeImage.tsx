import { useState, ReactNode } from 'react'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  placeholder?: string
  fallback?: string | ReactNode
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'auto' | 'sync'
  [key: string]: any // Allow other img props
}

/**
 * SafeImage component that handles missing or broken images gracefully
 * - If src is null/undefined/empty, shows placeholder immediately
 * - If image fails to load (404), automatically switches to placeholder
 * - Prevents broken image icons from appearing
 */
export default function SafeImage({
  src,
  alt,
  className = '',
  placeholder = '/assets/placeholder.svg',
  fallback,
  onError,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(() => {
    // If src is null, undefined, or empty string
    if (!src || (typeof src === 'string' && src.trim() === '')) {
      // If fallback is a ReactNode, return null to trigger ReactNode rendering
      if (fallback && typeof fallback !== 'string') {
        return null
      }
      // Otherwise use string fallback or placeholder
      return (typeof fallback === 'string' ? fallback : null) || placeholder
    }
    return src
  })
  const [hasError, setHasError] = useState(false)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Prevent infinite loop if placeholder also fails
    if (hasError) {
      return
    }

    setHasError(true)
    
    // Switch to placeholder/fallback (only if fallback is a string)
    if (typeof fallback === 'string') {
      const fallbackSrc = fallback || placeholder
      if (e.currentTarget.src !== fallbackSrc) {
        setImgSrc(fallbackSrc)
      }
    }

    // Call custom onError handler if provided
    if (onError) {
      onError(e)
    }
  }

  // If fallback is a ReactNode and we have no src or error, render fallback
  if ((!imgSrc || hasError) && fallback && typeof fallback !== 'string') {
    return <>{fallback}</>
  }

  // If we have a valid src, render image
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        {...props}
      />
    )
  }

  // Fallback: render placeholder div if no image at all
  return (
    <div
      className={`${className} bg-gray-800 flex items-center justify-center text-gray-500`}
      role="img"
      aria-label={alt}
    >
      <span className="text-sm">📷</span>
    </div>
  )
}
