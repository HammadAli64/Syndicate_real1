from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.portal.permissions import IsAuthenticatedStrict

from apps.courses.access import user_can_access_course, user_can_access_video
from apps.courses.models import Course, Video, VideoProgress
from apps.courses.serializers import (
    CourseSerializer,
    CourseWriteSerializer,
    VideoSerializer,
    VideoProgressSerializer,
)


class CourseListCreateView(APIView):
    """GET: list published courses (auth). POST: staff creates course."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [IsAuthenticatedStrict()]

    def get(self, request):
        qs = Course.objects.filter(show_in_programs=True)
        if not getattr(request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
        return Response(CourseSerializer(qs.order_by("title"), many=True).data)

    def post(self, request):
        ser = CourseWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        course = ser.save()
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not user_can_access_course(request.user, course):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return Response(CourseSerializer(course).data)


class CourseVideosListView(APIView):
    """GET /api/courses/<id>/videos/ — ordered playlist metadata."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not user_can_access_course(request.user, course):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        qs = (
            course.videos.filter(status=Video.Status.READY)
            .exclude(video_url="")
            .order_by("order", "id")
        )
        return Response(VideoSerializer(qs, many=True).data)


class VideoProgressView(APIView):
    """GET/POST /api/videos/<id>/progress/ — read or upsert watch position."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        prog = VideoProgress.objects.filter(user=request.user, video=video).first()
        if not prog:
            return Response({"position_seconds": 0, "completed": False})
        return Response(VideoProgressSerializer(prog).data)

    def post(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        ser = VideoProgressSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj, _ = VideoProgress.objects.update_or_create(
            user=request.user,
            video=video,
            defaults={
                "position_seconds": ser.validated_data.get("position_seconds", 0),
                "completed": ser.validated_data.get("completed", False),
            },
        )
        return Response(VideoProgressSerializer(obj).data)
