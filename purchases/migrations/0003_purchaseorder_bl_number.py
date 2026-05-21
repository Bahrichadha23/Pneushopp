from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('purchases', '0002_purchaseorderitem_dot_emplacement'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchaseorder',
            name='bl_number',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Numéro BL'),
        ),
    ]
