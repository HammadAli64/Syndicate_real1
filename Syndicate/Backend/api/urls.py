from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("mindset/status/", views.mindset_status),
    path("documents/upload/", views.upload_document),
    path("documents/ingest/", views.ingest_document),
    path("syndicate/bootstrap/", views.syndicate_bootstrap),
]
