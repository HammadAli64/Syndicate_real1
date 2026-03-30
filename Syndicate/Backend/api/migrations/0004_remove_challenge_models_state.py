# Remove GeneratedChallenge and ReferralRestore from api app state (tables unchanged).

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_referral_restore"),
        ("challenges", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name="GeneratedChallenge"),
                migrations.DeleteModel(name="ReferralRestore"),
            ],
            database_operations=[],
        ),
    ]
