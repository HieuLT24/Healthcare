# Generated by Django 5.1.7 on 2025-06-05 20:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('HealthcareApp', '0006_alter_user_date_of_birth'),
    ]

    operations = [
        migrations.AlterField(
            model_name='nutritionplan',
            name='date',
            field=models.DateField(null=True),
        ),
    ]
