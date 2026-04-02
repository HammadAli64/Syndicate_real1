from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0012_adminassignedtask_admin_note"),
    ]

    operations = [
        migrations.AddField(
            model_name="syndicateuserprogress",
            name="level",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="syndicateuserprogress",
            name="points_total",
            field=models.PositiveIntegerField(default=0),
        ),
    ]

