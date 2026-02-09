import multiprocessing

workers = (multiprocessing.cpu_count() * 2) + 1
worker_class = 'gthread'
threads = 4
preload_app = True
timeout = 30
graceful_timeout = 30
keepalive = 2
accesslog = '-'  # stdout
errorlog = '-'
loglevel = 'info'
capture_output = True

# Recommended limits for production
worker_connections = 1000
