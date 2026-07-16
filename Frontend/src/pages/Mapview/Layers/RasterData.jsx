import { ChevronDown } from "lucide-react";

const RASTER_DATA_LAYERS = [
  { key: "handuGujranOrtho", label: "Massavi" },
];

export default function RasterData({
  isMobile,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  updateLayer,
}) {
  return (
    <div
      className="overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={
        isMobile
          ? { maxHeight: "calc(70vh - 100px)" }
          : { maxHeight: "calc(100vh - 205px)" }
      }
    >
      <div className="mt-3 overflow-hidden rounded-md border border-[#13593f] bg-[#031a14] shadow-md">
        <div className="flex items-center gap-2 border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5">
          <h4 className="text-[12px] font-semibold leading-tight text-white">
            Raster Layers
          </h4>
        </div>

        <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-sm">
          {RASTER_DATA_LAYERS.map((item, index) => (
            <div
              key={item.key}
              className={`bg-[#06291f] px-2.5 py-2 ${
                index === RASTER_DATA_LAYERS.length - 1
                  ? ""
                  : "border-b border-[#0c3d2d]"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={getLayerVisible(item.key)}
                  onChange={() => toggleLayer(item.key)}
                  className="h-3.5 w-3.5 shrink-0 accent-[#9be37b]"
                />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
                  {item.label}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 pl-6">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getLayerOpacity(item.key)}
                  onChange={(event) =>
                    updateLayer(item.key, {
                      opacity: Number(event.target.value),
                    })
                  }
                  className="h-1.5 min-w-0 flex-1 accent-[#9be37b]"
                />
                <span className="w-9 shrink-0 text-right text-[11px] font-medium text-white/60">
                  {getLayerOpacity(item.key)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
