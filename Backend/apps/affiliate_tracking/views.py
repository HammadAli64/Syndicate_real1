from __future__ import annotations

import hashlib
import random
import secrets
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db.models import Max, Sum
from django.http import JsonResponse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import ApiToken, AffiliateProfile, ClickEvent, EmailOTP, LeadEvent, SaleEvent, SectionReferral

CLICK_POINTS = 1
LEAD_POINTS = 5
SALE_POINTS_PER_DOLLAR = 1
SALE_COMMISSION_RATE = Decimal("0.12")


def _now_iso() -> str:
    return timezone.now().isoformat()


def _bad_request(message: str, status_code: int = 400):
    return JsonResponse({"success": False, "error": message}, status=status_code)


def _get_json(request):
    try:
        import json

        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}


def _slug_name(name: str) -> str:
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in name.strip())
    out = "-".join(part for part in out.split("-") if part)
    return out[:24] or "affiliate"


def _referral_code(name: str, section: str, user_id: int) -> str:
    seed = f"{name}:{section}:{user_id}".encode("utf-8")
    digest = hashlib.sha1(seed).hexdigest()[:8]
    return f"{_slug_name(name)}-{section[:3]}-{digest}"


def _display_name_from_email(email: str) -> str:
    local = (email.split("@")[0] if "@" in email else email).strip()
    cleaned = "".join(ch if ch.isalnum() else " " for ch in local)
    normalized = " ".join(part for part in cleaned.split() if part)
    return (normalized.title() or "Affiliate")[:120]


def _ensure_profile_by_email(email: str) -> tuple[User, AffiliateProfile]:
    normalized_email = email.strip().lower()
    display_name = _display_name_from_email(normalized_email)
    user, _ = User.objects.get_or_create(
        username=normalized_email,
        defaults={"email": normalized_email, "first_name": display_name},
    )
    profile, _ = AffiliateProfile.objects.get_or_create(user=user, defaults={"display_name": display_name})
    if not profile.display_name:
        profile.display_name = display_name
        profile.save(update_fields=["display_name"])
    for section in ("complete", "single", "exclusive"):
        SectionReferral.objects.get_or_create(
            profile=profile,
            section=section,
            defaults={"referral_id": _referral_code(profile.display_name, section, user.id)},
        )
    return user, profile


def _ensure_profile(name: str) -> tuple[User, AffiliateProfile]:
    clean_name = name.strip()[:120]
    existing_profile = AffiliateProfile.objects.select_related("user").filter(display_name__iexact=clean_name).first()
    if existing_profile:
        user = existing_profile.user
        profile = existing_profile
    else:
        base_username = f"user_{_slug_name(clean_name)}"
        username = base_username
        idx = 2
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{idx}"
            idx += 1
        user = User.objects.create(username=username, first_name=clean_name)
        profile = AffiliateProfile.objects.create(user=user, display_name=clean_name)
    for section in ("complete", "single", "exclusive"):
        SectionReferral.objects.get_or_create(
            profile=profile,
            section=section,
            defaults={"referral_id": _referral_code(profile.display_name, section, user.id)},
        )
    return user, profile


def _get_referral_or_400(affiliate_id: str):
    try:
        return SectionReferral.objects.select_related("profile").get(referral_id=affiliate_id)
    except SectionReferral.DoesNotExist:
        return None


def ensure_affiliate_profile_for_existing_user(user: User) -> AffiliateProfile:
    """
    Link AffiliateProfile + SectionReferral rows to a Django user (e.g. OTP signup/login).
    Referral IDs are derived from display name + user id (see _referral_code); they are not
    the legacy hard-coded demo id.
    """
    email = (user.email or "").strip().lower()
    display_name = (
        _display_name_from_email(email)
        if email
        else (user.get_full_name() or user.username or "Affiliate")
    )[:120]
    profile, _ = AffiliateProfile.objects.get_or_create(
        user=user,
        defaults={"display_name": display_name},
    )
    if not profile.display_name:
        profile.display_name = display_name
        profile.save(update_fields=["display_name"])
    for section in ("complete", "single", "exclusive"):
        SectionReferral.objects.get_or_create(
            profile=profile,
            section=section,
            defaults={"referral_id": _referral_code(profile.display_name, section, user.id)},
        )
    return profile


def referral_ids_payload(profile: AffiliateProfile) -> dict[str, str]:
    refs = {r.section: r.referral_id for r in profile.section_referrals.all()}
    return {
        "complete": refs.get("complete", ""),
        "single": refs.get("single", ""),
        "exclusive": refs.get("exclusive", ""),
    }


