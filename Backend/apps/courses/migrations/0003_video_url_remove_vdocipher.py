# Replace VdoCipher id with a plain video URL for playback.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0002_course_cover_image_video_description_thumbnail"),
    ]

    operations = [
        migrations.AddField(
            model_name="video",
            name="video_url",
            field=models.URLField(
                blank=True,
                default="",
                help_text="Direct video file URL (MP4/WebM) or a normal watch link (e.g. YouTube). Set in Django admin.",
                max_length=2048,
            ),
        ),
        migrations.RemoveField(
            model_name="video",
            name="vdocipher_id",
        ),
    ]
