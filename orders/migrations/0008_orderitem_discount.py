from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0007_alter_warrantyclaim_invoice_photo_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='discount',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Discount percentage (0-100)', max_digits=5),
        ),
    ]
