import { Map } from "lucide-react";

const BASEMAPS = [
  {
    name: "Satellite",
    preview:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4640/3075",
  },
  {
    name: "Streets",
    preview:
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/13/4640/3075",
  },
  {
    name: "Light",
    preview: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
  },
  {
    name: "Dark",
    preview: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
  },
  {
    name: "Outdoors",
    preview: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
];

export default function BaseMap({ basemap, setBasemap }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {BASEMAPS.map((item) => (
        <button
          key={item.name}
          type="button"
          onClick={() => setBasemap(item.name)}
          className={`overflow-hidden rounded-lg border text-left transition ${
            basemap === item.name
              ? "border-[#9be37b] bg-[#083526]"
              : "border-[#104c39] bg-[#031a14] hover:bg-[#0a3327]"
          }`}
        >
          <div className="relative h-16 w-full overflow-hidden">
            <img
              src={item.preview}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-2 text-xs font-semibold text-white">
            <span className="flex items-center gap-1.5">
              <Map size={14} />
              {item.name}
            </span>
            {basemap === item.name && (
              <span className="text-[#9be37b]">✓</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
