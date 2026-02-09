### Multi-stage build: build React client, then build Python app and copy static files

# -------- Stage 1: Build client --------
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* client/yarn.lock* ./
COPY client/tsconfig.json client/vite.config.ts client/postcss.config.js ./
COPY client/ .
RUN npm ci --silent && npm run build

# -------- Stage 2: Build backend image --------
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    netcat-openbsd \
    tini \
    && rm -rf /var/lib/apt/lists/*

# copy requirements first for better caching
COPY requirements.txt requirements-optional.txt ./
RUN pip install --no-cache-dir -r requirements.txt || true
RUN pip install --no-cache-dir gunicorn || true
RUN ["/bin/sh", "-c", "test -f requirements-optional.txt && pip install --no-cache-dir -r requirements-optional.txt || true || true"]

# copy application code
COPY . .

# copy built client into place so Flask can serve it
COPY --from=client-build /app/client/dist ./client/dist

RUN addgroup --system app && adduser --system --ingroup app app
RUN chown -R app:app /app

# Make scripts executable
RUN chmod +x /app/entrypoint.sh || true
RUN chmod +x /app/scripts/wait-for.sh || true

USER app

ENV FLASK_ENV=production
EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--", "/app/entrypoint.sh"]
CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
