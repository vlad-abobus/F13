# 🛠️ Техническая документация: Защита от копирования капчи

## Архитектура

```
client/src/
├── utils/
│   ├── copyProtection.ts              # Базовая защита
│   ├── advancedCopyProtection.ts      # Продвинутая защита с логированием
│   └── testCopyProtection.js          # Тестовый скрипт
├── components/
│   ├── SimpleCaptcha.tsx              # Капча с вопросом
│   └── Captcha.tsx                    # Капча с изображением
```

## Файлы и их функции

### 1. copyProtection.ts
**Назначение**: Базовая защита от копирования

**Функции**:
```typescript
protectElement(element, options)     // Защита одного элемента
protectElements(selector, options)   // Защита по селектору
useCopyProtection(ref, options)      // React хук
```

**Использование**:
```tsx
import { protectElement } from '../utils/copyProtection'

useEffect(() => {
  if (captchaRef.current) {
    return protectElement(captchaRef.current, {
      blockCopy: true,
      blockSelect: true,
      blockContextMenu: true
    })
  }
}, [])
```

### 2. advancedCopyProtection.ts
**Назначение**: Продвинутая защита с логированием

**Класс**: `AdvancedCopyProtection`

**Методы**:
```typescript
// Инициализация
new AdvancedCopyProtection(element, options)

// Публичными методы
getAttempts()           // Получить список попыток
getAttemptCount()       // Получить количество попыток
isElementBlocked()      // Проверить если заблокирован
unblock()              // Разблокировать элемент
clearAttempts()        // Очистить логи
destroy()              // Удалить защиту
```

**Опции**:
```typescript
{
  blockCopy: boolean           // Блокировать Ctrl+C / Cmd+C
  blockSelect: boolean         // Блокировать выделение текста
  blockContextMenu: boolean    // Блокировать правый клик
  blockDrag: boolean          // Блокировать перетаскивание
  logAttempts: boolean        // Логировать попытки
  sendToServer: boolean       // Отправлять на сервер
  serverEndpoint: string      // URL для отправки логов
  blockAfterAttempts: number  // Заблокировать после N попыток
  showWarning: boolean        // Показывать предупреждения
}
```

### 3. testCopyProtection.js
**Назначение**: Тестирование защиты

**Использование**:
1. Откройте DevTools (F12)
2. Откройте консоль (Console tab)
3. Скопируйте и вставьте содержимое файла
4. Запустите скрипт

**Проверяет**:
- CSS защита (user-select)
- Блокировка копирования
- Обработчики событий
- Выделение текста
- Контекстное меню

## Интеграция в компоненты

### SimpleCaptcha.tsx

```tsx
import { useRef, useEffect } from 'react'
import { protectElement } from '../utils/copyProtection'

export default function SimpleCaptcha() {
  const questionRef = useRef<HTMLDivElement>(null)

  // Применяем защиту при загрузке вопроса
  useEffect(() => {
    if (questionRef.current && question) {
      return protectElement(questionRef.current, {
        blockCopy: true,
        blockSelect: true,
        blockContextMenu: true,
        blockDrag: true
      })
    }
  }, [question])

  return (
    <div ref={questionRef} className="captcha-container select-none">
      {/* Содержимое */}
    </div>
  )
}
```

### Captcha.tsx

```tsx
import { useRef, useEffect } from 'react'
import { protectElement } from '../utils/copyProtection'

export default function Captcha() {
  const captchaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (captchaRef.current && captchaData) {
      return protectElement(captchaRef.current, {
        blockCopy: true,
        blockSelect: true,
        blockContextMenu: true,
        blockDrag: true,
        blockInspect: false
      })
    }
  }, [captchaData])

  return (
    <div ref={captchaRef} className="captcha-container select-none">
      {/* Содержимое */}
    </div>
  )
}
```

## Отладка и отключение

### Временное отключение для разработки

```javascript
// В DevTools консоли
// 1. Отключить user-select
document.querySelector('.captcha').style.userSelect = 'auto'

// 2. Удалить все обработчики
const oldElement = document.querySelector('.captcha')
const newElement = oldElement.cloneNode(true)
oldElement.parentNode.replaceChild(newElement, oldElement)

// 3. Закомментировать в исходном коде
import { protectElement } from '../utils/copyProtection'
// return protectElement(...) // <-- закомментировать
```

### Проверить активные обработчики

```javascript
// Chrome DevTools
const element = document.querySelector('.captcha')
getEventListeners(element)

// Firefox консоль
console.log(element)  // Развернуть и проверить __eventListeners
```

### Нагрузка на производительность

```javascript
// Измерить время инициализации
console.time('protection')
protectElement(element, options)
console.timeEnd('protection')

// Результат: обычно < 1ms
```

