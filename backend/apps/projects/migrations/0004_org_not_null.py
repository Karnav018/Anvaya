from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orgs", "0001_initial"),
        ("projects", "0003_backfill_orgs"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="organization",
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name="projects",
                to="orgs.organization",
            ),
        ),
        migrations.AlterField(
            model_name="export",
            name="organization",
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name="exports",
                to="orgs.organization",
            ),
        ),
    ]
