from django.urls import path

from . import views

urlpatterns = [
    path("", views.challenge_list_create),
    path("today/", views.challenges_today),
    path("generate/", views.generate_challenge),
    path("history/", views.challenge_history),
    path("recent/", views.challenges_recent),
    path("generate_daily/", views.challenges_generate_daily),
    path("referral/create/", views.referral_create),
    path("referral/redeem/", views.referral_redeem),
    path("referral/status/", views.referral_status),
    path("referral/claim/", views.referral_claim),
]
