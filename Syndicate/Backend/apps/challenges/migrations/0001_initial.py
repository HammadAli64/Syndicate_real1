# State-only migration: tables already exist as api_* from legacy api app.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("api", "0003_referral_restore"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="GeneratedChallenge",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("mood", models.CharField(blank=True, db_index=True, max_length=128)),
                        ("category", models.CharField(blank=True, db_index=True, max_length=32)),
                        ("difficulty", models.CharField(blank=True, max_length=16)),
                        ("points", models.PositiveSmallIntegerField(default=0)),
                        ("challenge_date", models.DateField(blank=True, db_index=True, null=True)),
                        ("slot", models.PositiveSmallIntegerField(default=1)),
                        ("payload", models.JSONField()),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        (
                            "source_document",
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.SET_NULL,
                                related_name="challenges",
                                to="api.uploadeddocument",
                            ),
                        ),
                    ],
                    options={
                        "db_table": "api_generatedchallenge",
                        "ordering": ["-created_at"],
                    },
                ),
                migrations.CreateModel(
                    name="ReferralRestore",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("code", models.CharField(db_index=True, max_length=32, unique=True)),
                        ("creator_device", models.CharField(db_index=True, max_length=128)),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        ("expires_at", models.DateTimeField()),
                        ("redeemed", models.BooleanField(default=False)),
                        ("redeemer_device", models.CharField(blank=True, max_length=128)),
                        ("restore_claimed", models.BooleanField(default=False)),
                    ],
                    options={
                        "db_table": "api_referralrestore",
                        "ordering": ["-created_at"],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
