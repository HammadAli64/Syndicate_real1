from django.urls import path

from apps.courses import views

urlpatterns = [
    path("<int:pk>/progress/", views.VideoProgressView.as_view(), name="videos-progress"),
]
