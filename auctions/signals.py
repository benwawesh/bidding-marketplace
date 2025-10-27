from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
from .models import Auction, Round


@receiver(post_save, sender=Auction)
def create_first_round(sender, instance, created, **kwargs):
    """
    Automatically create Round 1 for a new Auction.
    """
    if created and not instance.rounds.filter(round_number=1).exists():
        Round.objects.create(
            auction=instance,
            round_number=1,
            base_price=instance.base_price or Decimal('0.00'),
            participation_fee=instance.participation_fee or Decimal('0.00'),
            start_time=timezone.now(),
            end_time=timezone.now() + timezone.timedelta(hours=2),  # You can change this duration
            is_active=True,
        )
