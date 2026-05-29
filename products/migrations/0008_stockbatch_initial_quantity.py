from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_stockmovement_created_by_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='stockbatch',
            name='initial_quantity',
            field=models.PositiveIntegerField(
                default=0,
                verbose_name='Quantite initiale a la reception',
                help_text="Jamais modifié après création — sert à l'audit.",
            ),
        ),
        # Rétro-remplissage : les lots existants ont initial_quantity = quantity actuelle
        migrations.RunSQL(
            sql="UPDATE products_stockbatch SET initial_quantity = quantity WHERE initial_quantity = 0",
            reverse_sql="UPDATE products_stockbatch SET initial_quantity = 0",
        ),
    ]
