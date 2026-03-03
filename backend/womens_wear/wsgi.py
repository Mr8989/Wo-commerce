"""
WSGI config for womens_wear project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'womens_wear.settings')

application = get_wsgi_application()
