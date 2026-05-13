from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_add_created_names_to_importjob'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='promotion_label',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Label promotion'),
        ),
        migrations.AddField(
            model_name='product',
            name='promotion_end_date',
            field=models.DateField(blank=True, null=True, verbose_name='Fin de promotion'),
        ),
    ]
