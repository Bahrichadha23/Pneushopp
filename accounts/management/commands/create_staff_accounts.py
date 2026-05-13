"""
Django management command to create/update PneuShop staff accounts.

Usage (on VPS):
    python manage.py create_staff_accounts
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create or update PneuShop staff accounts (commercial + achat)"

    ACCOUNTS = [
        {
            "email":      "service.commercial@pneushop.tn",
            "username":   "service.commercial",
            "password":   "S25e_Rcom",
            "role":       "sales",
            "first_name": "Service",
            "last_name":  "Commercial",
        },
        {
            "email":      "service.achat@pneushop.tn",
            "username":   "service.achat",
            "password":   "E2678;-chat9;:",
            "role":       "purchasing",
            "first_name": "Service",
            "last_name":  "Achat",
        },
    ]

    def handle(self, *args, **options):
        User = get_user_model()
        for acc in self.ACCOUNTS:
            user, created = User.objects.get_or_create(email=acc["email"])
            user.set_password(acc["password"])
            user.username    = acc["username"]
            user.role        = acc["role"]
            user.first_name  = acc["first_name"]
            user.last_name   = acc["last_name"]
            user.is_active   = True
            user.is_staff    = False
            user.is_superuser = False
            user.save()
            action = "Créé" if created else "Mis à jour"
            self.stdout.write(
                self.style.SUCCESS(
                    f"[{action}] {user.email}  rôle={user.role}"
                )
            )
        self.stdout.write(self.style.SUCCESS("Comptes configurés avec succès."))
