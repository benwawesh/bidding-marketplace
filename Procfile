web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
worker: daphne config.asgi:application -b 0.0.0.0 -p 8001