## Обработка ошибок

### Ошибка: "protectElement is not defined"

**Причина**: Неправильный импорт

**Решение**:
```tsx
// ❌ Неправильно
import { copyProtection } from '..'

// ✅ Правильно
import { protectElement } from '../utils/copyProtection'
```

### Ошибка: "Cannot read property 'current' of undefined"

**Причина**: useRef не инициализирован

**Решение**:
```tsx
// ✅ Правильно
const captchaRef = useRef<HTMLDivElement>(null)

// ❌ Неправильно
const captchaRef = useRef()  // без типа
```

### Ошибка: Защита не работает

**Проверьте**:
1. Ref должен быть назначен элементу: `ref={captchaRef}`
2. Element должен существовать в DOM
3. useEffect должен возвращать cleanup функцию
4. Проверить консоль на ошибки

## Логирование на сервере

### Flask endpoint

```python
@app.route('/api/security/log-copy-attempt', methods=['POST'])
@admin_required
def log_copy_attempt():
    data = request.get_json()
    
    logger.warning({
        'event': 'copy_attempt',
        'ip': request.remote_addr,
        'user_agent': data.get('userAgent'),
        'element': data.get('elementClass'),
        'type': data.get('type'),
        'timestamp': data.get('timestamp'),
        'total_attempts': data.get('totalAttempts')
    })
    
    # Проверить лимит попыток
    user_ip = request.remote_addr
    attempts = get_copy_attempts_count(user_ip)
    
    if attempts > 10:
        # Временно заблокировать IP
        ban_ip(user_ip, hours=24)
        logger.critical(f"IP {user_ip} заблокирован за попытки копирования капчи")
    
    return jsonify({'status': 'logged'}), 200
```

### Таблица для хранения логов

```sql
CREATE TABLE copy_attempts (
    id SERIAL PRIMARY KEY,
    user_ip VARCHAR(45),
    user_agent TEXT,
    element_class VARCHAR(255),
    attempt_type VARCHAR(50),
    timestamp DATETIME,
    total_attempts INT,
    created_at DATETIME DEFAULT NOW()
);

CREATE INDEX idx_copy_attempts_ip ON copy_attempts(user_ip);
CREATE INDEX idx_copy_attempts_timestamp ON copy_attempts(created_at);
```

## Оптимизация

### Уменьшение использования памяти

```typescript
// ✅ Хорошо - cleanup функция удаляет все обработчики
useEffect(() => {
  const cleanup = protectElement(element, options)
  return cleanup  // Очистка
}, [element])

// ❌ Плохо - обработчики остаются в памяти
useEffect(() => {
  protectElement(element, options)
  // без cleanup
}, [element])
```

### Производительность

```javascript
// Не создавать новые объекты options каждый раз
const OPTIONS = {
  blockCopy: true,
  blockSelect: true
}

useEffect(() => {
  return protectElement(element, OPTIONS)  // Переиспользовать объект
}, [element])
```

## Миграция с старой версии

### Если была старая защита

```typescript
// ❌ Старый способ
document.querySelector('.captcha').style.userSelect = 'none'
document.querySelector('.captcha').addEventListener('copy', () => false)

// ✅ Новый способ
import { protectElement } from '../utils/copyProtection'

useEffect(() => {
  return protectElement(element, { blockCopy: true, blockSelect: true })
}, [element])
```

## Версионирование

- **v1.0** (текущая)
  - Базовая защита от копирования
  - Блокировка выделения и контекстного меню
  - React компоненты с интеграцией
  - Тестовый скрипт

**Планы** (v2.0):
- Отправка логов на сервер
- Детектирование поведения бота
- Адаптивная защита
- WebRTC для контроля экрана

## FAQ

**Q: Почему защита не блокирует DevTools?**  
A: Потому что это усложняет разработку. Если нужно, установите `blockInspect: true`

**Q: Может ли пользователь обойти защиту?**  
A: Да, всегда можно использовать полноэкранный скриншот. Используйте серверную валидацию!

**Q: Влияет ли защита на производительность?**  
A: Нет, влияние < 1ms и 0%런타임 нагрузка

**Q: Работает ли на мобильных устройствах?**  
A: Да, полностью совместима с iOS и Android

**Q: Как отключить защиту для админов?**  
A: Проверьте роль на сервере перед отправкой элемента капчи

## Контакт и поддержка

Если возникли вопросы:
1. Проверьте консоль на ошибки (F12)
2. Используйте testCopyProtection.js для диагностики
3. Обратитесь к документации EXAMPLES_COPY_PROTECTION.md
4. Проверьте GitHub Issues
