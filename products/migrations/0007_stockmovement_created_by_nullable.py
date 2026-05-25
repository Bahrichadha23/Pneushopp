from django.db import migrations


class Migration(migrations.Migration):
    """
    Ensure created_by_id on products_stockmovement is nullable in the actual DB.
    Previous migrations may not have applied the nullable constraint correctly
    if the column already existed (0006 uses IF NOT EXISTS and skips silently).
    This migration explicitly drops any NOT NULL constraint on the column.
    """

    dependencies = [
        ('products', '0006_fix_stockmovement_created_by'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                DO $$
                BEGIN
                    -- Drop NOT NULL constraint if it exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'products_stockmovement'
                          AND column_name = 'created_by_id'
                          AND is_nullable = 'NO'
                    ) THEN
                        ALTER TABLE products_stockmovement
                            ALTER COLUMN created_by_id DROP NOT NULL;
                    END IF;
                END
                $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
