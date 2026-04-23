from django.urls import reverse
from rest_framework import serializers

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo


class StreamVideoListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = StreamVideo
        fields = (
            "id",
            "title",
            "description",
            "price",
            "thumbnail_url",
            "status",
            "player_layout",
            "source_width",
            "source_height",
            "created_at",
        )
        read_only_fields = fields

    def get_thumbnail_url(self, obj: StreamVideo):
        if not obj.thumbnail:
            return None
        request = self.context.get("request")
        url = obj.thumbnail.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class StreamVideoDetailSerializer(StreamVideoListSerializer):
    hls_path = serializers.SerializerMethodField()

    class Meta(StreamVideoListSerializer.Meta):
        fields = (*StreamVideoListSerializer.Meta.fields, "hls_path")

    def get_hls_path(self, obj: StreamVideo):
        if obj.status != StreamVideo.Status.READY or not (obj.hls_path or "").strip():
            return ""
        return reverse(
            "streaming-hls-media",
            kwargs={"video_id": obj.pk, "rel_path": "index.m3u8"},
        )


class StreamVideoStreamSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.CharField()
    hls_url = serializers.CharField(allow_null=True, allow_blank=True)


class StreamPlaylistItemSerializer(serializers.ModelSerializer):
    stream_video = StreamVideoListSerializer(read_only=True)

    class Meta:
        model = StreamPlaylistItem
        fields = ("id", "order", "stream_video")


class StreamPlaylistListSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    video_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = StreamPlaylist
        fields = (
            "id",
            "title",
            "slug",
            "category",
            "description",
            "price",
            "rating",
            "cover_image_url",
            "video_count",
            "is_published",
            "is_coming_soon",
            "created_at",
        )
        read_only_fields = fields

    def get_cover_image_url(self, obj: StreamPlaylist):
        request = self.context.get("request")
        if obj.cover_image:
            url = obj.cover_image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        for item in obj.items.all():
            sv = item.stream_video
            if sv.thumbnail:
                url = sv.thumbnail.url
                if request is not None:
                    return request.build_absolute_uri(url)
                return url
        return None


class StreamPlaylistDetailSerializer(StreamPlaylistListSerializer):
    items = StreamPlaylistItemSerializer(many=True, read_only=True)

    class Meta(StreamPlaylistListSerializer.Meta):
        fields = (*StreamPlaylistListSerializer.Meta.fields, "items")
