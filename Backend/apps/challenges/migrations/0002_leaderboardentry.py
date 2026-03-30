# Generated manually — public leaderboard table

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LeaderboardEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("device_id", models.CharField(db_index=True, max_length=128, unique=True)),
                ("display_name", models.CharField(default="Anonymous", max_length=64)),
                ("points_total", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "api_leaderboardentry",
                "ordering": ["-points_total", "updated_at"],
            },
        ),
    ]
