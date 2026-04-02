from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0010_syndicate_streak_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminassignedtask",
            name="visibility_hours",
            field=models.PositiveSmallIntegerField(
                default=24,
                help_text="How many hours this task stays visible after creation (1-168).",
                validators=[MinValueValidator(1), MaxValueValidator(168)],
            ),
        ),
    ]

