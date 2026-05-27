import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "anvaya.settings.dev")

application = get_wsgi_application()
