# Agent daily quote table

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0002_leaderboardentry"),
    ]

    operations = [
        migrations.CreateModel(
            name="AgentDailyQuote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quote_date", models.DateField(db_index=True, unique=True)),
                ("text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "api_agentdailyquote",
                "ordering": ["-quote_date"],
            },
        ),
    ]
