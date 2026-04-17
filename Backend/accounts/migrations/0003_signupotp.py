# Generated manually for email-only signup OTP flow

from django.db import migrations, models


class Migration(migrations.Migration):

  dependencies = [
    ("accounts", "0002_loginotp_remove_pendingsignup_otp_code_and_more"),
  ]

  operations = [
    migrations.CreateModel(
      name="SignupOTP",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("email", models.EmailField(max_length=254, unique=True)),
        ("otp_code", models.CharField(max_length=6)),
        ("otp_expires_at", models.DateTimeField()),
        ("created_at", models.DateTimeField(auto_now_add=True)),
      ],
    ),
  ]
