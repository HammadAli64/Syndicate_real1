from pathlib import Path

from django import forms
from django.contrib import admin, messages

from .models import MindsetKnowledge, UploadedDocument
from .services.ingest_async import schedule_ingest_after_commit
from .services.upload_store import SUPPORTED_SUFFIXES, store_uploaded_file
from .views import run_ingest


class UploadedDocumentAddForm(forms.ModelForm):
    file = forms.FileField(
        help_text="Use .docx (not .doc or .docs), or .pdf / .txt / .md. OpenAI ingest runs in the background after save (OPENAI_API_KEY on Railway).",
    )

    class Meta:
        model = UploadedDocument
        fields: list[str] = []

    def clean_file(self):
        f = self.cleaned_data["file"]
        name = getattr(f, "name", "upload") or "upload"
        suffix = Path(name).suffix.lower()
        if suffix == ".doc":
            raise forms.ValidationError(
                "Legacy Word .doc is not supported. In Word or Google Docs use Save as / Download → .docx."
            )
        if suffix in (".docs", ".docm"):
            raise forms.ValidationError(
                f"Extension {suffix!r} is not supported. For Word use .docx. Allowed: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
            )
        if suffix not in SUPPORTED_SUFFIXES:
            raise forms.ValidationError(
                f"Unsupported type {suffix!r}. Use one of: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
            )
        return f

    def save(self, commit=True):
        f = self.cleaned_data["file"]
        doc, err = store_uploaded_file(f)
        if err:
            raise forms.ValidationError(err)
        self.instance = doc
        return doc


@admin.register(UploadedDocument)
class UploadedDocumentAdmin(admin.ModelAdmin):
    list_display = ["id", "original_name", "content_hash", "created_at", "ingested"]
    list_filter = ["created_at"]
    actions = ["ingest_mindsets_action"]

    @admin.display(description="Mindset ingested", boolean=True)
    def ingested(self, obj: UploadedDocument) -> bool:
        return MindsetKnowledge.objects.filter(source_id=obj.pk).exists()

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = UploadedDocumentAddForm
        return super().get_form(request, obj, **kwargs)

    def get_fields(self, request, obj=None):
        if obj is None:
            return ["file"]
        return [f.name for f in self.model._meta.fields]

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []
        return [f.name for f in self.model._meta.fields]

    def save_model(self, request, obj, form, change):
        try:
            super().save_model(request, obj, form, change)
        except Exception as exc:
            self.message_user(
                request,
                f"Could not save document: {exc}",
                level=messages.ERROR,
            )
            raise
        if change:
            return
        # OpenAI ingest can exceed HTTP/proxy timeouts; run after commit in a background thread.
        schedule_ingest_after_commit(obj.pk)
        self.message_user(
            request,
            "Document saved. Mindset extraction runs in the background; wait ~30–60s then refresh "
            "Mindset knowledge or your app. Check deploy logs if it never appears (OPENAI_API_KEY / quota).",
            level=messages.SUCCESS,
        )

    @admin.action(description="Re-ingest mindsets with OpenAI (selected documents)")
    def ingest_mindsets_action(self, request, queryset):
        ok_n = 0
        for doc in queryset:
            ok, _data, err = run_ingest(doc)
            if ok:
                ok_n += 1
            else:
                self.message_user(
                    request,
                    f"Ingest failed for id={doc.pk} ({doc.original_name}): {err}",
                    level=messages.ERROR,
                )
        if ok_n:
            self.message_user(request, f"Ingest succeeded for {ok_n} document(s).", level=messages.SUCCESS)


@admin.register(MindsetKnowledge)
class MindsetKnowledgeAdmin(admin.ModelAdmin):
    list_display = ["id", "source", "updated_at", "model_used"]
    readonly_fields = ["source", "payload", "updated_at", "model_used"]
