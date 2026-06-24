import { useState } from "react";
import { Globe2, Check } from "lucide-react";

import { BASEMAP_STYLES } from "../../Mapview/LayerManager/layerConfig";

const BASEMAPS = [
  { name: "Streets", image: "/basemaps/streets.png" },
  { name: "Satellite", image: "/basemaps/satellite.png" },
  { name: "Dark", image: "/basemaps/dark.png" },
  { name: "Light", image: "/basemaps/light.png" },
  { name: "Outdoors", image: "/basemaps/outdoors.png" },
];

export default function Basemaps({ map, rebuildAllLayers }) {
  const [activeBasemap, setActiveBasemap] = useState("Streets");

  const handleBasemapChange = (item) => {
    setActiveBasemap(item.name);

    if (!map) return;

    map.stop();
    map.setStyle(BASEMAP_STYLES[item.name] || item.name);

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

      <div className="grid grid-cols-2 gap-4 p-4">
        {BASEMAPS.map((item) => (
          <div
            key={item.name}
            className={`cursor-pointer rounded-lg border-2 p-1 transition-all ${
              activeBasemap === item.name
                ? "border-green-500 shadow-lg"
                : "border-transparent hover:border-[#8bd66f]"
            }`}
            onClick={() => handleBasemapChange(item)}
          >
            <div className="relative aspect-video overflow-hidden rounded-md">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              {activeBasemap === item.name && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="rounded-full bg-green-500 p-1">
                    <Check size={16} className="text-white" />
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-sm font-medium text-slate-200">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}