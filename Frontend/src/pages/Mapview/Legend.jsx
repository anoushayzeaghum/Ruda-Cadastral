import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Map as MapIcon, Route } from "lucide-react";
import { getRudaProposedRoadsList } from "../../services/api";

const RUDA_PHASE_COLORS = [
  "#6bb7e8",
  "#f8d56b",
  "#6bd69a",
  "#f59e72",
  "#b99cf3",
  "#78d6d0",
  "#f3a6c8",
  "#a7d77b",
  "#f4b860",
  "#86a8e7",
  "#d7b377",
  "#8dd3c7",
];

const ROAD_STYLE_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
];

const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const getLayerVisible = (layers = {}, key, fallback = false) => {
  const value = layers?.[key];
  if (typeof value === "object") return value.visible !== false;
  if (typeof value === "boolean") return value;
  return fallback;
};

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

const getRudaPhaseLabel = (phase = {}) => {
  const phaseId = phase?.gid ?? phase?.id ?? phase?.oid ?? "";
  const candidates = [
    phase?.phase,
    phase?.phase_name,
    phase?.name,
    phase?.folderpath,
    phase?.popupinfo,
    phase?.snippet,
  ];

  for (const value of candidates) {
    const clean = stripHtml(value);
    if (!clean) continue;

    const phaseMatch = clean.match(/phase\s*[-_:]?\s*([a-z0-9]+)/i);
    if (phaseMatch?.[1]) return `Phase ${phaseMatch[1]}`;

    if (clean.length <= 28) return clean;
    return clean.slice(0, 28);
  }

  return phaseId ? `Phase ${phaseId}` : "RUDA Phase";
};

const getRoadLayerName = (road = {}) =>
  String(
    road.layer ||
      road.Layer ||
      road.road_layer ||
      road.road_type ||
      road.name ||
      "Proposed Road",
  ).trim() || "Proposed Road";

const getRoadColor = (layerName = "") =>
  ROAD_STYLE_PALETTE[hashString(layerName) % ROAD_STYLE_PALETTE.length];

const getRoadWidth = (layerName = "") => {
  const text = String(layerName || "").toLowerCase();

  if (text.includes("300") || text.includes("express") || text.includes("motorway")) return 8;
  if (text.includes("200") || text.includes("primary") || text.includes("arterial")) return 7;
  if (text.includes("150") || text.includes("secondary")) return 6;
  if (text.includes("120") || text.includes("100")) return 5;
  if (text.includes("80") || text.includes("60") || text.includes("local")) return 4;

  return 4.5;
};

export default function Legend({
  layers = {},
  rudaPhases = [],
  selectedRudaPhaseIds = [],
  selectedProposedRoadIds = [],
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [roads, setRoads] = useState([]);

  const rudaVisible = getLayerVisible(layers, "rudaBoundary", false);
  const roadsVisible = getLayerVisible(layers, "proposedRoads", false);
  const shouldShow = rudaVisible || roadsVisible;

  useEffect(() => {
    if (shouldShow) setCollapsed(false);
  }, [shouldShow]);

  useEffect(() => {
    let mounted = true;

    const loadRoads = async () => {
      if (!roadsVisible || roads.length) return;

      try {
        const list = await getRudaProposedRoadsList();
        if (mounted) setRoads(list || []);
      } catch (e) {
        console.error("Failed to load proposed road legend", e);
      }
    };

    loadRoads();

    return () => {
      mounted = false;
    };
  }, [roadsVisible, roads.length]);

  const rudaLegendItems = useMemo(() => {
    const selected = new Set((selectedRudaPhaseIds || []).map((id) => String(id)));

    return (rudaPhases || [])
      .filter((phase) => {
        const id = phase?.gid ?? phase?.id ?? phase?.oid;
        if (!selected.size) return true;
        return selected.has(String(id));
      })
      .map((phase) => {
        const id = phase?.gid ?? phase?.id ?? phase?.oid;
        return {
          id,
          label: getRudaPhaseLabel(phase),
          color: getRudaPhaseColor(id),
        };
      });
  }, [rudaPhases, selectedRudaPhaseIds]);

  const roadLegendItems = useMemo(() => {
    const selected = new Set((selectedProposedRoadIds || []).map((id) => String(id)));
    const byLayer = new Map();

    (roads || []).forEach((road) => {
      const id = road?.gid ?? road?.id ?? road?.oid ?? road?.fid;
      if (selected.size && !selected.has(String(id))) return;

      const layerName = getRoadLayerName(road);
      if (!byLayer.has(layerName)) {
        byLayer.set(layerName, {
          label: layerName,
          color: getRoadColor(layerName),
          width: getRoadWidth(layerName),
        });
      }
    });

    return Array.from(byLayer.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [roads, selectedProposedRoadIds]);

  if (!shouldShow) return null;

  return (
    <aside className="pointer-events-auto absolute bottom-5 right-5 z-40 w-[290px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex w-full items-center justify-between bg-[#158033] px-4 py-3 text-left text-white"
      >
        <div className="flex items-center gap-2">
          <MapIcon size={17} />
          <span className="text-sm font-semibold tracking-wide">MAP LEGEND</span>
        </div>
        {collapsed ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {!collapsed && (
        <div className="max-h-[360px] overflow-y-auto px-4 py-3 text-xs text-slate-700">
          {rudaVisible && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <MapIcon size={14} />
                RUDA Boundary Phases
              </div>

              <div className="space-y-2">
                {rudaLegendItems.length ? (
                  rudaLegendItems.map((item) => (
                    <div key={`ruda-${item.id}`} className="flex items-center gap-2">
                      <span
                        className="h-4 w-6 shrink-0 rounded border border-slate-700"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400">No selected RUDA phases.</div>
                )}
              </div>
            </div>
          )}

          {roadsVisible && (
            <div>
              <div className="mb-2 flex items-center gap-2 border-t border-slate-200 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Route size={14} />
                Proposed Roads
              </div>

              <div className="space-y-2.5">
                {roadLegendItems.length ? (
                  roadLegendItems.map((item) => (
                    <div key={`road-${item.label}`} className="flex items-center gap-2">
                      <span className="flex h-4 w-9 shrink-0 items-center">
                        <span
                          className="block w-full rounded-full"
                          style={{
                            borderTop: `${Math.max(2, Math.min(item.width, 7))}px solid ${item.color}`,
                          }}
                        />
                      </span>
                      <span className="truncate" title={item.label}>{item.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400">Road legend will appear after roads load.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
