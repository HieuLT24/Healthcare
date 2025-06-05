from django.db import migrations, models

# Forward SQL: ALTER TABLE HealthcareApp_user ADD COLUMN role VARCHAR(50) DEFAULT 'user';
# Reverse SQL: ALTER TABLE HealthcareApp_user DROP COLUMN role;

class Migration(migrations.Migration):
    dependencies = [
         ('HealthcareApp', '0001_initial'),
    ]

    operations = [
         migrations.RunSQL(
             sql="ALTER TABLE HealthcareApp_user ADD COLUMN role VARCHAR(50) DEFAULT 'user';",
             reverse_sql="ALTER TABLE HealthcareApp_user DROP COLUMN role;"
         )
    ] 