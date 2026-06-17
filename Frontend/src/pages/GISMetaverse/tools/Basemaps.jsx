import { useState } from "react";
import { Globe2, Check } from "lucide-react";

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
    preview: "linear-gradient(135deg, #111827, #374151)",
  },
  {
    id: "outdoors",
    label: "Outdoors",
    style: "mapbox://styles/mapbox/outdoors-v12",
    preview: "linear-gradient(135deg, #b7d59a, #5f8f58)",
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
              className={`overflow-hidden rounded-md border bg-[#1d2533] text-left transition hover:border-[#8bd66f] ${
                isActive ? "border-[#8bd66f]" : "border-[#344055]"
              }`}
            >
              <div
                className="relative h-16 w-full"
                style={{ background: basemap.preview }}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#8bd66f] text-[#111827]">
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