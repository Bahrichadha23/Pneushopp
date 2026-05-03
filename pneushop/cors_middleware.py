class CorsAlwaysAllowMiddleware:
    """
    Safety-net middleware: ensures CORS headers are present on EVERY response,
    including unhandled 500 errors where django-cors-headers may not run.
    Must be placed FIRST in MIDDLEWARE (before corsheaders.middleware.CorsMiddleware).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        except Exception:
            from django.http import JsonResponse
            import traceback
            response = JsonResponse({'error': 'Internal server error', 'detail': traceback.format_exc()}, status=500)

        origin = request.META.get('HTTP_ORIGIN', '*')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'

        if request.method == 'OPTIONS':
            response['Access-Control-Max-Age'] = '86400'

        return response
