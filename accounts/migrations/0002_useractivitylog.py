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
                    ('logout', 'Déconnexion'),
                    ('create_user', 'Création utilisateur'),
                    ('update_user', 'Modification utilisateur'),
                    ('delete_user', 'Suppression utilisateur'),
                    ('toggle_user', 'Activation/Désactivation utilisateur'),
                    ('view', 'Consultation'),
                    ('other', 'Autre'),
                ], max_length=50)),
                ('description', models.TextField()),
                ('target_user_email', models.CharField(blank=True, max_length=255)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='activity_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': "Journal d'activité",
                'verbose_name_plural': "Journaux d'activité",
                'ordering': ['-created_at'],
            },
        ),
    ]
