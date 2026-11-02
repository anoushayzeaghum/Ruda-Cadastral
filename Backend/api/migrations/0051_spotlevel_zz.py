# Spot_Levels.shp has a distinct ZZ elevation attribute; preserve legacy z.
# Because SpotLevel is managed=False, AddField does not create its DB column.
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0050_alter_klmtosaggian_table")]

    operations = [
        migrations.AddField(
            model_name="spotlevel",
            name="zz",
            field=models.FloatField(null=True, blank=True),
        ),
        migrations.RunSQL(
            sql='ALTER TABLE "spot_level" ADD COLUMN IF NOT EXISTS "zz" double precision;',
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
