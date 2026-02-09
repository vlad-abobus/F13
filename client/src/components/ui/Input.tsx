import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

/**
 * Input component with label, error, and helper text support.
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, className = '', ...props }, ref) => {
    const baseClasses = 'px-4 py-2 bg-gray-800/50 border text-white rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-gray-500'
    const borderClass = error ? 'border-gray-600 focus:ring-white' : 'border-gray-600 focus:ring-white focus:border-transparent'
    const widthClass = fullWidth ? 'w-full' : ''

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block mb-2 text-sm font-semibold text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${borderClass} ${widthClass} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-gray-300 mt-2 text-sm">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-gray-400 mt-2 text-sm">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
