from django.urls import path

from apps.video_streaming import views

# Mounted at /api/streaming/ (see api/urls.py). Course lesson progress stays at /api/videos/<id>/progress/.
urlpatterns = [
    path("playlists/<int:pk>/", views.StreamPlaylistDetailView.as_view(), name="streaming-playlists-detail"),
    path("playlists/", views.StreamPlaylistListView.as_view(), name="streaming-playlists-list"),
    path(
        "videos/hls/<int:video_id>/<path:rel_path>",
        views.StreamHlsMediaView.as_view(),
        name="streaming-hls-media",
    ),
    path("videos/stream/<int:pk>/", views.StreamVideoStreamView.as_view(), name="streaming-videos-stream"),
    path("videos/<int:pk>/", views.StreamVideoDetailView.as_view(), name="streaming-videos-detail"),
    path("videos/", views.StreamVideoListView.as_view(), name="streaming-videos-list"),
]
