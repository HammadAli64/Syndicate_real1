from django.contrib import admin



from apps.courses.models import Course, CourseEnrollment, Video, VideoProgress





def _all_model_field_names(model) -> tuple[str, ...]:

    return tuple(

        field.name

        for field in model._meta.get_fields()

        if ((field.concrete and not field.auto_created) or field.many_to_many)

    )





class AllFieldsListDisplayAdmin(admin.ModelAdmin):

    def get_list_display(self, request):

        return _all_model_field_names(self.model)





class VideoInline(admin.TabularInline):

    model = Video

    extra = 0

    ordering = ("order", "id")

    fields = ("order", "title", "description", "video_url", "thumbnail", "status")

    show_change_link = True





# @admin.register(Course)

# class CourseAdmin(admin.ModelAdmin):

#     prepopulated_fields = {"slug": ("title",)}

#     search_fields = ("title", "slug", "description")

#     list_display = ("title", "slug", "is_published", "show_in_programs", "allow_all_authenticated", "updated_at")

#     list_filter = ("is_published", "show_in_programs", "allow_all_authenticated")

#     readonly_fields = ("created_at", "updated_at")

#     fieldsets = (

#         (None, {"fields": ("title", "slug", "description", "cover_image")}),

#         ("Access", {"fields": ("is_published", "show_in_programs", "allow_all_authenticated")}),

#         ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),

#     )

#     inlines = [VideoInline]





# @admin.register(CourseEnrollment)

# class CourseEnrollmentAdmin(AllFieldsListDisplayAdmin):

#     list_filter = ("course",)






