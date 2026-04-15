from django.contrib import admin

from .models import LoginOTP, PendingSignup, ReturningCheckout, SignupOTP


def _all_model_field_names(model) -> tuple[str, ...]:
    return tuple(
        field.name
        for field in model._meta.get_fields()
        if ((field.concrete and not field.auto_created) or field.many_to_many)
    )


class AllFieldsListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return _all_model_field_names(self.model)


@admin.register(PendingSignup)
class PendingSignupAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email", "username", "stripe_checkout_session_id")


@admin.register(LoginOTP)
class LoginOTPAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email",)


@admin.register(SignupOTP)
class SignupOTPAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email",)


@admin.register(ReturningCheckout)
class ReturningCheckoutAdmin(AllFieldsListDisplayAdmin):
    search_fields = ("email", "stripe_checkout_session_id")
