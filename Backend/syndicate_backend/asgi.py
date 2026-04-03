"""
ASGI config for syndicate_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syndicate_backend.settings")

import django

django.setup()

# Same as wsgi.py: if the platform runs ASGI (e.g. uvicorn) instead of WSGI, tables still get created.
if (os.environ.get("SKIP_WSGI_MIGRATE") or "").strip().lower() not in ("1", "true", "yes"):
    from django.conf import settings
    from django.core.management import call_command

    _engine = (settings.DATABASES["default"].get("ENGINE") or "").lower()
    if _engine != "django.db.backends.sqlite3":
        print("syndicate_backend.asgi: running migrate on default database", flush=True)
        call_command("migrate", interactive=False, verbosity=1)
        print("syndicate_backend.asgi: migrate finished", flush=True)

from django.core.asgi import get_asgi_application

application = get_asgi_application()
