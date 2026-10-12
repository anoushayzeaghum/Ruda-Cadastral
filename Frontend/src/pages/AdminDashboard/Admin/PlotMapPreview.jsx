import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const CONTEXT = "plot-explorer-context";
const SELECTED = "plot-explorer-selected";
const EMPTY = { type: "FeatureCollection", features: [] };

const selectedFC = (feature) => ({
  type: "FeatureCollection",
  features: feature ? [feature] : [],
});

function walk(coords, bounds) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    bounds.extend([coords[0], coords[1]]);
    return;
  }
  coords.forEach((item) => walk(item, bounds));
}

function getBounds(fc) {
  const bounds = new mapboxgl.LngLatBounds();
  (fc?.features || []).forEach((feature) =>
    walk(feature?.geometry?.coordinates, bounds),
  );
  return bounds.isEmpty() ? null : bounds;
}

export default function PlotMapPreview({
  contextGeojson = EMPTY,
  selectedPlot = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";
    if (!mapboxgl.accessToken) {
      console.error("Missing VITE_MAPBOX_TOKEN in Frontend/.env");
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.32, 31.52],
      zoom: 10,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const addPlotLayers = () => {
      if (!map.getSource(CONTEXT))
        map.addSource(CONTEXT, {
          type: "geojson",
          data: contextGeojson || EMPTY,
        });
      if (!map.getSource(SELECTED))
        map.addSource(SELECTED, {
          type: "geojson",
          data: selectedFC(selectedPlot),
        });

      if (!map.getLayer(`${CONTEXT}-fill`)) {
        map.addLayer({
          id: `${CONTEXT}-fill`,
          type: "fill",
          source: CONTEXT,
          paint: {
            "fill-color": [
              "match",
              ["downcase", ["coalesce", ["get", "type"], ""]],
              "commercial",
              "#38bdf8",
              "park",
              "#6ee7b7",
              "masjid",
              "#fde68a",
              "residential",
              "#f59e0b",
              "#cbd5e1",
            ],
            "fill-opacity": 0.58,
          },
        });
        map.addLayer({
          id: `${CONTEXT}-outline`,
          type: "line",
          source: CONTEXT,
          paint: { "line-color": "#334155", "line-width": 1.2 },
        });
        map.addLayer({
          id: `${CONTEXT}-labels`,
          type: "symbol",
          source: CONTEXT,
          layout: {
            "text-field": ["coalesce", ["get", "plot_no"], ["get", "name"], ""],
            "text-size": 11,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#111827",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
          },
        });
      }

      if (!map.getLayer(`${SELECTED}-fill`)) {
        map.addLayer({
          id: `${SELECTED}-fill`,
          type: "fill",
          source: SELECTED,
          paint: { "fill-color": "#16a34a", "fill-opacity": 0.18 },
        });
        map.addLayer({
          id: `${SELECTED}-outline`,
          type: "line",
          source: SELECTED,
          paint: { "line-color": "#0B7A3B", "line-width": 4 },
        });
      }
    };

    map.on("load", addPlotLayers);
    map.on("style.load", addPlotLayers);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      map.getSource(CONTEXT)?.setData(contextGeojson || EMPTY);
      map.getSource(SELECTED)?.setData(selectedFC(selectedPlot));
      const target = selectedPlot ? selectedFC(selectedPlot) : contextGeojson;
      const bounds = getBounds(target);
      if (bounds)
        map.fitBounds(bounds, {
          padding: selectedPlot ? 90 : 45,
          maxZoom: selectedPlot ? 18.5 : 16,
          duration: 700,
        });
    };

    if (map.isStyleLoaded()) update();
    else map.once("style.load", update);
  }, [contextGeojson, selectedPlot, satellite]);

  const changeStyle = (useSatellite) => {
    setSatellite(useSatellite);
    mapRef.current?.setStyle(
      useSatellite
        ? "mapbox://styles/mapbox/satellite-streets-v12"
        : "mapbox://styles/mapbox/streets-v12",
    );
  };

  const fullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-md border border-white/80 bg-white shadow">
        <button
          type="button"
          onClick={() => changeStyle(false)}
          className={`px-3 py-1.5 text-[10px] font-bold ${!satellite ? "bg-[#0B7A3B] text-white" : "text-slate-600"}`}
        >
          Map View
        </button>
        <button
          type="button"
          onClick={() => changeStyle(true)}
          className={`px-3 py-1.5 text-[10px] font-bold ${satellite ? "bg-[#0B7A3B] text-white" : "text-slate-600"}`}
        >
          Satellite View
        </button>
      </div>
      <button
        type="button"
        onClick={fullscreen}
        title="Fullscreen"
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 shadow"
      >
        ⛶
      </button>
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-3 rounded-lg bg-white/95 px-3 py-2 text-[9px] text-slate-600 shadow">
        <span>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" />
          Residential
        </span>
        <span>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#38bdf8]" />
          Commercial
        </span>
        <span>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#6ee7b7]" />
          Park
        </span>
        <span>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#fde68a]" />
          Masjid
        </span>
        <span>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border-2 border-[#0B7A3B] bg-white" />
          Selected Plot
        </span>
      </div>
    </div>
  );
}
