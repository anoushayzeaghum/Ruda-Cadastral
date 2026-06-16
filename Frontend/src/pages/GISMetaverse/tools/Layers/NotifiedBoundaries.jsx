import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";

const IDS = {
  rudaBoundary:  { src: "gism-nb-ruda-src",  fill: "gism-nb-ruda-fill",  line: "gism-nb-ruda-line"  },
  mauzaBoundary: { src: "gism-nb-mauza-src", fill: "gism-nb-mauza-fill", line: "gism-nb-mauza-line" },
};

const LAYER_DEFS = [
  { key: "rudaBoundary",  label: "RUDA Boundary",   color: "#6bb7e8" },
  { key: "mauzaBoundary", label: "Mauza Boundary",  color: "#f8d56b" },
];

function applyVisibility(map, key, visible) {
  if (!map) return;
  const ids = IDS[key];
  const vis = visible ? "visible" : "none";
  try {
    if (ids.fill && map.getLayer(ids.fill)) map.setLayoutProperty(ids.fill, "visibility", vis);
    if (ids.line && map.getLayer(ids.line)) map.setLayoutProperty(ids.line, "visibility", vis);
  } catch (_) {}
}

function applyOpacity(map, key, opacity) {
  if (!map) return;
  const ids = IDS[key];
  const o = opacity / 100;
  try {
    if (ids.fill && map.getLayer(ids.fill)) map.setPaintProperty(ids.fill, "fill-opacity", o * 0.25);
    if (ids.line && map.getLayer(ids.line)) map.setPaintProperty(ids.line, "line-opacity", o);
  } catch (_) {}
}

export default function NotifiedBoundaries({ map }) {
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
        <span>NOTIFIED BOUNDARIES</span>
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
