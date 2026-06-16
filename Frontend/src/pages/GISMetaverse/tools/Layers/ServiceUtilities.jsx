import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";

const IDS = {
  waterSupplyPoints: { src: "gism-su-ws-pts-src",  circle: "gism-su-ws-pts-cir" },
  waterSupplyLines:  { src: "gism-su-ws-lns-src",  line:   "gism-su-ws-lns-line" },
  sewagePoints:      { src: "gism-su-sw-pts-src",  circle: "gism-su-sw-pts-cir"  },
  sewageLines:       { src: "gism-su-sw-lns-src",  line:   "gism-su-sw-lns-line"  },
};

const LAYER_DEFS = [
  { key: "waterSupplyPoints", label: "Water Supply Points",  color: "#42a5f5" },
  { key: "waterSupplyLines",  label: "Water Supply Lines",   color: "#1e88e5" },
  { key: "sewagePoints",      label: "Sewage Points",        color: "#8e44ad" },
  { key: "sewageLines",       label: "Sewage Lines",         color: "#6d4c41" },
];

function applyOpacity(map, key, opacity) {
  if (!map) return;
  const o = opacity / 100;
  const ids = IDS[key];
  if (!ids) return;
  try {
    if (ids.circle && map.getLayer(ids.circle)) map.setPaintProperty(ids.circle, "circle-opacity", o);
    if (ids.line   && map.getLayer(ids.line))   map.setPaintProperty(ids.line,   "line-opacity",   o);
  } catch (_) {}
}

function applyVisibility(map, key, visible) {
  if (!map) return;
  const ids = IDS[key];
  if (!ids) return;
  const vis = visible ? "visible" : "none";
  try {
    if (ids.circle && map.getLayer(ids.circle)) map.setLayoutProperty(ids.circle, "visibility", vis);
    if (ids.line   && map.getLayer(ids.line))   map.setLayoutProperty(ids.line,   "visibility", vis);
  } catch (_) {}
}

export default function ServiceUtilities({ map }) {
  const [open, setOpen] = useState(false);
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(LAYER_DEFS.map((d) => [d.key, { visible: false, opacity: 100 }]))
  );

  const setVisible = (key, v) => setLayers((p) => ({ ...p, [key]: { ...p[key], visible: v } }));
  const setOpacity = (key, o) => setLayers((p) => ({ ...p, [key]: { ...p[key], opacity: o } }));

  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) => applyVisibility(map, key, layers[key].visible));
  }, [map, layers]);

  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) => {
      if (layers[key].visible) applyOpacity(map, key, layers[key].opacity);
    });
  }, [map, layers]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((p) => !p)}
      >
        <span>SERVICES - UTILITIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          {LAYER_DEFS.map(({ key, label, color }) => (
            <LayerRow
              key={key}
              label={label}
              color={color}
              checked={layers[key].visible}
              opacity={layers[key].opacity}
              onCheckedChange={(v) => setVisible(key, v)}
              onOpacityChange={(o) => setOpacity(key, o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
