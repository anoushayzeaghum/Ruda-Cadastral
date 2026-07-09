from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_alter_trijunction_table"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterUniqueTogether(
                    name="projectmauza",
                    unique_together=set(),
                ),
                migrations.RemoveField(
                    model_name="projectmauza",
                    name="murabba",
                ),
                migrations.AddField(
                    model_name="projectmauza",
                    name="square_id",
                    field=models.FloatField(
                        db_column="square_id",
                        null=True,
                        blank=True,
                    ),
                ),
            ],
        ),
    ]