from django.contrib import admin

from apps.portal.models import Mission, Note, PortalPermission, PortalRole, Reminder, SocialLink, UserPortalRole


def _all_model_field_names(model) -> tuple[str, ...]:
    return tuple(
        field.name
        for field in model._meta.get_fields()
        if ((field.concrete and not field.auto_created) or field.many_to_many)
    )


class AllFieldsListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return _all_model_field_names(self.model)


@admin.register(PortalPermission)
class PortalPermissionAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("codename", "name")


@admin.register(PortalRole)
class PortalRoleAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("name", "display_name")
    filter_horizontal = ("permissions",)


@admin.register(UserPortalRole)
class UserPortalRoleAdmin(AllFieldsListDisplayAdmin):
    autocomplete_fields = ("user", "role")


@admin.register(SocialLink)
class SocialLinkAdmin(AllFieldsListDisplayAdmin):
    list_filter = ("platform", "is_active")


@admin.register(Mission)
class MissionAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(Reminder)
class ReminderAdmin(AllFieldsListDisplayAdmin):
    pass


@admin.register(Note)
class NoteAdmin(AllFieldsListDisplayAdmin):
    pass
