"""Create admin superuser from env (Railway / automated deploy)."""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


def _truthy(name: str) -> bool:
    return (os.environ.get(name) or "").strip().lower() in ("1", "true", "yes")


class Command(BaseCommand):
    help = (
        "If DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD are set, "
        "ensure a superuser exists (username = email). Safe to run on every deploy. "
        "Set DJANGO_SUPERUSER_SYNC_PASSWORD=1 once to reset that user's password from the env var."
    )

    def handle(self, *args, **options):
        email = (os.environ.get("DJANGO_SUPERUSER_EMAIL") or "").strip().lower()
        password = (os.environ.get("DJANGO_SUPERUSER_PASSWORD") or "").strip()
        if not email or not password:
            self.stdout.write("ensure_superuser: skip (set DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD)")
            return

        sync_pw = _truthy("DJANGO_SUPERUSER_SYNC_PASSWORD")
        existing = User.objects.filter(username=email).first()

        if existing:
            if sync_pw and existing.is_superuser:
                existing.set_password(password)
                existing.save(update_fields=["password"])
                self.stdout.write(self.style.SUCCESS(f"ensure_superuser: password updated for {email}"))
            else:
                self.stdout.write(f"ensure_superuser: already exists ({email})")
            return

        User.objects.create_superuser(username=email, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"ensure_superuser: created {email}"))