def _iso_or_none(value):
    return value.isoformat() if value else None


def _section_stats(referral: SectionReferral) -> dict:
    click_qs = referral.click_events.all()
    lead_qs = referral.lead_events.all()
    sale_qs = referral.sale_events.all()

    click_count = click_qs.count()
    lead_count = lead_qs.count()
    sale_count = sale_qs.count()
    section_sales_total = sale_qs.aggregate(v=Sum("amount")).get("v") or Decimal("0.00")
    section_earnings = (section_sales_total * SALE_COMMISSION_RATE).quantize(Decimal("0.01"))
    # Conversion blends lead-rate and sale-rate so it reflects clicks, leads, and sales together.
    conversion_rate = (
        int(round((((lead_count / click_count) + (sale_count / click_count)) / 2) * 100)) if click_count > 0 else 0
    )

    return {
        "section": referral.section,
        "affiliate_id": referral.referral_id,
        "click_count": click_count,
        "lead_count": lead_count,
        "sale_count": sale_count,
        "conversion_rate": conversion_rate,
        "earnings_total": str(section_earnings),
        "last_click_at": _iso_or_none(click_qs.aggregate(v=Max("created_at")).get("v")),
        "last_lead_at": _iso_or_none(lead_qs.aggregate(v=Max("created_at")).get("v")),
        "last_sale_at": _iso_or_none(sale_qs.aggregate(v=Max("created_at")).get("v")),
        "lead_emails": sorted(set(lead_qs.values_list("email", flat=True))),
    }


def _overall_stats(profile: AffiliateProfile) -> dict:
    all_referrals = profile.section_referrals.all()
    click_qs = ClickEvent.objects.filter(referral__in=all_referrals)
    lead_qs = LeadEvent.objects.filter(referral__in=all_referrals)
    sale_qs = SaleEvent.objects.filter(referral__in=all_referrals)
    click_count = click_qs.count()
    lead_count = lead_qs.count()
    sale_count = sale_qs.count()
    # Earnings are profile-wide (all sections) so dashboard "overall" stays consistent.
    commission_total = ((sale_qs.aggregate(v=Sum("amount")).get("v") or Decimal("0.00")) * SALE_COMMISSION_RATE).quantize(
        Decimal("0.01")
    )
    profile.earnings_total = commission_total
    profile.save(update_fields=["earnings_total"])
    # Conversion blends lead-rate and sale-rate so it reflects clicks, leads, and sales together.
    conversion_rate = (
        int(round((((lead_count / click_count) + (sale_count / click_count)) / 2) * 100)) if click_count > 0 else 0
    )

    return {
        "click_count": click_count,
        "lead_count": lead_count,
        "sale_count": sale_count,
        "conversion_rate": conversion_rate,
        "point_total": profile.points_total,
        "earnings_total": str(profile.earnings_total),
        "last_click_at": _iso_or_none(click_qs.aggregate(v=Max("created_at")).get("v")),
        "last_lead_at": _iso_or_none(lead_qs.aggregate(v=Max("created_at")).get("v")),
        "last_sale_at": _iso_or_none(sale_qs.aggregate(v=Max("created_at")).get("v")),
        "lead_emails": sorted(set(lead_qs.values_list("email", flat=True))),
    }


def _stats_payload(referral: SectionReferral) -> dict:
    current = _section_stats(referral)
    overall = _overall_stats(referral.profile)

    by_section = {}
    for section_name in ("complete", "single", "exclusive"):
        section_ref = referral.profile.section_referrals.filter(section=section_name).first()
        if section_ref:
            by_section[section_name] = _section_stats(section_ref)
        else:
            by_section[section_name] = {
                "section": section_name,
                "affiliate_id": "",
                "click_count": 0,
                "lead_count": 0,
                "sale_count": 0,
                "conversion_rate": 0,
                "earnings_total": "0.00",
                "last_click_at": None,
                "last_lead_at": None,
                "last_sale_at": None,
                "lead_emails": [],
            }

    # Keep legacy top-level keys as selected-section values for compatibility.
    return {
        "affiliate_id": current["affiliate_id"],
        "section": current["section"],
        "click_count": current["click_count"],
        "lead_count": current["lead_count"],
        "sale_count": current["sale_count"],
        "point_total": overall["point_total"],
        "earnings_total": overall["earnings_total"],
        "last_click_at": current["last_click_at"],
        "last_lead_at": current["last_lead_at"],
        "last_sale_at": current["last_sale_at"],
        "lead_emails": current["lead_emails"],
        "overall": overall,
        "current_section": current,
        "by_section": by_section,
    }


