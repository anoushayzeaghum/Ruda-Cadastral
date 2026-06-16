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
const TOPO_FILL_LAYER = "gis-topo-cb1-fill";
const TOPO_LINE_LAYER = "gis-topo-cb1-line";

// Chahar Bagh / Handu Gujran bounds for fly-to
const CB_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

// ── TileServer URLs ──────────────────────────────────────────────────────────
// Make sure these mbtiles are available in your TileServer data directory.
//
// Expected TileServer paths:
// http://localhost:8081/data/Chaharbagh_DSM/{z}/{x}/{y}.png
// http://localhost:8081/data/Chaharbagh_DTM/{z}/{x}/{y}.png
// http://localhost:8081/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png

const DSM_TILE_URL =
  "http://localhost:8081/data/Chaharbagh_DSM/{z}/{x}/{y}.png";

const DTM_TILE_URL =
  "http://localhost:8081/data/Chaharbagh_DTM/{z}/{x}/{y}.png";

const ORTHO_TILE_URL =
  "http://localhost:8081/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png";

// ── Coordinate reprojection ───────────────────────────────────────────────────
// Topo_CB_1.geojson is in a local Civil 3D / CAD coordinate system.
// We use a linear affine transform derived from the known CAD bounding box
// mapped to the known WGS84 bounds of the Chahar Bagh site.

const CAD_X_MIN = 1461800;
const CAD_X_MAX = 1464600;
const CAD_Y_MIN = 11473100;
const CAD_Y_MAX = 11474700;

const WGS_LNG_MIN = 74.42562;
const WGS_LNG_MAX = 74.43545;
const WGS_LAT_MIN = 31.60509;
const WGS_LAT_MAX = 31.61122;

const SCALE_X = (WGS_LNG_MAX - WGS_LNG_MIN) / (CAD_X_MAX - CAD_X_MIN);
const OFFSET_X = WGS_LNG_MIN - CAD_X_MIN * SCALE_X;

const SCALE_Y = (WGS_LAT_MAX - WGS_LAT_MIN) / (CAD_Y_MAX - CAD_Y_MIN);
const OFFSET_Y = WGS_LAT_MIN - CAD_Y_MIN * SCALE_Y;

function cadToWGS84([x, y]) {
  return [x * SCALE_X + OFFSET_X, y * SCALE_Y + OFFSET_Y];
}

function reprojectCoordArray(coords) {
  if (!Array.isArray(coords)) return coords;

  // Leaf node: [x, y] or [x, y, z]
  if (typeof coords[0] === "number") return cadToWGS84(coords);

  return coords.map(reprojectCoordArray);
}

function reprojectGeoJSON(geojson) {
  if (!geojson?.features) return geojson;

  return {
    ...geojson,
    features: geojson.features.map((f) => ({
      ...f,
      geometry: f.geometry
        ? {
          ...f.geometry,
          coordinates: reprojectCoordArray(f.geometry.coordinates),
        }
        : f.geometry,
    })),
  };
}

export default function TopographicPlan({ map }) {
  const [open, setOpen] = useState(false);

  const [orthoVisible, setOrthoVisible] = useState(false);
  const [orthoOpacity, setOrthoOpacity] = useState(100);

  const [dsmVisible, setDsmVisible] = useState(false);
  const [dsmOpacity, setDsmOpacity] = useState(85);

  const [dtmVisible, setDtmVisible] = useState(false);
  const [dtmOpacity, setDtmOpacity] = useState(85);

  const [topoVisible, setTopoVisible] = useState(false);
  const [topoOpacity, setTopoOpacity] = useState(80);
  const [topoLoading, setTopoLoading] = useState(false);

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
      if (map.getLayer(TOPO_FILL_LAYER)) {
        map.setLayoutProperty(TOPO_FILL_LAYER, "visibility", "none");
      }

      if (map.getLayer(TOPO_LINE_LAYER)) {
        map.setLayoutProperty(TOPO_LINE_LAYER, "visibility", "none");
      }

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

      if (!map.getLayer(TOPO_FILL_LAYER)) {
        map.addLayer({
          id: TOPO_FILL_LAYER,
          type: "fill",
          source: TOPO_SOURCE,
          paint: {
            "fill-color": "#65c96b",
            "fill-opacity": (topoOpacity / 100) * 0.25,
          },
          layout: {
            visibility: "visible",
          },
        });
      } else {
        map.setLayoutProperty(TOPO_FILL_LAYER, "visibility", "visible");
        map.setPaintProperty(
          TOPO_FILL_LAYER,
          "fill-opacity",
          (topoOpacity / 100) * 0.25,
        );
      }

      if (!map.getLayer(TOPO_LINE_LAYER)) {
        map.addLayer({
          id: TOPO_LINE_LAYER,
          type: "line",
          source: TOPO_SOURCE,
          paint: {
            "line-color": "#22c55e",
            "line-width": 1.2,
            "line-opacity": topoOpacity / 100,
          },
          layout: {
            visibility: "visible",
          },
        });
      } else {
        map.setLayoutProperty(TOPO_LINE_LAYER, "visibility", "visible");
        map.setPaintProperty(
          TOPO_LINE_LAYER,
          "line-opacity",
          topoOpacity / 100,
        );
      }

      flyToChaharbagh();
    };

    if (topoDataRef.current) {
      addToMap(topoDataRef.current);
      return;
    }

    setTopoLoading(true);

    fetch("/amenities/Topography CB_1/Topo_CB_1.geojson")
      .then((r) => r.json())
      .then((raw) => {
        const reprojected = reprojectGeoJSON(raw);
        topoDataRef.current = reprojected;
        addToMap(reprojected);
      })
      .catch((e) => console.error("Topo GeoJSON load error:", e))
      .finally(() => setTopoLoading(false));
  }, [map, topoVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Topo opacity live update ──────────────────────────────────────────────
  useEffect(() => {
    if (!map || !topoVisible) return;

    if (map.getLayer(TOPO_FILL_LAYER)) {
      map.setPaintProperty(
        TOPO_FILL_LAYER,
        "fill-opacity",
        (topoOpacity / 100) * 0.25,
      );
    }

    if (map.getLayer(TOPO_LINE_LAYER)) {
      map.setPaintProperty(TOPO_LINE_LAYER, "line-opacity", topoOpacity / 100);
    }
  }, [map, topoOpacity, topoVisible]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>TOPOGRAPHIC PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2 space-y-0">
          {/* Handu Gujran Ortho */}
          <LayerRow
            label="Handu Gujran Massavi"
            color="#84cc16"
            checked={orthoVisible}
            opacity={orthoOpacity}
            onCheckedChange={setOrthoVisible}
            onOpacityChange={setOrthoOpacity}
          />

          <div className="border-t border-[#344055] my-2" />

          {/* Topo boundary */}
          <LayerRow
            label={
              <span className="flex items-center gap-1.5">
                Topo Boundary — CB1
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
            onCheckedChange={setTopoVisible}
            onOpacityChange={setTopoOpacity}
          />

          <div className="border-t border-[#344055] my-2" />

          {/* DSM */}
          <LayerRow
            label="Chaharbagh DSM"
            color="#ff8b24"
            checked={dsmVisible}
            opacity={dsmOpacity}
            onCheckedChange={setDsmVisible}
            onOpacityChange={setDsmOpacity}
          />

          {/* DTM */}
          <LayerRow
            label="Chaharbagh DTM"
            color="#42a5f5"
            checked={dtmVisible}
            opacity={dtmOpacity}
            onCheckedChange={setDtmVisible}
            onOpacityChange={setDtmOpacity}
          />
        </div>
      )}
    </div>
  );
}