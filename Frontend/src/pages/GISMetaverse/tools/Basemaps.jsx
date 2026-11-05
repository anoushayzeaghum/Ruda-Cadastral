import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// Fixed preview tile around Lahore so every card shows a real basemap preview
// instead of a colour/gradient placeholder. These preview URLs are UI-only;
// the actual basemap switching logic below is unchanged.
// Licensed sources only. Google Map Tiles API is optional and requires a
// Google Cloud Map Tiles API key, billing and HTTP referrer restrictions.
const GOOGLE_MAP_TILES_KEY = import.meta.env.VITE_GOOGLE_MAP_TILES_API_KEY || "";
const ESRI_IMAGERY = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_REFERENCE = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const ESRI_HYBRID_STYLE = {
  version: 8,
  sources: {
    "esri-hybrid-imagery": {
      type: "raster", tiles: [ESRI_IMAGERY], tileSize: 256,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
    "esri-hybrid-reference": {
      type: "raster", tiles: [ESRI_REFERENCE], tileSize: 256,
      attribution: "&copy; Esri and its data providers",
    },
  },
  layers: [
    { id: "esri-hybrid-imagery-layer", type: "raster", source: "esri-hybrid-imagery" },
    { id: "esri-hybrid-reference-layer", type: "raster", source: "esri-hybrid-reference" },
  ],
};

async function getGoogleHybridStyle(apiKey) {
  const response = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mapType: "satellite", language: "en-US", region: "PK", layerTypes: ["layerRoadmap"], overlay: false }),
  });
  if (!response.ok) throw new Error(`Google Map Tiles session failed (HTTP ${response.status})`);
  const json = await response.json();
  if (!json.session) throw new Error("Google Map Tiles did not return a session token");
  return {
    session: json.session,
    style: {
      version: 8,
      sources: {
        "google-hybrid": {
          type: "raster", tileSize: json.tileWidth || 256,
          tiles: [`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(json.session)}&key=${encodeURIComponent(apiKey)}`],
          attribution: "Google Maps",
        },
      },
      layers: [{ id: "google-hybrid-imagery-layer", type: "raster", source: "google-hybrid" }],
    },
  };
}

const basemaps = [
  {
    id: "streets",
    label: "Streets",
    style: "mapbox://styles/mapbox/streets-v12",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/3339/5787",
    previewColor: "#d7e3c7",
  },
  {
    id: "satellite",
    label: "Satellite",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3339/5787",
    previewColor: "#26351f",
  },
  {
    id: "light",
    label: "Light",
    style: "mapbox://styles/mapbox/light-v11",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/13/3339/5787",
    previewColor: "#e5e7eb",
  },
  {
    id: "dark",
    label: "Dark",
    style: "mapbox://styles/mapbox/dark-v11",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/13/3339/5787",
    previewColor: "#1f2937",
  },
  {
    id: "outdoors",
    label: "Outdoors",
    style: "mapbox://styles/mapbox/outdoors-v12",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/13/3339/5787",
    previewColor: "#9fbe8a",
  },

  {
    id: "google-hybrid",
    label: "Google Hybrid",
    previewColor: "#315b3d",
    requiresGoogleKey: true,
  },
  {
    id: "esri-hybrid",
    label: "Esri Hybrid",
    previewUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3339/5787",
    previewColor: "#354a30",
    style: ESRI_HYBRID_STYLE,
  },

  // ── ESRI basemaps ────────────────────────────────────────────────────────
  {
    id: "esri-imagery",
    label: "ESRI Imagery",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3339/5787",
    previewColor: "#344634",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
      },
      layers: [
        { id: "esri-basemap-layer", type: "raster", source: "esri-basemap" },
      ],
    },
  },
  {
    id: "esri-streets",
    label: "ESRI Streets",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/3339/5787",
    previewColor: "#c9d9b5",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, HERE, DeLorme, USGS, Intermap, iPC, NRCAN",
        },
      },
      layers: [
        { id: "esri-basemap-layer", type: "raster", source: "esri-basemap" },
      ],
    },
  },
  {
    id: "esri-topo",
    label: "ESRI Topo",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/13/3339/5787",
    previewColor: "#a8c896",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, HERE, DeLorme, Intermap, USGS, NPS",
        },
      },
      layers: [
        { id: "esri-basemap-layer", type: "raster", source: "esri-basemap" },
      ],
    },
  },
  {
    id: "esri-light-gray",
    label: "ESRI Light Gray",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/13/3339/5787",
    previewColor: "#e8e8e8",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        },
      },
      layers: [
        { id: "esri-basemap-layer", type: "raster", source: "esri-basemap" },
      ],
    },
  },
  {
    id: "esri-natgeo",
    label: "ESRI NatGeo",
    previewUrl:
      "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/13/3339/5787",
    previewColor: "#d4e8c2",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution:
            "Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ",
        },
      },
      layers: [
        { id: "esri-basemap-layer", type: "raster", source: "esri-basemap" },
      ],
    },
  },
];

