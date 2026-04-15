import logging
from pathlib import Path

from django import forms
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponseRedirect
from django.urls import reverse

from .models import MindsetKnowledge, UploadedDocument
from .services.ingest_async import schedule_ingest_after_commit
from .services.upload_store import (
    SUPPORTED_SUFFIXES,
    persist_upload_to_storage,
    prepare_upload_bytes,
)
from .views import run_ingest

logger = logging.getLogger(__name__)


def _all_model_field_names(model) -> tuple[str, ...]:
    return tuple(
        field.name
        for field in model._meta.get_fields()
        if ((field.concrete and not field.auto_created) or field.many_to_many)
    )


class AllFieldsListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return _all_model_field_names(self.model)


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
        data = b"".join(f.chunks())
        if not data:
            raise forms.ValidationError("Empty file.")
        self._upload_bytes = data
        self._upload_original_name = name
        return f

    def clean(self):
        super().clean()
        # Do not INSERT here: admin wraps the whole form in transaction.atomic(); early INSERT + S3
        # then a second save() is fragile on Postgres/Railway. Only validate + extract + build unsaved instance.
        if getattr(self, "_upload_payload", None) is not None:
            return self.cleaned_data
        data = getattr(self, "_upload_bytes", None)
        name = getattr(self, "_upload_original_name", None)
        if data is None or name is None:
            return self.cleaned_data
        prepared, err = prepare_upload_bytes(data, name)
        if err:
            raise forms.ValidationError(err)
        self._upload_payload = prepared
        h = prepared["content_hash"]
        sfx = prepared["suffix"]
        self.instance = UploadedDocument(
            original_name=prepared["original_name"],
            stored_path=f"_pending/{h}{sfx}",
            content_hash=h,
            text_extracted=prepared["text"],
        )
        return self.cleaned_data

    def save(self, commit=True):
        if getattr(self, "_upload_payload", None) is None:
            raise forms.ValidationError("Upload did not complete. Choose a file and try again.")
        self.save_m2m = lambda: None
        return self.instance


@admin.register(UploadedDocument)
class UploadedDocumentAdmin(AllFieldsListDisplayAdmin):
    list_filter = ["created_at"]
    actions = ["ingest_mindsets_action"]

    @admin.display(description="Last ingest error (preview)")
    def ingest_error_short(self, obj: UploadedDocument) -> str:
        e = (obj.ingest_last_error or "").strip()
        if not e:
            return "—"
        return (e[:100] + "…") if len(e) > 100 else e

    def add_view(self, request, form_url="", extra_context=None):
        try:
            return super().add_view(request, form_url, extra_context)
        except (Http404, PermissionDenied):
            raise
        except Exception as exc:
            logger.exception("UploadedDocument admin add_view failed")
            self.message_user(
                request,
                f"Upload failed ({type(exc).__name__}: {exc}). See server logs for the full traceback.",
                level=messages.ERROR,
            )
            return HttpResponseRedirect(reverse("admin:api_uploadeddocument_add"))

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
        if not change and isinstance(form, UploadedDocumentAddForm):
            prepared = getattr(form, "_upload_payload", None)
            if prepared:
                path, err = persist_upload_to_storage(prepared)
                if err:
                    self.message_user(request, err, level=messages.ERROR)
                    raise RuntimeError(err)
                obj.stored_path = path
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
        try:
            schedule_ingest_after_commit(obj.pk)
        except Exception:
            logger.exception("schedule_ingest_after_commit failed document_id=%s", obj.pk)
            self.message_user(
                request,
                "Document saved, but background ingest could not be scheduled (check server logs).",
                level=messages.WARNING,
            )
            return
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
class MindsetKnowledgeAdmin(AllFieldsListDisplayAdmin):
    readonly_fields = ["source", "payload", "updated_at", "model_used"]


try:
    from rest_framework.authtoken.models import Token
except ImportError:  # pragma: no cover
    Token = None

if Token is not None:

    @admin.register(Token)
    class AuthtokenAdmin(AllFieldsListDisplayAdmin):
        autocomplete_fields = ("user",)
        search_fields = ("user__username", "user__email", "key")
