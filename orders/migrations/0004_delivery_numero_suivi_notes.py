from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_add_payment_columns'),
    ]

    operations = [
        migrations.AddField(
            model_name='delivery',
            name='numero_suivi',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='delivery',
            name='notes',
            field=models.TextField(blank=True, null=True),
        ),
    ]
