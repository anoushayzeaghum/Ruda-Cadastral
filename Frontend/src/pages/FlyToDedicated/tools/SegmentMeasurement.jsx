import { useEffect, useRef, useState } from "react";
import * as turf from "@turf/turf";
import { Ruler } from "lucide-react";

const SOURCE_ID = "segment-measurement-source";
const POINT_LAYER = "segment-measurement-points";
const LINE_LAYER = "segment-measurement-line";
const FILL_LAYER = "segment-measurement-fill";
const LABEL_LAYER = "segment-measurement-label";

const emptyFC = { type: "FeatureCollection", features: [] };

function removeLayer(map, id) {
  try {
    if (map?.getLayer(id)) map.removeLayer(id);
  } catch (_) {}
}

function removeSource(map, id) {
  try {
    if (map?.getSource(id)) map.removeSource(id);
  } catch (_) {}
}

function clearMeasurement(map) {
  removeLayer(map, LABEL_LAYER);
  removeLayer(map, POINT_LAYER);
  removeLayer(map, LINE_LAYER);
  removeLayer(map, FILL_LAYER);
  removeSource(map, SOURCE_ID);

  if (map?.getCanvas()) map.getCanvas().style.cursor = "";
}

function addSourceAndLayers(map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: emptyFC,
    });
  }

  if (!map.getLayer(FILL_LAYER)) {
    map.addLayer({
      id: FILL_LAYER,
      type: "fill",
      source: SOURCE_ID,
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": "#0d8bff",
        "fill-opacity": 0.18,
      },
    });
  }

  if (!map.getLayer(LINE_LAYER)) {
    map.addLayer({
      id: LINE_LAYER,
      type: "line",
      source: SOURCE_ID,
      filter: [
        "any",
        ["==", "$type", "LineString"],
        ["==", "$type", "Polygon"],
      ],
      paint: {
        "line-color": "#0d8bff",
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });
  }

  if (!map.getLayer(POINT_LAYER)) {
    map.addLayer({
      id: POINT_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-color": "#0d8bff",
        "circle-stroke-width": 2,
      },
    });
  }

  if (!map.getLayer(LABEL_LAYER)) {
    map.addLayer({
      id: LABEL_LAYER,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "label"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 13,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-anchor": "bottom",
        "text-offset": [0, -1],
      },
      paint: {
        "text-color": "#0d8bff",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });
  }
}

export default function SegmentMeasurement({ map }) {
  const [measureType, setMeasureType] = useState("");
  const coordsRef = useRef([]);

  useEffect(() => {
    if (!map || !measureType) return;

    clearMeasurement(map);
    addSourceAndLayers(map);
    map.getCanvas().style.cursor = "crosshair";
    coordsRef.current = [];

    const updateSource = () => {
      const coords = coordsRef.current;
      const features = coords.map((coord) => turf.point(coord));

      if (measureType === "coordinate" && coords.length) {
        const last = coords[coords.length - 1];
        features.push(
          turf.point(last, {
            label: `${last[1].toFixed(6)}, ${last[0].toFixed(6)}`,
          }),
        );
      }

      if (measureType === "length" && coords.length > 1) {
        const line = turf.lineString(coords);
        const length = turf.length(line, { units: "kilometers" });
        features.push(line);
        features.push(
          turf.point(coords[coords.length - 1], {
            label:
              length >= 1
                ? `${length.toFixed(3)} km`
                : `${(length * 1000).toFixed(2)} m`,
          }),
        );
      }

      if (measureType === "area") {
        if (coords.length > 1) {
          features.push(turf.lineString(coords));
        }

        if (coords.length > 2) {
          const polygon = turf.polygon([[...coords, coords[0]]]);
          const area = turf.area(polygon);
          const centroid = turf.centroid(polygon);

          features.push(polygon);
          centroid.properties = {
            label:
              area >= 1000000
                ? `${(area / 1000000).toFixed(3)} km²`
                : `${area.toFixed(2)} m²`,
          };
          features.push(centroid);
        }
      }

      map.getSource(SOURCE_ID)?.setData({
        type: "FeatureCollection",
        features,
      });
    };

    const onClick = (e) => {
      if (measureType === "coordinate") {
        coordsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      } else {
        coordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      }

      updateSource();
    };

    const onRightClick = (e) => {
      e.preventDefault();
      coordsRef.current = [];
      map.getSource(SOURCE_ID)?.setData(emptyFC);
    };

    map.on("click", onClick);
    map.on("contextmenu", onRightClick);

    return () => {
      map.off("click", onClick);
      map.off("contextmenu", onRightClick);
      clearMeasurement(map);
    };
  }, [map, measureType]);

  const handleChange = (e) => {
    setMeasureType(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 rounded-md bg-[#06291f] px-2 py-1.5 text-white shadow-lg">
      <div className="flex items-center gap-1 text-[12px] font-bold">
        <Ruler size={15} />
        Measure
      </div>

      <select
        value={measureType}
        onChange={handleChange}
        className="h-7 w-[110px] rounded bg-white px-2 text-[12px] text-[#06291f] outline-none"
      >
        <option value="">-----</option>
        <option value="coordinate">Coordinate</option>
        <option value="length">Length</option>
        <option value="area">Area</option>
      </select>

      <span className="text-[12px] font-bold">✓ Segment(s):</span>
      <span className="text-[12px] font-bold">✓ Previous</span>
    </div>
  );
}
