import json
import requests
from urllib.parse import urlencode
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point

from amenities.models import Amenity

# Bounding box covering RUDA / Lahore area
# Format: south_lat, west_lng, north_lat, east_lng
RUDA_BBOX = "31.35,74.05,31.75,74.55"

OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def map_osm_tags_to_category(tags):
    amenity = tags.get("amenity")
    leisure = tags.get("leisure")
    landuse = tags.get("landuse")
    religion = tags.get("religion")
    highway = tags.get("highway")
    railway = tags.get("railway")
    public_transport = tags.get("public_transport")

    if amenity in ["hospital", "clinic", "doctors"]:
        return "hospital"
    if amenity in ["school", "college", "university"]:
        return "school"
    if leisure == "park" or landuse == "recreation_ground":
        return "park"
    if amenity == "place_of_worship" and religion == "muslim":
        return "mosque"
    if highway == "bus_stop" or amenity == "bus_station":
        return "transport"
    if railway == "station" or public_transport == "station":
        return "transport"
    return None


def get_point_from_osm_element(element):
    if "lat" in element and "lon" in element:
        return Point(element["lon"], element["lat"], srid=4326)
    center = element.get("center")
    if center:
        return Point(center["lon"], center["lat"], srid=4326)
    return None


def build_overpass_query(bbox):
    return f"""
[out:json][timeout:90];
(
  node["amenity"="hospital"]({bbox});
  way["amenity"="hospital"]({bbox});
  relation["amenity"="hospital"]({bbox});

  node["amenity"="clinic"]({bbox});
  way["amenity"="clinic"]({bbox});
  relation["amenity"="clinic"]({bbox});

  node["amenity"="doctors"]({bbox});

  node["amenity"="school"]({bbox});
  way["amenity"="school"]({bbox});
  relation["amenity"="school"]({bbox});

  node["amenity"="college"]({bbox});
  way["amenity"="college"]({bbox});

  node["amenity"="university"]({bbox});
  way["amenity"="university"]({bbox});

  node["leisure"="park"]({bbox});
  way["leisure"="park"]({bbox});
  relation["leisure"="park"]({bbox});

  node["landuse"="recreation_ground"]({bbox});
  way["landuse"="recreation_ground"]({bbox});

  node["amenity"="place_of_worship"]["religion"="muslim"]({bbox});
  way["amenity"="place_of_worship"]["religion"="muslim"]({bbox});
  relation["amenity"="place_of_worship"]["religion"="muslim"]({bbox});

  node["highway"="bus_stop"]({bbox});
  node["amenity"="bus_station"]({bbox});
  way["amenity"="bus_station"]({bbox});

  node["railway"="station"]({bbox});
  way["railway"="station"]({bbox});

  node["public_transport"="station"]({bbox});
  way["public_transport"="station"]({bbox});
);
out center tags;
"""


class Command(BaseCommand):
    help = "Import hospitals, schools, parks, mosques, and transport facilities from OSM Overpass API."

    def add_arguments(self, parser):
        parser.add_argument(
            "--bbox",
            type=str,
            default=RUDA_BBOX,
            help="Bounding box in format: south_lat,west_lng,north_lat,east_lng",
        )
        parser.add_argument(
            "--filter-by-ruda",
            action="store_true",
            default=False,
            help="After import, deactivate amenities outside RUDA boundary polygon.",
        )
        parser.add_argument(
            "--from-file",
            type=str,
            default=None,
            help=(
                "Path to a local Overpass JSON export file to import instead of "
                "querying the live API. Useful when the server has no internet access. "
                "Export from: https://overpass-turbo.eu (Wizard > Export > Raw data)"
            ),
        )
        parser.add_argument(
            "--proxy",
            type=str,
            default=None,
            help="HTTP/HTTPS proxy URL, e.g. http://proxy.company.com:8080",
        )

    def handle(self, *args, **options):
        bbox = options["bbox"]
        filter_by_ruda = options["filter_by_ruda"]
        from_file = options.get("from_file")
        proxy = options.get("proxy")

        self.stdout.write(f"Starting OSM import for bbox: {bbox}")

        if from_file:
            # Load from a pre-downloaded Overpass JSON file
            self.stdout.write(f"Loading from local file: {from_file}")
            try:
                with open(from_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Failed to read file: {e}"))
                return
        else:
            data = self._query_overpass(bbox, proxy)
            if data is None:
                return

        self._process_elements(data)

        if filter_by_ruda:
            self._filter_by_ruda_boundary()

    def _query_overpass(self, bbox, proxy=None):
        """Try each Overpass mirror in order, return parsed JSON or None."""
        query = build_overpass_query(bbox)
        body = urlencode({"data": query})
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        proxies = {"http": proxy, "https": proxy} if proxy else None

        for mirror_url in OVERPASS_MIRRORS:
            self.stdout.write(f"Querying: {mirror_url} ...")
            try:
                response = requests.post(
                    mirror_url,
                    data=body,
                    headers=headers,
                    proxies=proxies,
                    timeout=120,
                )
                if response.status_code == 200:
                    data = response.json()
                    elements = data.get("elements", [])
                    self.stdout.write(f"Received {len(elements)} OSM elements.")
                    return data
                else:
                    self.stdout.write(
                        f"  Mirror returned {response.status_code}, trying next..."
                    )
            except requests.Timeout:
                self.stdout.write("  Timed out, trying next mirror...")
            except requests.RequestException as e:
                self.stdout.write(f"  Error: {e}, trying next mirror...")

        self.stderr.write(
            self.style.ERROR(
                "\nAll Overpass mirrors failed. This is likely a network/firewall issue.\n"
                "\nTo work around this, you can:\n"
                "1. Run the import from a machine with open internet access.\n"
                "2. Download the data manually from https://overpass-turbo.eu and use:\n"
                "   python manage.py import_osm_amenities --from-file /path/to/data.json\n"
                "3. Set a proxy: python manage.py import_osm_amenities --proxy http://proxy:8080\n"
            )
        )
        return None

    def _process_elements(self, data):
        elements = data.get("elements", [])
        self.stdout.write(f"Processing {len(elements)} elements...")

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for element in elements:
            tags = element.get("tags", {})
            category = map_osm_tags_to_category(tags)

            if not category:
                skipped_count += 1
                continue

            point = get_point_from_osm_element(element)
            if not point:
                skipped_count += 1
                continue

            osm_type = element.get("type")
            osm_id = element.get("id")
            source_id = f"osm:{osm_type}:{osm_id}"

            name = (
                tags.get("name")
                or tags.get("name:en")
                or tags.get("operator")
                or "Unnamed Facility"
            )

            _, created = Amenity.objects.update_or_create(
                source_id=source_id,
                defaults={
                    "name": name,
                    "category": category,
                    "geom": point,
                    "source": "osm",
                    "properties": tags,
                    "is_active": True,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"OSM import complete. Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}"
            )
        )

    def _filter_by_ruda_boundary(self):
        from api.models import RudaBoundary
        from django.contrib.gis.db.models import Union

        self.stdout.write("Filtering amenities by RUDA boundary...")
        boundaries = RudaBoundary.objects.all()
        if not boundaries.exists():
            self.stderr.write(
                self.style.WARNING("No RUDA boundary found in database. Skipping filter.")
            )
            return

        ruda_union = boundaries.aggregate(union=Union("geom"))["union"]
        deactivated = Amenity.objects.filter(is_active=True).exclude(
            geom__within=ruda_union
        ).update(is_active=False)

        self.stdout.write(
            self.style.SUCCESS(
                f"Deactivated {deactivated} amenities outside RUDA boundary."
            )
        )
