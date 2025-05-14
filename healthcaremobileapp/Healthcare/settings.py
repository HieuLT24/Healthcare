CORS_ALLOWED_ORIGINS = [
    "http://192.168.1.15:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://10.0.2.2:8000",  # Android emulator
    "exp://192.168.1.15:19000",  # Expo development server
    "http://192.168.1.15:19000",  # Expo development server alternative
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

# Add this to handle preflight requests
CORS_REPLACE_HTTPS_REFERER = True 