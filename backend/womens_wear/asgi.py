"""
ASGI config for womens_wear project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'womens_wear.settings')

application = get_asgi_application()
