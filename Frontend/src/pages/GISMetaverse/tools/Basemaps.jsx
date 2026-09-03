import { useState } from "react";
import { Globe2, Check, X } from "lucide-react";

const basemaps = [
  {
    id: "streets",
    label: "Streets",
    style: "mapbox://styles/mapbox/streets-v12",
    preview: "linear-gradient(135deg, #d7e3c7, #8db57a)",
  },
  {
    id: "satellite",
    label: "Satellite",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    preview: "linear-gradient(135deg, #26351f, #7c8b65)",
  },
  {
    id: "light",
    label: "Light",
    style: "mapbox://styles/mapbox/light-v11",
    preview: "linear-gradient(135deg, #f4f4f2, #cfcfcf)",
  },
  {
    id: "dark",
    label: "Dark",
    style: "mapbox://styles/mapbox/dark-v11",
    preview: "linear-gradient(135deg, #0f3d2e, #374151)",
  },
  {
    id: "outdoors",
    label: "Outdoors",
    style: "mapbox://styles/mapbox/outdoors-v12",
    preview: "linear-gradient(135deg, #b7d59a, #5f8f58)",
  },
  // ── ESRI basemaps ───────────────────────────────────────────────────────────
  {
    id: "esri-imagery",
    label: "ESRI Imagery",
    preview: "linear-gradient(135deg, #2d3b2d, #4a6741)",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
      },
      layers: [{ id: "esri-basemap-layer", type: "raster", source: "esri-basemap" }],
    },
  },
  {
    id: "esri-streets",
    label: "ESRI Streets",
    preview: "linear-gradient(135deg, #c9d9b5, #7da86f)",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, HERE, DeLorme, USGS, Intermap, iPC, NRCAN",
        },
      },
      layers: [{ id: "esri-basemap-layer", type: "raster", source: "esri-basemap" }],
    },
  },
  {
    id: "esri-topo",
    label: "ESRI Topo",
    preview: "linear-gradient(135deg, #a8c896, #6b8f5e)",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, HERE, DeLorme, Intermap, USGS, NPS",
        },
      },
      layers: [{ id: "esri-basemap-layer", type: "raster", source: "esri-basemap" }],
    },
  },
  {
    id: "esri-light-gray",
    label: "ESRI Light Gray",
    preview: "linear-gradient(135deg, #e8e8e8, #c0c0c0)",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        },
      },
      layers: [{ id: "esri-basemap-layer", type: "raster", source: "esri-basemap" }],
    },
  },
  {
    id: "esri-natgeo",
    label: "ESRI NatGeo",
    preview: "linear-gradient(135deg, #d4e8c2, #8faf6d)",
    style: {
      version: 8,
      sources: {
        "esri-basemap": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ",
        },
      },
      layers: [{ id: "esri-basemap-layer", type: "raster", source: "esri-basemap" }],
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
    <div className="text-white">
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <Globe2 size={15} />
          <span>BASEMAPS</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3">
        {basemaps.map((basemap) => {
          const isActive = activeBasemap === basemap.id;

          return (
            <button
              key={basemap.id}
              onClick={() => handleBasemapChange(basemap)}
              className={`overflow-hidden rounded-md border bg-[#06291f] text-left transition hover:border-[#9be37b] ${
                isActive ? "border-[#9be37b]" : "border-[#0f3d2e]"
              }`}
            >
              <div
                className="relative h-16 w-full"
                style={{ background: basemap.preview }}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#9be37b] text-[#06291f]">
                    <Check size={13} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="px-3 py-2 text-xs font-semibold">
                {basemap.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
