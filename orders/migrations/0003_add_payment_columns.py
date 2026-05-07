"""
Migration to add payment-related columns that may be missing from the DB
because the table was created before these fields were added to the model.
Uses ADD COLUMN IF NOT EXISTS to be safe (idempotent).
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_avoir_avoiritem'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE orders_order
                    ADD COLUMN IF NOT EXISTS transfer_number VARCHAR(100) NULL,
                    ADD COLUMN IF NOT EXISTS transfer_holder_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS transfer_bank_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS transfer_image_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS transfer_image VARCHAR(500) NULL,
                    ADD COLUMN IF NOT EXISTS transfer_amount_paid NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS transfer_remaining NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS transfer_remarque TEXT NULL,
                    ADD COLUMN IF NOT EXISTS lettre_number VARCHAR(100) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_date DATE NULL,
                    ADD COLUMN IF NOT EXISTS lettre_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_bank_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_rib VARCHAR(100) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_lieu VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_image_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_image VARCHAR(500) NULL,
                    ADD COLUMN IF NOT EXISTS lettre_amount_paid NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS lettre_remaining NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS lettre_remarque TEXT NULL,
                    ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(100) NULL,
                    ADD COLUMN IF NOT EXISTS cheque_date DATE NULL,
                    ADD COLUMN IF NOT EXISTS cheque_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS cheque_bank_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS cheque_image_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS cheque_image VARCHAR(500) NULL,
                    ADD COLUMN IF NOT EXISTS cheque_amount_paid NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS cheque_remaining NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS cheque_remarque TEXT NULL,
                    ADD COLUMN IF NOT EXISTS cod_authorization_number VARCHAR(100) NULL,
                    ADD COLUMN IF NOT EXISTS cod_bank_name VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS cod_amount_paid NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS cod_remaining NUMERIC(10,3) NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS cod_remarque TEXT NULL,
                    ADD COLUMN IF NOT EXISTS commercial VARCHAR(255) NULL,
                    ADD COLUMN IF NOT EXISTS cri_amount_paid NUMERIC(10,3) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS cri_remaining NUMERIC(10,3) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS cri_remarque TEXT NULL,
                    ADD COLUMN IF NOT EXISTS warranty_accepted BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS warranty_vehicle_registration VARCHAR(100) NULL,
                    ADD COLUMN IF NOT EXISTS warranty_vehicle_mileage VARCHAR(50) NULL,
                    ADD COLUMN IF NOT EXISTS delivery_cost NUMERIC(10,3) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) NULL;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
