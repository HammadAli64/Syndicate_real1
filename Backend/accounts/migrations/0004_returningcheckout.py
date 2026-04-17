# Generated manually

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

  dependencies = [
    ("accounts", "0003_signupotp"),
  ]

  operations = [
    migrations.CreateModel(
      name="ReturningCheckout",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("token", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
        ("email", models.EmailField(max_length=254)),
        ("stripe_checkout_session_id", models.CharField(blank=True, max_length=255)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("updated_at", models.DateTimeField(auto_now=True)),
      ],
    ),
  ]