export default function Basemaps({ map, rebuildAllLayers }) {
  const [activeBasemap, setActiveBasemap] = useState("streets");
  const [loadingBasemap, setLoadingBasemap] = useState(null);
  const [error, setError] = useState("");
  const switchId = useRef(0);
  const googleAttributionCleanup = useRef(null);

  useEffect(() => () => {
    switchId.current += 1;
    googleAttributionCleanup.current?.();
    googleAttributionCleanup.current = null;
  }, []);

  const attachGoogleAttribution = (apiKey, session) => {
    googleAttributionCleanup.current?.();
    const container = map?.getContainer?.();
    if (!container) return;
    // Google requires its map branding and per-viewport data-source attribution
    // to remain visible when a third-party renderer (Mapbox GL JS) is used.
    const info = document.createElement("div");
    info.className = "ruda-google-maps-attribution";
    info.setAttribute("aria-label", "Google Maps imagery attribution");
    Object.assign(info.style, {
      position: "absolute", bottom: "30px", left: "10px", zIndex: "9",
      padding: "3px 7px", borderRadius: "3px", fontSize: "11px",
      color: "#1f2937", background: "rgba(255,255,255,0.95)",
      maxWidth: "min(85%, 500px)", pointerEvents: "none",
    });
    const brand = document.createElement("strong");
    brand.textContent = "Google Maps";
    info.appendChild(brand);
    const data = document.createElement("span");
    data.style.marginLeft = "6px";
    info.appendChild(data);
    container.appendChild(info);

    let cancelled = false;
    let latest = 0;
    const update = async () => {
      if (!map?.getBounds) return;
      const request = ++latest;
      const bounds = map.getBounds();
      const params = new URLSearchParams({
        key: apiKey, session, zoom: String(Math.min(22, Math.max(0, Math.floor(map.getZoom())))),
        north: String(Math.min(89.999, bounds.getNorth())),
        south: String(Math.max(-89.999, bounds.getSouth())),
        east: String(Math.max(-179.999, Math.min(179.999, bounds.getEast()))),
        west: String(Math.max(-179.999, Math.min(179.999, bounds.getWest()))),
      });
      try {
        const response = await fetch(`https://tile.googleapis.com/tile/v1/viewport?${params}`);
        if (!response.ok) return;
        const metadata = await response.json();
        if (!cancelled && request === latest) data.textContent = metadata.copyright || "";
      } catch (err) {
        if (!cancelled) console.warn("Google Maps viewport attribution unavailable:", err);
      }
    };
    let timeoutId;
    const onMove = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(update, 350);
    };
    map.on("moveend", onMove);
    void update();
    googleAttributionCleanup.current = () => {
      cancelled = true;
      clearTimeout(timeoutId);
      map.off("moveend", onMove);
      info.remove();
    };
  };

  const handleBasemapChange = async (basemap) => {
    if (!map || activeBasemap === basemap.id) return;
    if (basemap.requiresGoogleKey && !GOOGLE_MAP_TILES_KEY) {
      setError("Google Hybrid requires VITE_GOOGLE_MAP_TILES_API_KEY and an enabled Google Map Tiles API billing account.");
      return;
    }
    const requestId = ++switchId.current;
    setError("");
    setLoadingBasemap(basemap.id);
    let nextStyle = basemap.style;
    let googleSession = null;
    try {
      if (basemap.id === "google-hybrid") {
        const result = await getGoogleHybridStyle(GOOGLE_MAP_TILES_KEY);
        nextStyle = result.style;
        googleSession = result.session;
      }
      if (requestId !== switchId.current) return;
      googleAttributionCleanup.current?.();
      googleAttributionCleanup.current = null;
      map.stop();
      map.once("style.load", () => {
        if (requestId !== switchId.current) return;
        if (basemap.id === "google-hybrid") {
          attachGoogleAttribution(GOOGLE_MAP_TILES_KEY, googleSession);
        }
        rebuildAllLayers?.();
      });
      map.setStyle(nextStyle);
      setActiveBasemap(basemap.id);
    } catch (err) {
      if (requestId === switchId.current) {
        setError(err?.message || "Basemap could not be loaded");
        console.error("Basemap switch failed:", err);
      }
    } finally {
      if (requestId === switchId.current) setLoadingBasemap(null);
    }
  };

  return (
    <div className="max-h-[calc(100vh-150px)] overflow-y-auto text-white">
      <div className="grid grid-cols-4 gap-2 p-3">
        {basemaps.map((basemap) => {
          const isActive = activeBasemap === basemap.id;
          const unavailable = basemap.requiresGoogleKey && !GOOGLE_MAP_TILES_KEY;
          return (
            <button
              key={basemap.id}
              type="button"
              disabled={unavailable || Boolean(loadingBasemap)}
              onClick={() => void handleBasemapChange(basemap)}
              className={`min-w-0 overflow-hidden rounded-md border bg-[#06291f] text-left transition hover:border-[#9be37b] disabled:opacity-65 ${
                isActive ? "border-[#9be37b]" : "border-[#0f3d2e]"
              }`}
              title={unavailable ? "Google Maps Platform API key required" : basemap.label}
            >
              <div
                className="relative h-14 w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundColor: basemap.previewColor,
                  backgroundImage: basemap.previewUrl ? `url("${basemap.previewUrl}")` : undefined,
                }}
              >
                {isActive && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#9be37b] text-[#06291f] shadow-sm">
                    <Check size={13} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="truncate px-2 py-2 text-[11px] font-semibold leading-tight">
                {basemap.label}
              </div>
              {unavailable && <div className="px-2 pb-2 text-[9px] text-amber-200">API key required</div>}
              {loadingBasemap === basemap.id && <div className="px-2 pb-2 text-[9px]">Loading…</div>}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="mx-3 mb-3 rounded border border-red-400/40 p-2 text-xs text-red-100">{error}</p>}
    </div>
  );
}
