from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('communication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='messagecomment',
            name='attachment',
            field=models.FileField(blank=True, null=True, upload_to='support_attachments/'),
        ),
    ]
