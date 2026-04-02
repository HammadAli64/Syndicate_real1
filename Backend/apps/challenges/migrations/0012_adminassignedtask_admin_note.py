from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0011_adminassignedtask_visibility_hours"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminassignedtask",
            name="admin_note",
            field=models.CharField(blank=True, default="", max_length=280),
        ),
    ]

