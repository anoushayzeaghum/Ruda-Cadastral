import React from "react";
import { CADASTRAL_BOUNDARY_STYLES } from "./LayerManager/CadastralBoundaryStyles.js";

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

export const roadLegendItems = [
  { label: "Primary Roads (300'-Wide)", color: "#c92020", width: 2 },
  { label: "Secondary Road (200'-Wide)", color: "#4caf50", width: 3 },
  { label: "Tertiary Roads", color: "#ff9800", width: 3 },
  { label: "Tertiary Roads (80'-Wide)", color: "#ff5722", width: 2.5 },
  { label: "Uti Walk Cycle", color: "#8bc34a", width: 2 },
  { label: "Bridge", color: "#75008a", width: 5 },
  { label: "300' CL", color: "#9b2400", width: 2 },
  { label: "300' ROW", color: "#00bcd4", width: 2.5 },
];

export const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

export const getRudaPhaseLabel = (phase = {}) => {
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

export function PolygonLegend({ label, fillColor, lineColor, fillOpacity = 0.4 }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="relative h-3 w-3 shrink-0 rounded-sm overflow-hidden"
        style={{
          border: lineColor ? `1px solid ${lineColor}` : "none",
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundColor: fillColor || "transparent",
            opacity: fillColor === "transparent" ? 1 : fillOpacity,
          }}
        />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
        {label}
      </span>
    </div>
  );
}

export function LineLegend({ label, color, width = 2 }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-3 w-6 shrink-0 items-center justify-center">
        <span
          className="block w-full rounded-full"
          style={{
            height: `${width}px`,
            backgroundColor: color,
          }}
        />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
        {label}
      </span>
    </div>
  );
}

export function PointLegend({ label, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-3 w-3 shrink-0 items-center justify-center">
        <span
          className="block h-2 w-2 rounded-full"
          style={{ backgroundColor: color || "#e11d48" }}
        />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
        {label}
      </span>
    </div>
  );
}

export function LegendSection({ title = "Legend", children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

export function LayerLegend({ layerKey, color, boundaryStatus }) {
  if (layerKey === "districtBoundary") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="District Boundary"
          fillColor={color}
          lineColor={color}
          fillOpacity={0.14}
        />
      </LegendSection>
    );
  }

  if (layerKey === "tehsilBoundary") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="Tehsil Boundary"
          fillColor={color}
          lineColor={color}
          fillOpacity={0.08}
        />
      </LegendSection>
    );
  }

  if (layerKey === "mauzaBoundary") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="Mauza Boundary"
          fillColor="transparent"
          lineColor={color}
        />
      </LegendSection>
    );
  }

  if (layerKey === "khasraLayer") {
    const vColor = CADASTRAL_BOUNDARY_STYLES.khasra.verifiedColor;
    const uColor = CADASTRAL_BOUNDARY_STYLES.khasra.unverifiedColor;
    const fillOpacity = CADASTRAL_BOUNDARY_STYLES.khasra.fillOpacity;

    const showVerified = boundaryStatus === "verified" || boundaryStatus === "both";
    const showUnverified = boundaryStatus === "unverified" || boundaryStatus === "both";

    return (
      <LegendSection title="Legend">
        {showVerified && (
          <PolygonLegend
            label="Verified Khasra"
            fillColor={vColor}
            lineColor={vColor}
            fillOpacity={fillOpacity}
          />
        )}
        {showUnverified && (
          <PolygonLegend
            label="Unverified Khasra"
            fillColor={uColor}
            lineColor={uColor}
            fillOpacity={fillOpacity}
          />
        )}
      </LegendSection>
    );
  }

  if (layerKey === "squareLayer") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="Square Boundary"
          fillColor={color}
          lineColor={color}
          fillOpacity={0.04}
        />
      </LegendSection>
    );
  }

  if (layerKey === "acreLayer") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="Acre Boundary"
          fillColor={color}
          lineColor={color}
          fillOpacity={0.04}
        />
      </LegendSection>
    );
  }

  if (layerKey === "awardedLand") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="Awarded Land"
          fillColor="#FAEEDA"
          lineColor={color}
          fillOpacity={0.45}
        />
      </LegendSection>
    );
  }

  if (layerKey === "stateLand") {
    return (
      <LegendSection title="Legend">
        <PolygonLegend
          label="State Land"
          fillColor="#F1EFE8"
          lineColor={color}
          fillOpacity={0.45}
        />
      </LegendSection>
    );
  }

  if (layerKey === "triJunctionPoints") {
    return (
      <LegendSection title="Legend">
        <PointLegend label="Tri Junction Point" color={color} />
      </LegendSection>
    );
  }

  if (layerKey === "fieldPoints") {
    return (
      <LegendSection title="Legend">
        <PointLegend label="Field Point" color={color} />
      </LegendSection>
    );
  }

  return null;
}
