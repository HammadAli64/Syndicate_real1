from django.contrib import admin

from .models import MindsetKnowledge, UploadedDocument


@admin.register(UploadedDocument)
class UploadedDocumentAdmin(admin.ModelAdmin):
    list_display = ["id", "original_name", "content_hash", "created_at"]


@admin.register(MindsetKnowledge)
class MindsetKnowledgeAdmin(admin.ModelAdmin):
    list_display = ["id", "source", "updated_at", "model_used"]
