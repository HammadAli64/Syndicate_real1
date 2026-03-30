from django.urls import path

from . import views
from .agent_quote_view import agent_quote_today

urlpatterns = [
    path("", views.challenge_list_create),
    path("today/", views.challenges_today),
    path("generate/", views.generate_challenges_view),
    path("history/", views.challenge_history),
    path("recent/", views.challenges_recent),
    path("generate_daily/", views.challenges_generate_daily),
    path("generate_pair/", views.challenges_generate_pair),
    path("agent_quote/", agent_quote_today),
    path("leaderboard/", views.leaderboard_list),
    path("leaderboard/sync/", views.leaderboard_sync),
    path("referral/create/", views.referral_create),
    path("referral/redeem/", views.referral_redeem),
    path("referral/status/", views.referral_status),
    path("referral/claim/", views.referral_claim),
]
