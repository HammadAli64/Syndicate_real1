from typing import Optional

from rest_framework import serializers

from apps.courses.models import Course, Video, VideoProgress


class CourseSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "cover_image_url",
            "is_published",
            "allow_all_authenticated",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "cover_image_url", "created_at", "updated_at")

    def get_cover_image_url(self, obj: Course) -> Optional[str]:
        if not obj.cover_image:
            return None
        return obj.cover_image.url


class CourseWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=280)

    class Meta:
        model = Course
        fields = ("title", "slug", "description", "is_published", "allow_all_authenticated")


class VideoSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            "id",
            "title",
            "description",
            "course",
            "video_url",
            "thumbnail_url",
            "order",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "thumbnail_url", "created_at", "updated_at")

    def get_thumbnail_url(self, obj: Video) -> Optional[str]:
        if not obj.thumbnail:
            return None
        return obj.thumbnail.url


class VideoProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgress
        fields = ("position_seconds", "completed", "updated_at")
        read_only_fields = ("updated_at",)
