import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getPlotsGeoJSON } from "../../services/metaverseApi";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MASTERPLAN_SOURCE = "metaverse-masterplan-source";
const MASTERPLAN_FILL = "metaverse-masterplan-fill";
const MASTERPLAN_LINE = "metaverse-masterplan-line";

function addOrUpdateMasterPlan(map, geojson) {
  if (!map.getSource(MASTERPLAN_SOURCE)) {
    map.addSource(MASTERPLAN_SOURCE, {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: MASTERPLAN_FILL,
      type: "fill",
      source: MASTERPLAN_SOURCE,
      paint: {
        "fill-color": [
          "match",
          ["get", "type"],
          "Residential",
          "#2563eb",
          "Commercial",
          "#facc15",
          "Park",
          "#15803d",
          "Road",
          "#ef4444",
          "#9ca3af",
        ],
        "fill-opacity": 0.45,
      },
    });

    map.addLayer({
      id: MASTERPLAN_LINE,
      type: "line",
      source: MASTERPLAN_SOURCE,
      paint: {
        "line-color": "#111827",
        "line-width": 1,
      },
    });
  } else {
    map.getSource(MASTERPLAN_SOURCE).setData(geojson);
  }
}

function fitGeoJSON(map, geojson) {
  if (!geojson?.features?.length) return;

  const bounds = new mapboxgl.LngLatBounds();

  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (!geom) return;

    const addCoord = (coord) => bounds.extend(coord);

    if (geom.type === "Point") addCoord(geom.coordinates);

    if (geom.type === "Polygon") {
      geom.coordinates.flat(1).forEach(addCoord);
    }

    if (geom.type === "MultiPolygon") {
      geom.coordinates.flat(2).forEach(addCoord);
    }

    if (geom.type === "LineString") {
      geom.coordinates.forEach(addCoord);
    }

    if (geom.type === "MultiLineString") {
      geom.coordinates.flat(1).forEach(addCoord);
    }
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 80,
      duration: 900,
      maxZoom: 17,
    });
  }
}

export default function GISMetaverseMap({ mapRef, setIsMapReady, filters }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.3587, 31.5204],
      zoom: 12,
    });

    mapRef.current.on("load", () => {
      setIsMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [mapRef, setIsMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters?.projectId) return;

    const loadLayer = () => {
      const params = {
        project_id: filters.projectId,
        block: filters.block || undefined,
        type: filters.plotType || undefined,
        plot_no: filters.plotNo || undefined,
        plot_area: filters.area || undefined,
      };

      getPlotsGeoJSON(params)
        .then((geojson) => {
          console.log("Loaded plots:", geojson.features.length, params);

          addOrUpdateMasterPlan(map, geojson);
          fitGeoJSON(map, geojson);

          window.dispatchEvent(
            new CustomEvent("metaverse-layer-selected", {
              detail: { layerId: "masterplan", checked: true },
            }),
          );
        })
        .catch(console.error);
    };

    if (map.isStyleLoaded()) {
      loadLayer();
    } else {
      map.once("load", loadLayer);
    }
  }, [filters, mapRef]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
