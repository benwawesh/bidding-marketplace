from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Make a user a seller'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user to make a seller')

    def handle(self, *args, **kwargs):
        username = kwargs['username']

        try:
            user = User.objects.get(username=username)
            user.user_type = 'seller'
            user.save()

            self.stdout.write(
                self.style.SUCCESS(f'✅ Successfully made {username} a SELLER!')
            )
            self.stdout.write(
                self.style.SUCCESS(f'👉 Visit: http://127.0.0.1:8000/admin-panel/')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User "{username}" does not exist!')
            )