# Generated by Django 3.1.5 on 2021-01-14 14:02

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0005_follow'),
    ]

    operations = [
        migrations.RenameField(
            model_name='post',
            old_name='createDate',
            new_name='create_date',
        ),
        migrations.RenameField(
            model_name='post',
            old_name='editDate',
            new_name='edit_date',
        ),
    ]
