from rest_framework import serializers

from .models import GeneratedChallenge


class ChallengePayloadSerializer(serializers.Serializer):
    challenge_title = serializers.CharField()
    challenge_description = serializers.CharField()
    example_task = serializers.CharField()
    benefits = serializers.CharField()
    based_on_mindset = serializers.CharField()
    suitable_moods = serializers.ListField(child=serializers.CharField())


class GeneratedChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedChallenge
        fields = ["id", "mood", "payload", "created_at"]
