import os

from django.core.wsgi import get_wsgi_application

# Minimal OTP-only app. For the full API use syndicate_backend.wsgi (see railway_start.sh).
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
