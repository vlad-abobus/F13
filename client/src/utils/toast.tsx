import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let toastId = 0
const toastListeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function notify() {
  toastListeners.forEach(listener => listener([...toasts]))
}

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  const id = `toast-${toastId++}`
  const toast: Toast = { id, message, type, duration }
  toasts.push(toast)
  notify()
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notify()
  }, duration)
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>([])
  
  useEffect(() => {
    const listener = (newToasts: Toast[]) => setState(newToasts)
    toastListeners.push(listener)
    setState([...toasts])
    
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) {
        toastListeners.splice(index, 1)
      }
    }
  }, [])
  
  return state
}

export function ToastContainer() {
  const toasts = useToasts()
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-6 py-4 rounded-lg shadow-lg border-2 border-white font-bold min-w-[300px] max-w-md animate-slide-in ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : toast.type === 'warning'
              ? 'bg-yellow-600 text-black'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
