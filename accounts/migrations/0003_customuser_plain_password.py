from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_useractivitylog'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='plain_password',
            field=models.CharField(
                blank=True,
                default='',
                max_length=255,
                verbose_name='Mot de passe (visible admin)',
            ),
        ),
    ]
