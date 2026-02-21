/**
 * Продвинутая защита от копирования с логированием
 * Отправляет информацию о попытках копирования на сервер
 */

import React from 'react'

export interface AdvancedProtectionOptions {
  // Базовые опции
  blockCopy?: boolean
  blockSelect?: boolean
  blockContextMenu?: boolean
  blockDrag?: boolean
  
  // Продвинутые опции
  logAttempts?: boolean              // Логировать попытки копирования
  sendToServer?: boolean             // Отправлять логи на сервер
  serverEndpoint?: string            // Эндпоинт для отправки логов
  blockAfterAttempts?: number        // Заблокировать после N попыток (0 = без ограничений)
  showWarning?: boolean              // Показывать предупреждение пользователю
}

interface CopyAttempt {
  timestamp: number
  type: 'copy' | 'select' | 'contextmenu' | 'drag'
  elementClass?: string
  userAgent?: string
}

export class AdvancedCopyProtection {
  private element: HTMLElement
  private options: AdvancedProtectionOptions
  private attempts: CopyAttempt[] = []
  private isBlocked: boolean = false

  constructor(element: HTMLElement, options: Partial<AdvancedProtectionOptions> = {}) {
    this.element = element
    this.options = {
      blockCopy: true,
      blockSelect: true,
      blockContextMenu: true,
      blockDrag: true,
      logAttempts: false,
      sendToServer: false,
      blockAfterAttempts: 0,
      showWarning: true,
      ...options
    }

    this.init()
  }

  private init() {
    this.setupProtection()
  }

  private setupProtection() {
    // CSS защита
    this.element.style.userSelect = 'none'
    this.element.style.webkitUserSelect = 'none'
    ;(this.element.style as any).msUserSelect = 'none'
    ;(this.element.style as any).mozUserSelect = 'none'

    // Добавляем обработчики
    this.element.addEventListener('copy', this.handleCopy.bind(this))
    this.element.addEventListener('selectstart', this.handleSelectStart.bind(this))
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this))
    this.element.addEventListener('dragstart', this.handleDragStart.bind(this))
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this))
  }

  private logAttempt(type: CopyAttempt['type']) {
    if (!this.options.logAttempts) return

    const attempt: CopyAttempt = {
      timestamp: Date.now(),
      type,
      elementClass: this.element.className,
      userAgent: navigator.userAgent
    }

    this.attempts.push(attempt)

    // Отправляем на сервер если нужно
    if (this.options.sendToServer && this.options.serverEndpoint) {
      this.sendToServer(attempt)
    }

    // Проверяем лимит попыток
    if (this.options.blockAfterAttempts && this.options.blockAfterAttempts > 0) {
      if (this.attempts.length >= this.options.blockAfterAttempts) {
        this.blockElement()
      }
    }
  }

  private blockElement() {
    if (this.isBlocked) return

    this.isBlocked = true
    this.element.style.opacity = '0.5'
    this.element.style.pointerEvents = 'none'

    if (this.options.showWarning) {
      this.showWarning('Слишком много попыток копирования. Элемент заблокирован.')
    }

    console.warn('🔒 Элемент капчи заблокирован за частые попытки копирования')
  }

  private handleCopy(e: ClipboardEvent) {
    e.preventDefault()
    this.logAttempt('copy')

    if (this.options.showWarning) {
      this.showWarning('Копирование капчи запрещено!')
    }
  }

  private handleSelectStart(e: Event) {
    e.preventDefault()
    this.logAttempt('select')
  }

  private handleContextMenu(e: MouseEvent) {
    e.preventDefault()
    this.logAttempt('contextmenu')

    if (this.options.showWarning) {
      this.showWarning('Контекстное меню на капче запрещено!')
    }
  }

  private handleDragStart(e: DragEvent) {
    e.preventDefault()
    this.logAttempt('drag')
  }

  private handleMouseDown(e: MouseEvent) {
    // Блокируем рабочее выделение (triple-click, shift+click)
    if (e.detail >= 3 || (e.shiftKey && e.detail >= 1)) {
      e.preventDefault()
      this.logAttempt('select')
    }
  }

  private showWarning(message: string) {
    // Создаем временное предупреждение
    const warning = document.createElement('div')
    warning.textContent = message
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `

    document.body.appendChild(warning)

    // Удаляем после 3 секунд
    setTimeout(() => {
      warning.remove()
    }, 3000)
  }

  private sendToServer(attempt: CopyAttempt) {
    const endpoint = this.options.serverEndpoint || '/api/security/log-copy-attempt'

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attempt,
        totalAttempts: this.attempts.length,
        timestamp: new Date().toISOString()
      })
    }).catch((err) => {
      console.error('Ошибка при отправке лога копирования:', err)
    })
  }

  // Публичные методы

  /**
   * Получить список всех попыток копирования
   */
  getAttempts(): CopyAttempt[] {
    return [...this.attempts]
  }

  /**
   * Получить количество попыток
   */
  getAttemptCount(): number {
    return this.attempts.length
  }

  /**
   * Проверить если элемент заблокирован
   */
  isElementBlocked(): boolean {
    return this.isBlocked
  }

  /**
   * Разблокировать элемент
   */
  unblock() {
    this.isBlocked = false
    this.element.style.opacity = '1'
    this.element.style.pointerEvents = 'auto'
    this.attempts = []
  }

  /**
   * Очистить логи попыток
   */
  clearAttempts() {
    this.attempts = []
  }

  /**
   * Удалить защиту
   */
  destroy() {
    this.element.removeEventListener('copy', this.handleCopy.bind(this))
    this.element.removeEventListener('selectstart', this.handleSelectStart.bind(this))
    this.element.removeEventListener('contextmenu', this.handleContextMenu.bind(this))
    this.element.removeEventListener('dragstart', this.handleDragStart.bind(this))
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this))
  }
}

/**
 * React хук для продвинутой защиты
 */
export function useAdvancedCopyProtection(
  ref: React.RefObject<HTMLElement>,
  options?: Partial<AdvancedProtectionOptions>
) {
  const [protection, setProtection] = React.useState<AdvancedCopyProtection | null>(null)

  React.useEffect(() => {
    if (ref.current) {
      const protectionInstance = new AdvancedCopyProtection(ref.current, options)
      setProtection(protectionInstance)

      return () => {
        protectionInstance.destroy()
      }
    }
  }, [ref, options])

  return protection
}
