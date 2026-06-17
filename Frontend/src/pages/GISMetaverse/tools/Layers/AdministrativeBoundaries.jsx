import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import mapboxgl from "mapbox-gl";

export default function AdministrativeBoundaries({
  map,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(false);

  const zoomToBoundarySource = (sourceNamePart) => {
    if (!map) return;

    const extendBounds = (bounds, coords) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === "number" && typeof coords[1] === "number") {
        bounds.extend(coords);
        return;
      }
      coords.forEach((coord) => extendBounds(bounds, coord));
    };

    const tryZoom = () => {
      try {
        const style = map.getStyle?.();
        const sourceId = Object.keys(style?.sources || {}).find((id) =>
          id.toLowerCase().includes(sourceNamePart),
        );

        if (!sourceId) return;

        const source = map.getSource(sourceId);
        const data = source?._data || source?.serialize?.()?.data;
        if (!data?.features?.length) return;

        const bounds = new mapboxgl.LngLatBounds();
        data.features.forEach((feature) =>
          extendBounds(bounds, feature.geometry?.coordinates),
        );

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, duration: 1200, maxZoom: 14 });
        }
      } catch (error) {
        console.error("Boundary zoom error:", error);
      }
    };

    tryZoom();
    setTimeout(tryZoom, 350);
    setTimeout(tryZoom, 900);
  };

  const toggleLayer = (key) => {
    const willBeVisible = !adminBoundaryVisibility?.[key];

    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    if (key === "rudaBoundary" && willBeVisible) {
      zoomToBoundarySource("ruda-boundary");
    }

    if (key === "rudaMauzaBoundary" && willBeVisible) {
      zoomToBoundarySource("ruda-mauza");
    }
  };

  const updateOpacity = (key, value) => {
    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      [`${key}Opacity`]: value,
    }));
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>ADMINISTRATIVE BOUNDARIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <LayerItem
            checked={adminBoundaryVisibility.rudaBoundary}
            color="#6bb7e8"
            label="Ruda Boundary"
            opacity={adminBoundaryVisibility.rudaBoundaryOpacity ?? 100}
            onChange={() => toggleLayer("rudaBoundary")}
            onOpacityChange={(value) => updateOpacity("rudaBoundary", value)}
          />

          <LayerItem
            checked={adminBoundaryVisibility.rudaMauzaBoundary}
            color="#22c55e"
            label="Ruda Mauza Boundary"
            opacity={adminBoundaryVisibility.rudaMauzaBoundaryOpacity ?? 100}
            onChange={() => toggleLayer("rudaMauzaBoundary")}
            onOpacityChange={(value) =>
              updateOpacity("rudaMauzaBoundary", value)
            }
          />

          <LayerItem
            checked={adminBoundaryVisibility.geodeticNetwork}
            color="#22c55e"
            label="Geodetic Network"
            opacity={adminBoundaryVisibility.geodeticNetworkOpacity ?? 100}
            onChange={() => toggleLayer("geodeticNetwork")}
            onOpacityChange={(value) => updateOpacity("geodeticNetwork", value)}
          />

          <LayerItem
            checked={adminBoundaryVisibility.proposedRoads}
            color="#19598d"
            label="Proposed Roads Layer"
            opacity={adminBoundaryVisibility.proposedRoadsOpacity ?? 100}
            onChange={() => toggleLayer("proposedRoads")}
            onOpacityChange={(value) => updateOpacity("proposedRoads", value)}
          />
        </div>
      )}
    </div>
  );
}

function LayerItem({
  checked,
  color,
  label,
  opacity,
  onChange,
  onOpacityChange,
}) {
  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-[#65c96b]"
          />

          <span
            className="h-4 w-4 rounded-sm border-2"
            style={{ borderColor: color }}
          />

          <span className="text-[11px]">{label}</span>
        </label>

        <Grid3X3 size={14} className="text-white/60" />
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}