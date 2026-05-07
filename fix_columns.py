import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pneushop.settings')
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    # Fix date_livraison_prevue to allow NULL (model says null=True)
    cursor.execute(
        'ALTER TABLE orders_purchaseorder ALTER COLUMN date_livraison_prevue DROP NOT NULL'
    )
    print('Fixed: date_livraison_prevue now allows NULL')

    # Verify final column state
    cursor.execute(
        "SELECT column_name, is_nullable, data_type FROM information_schema.columns "
        "WHERE table_name = 'orders_purchaseorder' ORDER BY column_name"
    )
    for row in cursor.fetchall():
        print(f"  {row[0]}: nullable={row[1]}, type={row[2]}")
