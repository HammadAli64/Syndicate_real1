from django.urls import path

from .views import (
  checkout_success_view,
  create_checkout_session_view,
  login_view,
  signup_view,
  verify_login_otp_view,
  verify_signup_otp_view,
)

urlpatterns = [
  path("signup/", signup_view, name="signup"),
  path("signup/verify-otp/", verify_signup_otp_view, name="signup-verify-otp"),
  path("checkout/create-session/", create_checkout_session_view, name="checkout-create-session"),
  path("checkout/success/", checkout_success_view, name="checkout-success"),
  path("login/", login_view, name="login"),
  path("verify-login-otp/", verify_login_otp_view, name="verify-login-otp"),
]
