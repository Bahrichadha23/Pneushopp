from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):
    """
    The products_stockmovement table may have been created before the
    created_by FK column was added to the model.  This migration adds it
    safely with IF NOT EXISTS so it is a no-op when the column already exists.
    """

    dependencies = [
        ('products', '0005_stockbatch'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'products_stockmovement'
                          AND column_name = 'created_by_id'
                    ) THEN
                        ALTER TABLE products_stockmovement
                            ADD COLUMN created_by_id integer
                            REFERENCES accounts_customuser(id)
                            ON DELETE SET NULL
                            DEFERRABLE INITIALLY DEFERRED;
                    END IF;
                END
                $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
