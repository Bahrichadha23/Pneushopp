import orders.models
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_warrantyclaim'),
    ]

    operations = [
        migrations.CreateModel(
            name='WarrantyClaimTireImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.FileField(storage=orders.models._sav_storage, upload_to='sav/tire_images/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('claim', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tire_images', to='orders.warrantyclaim')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
    ]
