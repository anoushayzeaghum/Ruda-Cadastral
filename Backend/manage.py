#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# PROJ_DATA must be set before Django/GDAL is imported.
# This points to the directory containing proj.db from the QGIS install.
os.environ.setdefault("PROJ_DATA", r"C:\Program Files\QGIS 3.44.11\share\proj")
os.environ.setdefault("PROJ_LIB",  r"C:\Program Files\QGIS 3.44.11\share\proj")


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
