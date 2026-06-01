from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserActivityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[
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
                    ('other', 'Autre'),
                ], max_length=50)),
                ('description', models.TextField()),
                ('target_user_email', models.EmailField(blank=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='activity_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': "Journal d'activité",
                'verbose_name_plural': "Journal des activités",
                'ordering': ['-created_at'],
            },
        ),
    ]
