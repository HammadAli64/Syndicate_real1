from django.contrib import admin

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo


class StreamPlaylistItemInline(admin.TabularInline):
    model = StreamPlaylistItem
    extra = 0
    ordering = ("order", "id")
    autocomplete_fields = ("stream_video",)
    fields = ("order", "stream_video")


@admin.register(StreamPlaylist)
class StreamPlaylistAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "updated_at")
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [StreamPlaylistItemInline]
    fieldsets = (
        (None, {"fields": ("title", "slug", "description", "cover_image")}),
        ("Publishing", {"fields": ("is_published",)}),
    )


@admin.register(StreamVideo)
class StreamVideoAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "price", "show_in_programs", "show_in_membership", "created_at")
    list_filter = ("status", "show_in_programs", "show_in_membership")
    search_fields = ("title", "description")
    readonly_fields = ("hls_path", "status", "last_error", "created_at")
    fieldsets = (
        (None, {"fields": ("title", "description", "price", "show_in_programs", "show_in_membership")}),
        ("Media", {"fields": ("thumbnail", "original_video")}),
        ("Pipeline", {"fields": ("status", "hls_path", "last_error", "created_at")}),
    )
