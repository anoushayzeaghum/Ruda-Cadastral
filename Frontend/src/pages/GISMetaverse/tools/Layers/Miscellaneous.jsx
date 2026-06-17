import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";

const IDS = {
  trijunction: { src: "gism-misc-tri-src", circle: "gism-misc-tri-cir" },
  fieldPoints: { src: "gism-misc-fp-src", circle: "gism-misc-fp-cir" },
};

const LAYER_DEFS = [
  { key: "trijunction", label: "Trijunction Points", color: "#f97316" },
  { key: "fieldPoints", label: "Field Points", color: "#a855f7" },
];

function applyVisibility(map, key, visible) {
  if (!map) return;
  const ids = IDS[key];
  const vis = visible ? "visible" : "none";
  try {
    if (ids.circle && map.getLayer(ids.circle)) map.setLayoutProperty(ids.circle, "visibility", vis);
  } catch (_) {}
}

function applyOpacity(map, key, opacity) {
  if (!map) return;
  const ids = IDS[key];
  const o = opacity / 100;
  try {
    if (ids.circle && map.getLayer(ids.circle)) map.setPaintProperty(ids.circle, "circle-opacity", o);
  } catch (_) {}
}

export default function Miscellaneous({ map }) {
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
        <span>MISCELLANEOUS</span>
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
