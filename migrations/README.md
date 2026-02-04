# Database Migration: Fix Invalid Image URLs

Ця міграція очищає невалідні URL зображень у базі даних, встановлюючи їх у `NULL`.

## Виконання міграції

### Варіант 1: SQL скрипт (для PostgreSQL/SQLite)

```bash
# Для PostgreSQL
psql -U your_user -d freedom13 -f migrations/fix_image_urls.sql

# Або через psql інтерактивно
psql -U your_user -d freedom13
\i migrations/fix_image_urls.sql
```

### Варіант 2: Python скрипт (рекомендовано)

```bash
# З кореня проекту
python -m app.scripts.fix_image_urls
```

## Що робить міграція

1. **Оновлює `posts.image_url`**: Встановлює `NULL` для порожніх рядків, 'null', 'NULL', 'undefined'
2. **Оновлює `users.avatar_url`**: Те саме для аватарок користувачів
3. **Оновлює `profile_posts.image_url`**: Те саме для зображень на стіні профілю

## Перевірка результатів

Після виконання міграції можна перевірити результати:

```sql
-- Підрахунок NULL vs non-NULL значень
SELECT 
  'posts' as table_name,
  COUNT(*) FILTER (WHERE image_url IS NULL) as null_count,
  COUNT(*) FILTER (WHERE image_url IS NOT NULL) as non_null_count
FROM posts;
```

## Безпека

- Міграція **не видаляє** дані, тільки встановлює невалідні значення у `NULL`
- Можна виконати кілька разів безпечно (idempotent)
- Не впливає на валідні URL
