"""
WSGI config for syndicate_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syndicate_backend.settings")

import django

django.setup()

# Apply DB migrations at import so deploys work even when the shell start command is wrong.
# Use gunicorn --preload so this runs once in the master before workers fork.
if (os.environ.get("SKIP_WSGI_MIGRATE") or "").strip().lower() not in ("1", "true", "yes"):
    from django.conf import settings
    from django.core.management import call_command

    _engine = (settings.DATABASES["default"].get("ENGINE") or "").lower()
    _is_sqlite = _engine == "django.db.backends.sqlite3"
    if not _is_sqlite:
        print("syndicate_backend.wsgi: running migrate on default database", file=sys.stderr, flush=True)
        try:
            call_command("migrate", interactive=False, verbosity=1)
        except Exception:
            print("syndicate_backend.wsgi: migrate failed", file=sys.stderr, flush=True)
            raise
        print("syndicate_backend.wsgi: migrate finished", file=sys.stderr, flush=True)
    else:
        print(
            "syndicate_backend.wsgi: skipping migrate (SQLite default)",
            file=sys.stderr,
            flush=True,
        )

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
