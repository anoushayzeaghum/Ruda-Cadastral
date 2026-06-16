import { ChevronDown, Map as MapIcon, Route } from "lucide-react";
import { useMemo, useState } from "react";

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

const roadLegendItems = [
  { label: "Primary Roads (300'-Wide)", color: "#19598d", width: 3 },
  { label: "Secondary Road (200'-Wide)", color: "#4caf50", width: 3 },
  { label: "Tertiary Roads", color: "#ff9800", width: 3 },
  { label: "Tertiary Roads (80'-Wide)", color: "#ff5722", width: 2.5 },
  { label: "Uti Walk Cycle", color: "#8bc34a", width: 2 },
  { label: "Bridge", color: "#75008a", width: 5 },
  { label: "300' CL", color: "#9b2400", width: 2 },
  { label: "300' ROW", color: "#00bcd4", width: 2.5 },
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

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

const getRudaPhaseLabel = (phase = {}) => {
  const phaseId = phase?._ruda_phase_id ?? phase?.gid ?? phase?.id ?? phase?.oid ?? "";
  const candidates = [
    phase?._ruda_phase_label,
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

export default function MetaverseLegend({
  adminBoundaryVisibility = {},
  rudaPhases = [],
}) {
  const [collapsed, setCollapsed] = useState(false);

  const showRudaLegend = !!adminBoundaryVisibility.rudaBoundary;
  const showRoadLegend = !!adminBoundaryVisibility.proposedRoads;
  const shouldShow = showRudaLegend || showRoadLegend;

  const rudaLegendItems = useMemo(() => {
    const unique = new Map();

    (rudaPhases || []).forEach((phase) => {
      const id = phase?._ruda_phase_id ?? phase?.gid ?? phase?.id ?? phase?.oid ?? phase?.fid;
      const key = String(id ?? getRudaPhaseLabel(phase));

      if (!unique.has(key)) {
        unique.set(key, {
          id: key,
          label: getRudaPhaseLabel(phase),
          color: phase?._ruda_phase_color || getRudaPhaseColor(key),
        });
      }
    });

    return [...unique.values()];
  }, [rudaPhases]);

  if (!shouldShow) return null;

  return (
    <aside className="pointer-events-auto absolute bottom-5 right-5 z-30 w-[310px] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center justify-between bg-[#0f5f2d] px-3.5 py-2.5 text-left text-white"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide">
          <MapIcon size={16} />
          Legend
        </span>

        <ChevronDown
          size={17}
          strokeWidth={2.5}
          className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>

      {!collapsed && (
        <div className="max-h-[380px] overflow-y-auto px-3.5 py-3">
          {showRudaLegend && (
            <div className="mb-4">
              <p className="mb-2 text-[12px] font-semibold text-slate-800">
                RUDA Boundary Phases
              </p>

              <div className="space-y-2">
                {rudaLegendItems.length ? (
                  rudaLegendItems.map((item) => (
                    <div key={`ruda-${item.id}`} className="flex items-center gap-2.5">
                      <span
                        className="h-4 w-7 shrink-0 rounded border border-slate-600"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[11.5px] leading-tight text-slate-700">
                        {item.label}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Turn on RUDA Boundary to load phase colors.
                  </div>
                )}
              </div>
            </div>
          )}

          {showRoadLegend && (
            <div className={showRudaLegend ? "border-t border-slate-200 pt-3" : ""}>
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                <Route size={14} />
                RUDA Proposed Roads
              </p>

              <div className="space-y-2">
                {roadLegendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-10 shrink-0 items-center">
                      <span
                        className="block w-full rounded-full"
                        style={{
                          height: `${item.width}px`,
                          backgroundColor: item.color,
                        }}
                      />
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[11.5px] leading-tight text-slate-700">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
