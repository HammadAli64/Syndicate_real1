import json
import random
import secrets
from datetime import timedelta

import stripe
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import LoginOTP, PendingSignup, ReturningCheckout, SignupOTP


def _json_error(message: str, status: int = 400) -> JsonResponse:
  return JsonResponse({"error": message}, status=status)


def _read_payload(request):
  try:
    return json.loads(request.body.decode("utf-8"))
  except json.JSONDecodeError:
    return None


def _generate_otp() -> str:
  return f"{random.randint(0, 999999):06d}"


def _send_login_otp_email(email: str, otp_code: str, username: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  subject = "Your login OTP code"
  body = (
    f"Hello {username},\n\n"
    f"Your login OTP code is: {otp_code}\n"
    f"This code expires in {expires_minutes} minutes.\n\n"
    "If you did not request this, please ignore this email."
  )
  send_mail(
    subject=subject,
    message=body,
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=[email],
    fail_silently=False,
  )


def _send_signup_otp_email(email: str, otp_code: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  subject = "Your Syndicate signup verification code"
  body = (
    f"Your signup verification code is: {otp_code}\n"
    f"This code expires in {expires_minutes} minutes.\n\n"
    "If you did not request this, please ignore this email."
  )
  send_mail(
    subject=subject,
    message=body,
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=[email],
    fail_silently=False,
  )


def _unique_pending_username() -> str:
  for _ in range(32):
    candidate = f"syn_{secrets.token_hex(10)}"
    if not User.objects.filter(username=candidate).exists():
      return candidate
  return f"syn_{secrets.token_hex(16)}"


def _create_and_email_login_otp(email: str):
  """Create LoginOTP and send email. Returns None on success, or JsonResponse error."""
  try:
    user_by_email = User.objects.get(email=email)
  except User.DoesNotExist:
    return _json_error("No account found for this email.", status=404)

  otp_code = _generate_otp()
  expires_at = timezone.now() + timedelta(
    minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  )
  LoginOTP.objects.update_or_create(
    email=email,
    defaults={"otp_code": otp_code, "otp_expires_at": expires_at},
  )

  try:
    _send_login_otp_email(email=email, otp_code=otp_code, username=user_by_email.username)
  except Exception:
    return _json_error("Failed to send login OTP email.", status=500)

  return None


@csrf_exempt
@require_POST
def signup_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  password = str(payload.get("password", ""))
  if not email:
    return _json_error("Email is required.")
  if len(password) < 6:
    return _json_error("Password must be at least 6 characters.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  if User.objects.filter(email=email).exists():
    return _json_error("Email already registered.", status=400)

  user = User.objects.create_user(username=email, email=email, password=password)
  token = secrets.token_urlsafe(32)
  return JsonResponse(
    {
      "token": token,
      "user": {"id": user.id, "email": user.email},
    },
    status=201,
  )


@csrf_exempt
@require_POST
def verify_signup_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()

  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  try:
    pending_signup = PendingSignup.objects.get(email=email)
  except PendingSignup.DoesNotExist:
    return _json_error("No pending signup for this email.", status=404)

  if pending_signup.is_paid:
    return _json_error("Checkout already completed for this email.", status=400)

  try:
    signup_otp = SignupOTP.objects.get(email=email)
  except SignupOTP.DoesNotExist:
    return _json_error("Verification not requested for this email.", status=404)

  if signup_otp.otp_expires_at < timezone.now():
    signup_otp.delete()
    return _json_error("Verification code expired. Please sign up again.", status=400)

  if signup_otp.otp_code != otp:
    return _json_error("Invalid verification code.", status=400)

  signup_otp.delete()

  return JsonResponse(
    {
      "message": "Email verified. Continue to checkout.",
      "signup_token": str(pending_signup.token),
      "email": email,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def create_checkout_session_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  signup_token = str(payload.get("signup_token", "")).strip()
  if not signup_token:
    return _json_error("Signup token is required.")

  pending_signup = PendingSignup.objects.filter(token=signup_token).first()
  returning = None
  if pending_signup is None:
    try:
      returning = ReturningCheckout.objects.get(token=signup_token)
    except ReturningCheckout.DoesNotExist:
      return _json_error("Checkout link not found.", status=404)

  if pending_signup is not None:
    if pending_signup.is_paid:
      return _json_error("Checkout already completed for this account.", status=400)
    checkout_email = pending_signup.email
    metadata = {
      "signup_token": str(pending_signup.token),
      "email": checkout_email,
      "checkout_kind": "new_signup",
    }
  else:
    if not User.objects.filter(email=returning.email).exists():
      return _json_error("No account found for this checkout link.", status=404)
    checkout_email = returning.email
    metadata = {
      "returning_token": str(returning.token),
      "email": checkout_email,
      "checkout_kind": "returning",
    }

  if not settings.STRIPE_SECRET_KEY:
    return _json_error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
      status=500,
    )

  stripe.api_key = settings.STRIPE_SECRET_KEY
  frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")

  def _session_create(pm_types: list[str]):
    return stripe.checkout.Session.create(
      mode="payment",
      customer_email=checkout_email,
      payment_method_types=pm_types,
      line_items=[
        {
          "price_data": {
            "currency": "gbp",
            "product_data": {"name": "The Syndicate Membership Checkout"},
            "unit_amount": settings.CHECKOUT_AMOUNT_PENCE,
          },
          "quantity": 1,
        }
      ],
      success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
      cancel_url=f"{frontend_base}/signup",
      custom_text={
        "submit": {"message": "The Syndicate — secure checkout"},
      },
      metadata=metadata,
    )

  pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
  try:
    session = _session_create(pm_list)
  except stripe.error.InvalidRequestError as exc:
    err_txt = str(exc).lower()
    if "pay_by_bank" in pm_list and "pay_by_bank" in err_txt:
      pm_retry = [t for t in pm_list if t != "pay_by_bank"]
      try:
        session = _session_create(pm_retry)
      except stripe.error.StripeError as exc2:
        msg = getattr(exc2, "user_message", None) or str(exc2) or "Stripe could not start checkout."
        return _json_error(msg, status=400)
    else:
      msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
      return _json_error(msg, status=400)
  except stripe.error.StripeError as exc:
    msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
    return _json_error(msg, status=400)
  except Exception:
    return _json_error("Unable to create checkout session.", status=500)

  if pending_signup is not None:
    pending_signup.stripe_checkout_session_id = session.id
    pending_signup.save(update_fields=["stripe_checkout_session_id", "updated_at"])
  else:
    returning.stripe_checkout_session_id = session.id
    returning.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  return JsonResponse(
    {
      "checkout_url": session.url,
      "session_id": session.id,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def checkout_success_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  session_id = str(payload.get("session_id", "")).strip()
  if not session_id:
    return _json_error("Session ID is required.")

  stripe.api_key = settings.STRIPE_SECRET_KEY
  try:
    session = stripe.checkout.Session.retrieve(session_id)
  except Exception:
    return _json_error("Invalid checkout session.", status=400)

  if session.payment_status != "paid":
    return _json_error("Payment not completed.", status=400)

  pending_signup = PendingSignup.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  if pending_signup is not None:
    if User.objects.filter(username=pending_signup.username).exists():
      return _json_error("Username already exists. Please sign up again.")
    if User.objects.filter(email=pending_signup.email).exists():
      return _json_error("Email already registered. Please login.")

    user = User(
      username=pending_signup.username,
      email=pending_signup.email,
      password=pending_signup.password_hash,
    )
    user.save()
    pending_signup.is_paid = True
    pending_signup.save(update_fields=["is_paid", "updated_at"])

    return JsonResponse(
      {"message": "Payment successful.", "email": user.email},
      status=200,
    )

  returning = ReturningCheckout.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  if returning is not None:
    return JsonResponse(
      {
        "message": "Payment successful. Thank you for your purchase.",
        "email": returning.email,
      },
      status=200,
    )

  return _json_error("Checkout record not found for this payment.", status=404)


@csrf_exempt
@require_POST
def login_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  password = str(payload.get("password", ""))
  if not email or not password:
    return _json_error("Email and password are required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  user = authenticate(username=email, password=password)
  if not user:
    return _json_error("Invalid credentials.", status=401)

  token = secrets.token_urlsafe(32)
  return JsonResponse(
    {
      "token": token,
      "user": {"id": user.id, "email": user.email},
    },
    status=200,
  )


@csrf_exempt
@require_POST
def verify_login_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()

  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  try:
    user = User.objects.get(email=email)
  except User.DoesNotExist:
    return _json_error("Invalid email.", status=401)

  try:
    login_otp = LoginOTP.objects.get(email=email)
  except LoginOTP.DoesNotExist:
    return _json_error("OTP not requested for this email.", status=404)

  if login_otp.otp_expires_at < timezone.now():
    login_otp.delete()
    return _json_error("OTP expired. Please login again.", status=400)

  if login_otp.otp_code != otp:
    return _json_error("Invalid OTP code.", status=400)

  login_otp.delete()
  return JsonResponse(
    {
      "message": "Login verified successfully.",
      "redirect_url": settings.POST_LOGIN_REDIRECT_URL,
      "user": {"id": user.id, "username": user.username, "email": user.email},
    },
    status=200,
  )
