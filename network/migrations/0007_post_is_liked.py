# Generated by Django 3.1.5 on 2021-01-14 14:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0006_auto_20210114_1402'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='is_liked',
            field=models.BooleanField(default=False),
        ),
    ]
