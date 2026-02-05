import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  webpSrc?: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'auto' | 'sync'
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  [key: string]: any
}

/**
 * OptimizedImage component with WebP support and lazy loading.
 * 
 * Automatically uses WebP format if available, falls back to original format.
 * Uses native browser lazy loading for better performance.
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/image.jpg"
 *   webpSrc="/image.webp"
 *   alt="Description"
 *   loading="lazy"
 * />
 * ```
 */
export default function OptimizedImage({
  src,
  webpSrc,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    if (onError) {
      onError(e)
    }
  }

  if (hasError) {
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

  // If WebP source is provided, use <picture> with fallback
  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={src}
          alt={alt}
          className={className}
          loading={loading}
          decoding={decoding}
          onError={handleError}
          {...props}
        />
      </picture>
    )
  }

  // Otherwise, use regular img with lazy loading
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      {...props}
    />
  )
}
