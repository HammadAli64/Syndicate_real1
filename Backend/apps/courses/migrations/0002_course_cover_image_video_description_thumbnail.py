# Generated manually for course cover + video metadata images

from django.db import migrations, models
import apps.courses.models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0001_initial_courses_vdocipher"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="cover_image",
            field=models.ImageField(
                blank=True,
                help_text="Shown on the Programs grid. Prefer wide images (e.g. 3:4 or 16:9).",
                null=True,
                upload_to=apps.courses.models.course_cover_upload_to,
            ),
        ),
        migrations.AddField(
            model_name="video",
            name="description",
            field=models.TextField(
                blank=True,
                help_text="Optional. Shown under the lesson title in the player.",
            ),
        ),
        migrations.AddField(
            model_name="video",
            name="thumbnail",
            field=models.ImageField(
                blank=True,
                help_text="Optional. Shown in the lesson list; VdoCipher poster is separate.",
                null=True,
                upload_to=apps.courses.models.video_thumbnail_upload_to,
            ),
        ),
    ]
