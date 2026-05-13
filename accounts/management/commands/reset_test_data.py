"""
Django management command — remise à zéro des données de test.

Supprime :
  • Toutes les commandes vente (Order, OrderItem, Avoir, AvoirItem)
  • Tous les bons de commande achat (PurchaseOrder + items)
  • Tous les mouvements de stock (StockMovement)
  • Tous les comptes clients (role='customer') + leurs paniers / favoris
  • Tous les messages support (Message, MessageComment)

Conserve :
  • Tous les produits / articles
  • Tous les fournisseurs
  • Les comptes admin / sales / purchasing

Usage (sur le VPS) :
    python manage.py reset_test_data
    python manage.py reset_test_data --confirm   # sans prompt interactif
"""

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Supprime toutes les données de test (commandes, clients, mouvements, support) sans toucher aux produits ni aux comptes staff."

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Sauter la confirmation interactive",
        )

    def handle(self, *args, **options):
        if not options["confirm"]:
            self.stdout.write(self.style.WARNING(
                "\n⚠️  Cette opération va supprimer DÉFINITIVEMENT :"
                "\n   - Toutes les commandes vente (+ articles, avoirs)"
                "\n   - Tous les bons de commande achat"
                "\n   - Tous les mouvements de stock"
                "\n   - Tous les comptes clients (role=customer) + paniers + favoris"
                "\n   - Tous les messages support"
                "\n\n✅  Seront conservés : Produits, Fournisseurs, Comptes staff\n"
            ))
            confirm = input("Tapez OUI pour continuer : ").strip()
            if confirm != "OUI":
                self.stdout.write(self.style.ERROR("Annulé."))
                return

        with transaction.atomic():

            # ── 1. Avoirs ──────────────────────────────────────────────────────
            from orders.models import Avoir, AvoirItem
            avoirs_items = AvoirItem.objects.all().count()
            AvoirItem.objects.all().delete()
            avoirs = Avoir.objects.all().count()
            Avoir.objects.all().delete()
            self._ok(f"Avoirs/Retours : {avoirs} avoirs, {avoirs_items} lignes supprimés")

            # ── 2. Commandes vente ─────────────────────────────────────────────
            from orders.models import Order, OrderItem
            order_items = OrderItem.objects.all().count()
            OrderItem.objects.all().delete()
            orders = Order.objects.all().count()
            Order.objects.all().delete()
            self._ok(f"Commandes vente : {orders} commandes, {order_items} lignes supprimées")

            # ── 3. Bons de commande achat ──────────────────────────────────────
            try:
                from purchases.models import PurchaseOrder
                # Les items sont supprimés en cascade via on_delete=CASCADE
                pos = PurchaseOrder.objects.all().count()
                PurchaseOrder.objects.all().delete()
                self._ok(f"Bons de commande achat : {pos} supprimés")
            except ImportError:
                self.stdout.write("  (module purchases introuvable, ignoré)")

            # ── 4. Mouvements de stock ─────────────────────────────────────────
            try:
                from products.models import StockMovement
                mvts = StockMovement.objects.all().count()
                StockMovement.objects.all().delete()
                self._ok(f"Mouvements de stock : {mvts} supprimés")
            except ImportError:
                self.stdout.write("  (StockMovement introuvable, ignoré)")

            # ── 5. Paniers + Favoris des clients ───────────────────────────────
            try:
                from cart.models import Cart, CartItem
                ci = CartItem.objects.all().count()
                CartItem.objects.all().delete()
                c = Cart.objects.all().count()
                Cart.objects.all().delete()
                self._ok(f"Paniers : {c} paniers, {ci} articles supprimés")
            except ImportError:
                pass

            try:
                from favorites.models import Favorite
                fav = Favorite.objects.all().count()
                Favorite.objects.all().delete()
                self._ok(f"Favoris : {fav} supprimés")
            except ImportError:
                pass

            # ── 6. Messages support ────────────────────────────────────────────
            try:
                from communication.models import Message, MessageComment
                mc = MessageComment.objects.all().count()
                MessageComment.objects.all().delete()
                m = Message.objects.all().count()
                Message.objects.all().delete()
                self._ok(f"Support : {m} messages, {mc} commentaires supprimés")
            except ImportError:
                pass

            # ── 7. Comptes clients (role=customer) ─────────────────────────────
            from django.contrib.auth import get_user_model
            User = get_user_model()
            clients = User.objects.filter(role="customer")
            nb = clients.count()
            clients.delete()
            self._ok(f"Comptes clients : {nb} supprimés")

        # ── Résumé ─────────────────────────────────────────────────────────────
        from django.contrib.auth import get_user_model
        User = get_user_model()
        from products.models import Product
        try:
            from suppliers.models import Supplier
            nb_suppliers = Supplier.objects.count()
        except Exception:
            nb_suppliers = "?"

        self.stdout.write(self.style.SUCCESS(
            f"\n✅  Remise à zéro terminée avec succès !"
            f"\n   📦 Produits conservés : {Product.objects.count()}"
            f"\n   🏭 Fournisseurs conservés : {nb_suppliers}"
            f"\n   👤 Comptes staff conservés : {User.objects.exclude(role='customer').count()}"
        ))

    def _ok(self, msg):
        self.stdout.write(self.style.SUCCESS(f"  ✓ {msg}"))
