from pathlib import Path

from django import forms
from django.contrib import admin, messages

from .models import MindsetKnowledge, UploadedDocument
from .services.ingest_async import schedule_ingest_after_commit
from .services.upload_store import SUPPORTED_SUFFIXES, store_upload_bytes
from .views import run_ingest


class UploadedDocumentAddForm(forms.ModelForm):
    """Must not use Meta.fields = [] — Django drops non-model fields, so <input type=file> never binds."""

    file = forms.FileField(
        help_text="Use .docx (not .doc or .docs), or .pdf / .txt / .md. OpenAI ingest runs in the background after save (OPENAI_API_KEY on Railway).",
    )

    class Meta:
        model = UploadedDocument
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name in list(self.fields.keys()):
            if name != "file":
                del self.fields[name]

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
        # Read once here; do not re-read in save() (some upload handlers only allow one read).
        data = b"".join(f.chunks())
        if not data:
            raise forms.ValidationError("Empty file.")
        self._upload_bytes = data
        self._upload_original_name = name
        return f

    def clean(self):
        super().clean()
        # Persist during validation so S3/DB/extract errors attach to the form instead of 500 after is_valid().
        if getattr(self, "_admin_upload_doc", None) is not None:
            return self.cleaned_data
        data = getattr(self, "_upload_bytes", None)
        name = getattr(self, "_upload_original_name", None)
        if data is None or name is None:
            return self.cleaned_data
        doc, err = store_upload_bytes(data, name)
        if err:
            raise forms.ValidationError(err)
        self._admin_upload_doc = doc
        return self.cleaned_data

    def save(self, commit=True):
        doc = getattr(self, "_admin_upload_doc", None)
        if doc is None:
            raise forms.ValidationError("Upload did not complete. Choose a file and try again.")
        self.instance = doc
        self.save_m2m = lambda: None
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
