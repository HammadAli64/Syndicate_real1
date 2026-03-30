from rest_framework import serializers

from .models import GeneratedChallenge


class ChallengePayloadSerializer(serializers.Serializer):
    challenge_title = serializers.CharField()
    challenge_description = serializers.CharField()
    example_task = serializers.CharField(required=False, allow_blank=True)
    benefits = serializers.CharField(required=False, allow_blank=True)
    example_tasks = serializers.ListField(child=serializers.CharField(), required=False)
    benefits_list = serializers.ListField(child=serializers.CharField(), required=False)
    based_on_mindset = serializers.CharField()
    suitable_moods = serializers.ListField(child=serializers.CharField())


class GeneratedChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedChallenge
        fields = ["id", "mood", "payload", "created_at"]
