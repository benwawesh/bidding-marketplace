from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with additional fields"""

    # User types
    USER_TYPE_CHOICES = (
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
        ('admin', 'Admin'),
    )


    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )

    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='buyer')
    phone_number = models.CharField(max_length=15, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    is_verified = models.BooleanField(default=False)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Statistics
    auctions_won = models.IntegerField(default=0)
    auctions_participated = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Trust score (0-100)
    trust_score = models.IntegerField(default=50)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    @property
    def age(self):
        """Calculate age from date_of_birth"""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['-created_at']


class UserProfile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)

    # Verification documents (for sellers)
    id_document = models.FileField(upload_to='documents/', blank=True, null=True)
    is_id_verified = models.BooleanField(default=False)

    # Notifications preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)


    @property
    def age(self):
        """Calculate age from date_of_birth"""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None

    def __str__(self):
        return f"{self.user.username}'s Profile"
