from django.db import models


class UploadedDocument(models.Model):
    """User-uploaded PDF or text file on disk."""

    original_name = models.CharField(max_length=512)
    stored_path = models.CharField(max_length=1024)
    content_hash = models.CharField(max_length=64, db_index=True)
    text_extracted = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.original_name


class MindsetKnowledge(models.Model):
    """Latest extracted mindset graph (replaced on re-ingest)."""

    source = models.OneToOneField(
        UploadedDocument,
        on_delete=models.CASCADE,
        related_name="mindset",
    )
    payload = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)
    model_used = models.CharField(max_length=64, blank=True)

    def __str__(self) -> str:
        return f"MindsetKnowledge({self.source_id})"
