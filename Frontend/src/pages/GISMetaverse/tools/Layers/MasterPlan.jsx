import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import LayerRow from "./_LayerRow";

// ── Source / layer ID constants ───────────────────────────────────────────────
const IDS = {
  boundary:   { src: "gism-mp-boundary-src",   fill: "gism-mp-boundary-fill",   line: "gism-mp-boundary-line"   },
  masterPlan: { src: "gism-mp-plan-src",        fill: "gism-mp-plan-fill",        line: "gism-mp-plan-line"        },
  spotLevel:  { src: "gism-mp-spotlevel-src",   circle: "gism-mp-spotlevel-cir"                                    },
  contours:   { src: "gism-mp-contours-src",    line: "gism-mp-contours-line"                                      },
  roads:      { src: "gism-mp-roads-src",       line: "gism-mp-roads-line"                                         },
};

const LAYER_DEFS = [
  { key: "boundary",   label: "Boundary",             color: "#ff8b24", type: "polygon" },
  { key: "masterPlan", label: "Master Plan Boundary",  color: "#42a5f5", type: "polygon" },
  { key: "spotLevel",  label: "Spot Level",            color: "#65c96b", type: "point"   },
  { key: "contours",   label: "Contours",              color: "#d7bf32", type: "line"    },
  { key: "roads",      label: "Roads",                 color: "#ef4444", type: "line"    },
];

// ── Helper: update opacity on existing Mapbox layers ─────────────────────────
function setLayerOpacity(map, key, opacity) {
  if (!map) return;
  const o = opacity / 100;
  const ids = IDS[key];
  if (!ids) return;

  try {
    if (ids.fill   && map.getLayer(ids.fill))   map.setPaintProperty(ids.fill,   "fill-opacity",   o * 0.4);
    if (ids.line   && map.getLayer(ids.line))   map.setPaintProperty(ids.line,   "line-opacity",   o);
    if (ids.circle && map.getLayer(ids.circle)) map.setPaintProperty(ids.circle, "circle-opacity", o);
  } catch (_) {}
}

// ── Helper: show/hide layers ──────────────────────────────────────────────────
function setLayerVisibility(map, key, visible) {
  if (!map) return;
  const ids = IDS[key];
  if (!ids) return;
  const vis = visible ? "visible" : "none";
  try {
    if (ids.fill   && map.getLayer(ids.fill))   map.setLayoutProperty(ids.fill,   "visibility", vis);
    if (ids.line   && map.getLayer(ids.line))   map.setLayoutProperty(ids.line,   "visibility", vis);
    if (ids.circle && map.getLayer(ids.circle)) map.setLayoutProperty(ids.circle, "visibility", vis);
  } catch (_) {}
}

export default function MasterPlan({ map }) {
  const [open, setOpen] = useState(true);

  // Per-layer state: { visible, opacity }
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(LAYER_DEFS.map((d) => [d.key, { visible: false, opacity: 100 }]))
  );

  const setVisible = (key, v) =>
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], visible: v } }));
  const setOpacity = (key, o) =>
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], opacity: o } }));

  // Sync visibility to map
  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) => setLayerVisibility(map, key, layers[key].visible));
  }, [map, layers]);

  // Sync opacity to map (runs on any opacity change)
  useEffect(() => {
    LAYER_DEFS.forEach(({ key }) => {
      if (layers[key].visible) setLayerOpacity(map, key, layers[key].opacity);
    });
  }, [map, layers]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((p) => !p)}
      >
        <span>MASTER PLAN</span>
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
