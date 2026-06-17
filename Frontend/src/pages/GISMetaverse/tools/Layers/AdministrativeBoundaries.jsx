import { useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import mapboxgl from "mapbox-gl";

export default function AdministrativeBoundaries({
  map,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(false);

  const ADMIN_SOURCE_IDS = {
    rudaBoundary: "metaverse-ruda-boundary-source",
    rudaMauzaBoundary: "metaverse-ruda-mauza-boundary-source",
    geodeticNetwork: "metaverse-geodetic-network-source",
    proposedRoads: "metaverse-proposed-roads-source",
  };

  const zoomToBoundarySource = (key) => {
    if (!map) return;

    const sourceId = ADMIN_SOURCE_IDS[key];
    if (!sourceId) return;

    const extendBounds = (bounds, coords) => {
      if (!Array.isArray(coords)) return;

      if (
        coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        bounds.extend(coords);
        return;
      }

      coords.forEach((coord) => extendBounds(bounds, coord));
    };

    const tryZoom = () => {
      try {
        const source = map.getSource(sourceId);
        const data = source?._data || source?.serialize?.()?.data;

        if (!data?.features?.length) return false;

        const bounds = new mapboxgl.LngLatBounds();

        data.features.forEach((feature) => {
          const geometry = feature.geometry;
          if (!geometry) return;

          if (geometry.type === "GeometryCollection") {
            geometry.geometries?.forEach((geom) => {
              extendBounds(bounds, geom.coordinates);
            });
            return;
          }

          extendBounds(bounds, geometry.coordinates);
        });

        if (bounds.isEmpty()) return false;

        map.fitBounds(bounds, {
          padding: 70,
          duration: 1200,
          maxZoom: key === "geodeticNetwork" ? 16 : 14,
        });

        return true;
      } catch (error) {
        console.error("Administrative boundary zoom error:", error);
        return false;
      }
    };

    const zoomWhenReady = () => {
      if (tryZoom()) return;
      setTimeout(tryZoom, 350);
      setTimeout(tryZoom, 900);
      setTimeout(tryZoom, 1400);
    };

    if (map.isStyleLoaded?.()) zoomWhenReady();
    else map.once("load", zoomWhenReady);
  };

  const toggleLayer = (key) => {
    const willBeVisible = !adminBoundaryVisibility?.[key];

    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
      ...(willBeVisible
        ? {
            _zoomTo: key,
            _zoomToken: Date.now(),
          }
        : {}),
    }));

    if (willBeVisible) {
      zoomToBoundarySource(key);
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