"""
Django management command to fix product brands that were incorrectly
extracted from the product name during a previous Excel import
(e.g. "GOOD YEAR" → "GOOD" instead of "Goodyear").

Re-runs the brand extraction logic on every product's name and
normalizes the brand to its canonical form when a known brand is found.

Usage (on VPS):
    python manage.py fix_brands
    python manage.py fix_brands --dry-run
"""
from django.core.management.base import BaseCommand

from products.models import Product
from products.import_views import extract_brand_size_from_name, BRAND_CANONICAL


class Command(BaseCommand):
    help = "Fix product brands incorrectly extracted from the product name during import"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would change without saving',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        updated = 0

        for product in Product.objects.all():
            auto_brand, _ = extract_brand_size_from_name(product.name)
            if not auto_brand:
                continue

            canonical = BRAND_CANONICAL.get(auto_brand.lower().strip(), auto_brand)
            if canonical and canonical != product.brand:
                self.stdout.write(
                    f"#{product.id} {product.name[:60]!r}: "
                    f"{product.brand!r} -> {canonical!r}"
                )
                if not dry_run:
                    product.brand = canonical
                    product.save(update_fields=['brand'])
                updated += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f"{updated} produit(s) seraient mis à jour (dry-run)."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{updated} produit(s) mis à jour."))
