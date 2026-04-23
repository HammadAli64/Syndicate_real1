from django.contrib import admin

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo
from apps.video_streaming.transcode_policy import inline_stream_transcode_enabled


class StreamPlaylistItemInline(admin.TabularInline):
    model = StreamPlaylistItem
    extra = 0
    ordering = ("order", "id")
    autocomplete_fields = ("stream_video",)
    fields = ("order", "stream_video")


@admin.register(StreamPlaylist)
class StreamPlaylistAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "price", "rating", "slug", "is_published", "is_coming_soon", "updated_at")
    list_filter = ("category", "is_published", "is_coming_soon")
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [StreamPlaylistItemInline]
    fieldsets = (
        (None, {"fields": ("title", "slug", "category", "price", "rating", "cover_image")}),
        ("Publishing", {"fields": ("is_published", "is_coming_soon")}),
    )


@admin.register(StreamVideo)
class StreamVideoAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "status",
        "player_layout",
        "price",
        "show_in_programs",
        "show_in_membership",
        "created_at",
    )
    list_filter = ("status", "player_layout", "show_in_programs", "show_in_membership")
    search_fields = ("title", "description")
    readonly_fields = ("hls_path", "status", "last_error", "source_width", "source_height", "created_at")
    actions = ("reprocess_hls",)
    fieldsets = (
        (None, {"fields": ("title", "description", "price", "show_in_programs", "show_in_membership")}),
        ("Player", {"fields": ("player_layout", "source_width", "source_height")}),
        ("Media", {"fields": ("thumbnail", "original_video")}),
        ("Pipeline", {"fields": ("status", "hls_path", "last_error", "created_at")}),
    )

    @admin.action(description="Re-run HLS transcoding (selected rows with an original file)")
    def reprocess_hls(self, request, queryset):
        from apps.video_streaming.tasks import process_stream_video_to_hls

        n = 0
        for v in queryset:
            if not v.original_video or not v.original_video.name:
                continue
            n += 1
            if inline_stream_transcode_enabled():
                process_stream_video_to_hls(v.pk)
            else:
                process_stream_video_to_hls.delay(v.pk)
        self.message_user(request, f"HLS transcoding started for {n} video(s).")
