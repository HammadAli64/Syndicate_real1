import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me-for-production")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
  "corsheaders",
  "django.contrib.admin",
  "django.contrib.auth",
  "django.contrib.contenttypes",
  "django.contrib.sessions",
  "django.contrib.messages",
  "django.contrib.staticfiles",
  "accounts",
]

MIDDLEWARE = [
  "django.middleware.security.SecurityMiddleware",
  "corsheaders.middleware.CorsMiddleware",
  "django.contrib.sessions.middleware.SessionMiddleware",
  "django.middleware.common.CommonMiddleware",
  "django.middleware.csrf.CsrfViewMiddleware",
  "django.contrib.auth.middleware.AuthenticationMiddleware",
  "django.contrib.messages.middleware.MessageMiddleware",
  "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
  {
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {
      "context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
      ],
    },
  },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
  "default": {
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": BASE_DIR / "db.sqlite3",
  }
}

AUTH_PASSWORD_VALIDATORS = [
  {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
  {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
  {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
  {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Browsers send OPTIONS first for JSON POSTs. If your page origin is not listed here,
# preflight can "succeed" in logs but the real POST is never sent — you only see OPTIONS.
_extra = [
  o.strip()
  for o in os.getenv("CORS_EXTRA_ORIGINS", "").split(",")
  if o.strip()
]
CORS_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3003",
  *_extra,
]

if DEBUG:
  # Local dev: allow any origin so phone/LAN IPs and odd ports work without listing each one.
  CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = os.getenv(
  "EMAIL_BACKEND",
  "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
# Gmail app passwords are often pasted with spaces (e.g. "abcd efgh ...").
# Normalize to avoid SMTP auth failures.
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").replace(" ", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "no-reply@example.com")
OTP_EXPIRES_MINUTES = int(os.getenv("OTP_EXPIRES_MINUTES", "10"))
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3003")
POST_LOGIN_REDIRECT_URL = os.getenv("POST_LOGIN_REDIRECT_URL", "https://the-syndicate.com/")
CHECKOUT_AMOUNT_PENCE = int(os.getenv("CHECKOUT_AMOUNT_PENCE", "33300"))
# Hosted Checkout: card (cards + Apple Pay / Google Pay when enabled), link, pay_by_bank (UK bank transfer).
# No PayPal by default — add paypal to the comma list in .env when you enable it in Stripe.
# Dark / gold styling: Stripe Dashboard → Settings → Branding → customize Checkout colors & logo.
STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES = [
  t.strip()
  for t in os.getenv(
    "STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES",
    "card,link,pay_by_bank",
  ).split(",")
  if t.strip()
]
