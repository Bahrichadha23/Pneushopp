from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0008_orderitem_discount'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='especes_amount_paid',
            field=models.DecimalField(blank=True, decimal_places=3, default=0, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='especes_remaining',
            field=models.DecimalField(blank=True, decimal_places=3, default=0, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='especes_remarque',
            field=models.TextField(blank=True, null=True),
        ),
    ]
