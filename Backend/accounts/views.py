import json
import random
import secrets
from datetime import timedelta

import stripe
from django.conf import settings
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.affiliate_tracking.views import ensure_affiliate_profile_for_existing_user, referral_ids_payload

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
  subject = "Your Syndicate login verification code"
  html_body = f"""
  <div style="margin:0;padding:34px 16px;background:#020305;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#d8e5f2;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #cda936;border-radius:16px;background:radial-gradient(920px 460px at 8% -8%,rgba(34,211,238,0.12),rgba(0,0,0,0) 56%),radial-gradient(760px 420px at 100% 0%,rgba(250,204,21,0.10),rgba(0,0,0,0) 58%),#070a10;overflow:hidden;box-shadow:0 0 0 1px rgba(205,169,54,0.28),0 0 0 2px rgba(250,204,21,0.06) inset,0 26px 88px rgba(0,0,0,0.7);">
      <div style="padding:20px 24px 16px;border-bottom:1px solid #cda936;background:linear-gradient(140deg,rgba(5,12,18,0.96),rgba(7,9,13,0.98));">
        <div style="display:inline-block;padding:5px 10px;border:1px solid #cda936;border-radius:3px;background:rgba(205,169,54,0.12);font-size:10px;font-weight:700;letter-spacing:1.7px;color:#fde68a;text-transform:uppercase;">Neural Access Node</div>
        <div style="margin-top:11px;font-size:33px;line-height:1.02;font-weight:800;letter-spacing:1.6px;color:#facc15;text-transform:uppercase;">The Syndicate</div>
        <div style="margin-top:8px;font-size:12px;letter-spacing:1.7px;color:#c5d4e6;text-transform:uppercase;">Money, Power, Honour and Freedom.</div>
        <div style="margin-top:10px;height:1px;background:linear-gradient(90deg,rgba(34,211,238,0.55),rgba(250,204,21,0.28),rgba(0,0,0,0));"></div>
      </div>
      <div style="padding:26px;">
        <p style="margin:0 0 11px;font-size:15px;line-height:1.5;color:#c7d8e8;">Operator <span style="color:#fef3c7;">{username}</span>,</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#b8c9dc;">
          Authentication handshake initiated. Use this access code to complete login.
        </p>
        <div style="margin:0 0 16px;padding:20px 16px;border:1px solid #cda936;border-radius:12px;background:linear-gradient(145deg,rgba(9,18,28,0.96),rgba(9,12,18,0.98));text-align:center;box-shadow:inset 0 0 0 1px rgba(205,169,54,0.15),0 0 26px rgba(205,169,54,0.16);">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7ddbf4;">One-time Code</div>
          <div style="margin-top:10px;font-size:44px;line-height:1;font-weight:800;letter-spacing:9px;color:#facc15;text-shadow:0 0 18px rgba(250,204,21,0.35);">{otp_code}</div>
          <div style="margin-top:12px;font-size:11px;letter-spacing:1.8px;color:#9fb3c8;text-transform:uppercase;">Encrypted Token - Do Not Share</div>
        </div>
        <div style="margin:0 0 14px;padding:12px 14px;border-left:3px solid #cda936;border-top:1px solid #cda936;border-right:1px solid #cda936;border-bottom:1px solid #cda936;border-radius:8px;background:rgba(9,22,34,0.85);font-size:13px;color:#cde8f7;">
          Session window: <strong style="color:#f8fafc;">{expires_minutes} minutes</strong>. Expired token requires regeneration.
        </div>
        <p style="margin:0 0 12px;font-size:13px;color:#93a8bf;">
          This key auto-expires in <strong style="color:#e5e7eb;">{expires_minutes} minutes</strong>.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.65;color:#70839a;">
          If you did not request this login, you can safely ignore this email.
        </p>
      </div>
      <div style="padding:12px 24px 16px;border-top:1px solid #cda936;background:rgba(6,10,14,0.72);font-size:11px;letter-spacing:1.1px;color:#6f8194;text-transform:uppercase;">
        The Syndicate - Operator Security Mailer
      </div>
    </div>
  </div>
  """
  body = strip_tags(html_body)
  msg = EmailMultiAlternatives(
    subject=subject,
    body=body,
    from_email=settings.DEFAULT_FROM_EMAIL,
    to=[email],
  )
  msg.attach_alternative(html_body, "text/html")
  msg.send(fail_silently=False)


