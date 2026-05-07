from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('purchases', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchaseorderitem',
            name='dot',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='DOT (sem.année)'),
        ),
        migrations.AddField(
            model_name='purchaseorderitem',
            name='emplacement',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Emplacement'),
        ),
    ]
