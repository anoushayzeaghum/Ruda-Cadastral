import { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";

// ── Source / Layer IDs ────────────────────────────────────────────────────────
const DSM_SOURCE = "gis-dsm-source";
const DSM_LAYER = "gis-dsm-layer";

const DTM_SOURCE = "gis-dtm-source";
const DTM_LAYER = "gis-dtm-layer";

const ORTHO_SOURCE = "gis-handu-gujran-ortho-source";
const ORTHO_LAYER = "gis-handu-gujran-ortho-layer";

const TOPO_SOURCE = "gis-topo-cb1-source";

const TOPO_SUB_LAYERS = [
  {
    id: "gis-topo-builtup-fill",
    type: "fill",
    filter: ["==", ["get", "layer"], "Builtup"],
    baseOpacity: 0.5,
    paint: {
      "fill-color": "#f97316", // Vibrant Amber/Orange for structures
    },
  },
  {
    id: "gis-topo-builtup-outline",
    type: "line",
    filter: ["==", ["get", "layer"], "Builtup"],
    baseOpacity: 0.8,
    paint: {
      "line-color": "#ea580c",
      "line-width": 1.5,
    },
  },
  {
    id: "gis-topo-park-fill",
    type: "fill",
    filter: ["==", ["get", "layer"], "Park"],
    baseOpacity: 0.6,
    paint: {
      "fill-color": "#22c55e", // Bright Park Green
    },
  },
  {
    id: "gis-topo-greenbelt-fill",
    type: "fill",
    filter: ["==", ["get", "layer"], "Green Belt"],
    baseOpacity: 0.55,
    paint: {
      "fill-color": "#10b981", // Emerald/Teal Green
    },
  },
  {
    id: "gis-topo-road-line",
    type: "line",
    filter: ["==", ["get", "layer"], "Road Track"],
    baseOpacity: 0.8,
    paint: {
      "line-color": "#64748b", // Slate Gray for Road boundaries
      "line-width": 2,
    },
  },
  {
    id: "gis-topo-manholes-circle",
    type: "circle",
    filter: ["==", ["get", "layer"], "Manholes"],
    baseOpacity: 0.9,
    paint: {
      "circle-color": "#ef4444", // Crimson Red for manholes
      "circle-radius": 4,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
    },
  },
  {
    id: "gis-topo-lightpoles-circle",
    type: "circle",
    filter: ["==", ["get", "layer"], "Light Poles"],
    baseOpacity: 0.9,
    paint: {
      "circle-color": "#eab308", // Yellow for light poles
      "circle-radius": 4.5,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
    },
  },
  {
    id: "gis-topo-spotlevel-circle",
    type: "circle",
    filter: ["==", ["get", "layer"], "Spot level"],
    baseOpacity: 0.65,
    paint: {
      "circle-color": "#a855f7", // Violet/Purple for survey points
      "circle-radius": 2.5,
    },
  },
];

// Chahar Bagh / Handu Gujran bounds for fly-to
const CB_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

// ── TileServer URLs ──────────────────────────────────────────────────────────
// Make sure these mbtiles are available in your TileServer data directory.
//
// Expected TileServer paths:
// https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_DSM/{z}/{x}/{y}.png
// https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_DTM/{z}/{x}/{y}.png
// https://rudametaverse.nespakprogresscenter.com/tiles/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png

const DSM_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_DSM/{z}/{x}/{y}.png";

const DTM_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_DTM/{z}/{x}/{y}.png";

const ORTHO_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png";

// Topo_CB_1.geojson is already in WGS84 (CRS84) — no reprojection needed.

export default function TopographicPlan({
  map,
  selectedProjectId,
  layerVisibility,
  setLayerVisibility,
}) {
  const [open, setOpen] = useState(false);

  const [orthoVisible, setOrthoVisible] = useState(false);
  const [orthoOpacity, setOrthoOpacity] = useState(100);

  const [dsmVisible, setDsmVisible] = useState(false);
  const [dsmOpacity, setDsmOpacity] = useState(85);

  const [dtmVisible, setDtmVisible] = useState(false);
  const [dtmOpacity, setDtmOpacity] = useState(85);

  const topoVisible = !!layerVisibility?.topography;
  const topoOpacity = layerVisibility?.topographyOpacity ?? 80;
  const setTopoVisible = (val) => {
    setLayerVisibility?.((prev) => ({ ...prev, topography: val }));
  };
  const setTopoOpacity = (val) => {
    setLayerVisibility?.((prev) => ({ ...prev, topographyOpacity: val }));
  };
  const [topoLoading, setTopoLoading] = useState(false);

  // ── Lock all layers off when no project is selected ───────────────────────
  useEffect(() => {
    if (!selectedProjectId) {
      setOrthoVisible(false);
      setDsmVisible(false);
      setDtmVisible(false);
      setTopoVisible(false);
    }
  }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache reprojected GeoJSON so we don't re-fetch on every opacity change
  const topoDataRef = useRef(null);

  const flyToChaharbagh = () => {
    if (!map) return;
    map.fitBounds(CB_BOUNDS, { padding: 50, duration: 1500 });
  };

  // ── Handu Gujran Ortho raster ─────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    if (orthoVisible) {
      if (!map.getSource(ORTHO_SOURCE)) {
        map.addSource(ORTHO_SOURCE, {
          type: "raster",
          tiles: [ORTHO_TILE_URL],
          tileSize: 256,
        });
      }

      if (!map.getLayer(ORTHO_LAYER)) {
        map.addLayer({
          id: ORTHO_LAYER,
          type: "raster",
          source: ORTHO_SOURCE,
          paint: {
            "raster-opacity": orthoOpacity / 100,
          },
          layout: {
            visibility: "visible",
          },
        });

        flyToChaharbagh();
      } else {
        map.setLayoutProperty(ORTHO_LAYER, "visibility", "visible");
        map.setPaintProperty(ORTHO_LAYER, "raster-opacity", orthoOpacity / 100);
      }
    } else if (map.getLayer(ORTHO_LAYER)) {
      map.setLayoutProperty(ORTHO_LAYER, "visibility", "none");
    }
  }, [map, orthoVisible, orthoOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── DSM raster ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    if (dsmVisible) {
      if (!map.getSource(DSM_SOURCE)) {
        map.addSource(DSM_SOURCE, {
          type: "raster",
          tiles: [DSM_TILE_URL],
          tileSize: 256,
        });
      }

      if (!map.getLayer(DSM_LAYER)) {
        map.addLayer({
          id: DSM_LAYER,
          type: "raster",
          source: DSM_SOURCE,
          paint: {
            "raster-opacity": dsmOpacity / 100,
          },
          layout: {
            visibility: "visible",
          },
        });

        flyToChaharbagh();
      } else {
        map.setLayoutProperty(DSM_LAYER, "visibility", "visible");
        map.setPaintProperty(DSM_LAYER, "raster-opacity", dsmOpacity / 100);
      }
    } else if (map.getLayer(DSM_LAYER)) {
      map.setLayoutProperty(DSM_LAYER, "visibility", "none");
    }
  }, [map, dsmVisible, dsmOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── DTM raster ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    if (dtmVisible) {
      if (!map.getSource(DTM_SOURCE)) {
        map.addSource(DTM_SOURCE, {
          type: "raster",
          tiles: [DTM_TILE_URL],
          tileSize: 256,
        });
      }

      if (!map.getLayer(DTM_LAYER)) {
        map.addLayer({
          id: DTM_LAYER,
          type: "raster",
          source: DTM_SOURCE,
          paint: {
            "raster-opacity": dtmOpacity / 100,
          },
          layout: {
            visibility: "visible",
          },
        });

        flyToChaharbagh();
      } else {
        map.setLayoutProperty(DTM_LAYER, "visibility", "visible");
        map.setPaintProperty(DTM_LAYER, "raster-opacity", dtmOpacity / 100);
      }
    } else if (map.getLayer(DTM_LAYER)) {
      map.setLayoutProperty(DTM_LAYER, "visibility", "none");
    }
  }, [map, dtmVisible, dtmOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Topo CB1 boundary GeoJSON ─────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    if (!topoVisible) {
      // Hide layers but keep source to avoid re-fetch on re-toggle
      TOPO_SUB_LAYERS.forEach((sub) => {
        if (map.getLayer(sub.id)) {
          map.setLayoutProperty(sub.id, "visibility", "none");
        }
      });
      return;
    }

    const addToMap = (geojson) => {
      if (!map.getSource(TOPO_SOURCE)) {
        map.addSource(TOPO_SOURCE, {
          type: "geojson",
          data: geojson,
        });
      } else {
        map.getSource(TOPO_SOURCE).setData(geojson);
      }

      TOPO_SUB_LAYERS.forEach((sub) => {
        const opacityVal = (topoOpacity / 100) * sub.baseOpacity;
        if (!map.getLayer(sub.id)) {
          const layerDef = {
            id: sub.id,
            type: sub.type,
            source: TOPO_SOURCE,
            filter: sub.filter,
            paint: { ...sub.paint },
            layout: {
              visibility: "visible",
            },
          };

          // Apply corresponding paint opacity field
          if (sub.type === "fill") {
            layerDef.paint["fill-opacity"] = opacityVal;
          } else if (sub.type === "line") {
            layerDef.paint["line-opacity"] = opacityVal;
          } else if (sub.type === "circle") {
            layerDef.paint["circle-opacity"] = opacityVal;
            if (sub.paint["circle-stroke-width"]) {
              layerDef.paint["circle-stroke-opacity"] = opacityVal;
            }
          }

          map.addLayer(layerDef);
        } else {
          map.setLayoutProperty(sub.id, "visibility", "visible");
          if (sub.type === "fill") {
            map.setPaintProperty(sub.id, "fill-opacity", opacityVal);
          } else if (sub.type === "line") {
            map.setPaintProperty(sub.id, "line-opacity", opacityVal);
          } else if (sub.type === "circle") {
            map.setPaintProperty(sub.id, "circle-opacity", opacityVal);
            if (sub.paint["circle-stroke-width"]) {
              map.setPaintProperty(sub.id, "circle-stroke-opacity", opacityVal);
            }
          }
        }
      });

      flyToChaharbagh();
    };

    if (topoDataRef.current) {
      addToMap(topoDataRef.current);
      return;
    }

    setTopoLoading(true);

    fetch("/Topogeojson_backup/Topography.geojson")
      .then((r) => r.json())
      .then((raw) => {
        // File is already in WGS84 — use directly without reprojection.
        topoDataRef.current = raw;
        addToMap(raw);
      })
      .catch((e) => console.error("Topo GeoJSON load error:", e))
      .finally(() => setTopoLoading(false));
  }, [map, topoVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Topo opacity live update ──────────────────────────────────────────────
  useEffect(() => {
    if (!map || !topoVisible) return;

    TOPO_SUB_LAYERS.forEach((sub) => {
      if (map.getLayer(sub.id)) {
        const opacityVal = (topoOpacity / 100) * sub.baseOpacity;
        if (sub.type === "fill") {
          map.setPaintProperty(sub.id, "fill-opacity", opacityVal);
        } else if (sub.type === "line") {
          map.setPaintProperty(sub.id, "line-opacity", opacityVal);
        } else if (sub.type === "circle") {
          map.setPaintProperty(sub.id, "circle-opacity", opacityVal);
          if (sub.paint["circle-stroke-width"]) {
            map.setPaintProperty(sub.id, "circle-stroke-opacity", opacityVal);
          }
        }
      }
    });
  }, [map, topoOpacity, topoVisible]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>TOPOGRAPHIC PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {/* Topo boundary */}
          <LayerRow
            label={
              <span className="flex items-center gap-1.5">
                Topo Boundary
                {topoLoading && (
                  <span className="text-[9px] text-white/40 animate-pulse">
                    loading…
                  </span>
                )}
              </span>
            }
            color="#22c55e"
            checked={topoVisible}
            opacity={topoOpacity}
            disabled={!selectedProjectId}
            onCheckedChange={(v) => {
              if (!selectedProjectId) return;
              setTopoVisible(v);
            }}
            onOpacityChange={setTopoOpacity}
          />

          {/* DSM */}
          <LayerRow
            label="DSM"
            color="#ff8b24"
            checked={dsmVisible}
            opacity={dsmOpacity}
            disabled={!selectedProjectId}
            onCheckedChange={(v) => {
              if (!selectedProjectId) return;
              setDsmVisible(v);
            }}
            onOpacityChange={setDsmOpacity}
          />

          {/* DTM */}
          <LayerRow
            label="DTM"
            color="#42a5f5"
            checked={dtmVisible}
            opacity={dtmOpacity}
            disabled={!selectedProjectId}
            onCheckedChange={(v) => {
              if (!selectedProjectId) return;
              setDtmVisible(v);
            }}
            onOpacityChange={setDtmOpacity}
          />
        </div>
      )}
    </div>
  );
}
