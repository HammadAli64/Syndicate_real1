import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syndicate_backend.settings")

app = Celery("syndicate_backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