def _send_signup_otp_email(email: str, otp_code: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  subject = "Your Syndicate signup verification code"
  html_body = f"""
  <div style="margin:0;padding:34px 16px;background:#020305;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#d8e5f2;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #cda936;border-radius:16px;background:radial-gradient(920px 460px at 8% -8%,rgba(34,211,238,0.12),rgba(0,0,0,0) 56%),radial-gradient(760px 420px at 100% 0%,rgba(250,204,21,0.10),rgba(0,0,0,0) 58%),#070a10;overflow:hidden;box-shadow:0 0 0 1px rgba(205,169,54,0.28),0 0 0 2px rgba(250,204,21,0.06) inset,0 26px 88px rgba(0,0,0,0.7);">
      <div style="padding:20px 24px 16px;border-bottom:1px solid #cda936;background:linear-gradient(140deg,rgba(5,12,18,0.96),rgba(7,9,13,0.98));">
        <div style="display:inline-block;padding:5px 10px;border:1px solid #cda936;border-radius:3px;background:rgba(205,169,54,0.12);font-size:10px;font-weight:700;letter-spacing:1.7px;color:#fde68a;text-transform:uppercase;">Identity Provisioning</div>
        <div style="margin-top:11px;font-size:33px;line-height:1.02;font-weight:800;letter-spacing:1.6px;color:#facc15;text-transform:uppercase;">The Syndicate</div>
        <div style="margin-top:8px;font-size:12px;letter-spacing:1.7px;color:#c5d4e6;text-transform:uppercase;">Money, Power, Honour and Freedom.</div>
        <div style="margin-top:10px;height:1px;background:linear-gradient(90deg,rgba(34,211,238,0.55),rgba(250,204,21,0.28),rgba(0,0,0,0));"></div>
      </div>
      <div style="padding:26px;">
        <p style="margin:0 0 11px;font-size:15px;line-height:1.5;color:#c7d8e8;">Welcome, operator.</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#b8c9dc;">
          Identity verification is required before network access is granted.
        </p>
        <div style="margin:0 0 16px;padding:20px 16px;border:1px solid #cda936;border-radius:12px;background:linear-gradient(145deg,rgba(9,18,28,0.96),rgba(9,12,18,0.98));text-align:center;box-shadow:inset 0 0 0 1px rgba(205,169,54,0.15),0 0 26px rgba(205,169,54,0.16);">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7ddbf4;">Verification Code</div>
          <div style="margin-top:10px;font-size:44px;line-height:1;font-weight:800;letter-spacing:9px;color:#facc15;text-shadow:0 0 18px rgba(250,204,21,0.35);">{otp_code}</div>
          <div style="margin-top:12px;font-size:11px;letter-spacing:1.8px;color:#9fb3c8;text-transform:uppercase;">Encrypted Token - Do Not Share</div>
        </div>
        <div style="margin:0 0 14px;padding:12px 14px;border-left:3px solid #cda936;border-top:1px solid #cda936;border-right:1px solid #cda936;border-bottom:1px solid #cda936;border-radius:8px;background:rgba(9,22,34,0.85);font-size:13px;color:#cde8f7;">
          Session window: <strong style="color:#f8fafc;">{expires_minutes} minutes</strong>. Expired token requires regeneration.
        </div>
        <p style="margin:0 0 12px;font-size:13px;color:#93a8bf;">
          This key auto-expires in <strong style="color:#e5e7eb;">{expires_minutes} minutes</strong>.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.65;color:#70839a;">
          If you did not request this signup, you can safely ignore this email.
        </p>
      </div>
      <div style="padding:12px 24px 16px;border-top:1px solid #cda936;background:rgba(6,10,14,0.72);font-size:11px;letter-spacing:1.1px;color:#6f8194;text-transform:uppercase;">
        The Syndicate - Operator Security Mailer
      </div>
    </div>
  </div>
  """
  body = strip_tags(html_body)
  msg = EmailMultiAlternatives(
    subject=subject,
    body=body,
    from_email=settings.DEFAULT_FROM_EMAIL,
    to=[email],
  )
  msg.attach_alternative(html_body, "text/html")
  msg.send(fail_silently=False)


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
    if settings.DEBUG:
      print(f"[DEV OTP FALLBACK] login {email}: {otp_code}")
      return None
    return _json_error("Failed to send login OTP email.", status=500)

  return None


@csrf_exempt
@require_POST
def signup_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  if User.objects.filter(email=email).exists():
    return _json_error("Email already registered. Please log in.", status=400)

  pending, created = PendingSignup.objects.get_or_create(
    email=email,
    defaults={
      "username": _unique_pending_username(),
      "password_hash": make_password(secrets.token_urlsafe(48)),
      "is_paid": False,
      "stripe_checkout_session_id": "",
    },
  )
  if not created and pending.is_paid:
    return _json_error("This email is already registered. Please log in instead.")

  if not created and not pending.is_paid:
    pending.stripe_checkout_session_id = ""
    pending.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  SignupOTP.objects.filter(email=email).delete()
  LoginOTP.objects.filter(email=email).delete()

  return JsonResponse(
    {
      "message": "Signup started. Continue to checkout.",
      "email": email,
      "signup_token": str(pending.token),
    },
    status=200,
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

  if User.objects.filter(username=pending_signup.username).exists():
    pending_signup.username = _unique_pending_username()
    pending_signup.save(update_fields=["username", "updated_at"])
  if User.objects.filter(email=pending_signup.email).exists():
    pending_signup.delete()
    return _json_error("Email already registered. Please log in.", status=400)

  user = User(
    username=pending_signup.username,
    email=pending_signup.email,
    password=pending_signup.password_hash,
  )
  user.save()
  pending_signup.is_paid = True
  pending_signup.save(update_fields=["is_paid", "updated_at"])

  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)

  return JsonResponse(
    {
      "message": "Signup verified successfully.",
      "email": email,
      "token": auth_token.key,
      "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
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
    auth_token, _ = Token.objects.get_or_create(user=user)
    af_profile = ensure_affiliate_profile_for_existing_user(user)

    return JsonResponse(
      {
        "message": "Payment successful.",
        "email": user.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids_payload(af_profile),
      },
      status=200,
    )

  returning = ReturningCheckout.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  if returning is not None:
    try:
      user = User.objects.get(email=returning.email)
    except User.DoesNotExist:
      return _json_error("No account found for this checkout email.", status=404)
    auth_token, _ = Token.objects.get_or_create(user=user)
    af_profile = ensure_affiliate_profile_for_existing_user(user)
    return JsonResponse(
      {
        "message": "Payment successful. Thank you for your purchase.",
        "email": returning.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids_payload(af_profile),
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
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  try:
    User.objects.get(email=email)
  except User.DoesNotExist:
    return JsonResponse(
      {
        "error": "No account found for this email. Please sign up first.",
        "code": "SIGNUP_REQUIRED",
      },
      status=404,
    )

  login_err = _create_and_email_login_otp(email)
  if login_err is not None:
    return login_err

  return JsonResponse(
    {
      "message": "Login OTP sent to your email.",
      "email": email,
      "otp_required": True,
    },
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
  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)
  return JsonResponse(
    {
      "message": "Login verified successfully.",
      "token": auth_token.key,
      "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
    },
    status=200,
  )
