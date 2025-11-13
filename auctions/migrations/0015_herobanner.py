# Generated manually

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0014_auction_background_music'),
    ]

    operations = [
        migrations.CreateModel(
            name='HeroBanner',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(help_text='Main banner title', max_length=200)),
                ('subtitle', models.CharField(blank=True, help_text='Secondary text', max_length=300)),
                ('image', models.ImageField(help_text='Banner image (recommended: 1200x500px)', upload_to='hero_banners/')),
                ('cta_text', models.CharField(default='Shop Now', help_text='Call to action button text', max_length=50)),
                ('cta_link', models.CharField(default='/browse', help_text='Link URL (e.g., /browse, /category/electronics)', max_length=200)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order (0 = first)')),
                ('is_active', models.BooleanField(default=True, help_text='Show this banner in the carousel')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Hero Banner',
                'verbose_name_plural': 'Hero Banners',
                'ordering': ['order', 'created_at'],
            },
        ),
    ]