@require_GET
def health(_request):
    return JsonResponse({"status": "ok", "backend": "django", "at": _now_iso()})


@csrf_exempt
@require_POST
def auth_login(request):
    # Legacy endpoint retained for compatibility; now expects email.
    payload = _get_json(request)
    email = str(payload.get("email") or payload.get("name") or "").strip().lower()
    if not email:
        return _bad_request("email is required")
    try:
        validate_email(email)
    except ValidationError:
        return _bad_request("A valid email is required")

    user, profile = _ensure_profile_by_email(email)
    token = secrets.token_hex(24)
    ApiToken.objects.create(user=user, token=token)
    refs = {r.section: r.referral_id for r in profile.section_referrals.all()}
    return JsonResponse(
        {
            "success": True,
            "token": token,
            "user": {
                "display_name": profile.display_name,
                "email": user.email or email,
                "referral_ids": refs,
            },
        }
    )


@csrf_exempt
@require_POST
def auth_request_otp(request):
    payload = _get_json(request)
    email = str(payload.get("email") or "").strip().lower()
    if not email:
        return _bad_request("email is required")
    try:
        validate_email(email)
    except ValidationError:
        return _bad_request("A valid email is required")

    code = f"{random.randint(0, 999999):06d}"
    expires_at = timezone.now() + timedelta(minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10))
    EmailOTP.objects.filter(email=email, is_used=False).update(is_used=True)
    EmailOTP.objects.create(email=email, code=code, expires_at=expires_at, is_used=False)

    subject = "Your Syndicate OTP"
    body = f"Your OTP is {code}. It expires in {getattr(settings, 'OTP_EXPIRES_MINUTES', 10)} minutes."
    using_console_backend = "console.EmailBackend" in getattr(settings, "EMAIL_BACKEND", "")
    if using_console_backend:
        if getattr(settings, "DEBUG", False):
            return JsonResponse(
                {
                    "success": True,
                    "message": "Dev mode: OTP not emailed (console backend). Use dev_otp below.",
                    "delivery": "console",
                    "dev_otp": code,
                }
            )
        return _bad_request(
            "OTP email is disabled. Configure SMTP (EMAIL_BACKEND/EMAIL_HOST/EMAIL_HOST_USER/EMAIL_HOST_PASSWORD) and try again.",
            503,
        )

    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
    except Exception:
        return _bad_request("Could not send OTP email right now. Verify SMTP credentials/settings.", 503)

    return JsonResponse({"success": True, "message": "OTP sent to your email.", "delivery": "smtp"})


@csrf_exempt
@require_POST
def auth_verify_otp(request):
    payload = _get_json(request)
    email = str(payload.get("email") or "").strip().lower()
    otp = str(payload.get("otp") or "").strip()
    if not email:
        return _bad_request("email is required")
    if len(otp) != 6 or not otp.isdigit():
        return _bad_request("A valid 6-digit OTP is required")
    try:
        validate_email(email)
    except ValidationError:
        return _bad_request("A valid email is required")

    now = timezone.now()
    otp_row = (
        EmailOTP.objects.filter(email=email, code=otp, is_used=False, expires_at__gt=now)
        .order_by("-created_at")
        .first()
    )
    if not otp_row:
        return _bad_request("OTP invalid or expired", 401)

    otp_row.is_used = True
    otp_row.save(update_fields=["is_used"])

    user, profile = _ensure_profile_by_email(email)
    token = secrets.token_hex(24)
    ApiToken.objects.create(user=user, token=token)
    refs = {r.section: r.referral_id for r in profile.section_referrals.all()}
    return JsonResponse(
        {
            "success": True,
            "token": token,
            "user": {
                "display_name": profile.display_name,
                "email": user.email or email,
                "referral_ids": refs,
            },
        }
    )


