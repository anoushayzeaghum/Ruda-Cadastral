import { ChevronDown, Map as MapIcon, Route } from "lucide-react";
import { useMemo, useState } from "react";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";

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
  { label: "Primary Roads (300'-Wide)", color: "#c92020", width: 3 },
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
  const phaseId =
    phase?._ruda_phase_id ?? phase?.gid ?? phase?.id ?? phase?.oid ?? "";

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
  layerVisibility = {},
  rudaPhases = [],
}) {
  const [collapsed, setCollapsed] = useState(false);

  const showRudaLegend = !!adminBoundaryVisibility.rudaBoundary;
  const showRoadLegend = !!adminBoundaryVisibility.proposedRoads;
  const showTopoLegend = !!layerVisibility?.topography;

  const legendRudaPhases = rudaPhases?.length
    ? rudaPhases
    : adminBoundaryVisibility?.rudaPhases || [];

  const rudaLegendItems = useMemo(() => {
    const unique = new Map();
    const selected = new Set(
      (adminBoundaryVisibility?.selectedRudaPhaseIds || []).map((id) =>
        String(id),
      ),
    );

    (legendRudaPhases || []).forEach((phase) => {
      const id =
        phase?._ruda_phase_id ??
        phase?.gid ??
        phase?.id ??
        phase?.oid ??
        phase?.fid;

      const key = String(id ?? getRudaPhaseLabel(phase));

      if (selected.size && !selected.has(key)) return;

      if (!unique.has(key)) {
        unique.set(key, {
          id: key,
          label: getRudaPhaseLabel(phase),
          color: phase?._ruda_phase_color || getRudaPhaseColor(key),
        });
      }
    });

    return [...unique.values()];
  }, [legendRudaPhases, adminBoundaryVisibility?.selectedRudaPhaseIds]);

  return (
    <aside className="pointer-events-auto w-[310px] overflow-hidden rounded-md border border-[#13593f] bg-[#06291f] text-white shadow-2xl">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between border-b border-[#343c4c] px-4 py-3 text-white hover:bg-[#0f3d2e]"
      >
        <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide">
          <MapIcon size={15} />
          Legend
        </span>

        <ChevronDown
          size={15}
          className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className={`max-h-[380px] p-3 ${LAYER_PANEL_SCROLL}`}>
          {!showRudaLegend && !showRoadLegend && !showTopoLegend && (
            <div className="rounded-sm border border-[#13593f]/30 bg-[#051f17] p-3 text-[11px] text-white/70">
              No active legend layer. Turn on RUDA Boundary, Proposed Roads, or
              Topographic Plan.
            </div>
          )}

          {showRudaLegend && (
            <LegendSection title="RUDA Boundary Phases">
              {rudaLegendItems.length ? (
                rudaLegendItems.map((item) => (
                  <LegendPolygonItem
                    key={`ruda-${item.id}`}
                    label={item.label}
                    color={item.color}
                  />
                ))
              ) : (
                <div className="text-[11px] text-white/60">
                  RUDA boundary is active.
                </div>
              )}
            </LegendSection>
          )}

          {showRoadLegend && (
            <LegendSection
              title="RUDA Proposed Roads"
              icon={<Route size={14} />}
            >
              {roadLegendItems.map((item) => (
                <LegendRoadItem key={item.label} item={item} />
              ))}
            </LegendSection>
          )}

          {showTopoLegend && (
            <LegendSection title="Topographic Plan">
              <LegendPolygonItem label="Builtup Areas" color="#f97316" />
              <LegendPolygonItem label="Parks" color="#22c55e" />
              <LegendPolygonItem label="Green Belts" color="#10b981" />
              <LegendRoadItem
                item={{ label: "Road Tracks", color: "#64748b", width: 2 }}
              />
              <LegendPointItem label="Manholes" color="#ef4444" />
              <LegendPointItem label="Light Poles" color="#eab308" />
              <LegendPointItem label="Spot Levels" color="#a855f7" />
            </LegendSection>
          )}
        </div>
      )}
    </aside>
  );
}

function LegendSection({ title, icon, children }) {
  return (
    <div className="mb-3 rounded-sm border border-[#13593f]/30 bg-[#051f17] p-2 last:mb-0">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-white">
        {icon}
        {title}
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function LegendPolygonItem({ label, color }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-4 w-7 shrink-0 rounded-sm border border-white/40"
        style={{ backgroundColor: color }}
      />

      <span className="min-w-0 flex-1 truncate text-[11px] leading-tight text-white/80">
        {label}
      </span>
    </div>
  );
}

function LegendRoadItem({ item }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-5 w-10 shrink-0 items-center">
        <span
          className="block w-full rounded-full"
          style={{
            height: `${item.width}px`,
            backgroundColor: item.color,
          }}
        />
      </span>

      <span className="min-w-0 flex-1 truncate text-[11px] leading-tight text-white/80">
        {item.label}
      </span>
    </div>
  );
}

function LegendPointItem({ label, color }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-4 w-7 shrink-0 items-center justify-center">
        <span
          className="h-3 w-3 rounded-full border border-white/60"
          style={{ backgroundColor: color }}
        />
      </span>

      <span className="min-w-0 flex-1 truncate text-[11px] leading-tight text-white/80">
        {label}
      </span>
    </div>
  );
}
