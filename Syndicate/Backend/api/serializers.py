from rest_framework import serializers

from .models import MindsetKnowledge, UploadedDocument


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = ["id", "original_name", "content_hash", "created_at"]


class MindsetKnowledgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MindsetKnowledge
        fields = ["payload", "updated_at", "model_used"]