@require_GET
def stats(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    return JsonResponse(_stats_payload(referral))


@csrf_exempt
@require_POST
def click(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    visitor_id = str(payload.get("visitor_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    if not visitor_id:
        return _bad_request("visitor_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    _, created = ClickEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id)
    if created:
        referral.profile.points_total += CLICK_POINTS
        referral.profile.save(update_fields=["points_total"])
    return JsonResponse({"success": True, "click_recorded": created, "stats": _stats_payload(referral)})


@csrf_exempt
@require_POST
def lead(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    visitor_id = str(payload.get("visitor_id") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    if not visitor_id:
        return _bad_request("visitor_id is required")
    if not email or "@" not in email:
        return _bad_request("A valid email is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    _, _ = ClickEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id)
    _, created = LeadEvent.objects.get_or_create(
        referral=referral, visitor_id=visitor_id, defaults={"email": email}
    )
    if not created:
        LeadEvent.objects.filter(referral=referral, visitor_id=visitor_id).update(email=email)
    else:
        referral.profile.points_total += LEAD_POINTS
        referral.profile.save(update_fields=["points_total"])
    return JsonResponse({"success": True, "lead_recorded": created, "stats": _stats_payload(referral)})


@csrf_exempt
@require_POST
def sale(request):
    payload = _get_json(request)
    affiliate_id = str(payload.get("affiliate_id") or "").strip()
    visitor_id = str(payload.get("visitor_id") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    amount_raw = str(payload.get("amount") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    if not visitor_id:
        return _bad_request("visitor_id is required")
    if not email or "@" not in email:
        return _bad_request("A valid email is required")
    try:
        amount = Decimal(amount_raw)
    except (InvalidOperation, TypeError):
        return _bad_request("A valid amount is required")
    if amount <= 0:
        return _bad_request("amount must be > 0")

    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    ClickEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id)
    LeadEvent.objects.get_or_create(referral=referral, visitor_id=visitor_id, defaults={"email": email})
    _, created = SaleEvent.objects.get_or_create(
        referral=referral, visitor_id=visitor_id, email=email, amount=amount
    )
    if created:
        referral.profile.points_total += int(amount) * SALE_POINTS_PER_DOLLAR
        referral.profile.save(update_fields=["points_total"])
    return JsonResponse({"success": True, "sale_recorded": created, "stats": _stats_payload(referral)})


@require_GET
def affiliate_visitors(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    limit_raw = (request.GET.get("limit") or "100").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 100
    limit = max(1, min(limit, 500))

    click_map = {c.visitor_id: c.created_at for c in referral.click_events.all()}
    lead_map = {l.visitor_id: l for l in referral.lead_events.all()}
    sale_map: dict[str, Decimal] = {}
    for s in referral.sale_events.all():
        sale_map[s.visitor_id] = (sale_map.get(s.visitor_id) or Decimal("0.00")) + s.amount

    visitors = []
    for vid in set(click_map.keys()) | set(lead_map.keys()) | set(sale_map.keys()):
        lead_obj = lead_map.get(vid)
        visitors.append(
            {
                "visitor_id": vid,
                "clicked_at": click_map.get(vid).isoformat() if click_map.get(vid) else None,
                "lead_email": lead_obj.email if lead_obj else None,
                "lead_at": lead_obj.created_at.isoformat() if lead_obj else None,
                "sale_amount": str(sale_map.get(vid, Decimal("0.00"))),
            }
        )
    visitors.sort(key=lambda v: v.get("lead_at") or v.get("clicked_at") or "", reverse=True)
    return JsonResponse({"affiliate_id": affiliate_id, "visitors": visitors[:limit]})


@require_GET
def funnel(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    click_count = referral.click_events.count()
    lead_count = referral.lead_events.count()
    sale_count = referral.sale_events.count()
    return JsonResponse(
        {
            "affiliate_id": affiliate_id,
            "stages": [
                {"stage": "Clicks", "value": click_count},
                {"stage": "Leads", "value": lead_count},
                {"stage": "Conversions", "value": sale_count},
            ],
        }
    )


@require_GET
def recent_referrals(request):
    affiliate_id = (request.GET.get("affiliate_id") or "").strip()
    limit_raw = (request.GET.get("limit") or "10").strip()
    if not affiliate_id:
        return _bad_request("affiliate_id is required")
    referral = _get_referral_or_400(affiliate_id)
    if referral is None:
        return _bad_request("affiliate_id not found", 404)
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 10
    limit = max(1, min(limit, 50))

    click_map = {c.visitor_id: c.created_at for c in referral.click_events.all()}
    lead_map = {l.visitor_id: l.created_at for l in referral.lead_events.all()}
    sale_map = {s.visitor_id: s.created_at for s in referral.sale_events.all()}
    items = []
    for vid in set(click_map.keys()) | set(lead_map.keys()) | set(sale_map.keys()):
        at = sale_map.get(vid) or lead_map.get(vid) or click_map.get(vid)
        status = "purchased" if vid in sale_map else "joined"
        items.append({"visitor_id": vid, "status": status, "at": at.isoformat() if at else None})
    items.sort(key=lambda x: x.get("at") or "", reverse=True)
    return JsonResponse({"affiliate_id": affiliate_id, "items": items[:limit]})
