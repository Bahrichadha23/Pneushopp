from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_customuser_plain_password'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useractivitylog',
            name='action',
            field=models.CharField(choices=[
                ('login', 'Connexion'),
                ('create_user', 'Création utilisateur'),
                ('update_user', 'Modification utilisateur'),
                ('delete_user', 'Suppression utilisateur'),
                ('toggle_user', 'Activation/désactivation utilisateur'),
                ('confirm_order', 'Validation commande'),
                ('cancel_order', 'Annulation commande'),
                ('create_invoice', 'Création facture'),
                ('create_delivery', 'Création livraison'),
                ('update_delivery', 'Mise à jour livraison'),
                ('create_bon', 'Création bon de commande'),
                ('add_stock', 'Ajout stock'),
                ('adjust_stock', 'Ajustement stock'),
                ('create_purchase', 'Commande achat'),
                ('sav_update', 'Mise à jour SAV'),
                ('add_product', 'Ajout article'),
                ('update_product', 'Modification article'),
                ('delete_product', 'Suppression article'),
                ('update_price', 'Modification prix'),
                ('dot_sale', 'Vente DOT'),
                ('apply_promotion', 'Application promotion'),
                ('remove_promotion', 'Retrait promotion'),
                ('other', 'Autre'),
            ], max_length=50),
        ),
    ]
