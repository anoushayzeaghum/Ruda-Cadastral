import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Legend from "./Legend";

import {
  getDivisionBoundary,
  getDistrictBoundary,
  getTehsilBoundary,
  getMouzaBoundary,
  getKhasras,
  getMurabbas,
  getRudaGeoJSON,
  getTrijunctionPoints,
} from "../../services/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [74.3587, 31.5204];
const DEFAULT_ZOOM = 8;

const KHASRA_SOURCE = "khasra-source";
const KHASRA_FILL = "khasra-fill";
const KHASRA_LINE = "khasra-line";

const MURABBA_SOURCE = "murabba-source";
const MURABBA_FILL = "murabba-fill";
const MURABBA_LINE = "murabba-line";

const SELECTED_SOURCE = "selected-source";
const SELECTED_FILL = "selected-fill";
const SELECTED_LINE = "selected-line";

const CONTROL_POINTS_SOURCE = "control-points-source";
const CONTROL_POINTS_LAYER = "control-points-layer";

const TRI_JUNCTION_POINTS_SOURCE = "tri-junction-points-source";
const TRI_JUNCTION_POINTS_LAYER = "tri-junction-points-layer";

const MAP_THEME = {
  fillColor: "#158033",
  fillOpacity: 0.2,
  lineColor: "#1e3a5f",
  lineWidth: 2,
};

const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const mergeFeatureCollections = (collections) => ({
  type: "FeatureCollection",
  features: collections.flatMap((collection) =>
    Array.isArray(collection?.features) ? collection.features : [],
  ),
});

function ringArea(coords) {
  let area = 0;
  if (!coords || coords.length === 0) return 0;

  for (let i = 0, len = coords.length; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return (Math.abs(area) * 6378137 * 6378137) / 2.0;
}

function computeArea(feature) {
  if (!feature || !feature.geometry) return 0;

  const geom = feature.geometry;
  let total = 0;

  if (geom.type === "Polygon") {
    geom.coordinates.forEach((ring) => {
      total += ringArea(ring);
    });
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly) => {
      poly.forEach((ring) => {
        total += ringArea(ring);
      });
    });
  }

  return Math.abs(total);
}

