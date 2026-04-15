#!/usr/bin/env python
import os
import sys


def main() -> None:
  # Full Syndicate API (courses, challenges, portal, …) uses syndicate_backend.settings.
  # Minimal OTP-only server (no /api/challenges/, etc.): RUN_MINIMAL_OTP_SERVER=1 → config.settings.
  minimal = (os.environ.get("RUN_MINIMAL_OTP_SERVER") or "").strip().lower() in ("1", "true", "yes")
  if minimal:
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
  else:
    current = (os.environ.get("DJANGO_SETTINGS_MODULE") or "").strip()
    if not current or current == "config.settings":
      os.environ["DJANGO_SETTINGS_MODULE"] = "syndicate_backend.settings"
  try:
    from django.core.management import execute_from_command_line
  except ImportError as exc:
    raise ImportError(
      "Couldn't import Django. Install it with: pip install django"
    ) from exc
  execute_from_command_line(sys.argv)


if __name__ == "__main__":
  main()
