# Generated by Django 5.1.7 on 2025-06-05 20:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HealthcareApp', '0009_alter_user_date_of_birth'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
    ]
