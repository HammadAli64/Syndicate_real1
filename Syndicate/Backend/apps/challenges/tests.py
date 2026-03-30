from django.test import TestCase

from apps.challenges import views


class ChallengesAppTests(TestCase):
    def test_views_importable(self):
        self.assertTrue(callable(views.challenges_today))
