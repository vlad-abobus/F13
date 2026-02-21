/**
 * Утилита для блокировки копирования и выделения текста
 * Используется для защиты вопросов и ответов капчи
 */

import React from 'react'

export interface ProtectionOptions {
  blockCopy?: boolean
  blockSelect?: boolean
  blockContextMenu?: boolean
  blockDrag?: boolean
  blockInspect?: boolean
}

const DEFAULT_OPTIONS: ProtectionOptions = {
  blockCopy: true,
  blockSelect: true,
  blockContextMenu: true,
  blockDrag: true,
  blockInspect: true
}

/**
 * Блокирует копирование и выделение на элементе
 * @param element - DOM элемент для защиты
 * @param options - Опции защиты
 */
export function protectElement(
  element: HTMLElement,
  options: ProtectionOptions = DEFAULT_OPTIONS
): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Блокировка выделения текста через CSS
  if (opts.blockSelect) {
    element.style.userSelect = 'none'
    element.style.webkitUserSelect = 'none'
    ;(element.style as any).msUserSelect = 'none'
    ;(element.style as any).mozUserSelect = 'none'
  }

  // Обработчик для блокировки копирования
  const handleCopy = (e: ClipboardEvent) => {
    if (opts.blockCopy) {
      e.preventDefault()
      console.warn('⚠️ Копирование капчи запрещено')
    }
  }

  // Обработчик для блокировки выделения
  const handleSelectStart = (e: Event) => {
    if (opts.blockSelect) {
      e.preventDefault()
    }
  }

  // Обработчик для блокировки правого клика
  const handleContextMenu = (e: MouseEvent) => {
    if (opts.blockContextMenu) {
      e.preventDefault()
      console.warn('⚠️ Контекстное меню на капче запрещено')
    }
  }

  // Обработчик для блокировки перетаскивания текста
  const handleDragStart = (e: DragEvent) => {
    if (opts.blockDrag) {
      e.preventDefault()
    }
  }

  // Обработчик для блокировки инспектора DevTools (F12, Ctrl+Shift+I)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (opts.blockInspect) {
      // F12
      if (e.key === 'F12') {
        e.preventDefault()
      }
      // Ctrl+Shift+I (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
      }
      // Cmd+Shift+I (Mac)
      if (e.metaKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
      }
      // Ctrl+Shift+C (Inspect element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
      }
      // Cmd+Shift+C (Mac Inspect element)
      if (e.metaKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
      }
      // Cmd+Option+J (Mac Console)
      if (e.metaKey && e.altKey && e.key === 'J') {
        e.preventDefault()
      }
    }
  }

  // Добавляем обработчики событий
  element.addEventListener('copy', handleCopy)
  element.addEventListener('selectstart', handleSelectStart)
  element.addEventListener('contextmenu', handleContextMenu)
  element.addEventListener('dragstart', handleDragStart)
  if (opts.blockInspect) {
    document.addEventListener('keydown', handleKeyDown)
  }

  // Возвращаем функцию для удаления защиты
  return () => {
    element.removeEventListener('copy', handleCopy)
    element.removeEventListener('selectstart', handleSelectStart)
    element.removeEventListener('contextmenu', handleContextMenu)
    element.removeEventListener('dragstart', handleDragStart)
    if (opts.blockInspect) {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }
}

/**
 * Блокирует копирование на нескольких элементах
 * @param selector - CSS селектор для элементов
 * @param options - Опции защиты
 */
export function protectElements(
  selector: string,
  options: ProtectionOptions = DEFAULT_OPTIONS
): () => void {
  const elements = document.querySelectorAll(selector)
  const cleanupFunctions: Array<() => void> = []

  elements.forEach((el) => {
    const cleanup = protectElement(el as HTMLElement, options)
    cleanupFunctions.push(cleanup)
  })

  // Возвращаем функцию для удаления всей защиты
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup())
  }
}

/**
 * Хук React для защиты элемента от копирования
 * Используется с useEffect
 */
export function useCopyProtection(
  ref: React.RefObject<HTMLElement>,
  options: ProtectionOptions = DEFAULT_OPTIONS
) {
  React.useEffect(() => {
    if (ref.current) {
      const cleanup = protectElement(ref.current, options)
      return cleanup
    }
  }, [options])
}
