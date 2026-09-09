import { useState } from "react";
import { Check } from "lucide-react";

// Fixed preview tile around Lahore so every card shows a real basemap preview
// instead of a colour/gradient placeholder. These preview URLs are UI-only;
// the actual basemap switching logic below is unchanged.
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

  const handleBasemapChange = (basemap) => {
    setActiveBasemap(basemap.id);

    if (!map) return;

    map.stop();
    map.setStyle(basemap.style);

    map.once("style.load", () => {
      console.log("STYLE LOADED");

      if (rebuildAllLayers) {
        console.log("CALLING REBUILD");
        rebuildAllLayers();
      } else {
        console.log("NO REBUILD FUNCTION");
      }
    });
  };

  return (
    <div className="max-h-[calc(100vh-150px)] overflow-y-auto text-white">
      {/* Heading is intentionally NOT repeated here.
          MetaverseLeftToolbar already renders the single BASemaps panel header. */}
      <div className="grid grid-cols-4 gap-2 p-3">
        {basemaps.map((basemap) => {
          const isActive = activeBasemap === basemap.id;

          return (
            <button
              key={basemap.id}
              type="button"
              onClick={() => handleBasemapChange(basemap)}
              className={`min-w-0 overflow-hidden rounded-md border bg-[#06291f] text-left transition hover:border-[#9be37b] ${
                isActive ? "border-[#9be37b]" : "border-[#0f3d2e]"
              }`}
              title={basemap.label}
            >
              <div
                className="relative h-14 w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundColor: basemap.previewColor,
                  backgroundImage: `url("${basemap.previewUrl}")`,
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
