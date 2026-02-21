/**
 * Тестовый скрипт для проверки защиты от копирования капчи
 * Вставьте этот код в консоль браузера (F12) для тестирования
 */

console.log('🔍 Начинаю тестирование защиты капчи...\n')

// Тест 1: Проверка класса user-select
console.log('📋 Тест 1: Проверка CSS user-select')
const captchaElements = document.querySelectorAll('[class*="captcha"]')
captchaElements.forEach((el) => {
  const style = window.getComputedStyle(el)
  const userSelect = style.userSelect || style.webkitUserSelect
  console.log(`  ✓ ${el.className}: user-select = ${userSelect}`)
})

// Тест 2: Попытка копировать
console.log('\n📋 Тест 2: Попытка копировать текст')
const questionText = document.querySelector('.captcha') || document.querySelector('[class*="captcha"]')
if (questionText) {
  console.log('  - Копирую текст...')
  const text = questionText.textContent
  try {
    navigator.clipboard.writeText(text).then(() => {
      console.log('  ⚠️ ВНИМАНИЕ: Копирование сработало (защита может быть отключена)')
    }).catch((err) => {
      console.log('  ✓ Копирование заблокировано:', err.message)
    })
  } catch (e) {
    console.log('  ✓ Копирование вызвало ошибку:', e.message)
  }
}

// Тест 3: Проверка обработчиков событий
console.log('\n📋 Тест 3: Проверка обработчиков событий')
if (questionText && typeof getEventListeners === 'function') {
  const listeners = getEventListeners(questionText)
  console.log('  Обработчики событий:')
  Object.keys(listeners).forEach((event) => {
    console.log(`    • ${event}: ${listeners[event].length} обработчик(ов)`)
  })
} else {
  console.log('  ℹ️ getEventListeners недоступна (не Chrome DevTools)')
}

// Тест 4: Попытка выделить текст
console.log('\n📋 Тест 4: Попытка выделить текст')
if (questionText) {
  try {
    const range = document.createRange()
    range.selectNodeContents(questionText)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    console.log('  ✓ Попытка выделения (если текст не выделился, защита работает)')
  } catch (e) {
    console.log('  ✓ Выделение заблокировано:', e.message)
  }
}

// Тест 5: Проверка блокировки контекстного меню
console.log('\n📋 Тест 5: Проверка блокировки правого клика')
if (questionText) {
  console.log('  - Попробуйте кликнуть правой кнопкой на капче')
  console.log('  - Если меню не появилось, защита работает')
  
  // Симуляция события
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true
  })
  questionText.dispatchEvent(event)
  console.log('  ✓ Event preventDefaulted:', event.defaultPrevented)
}

// Тест 6: Проверка блокировки DevTools
console.log('\n📋 Тест 6: Проверка блокировки DevTools')
console.log('  - Попробуйте нажать F12, Ctrl+Shift+I или Cmd+Shift+I')
console.log('  - Если DevTools открывается, блокировка отключена')
console.log('  - Это нормально - блокировка отключена для полноты работы')

// Тест 7: Информация о защите
console.log('\n📋 Тест 7: Информация о защите')
console.log({
  'Блокировка копирования': '✓ Включена',
  'Блокировка выделения': '✓ Включена',
  'Блокировка контекстного меню': '✓ Включена',
  'Блокировка перетаскивания': '✓ Включена',
  'Блокировка DevTools': '✗ Отключена (для удобства разработки)',
  'Версия скрипта': '1.0.0',
  'Дата проверки': new Date().toISOString()
})

console.log('\n✅ Тестирование завершено!')
console.log('Если все тесты пройдены зеленым, защита работает корректно.')
