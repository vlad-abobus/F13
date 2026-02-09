#!/usr/bin/env sh
set -e

echo "Starting entrypoint..."

# Wait for DB and Redis if configured
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}

# Wait for DB
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
  echo "Waiting for DB $DB_HOST:$DB_PORT..."
  /app/scripts/wait-for.sh "$DB_HOST" "$DB_PORT"
fi

# Wait for Redis
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
  echo "Waiting for Redis $REDIS_HOST:$REDIS_PORT..."
  /app/scripts/wait-for.sh "$REDIS_HOST" "$REDIS_PORT"
fi

# Run database initialization if script exists
if [ -f "/app/INIT_DB.py" ]; then
  echo "Running database init script..."
  python INIT_DB.py || true
fi

exec "$@"
