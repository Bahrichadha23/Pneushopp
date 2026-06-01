from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('purchases', '0004_add_purchase_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchaseorderitem',
            name='frais_livraison',
            field=models.DecimalField(
                decimal_places=3,
                default=0,
                max_digits=10,
                verbose_name='Frais de livraison',
            ),
        ),
    ]