const BASEMAP_STYLES = {
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
  Dark: "mapbox://styles/mapbox/dark-v11",
  Outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

class BasemapControl {
  onAdd(map) {
    this.map = map;

    const container = document.createElement("div");
    container.className =
      "mapboxgl-ctrl mapboxgl-ctrl-group bg-white rounded shadow";

    const select = document.createElement("select");
    select.style.padding = "4px";
    select.style.fontSize = "12px";
    select.style.border = "none";
    select.style.outline = "none";
    select.style.cursor = "pointer";

    Object.keys(BASEMAP_STYLES).forEach((name) => {
      const option = document.createElement("option");
      option.value = BASEMAP_STYLES[name];
      option.textContent = name;
      select.appendChild(option);
    });

    select.onchange = (e) => {
      map.setStyle(e.target.value);
    };

    container.appendChild(select);
    this.container = container;

    return container;
  }

  onRemove() {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
  }
}

export default function MapView({
  selectedDivision,
  selectedDistrict,
  selectedTehsil,
  selectedMouza,
  viewBy,
  onParcelSelect,
  layers = {},
  selectedRudaPhaseIds = [],
  basemap = "Outdoors",
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: BASEMAP_STYLES.Outdoors,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      map.setProjection("globe");
      map.addControl(new BasemapControl(), "top-left");
      map.addControl(new mapboxgl.NavigationControl(), "top-left");

      map.on("load", () => {
        setIsMapReady(true);
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Error initializing map");
      });

      mapInstance.current = map;

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (e) {
      console.error("Map initialization error:", e);
      setError("Failed to initialize map");
    }
  }, []);

  const zoomToGeoJSON = (geojson) => {
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    geojson.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      const traverse = (c) => {
        if (typeof c[0] === "number") {
          bounds.extend(c);
        } else {
          c.forEach(traverse);
        }
      };

      traverse(coords);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
  };

  const getBoundaryIds = (level) => ({
    source: `${level}-boundary-source`,
    fill: `${level}-boundary-fill`,
    line: `${level}-boundary-line`,
  });

  const clearBoundaryLevel = (level) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);

    try {
      if (map.getLayer(ids.fill)) map.removeLayer(ids.fill);
      if (map.getLayer(ids.line)) map.removeLayer(ids.line);
      if (map.getSource(ids.source)) map.removeSource(ids.source);
    } catch (e) {
      console.warn(`Error clearing boundary level ${level}`, e);
    }
  };

  const drawBoundaryLevel = (level, geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    const ids = getBoundaryIds(level);
    clearBoundaryLevel(level);

    try {
      map.addSource(ids.source, {
        type: "geojson",
        data: geojson || emptyFeatureCollection(),
      });

      map.addLayer({
        id: ids.fill,
        type: "fill",
        source: ids.source,
        paint: {
          "fill-color": level.startsWith("ruda") ? "#3d7cc4" : "#0b6a2e",
          "fill-opacity": level.startsWith("ruda") ? 0.5 : 0.2,
        },
      });

      map.addLayer({
        id: ids.line,
        type: "line",
        source: ids.source,
        paint: {
          "line-color": level.startsWith("ruda") ? "#14532d" : "#194c8e",
          "line-width": MAP_THEME.lineWidth,
        },
      });

      currentGeojson.current[level] = geojson;
    } catch (e) {
      console.error("drawBoundaryLevel error", e);
    }
  };

  const clearLayerAndSource = (fillId, lineId, sourceId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (fillId && map.getLayer(fillId)) map.removeLayer(fillId);
      if (lineId && map.getLayer(lineId)) map.removeLayer(lineId);
      if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing ${sourceId}`, e);
    }
  };

  const clearPointLayer = (sourceId, layerId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing point layer ${layerId}`, e);
    }
  };

  const clearKhasraLayers = () => {
    clearLayerAndSource(KHASRA_FILL, KHASRA_LINE, KHASRA_SOURCE);
  };

  const clearMurabbaLayers = () => {
    clearLayerAndSource(MURABBA_FILL, MURABBA_LINE, MURABBA_SOURCE);
  };

  const drawPointLayer = ({
    sourceId,
    layerId,
    geojson,
    color,
    strokeColor,
    radius,
    popupTitle,
  }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearPointLayer(sourceId, layerId);

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    try {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": radius,
          "circle-color": color,
          "circle-stroke-width": 2,
          "circle-stroke-color": strokeColor,
          "circle-opacity": 0.95,
        },
      });

      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", layerId, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const props = feature.properties || {};
        const html = `
          <div style="min-width:180px">
            <strong>${popupTitle}</strong><br/>
            <strong>Type:</strong> ${props.type ?? "-"}<br/>
            <strong>M1:</strong> ${props.m1 ?? "-"}<br/>
            <strong>M2:</strong> ${props.m2 ?? "-"}<br/>
            <strong>M3:</strong> ${props.m3 ?? "-"}<br/>
            <strong>ID:</strong> ${props.id ?? "-"}
          </div>
        `;

        new mapboxgl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const drawKhasras = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearKhasraLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      map.addSource(KHASRA_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: KHASRA_FILL,
        type: "fill",
        source: KHASRA_SOURCE,
        paint: {
          "fill-color": MAP_THEME.fillColor,
          "fill-opacity": MAP_THEME.fillOpacity,
        },
      });

      map.addLayer({
        id: KHASRA_LINE,
        type: "line",
        source: KHASRA_SOURCE,
        paint: {
          "line-color": MAP_THEME.lineColor,
          "line-width": MAP_THEME.lineWidth,
        },
      });

      currentGeojson.current.khasra = geojson;

      if (!map.getSource(SELECTED_SOURCE)) {
        map.addSource(SELECTED_SOURCE, {
          type: "geojson",
          data: emptyFeatureCollection(),
        });

        map.addLayer({
          id: SELECTED_FILL,
          type: "fill",
          source: SELECTED_SOURCE,
          paint: {
            "fill-color": "#FFD54F",
            "fill-opacity": 0.7,
          },
        });

        map.addLayer({
          id: SELECTED_LINE,
          type: "line",
          source: SELECTED_SOURCE,
          paint: {
            "line-color": "#b38f00",
            "line-width": 2,
          },
        });
      }

      map.on("click", KHASRA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;

          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };

          try {
            const src = map.getSource(SELECTED_SOURCE);
            if (src) src.setData(selectedGeo);
          } catch (err) {
            console.warn("Could not set selected feature", err);
          }

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "khasra";
            onParcelSelect(cloned);
          }
        }
      });

      map.on("mouseenter", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "";
      });

      zoomToGeoJSON(geojson);
      setFeatureCount(geojson.features.length);
    } catch (e) {
      console.error("Khasra drawing error:", e);
      setError("Failed to display Khasras");
    }
  };

  const drawMurabbas = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearMurabbaLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      map.addSource(MURABBA_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: MURABBA_FILL,
        type: "fill",
        source: MURABBA_SOURCE,
        paint: {
          "fill-color": MAP_THEME.fillColor,
          "fill-opacity": MAP_THEME.fillOpacity,
        },
      });

      map.addLayer({
        id: MURABBA_LINE,
        type: "line",
        source: MURABBA_SOURCE,
        paint: {
          "line-color": MAP_THEME.lineColor,
          "line-width": MAP_THEME.lineWidth,
        },
      });

      currentGeojson.current.murabba = geojson;

      if (!map.getSource(SELECTED_SOURCE)) {
        map.addSource(SELECTED_SOURCE, {
          type: "geojson",
          data: emptyFeatureCollection(),
        });

        map.addLayer({
          id: SELECTED_FILL,
          type: "fill",
          source: SELECTED_SOURCE,
          paint: {
            "fill-color": "#FFD54F",
            "fill-opacity": 0.7,
          },
        });

        map.addLayer({
          id: SELECTED_LINE,
          type: "line",
          source: SELECTED_SOURCE,
          paint: {
            "line-color": "#b38f00",
            "line-width": 2,
          },
        });
      }

      map.on("click", MURABBA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;

          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };

          try {
            const src = map.getSource(SELECTED_SOURCE);
            if (src) src.setData(selectedGeo);
          } catch (err) {
            console.warn("Could not set selected feature", err);
          }

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "murabba";
            onParcelSelect(cloned);
          }
        }
      });

      zoomToGeoJSON(geojson);
      setFeatureCount(geojson.features.length);
    } catch (e) {
      console.error("Murabba drawing error:", e);
      setError("Failed to display Murabbas");
    }
  };

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadBoundary = async () => {
      try {
        setIsLoading(true);
        setError("");

        ["division", "district", "tehsil", "mouza"].forEach((lvl) =>
          clearBoundaryLevel(lvl),
        );

        setFeatureCount(0);

        if (selectedMouza) {
          const mouzaId =
            selectedMouza.mouza_id || selectedMouza.id || selectedMouza;

          const geojson = await getMouzaBoundary(mouzaId);
          if (cancelled) return;

          if (geojson?.features?.length) {
            drawBoundaryLevel("mouza", geojson);
            zoomToGeoJSON(geojson);
            setFeatureCount(geojson.features.length);
          }
          return;
        }

        if (selectedTehsil?.length) {
          const geojsons = await Promise.all(
            selectedTehsil.map((t) => getTehsilBoundary(t.id || t)),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            drawBoundaryLevel("tehsil", merged);
            zoomToGeoJSON(merged);
            setFeatureCount(merged.features.length);
          }
          return;
        }

        if (selectedDistrict?.length) {
          const geojsons = await Promise.all(
            selectedDistrict.map((d) => getDistrictBoundary(d.id || d)),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            drawBoundaryLevel("district", merged);
            zoomToGeoJSON(merged);
            setFeatureCount(merged.features.length);
          }
          return;
        }

        if (selectedDivision?.length) {
          const geojsons = await Promise.all(
            selectedDivision.map((div) =>
              getDivisionBoundary(div.division_i || div),
            ),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            drawBoundaryLevel("division", merged);
            zoomToGeoJSON(merged);
            setFeatureCount(merged.features.length);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Boundary load error:", e);
          setError("Failed to load boundary");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBoundary();

    return () => {
      cancelled = true;
    };
  }, [
    selectedDivision,
    selectedDistrict,
    selectedTehsil,
    selectedMouza,
    isMapReady,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const styleUrl = BASEMAP_STYLES[basemap] || basemap;
    if (!styleUrl) return;

    try {
      map.setStyle(styleUrl);

      map.once("style.load", () => {
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;

            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else if (key === "control-points") {
              drawPointLayer({
                sourceId: CONTROL_POINTS_SOURCE,
                layerId: CONTROL_POINTS_LAYER,
                geojson: g,
                color: "#0b2ef5",
                strokeColor: "#78350f",
                radius: 5,
                popupTitle: "Control Point",
              });
            } else if (key === "tri-junction-points") {
              drawPointLayer({
                sourceId: TRI_JUNCTION_POINTS_SOURCE,
                layerId: TRI_JUNCTION_POINTS_LAYER,
                geojson: g,
                color: "#ef4444",
                strokeColor: "#890b0b",
                radius: 6,
                popupTitle: "Tri-junction Point",
              });
            } else {
              drawBoundaryLevel(key, g);
            }
          });
        } catch (e) {
          console.warn("Error restoring layers after style change", e);
        }
      });
    } catch (e) {
      console.error("Failed to change basemap style", e);
    }
  }, [basemap, isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;

    const loadRuda = async () => {
      if (!layers?.rudaBoundary) {
        try {
          (selectedRudaPhaseIds || []).forEach((id) => {
            const lvl = `ruda-${id}`;
            clearBoundaryLevel(lvl);
            delete currentGeojson.current[lvl];
          });
        } catch (e) {}
        return;
      }

      if (!selectedRudaPhaseIds?.length) return;

      try {
        setIsLoading(true);

        const results = await Promise.all(
          selectedRudaPhaseIds.map((gid) =>
            getRudaGeoJSON(gid)
              .then((geojson) => ({ gid, geojson }))
              .catch((e) => {
                console.error("RUDA geojson error", e);
                return null;
              }),
          ),
        );

        results.filter(Boolean).forEach((item) => {
          drawBoundaryLevel(`ruda-${item.gid}`, item.geojson);
          currentGeojson.current[`ruda-${item.gid}`] = item.geojson;
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRuda();
  }, [isMapReady, layers?.rudaBoundary, selectedRudaPhaseIds]);

  useEffect(() => {
    if (!selectedMouza || !isMapReady || viewBy !== "khasra") {
      clearKhasraLayers();
      delete currentGeojson.current.khasra;
      return;
    }

    const loadKhasras = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mouzaId =
          selectedMouza.mouza_id || selectedMouza.id || selectedMouza;

        const geojson = await getKhasras(mouzaId);

        if (geojson?.features?.length) {
          drawKhasras(geojson);
        } else {
          clearKhasraLayers();
          delete currentGeojson.current.khasra;
          setFeatureCount(0);
        }
      } catch (e) {
        console.error("Khasra load error:", e);
        setError("Failed to load Khasras");
      } finally {
        setIsLoading(false);
      }
    };

    loadKhasras();
  }, [selectedMouza, isMapReady, viewBy]);

  useEffect(() => {
    if (!selectedMouza || !isMapReady || viewBy !== "murabba") {
      clearMurabbaLayers();
      delete currentGeojson.current.murabba;
      return;
    }

    const loadMurabbas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mouzaId =
          selectedMouza.mouza_id || selectedMouza.id || selectedMouza;

        const geojson = await getMurabbas(mouzaId);

        if (geojson?.features?.length) {
          drawMurabbas(geojson);
        } else {
          clearMurabbaLayers();
          delete currentGeojson.current.murabba;
          setFeatureCount(0);
        }
      } catch (e) {
        console.error("Murabba load error:", e);
        setError("Failed to load Murabbas");
      } finally {
        setIsLoading(false);
      }
    };

    loadMurabbas();
  }, [selectedMouza, isMapReady, viewBy]);

  useEffect(() => {
    if (!isMapReady) return;

    const mouzaName =
      typeof selectedMouza === "object"
        ? selectedMouza?.mouza?.trim?.() || ""
        : "";

    const loadPoints = async () => {
      try {
        // CONTROL POINTS (type = B)
        // show whenever checkbox is on
        if (layers?.controlPoints) {
          const controlGeojson = await getTrijunctionPoints({
            type: "B",
          });

          if (controlGeojson?.features?.length) {
            drawPointLayer({
              sourceId: CONTROL_POINTS_SOURCE,
              layerId: CONTROL_POINTS_LAYER,
              geojson: controlGeojson,
              color: "#f59e0b",
              strokeColor: "#78350f",
              radius: 5,
              popupTitle: "Control Point",
            });
            currentGeojson.current["control-points"] = controlGeojson;
          } else {
            clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
            delete currentGeojson.current["control-points"];
          }
        } else {
          clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
          delete currentGeojson.current["control-points"];
        }

        // TRI-JUNCTION POINTS (type = TJ)
        // use m3 = mouza name
        if (layers?.triJunctionPoints && mouzaName) {
          const trijunctionGeojson = await getTrijunctionPoints({
            mouza: mouzaName,
            type: "TJ",
          });

          if (trijunctionGeojson?.features?.length) {
            drawPointLayer({
              sourceId: TRI_JUNCTION_POINTS_SOURCE,
              layerId: TRI_JUNCTION_POINTS_LAYER,
              geojson: trijunctionGeojson,
              color: "#ef4444",
              strokeColor: "#890b0b",
              radius: 6,
              popupTitle: "Tri-junction Point",
            });
            currentGeojson.current["tri-junction-points"] = trijunctionGeojson;
          } else {
            clearPointLayer(
              TRI_JUNCTION_POINTS_SOURCE,
              TRI_JUNCTION_POINTS_LAYER,
            );
            delete currentGeojson.current["tri-junction-points"];
          }
        } else {
          clearPointLayer(
            TRI_JUNCTION_POINTS_SOURCE,
            TRI_JUNCTION_POINTS_LAYER,
          );
          delete currentGeojson.current["tri-junction-points"];
        }
      } catch (e) {
        console.error("Failed to load trijunction points:", e);
        setError("Failed to load control / tri-junction points");
      }
    };

    loadPoints();
  }, [
    isMapReady,
    selectedMouza,
    layers?.controlPoints,
    layers?.triJunctionPoints,
  ]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {error && (
        <div className="absolute top-5 left-5 bg-red-500 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}

      <Legend
        featureCount={featureCount}
        selectedMouzaName={selectedMouza?.mouza}
        isLoading={isLoading}
      />
    </div>
  );
}
