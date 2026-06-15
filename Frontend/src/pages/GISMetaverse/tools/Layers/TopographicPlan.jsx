import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";

export default function TopographicPlan({ map }) {
  const [open, setOpen] = useState(false);
  const [dsmVisible, setDsmVisible] = useState(false);
  const [dsmOpacity, setDsmOpacity] = useState(85);
  const [dtmVisible, setDtmVisible] = useState(false);
  const [dtmOpacity, setDtmOpacity] = useState(85);

  const DSM_SOURCE = "gis-dsm-source";
  const DSM_LAYER = "gis-dsm-layer";
  const DTM_SOURCE = "gis-dtm-source";
  const DTM_LAYER = "gis-dtm-layer";

  const flyToChaharbagh = () => {
    if (!map) return;

    const bounds = [
      [74.42562653088396, 31.60509230706726],
      [74.43545280361002, 31.6112165411359],
    ];

    map.fitBounds(bounds, { padding: 50, duration: 1500 });
  };

  useEffect(() => {
    if (!map) return;

    if (dsmVisible) {
      if (!map.getSource(DSM_SOURCE)) {
        map.addSource(DSM_SOURCE, {
          type: "raster",
          tiles: ["http://localhost:8080/data/Chaharbagh_DSM/{z}/{x}/{y}.png"],
          tileSize: 256,
        });
      }

      if (!map.getLayer(DSM_LAYER)) {
        map.addLayer({
          id: DSM_LAYER,
          type: "raster",
          source: DSM_SOURCE,
          paint: { "raster-opacity": dsmOpacity / 100 },
          layout: { visibility: "visible" },
        });

        flyToChaharbagh();
      } else {
        map.setLayoutProperty(DSM_LAYER, "visibility", "visible");
        map.setPaintProperty(DSM_LAYER, "raster-opacity", dsmOpacity / 100);
      }
    } else if (map.getLayer(DSM_LAYER)) {
      map.setLayoutProperty(DSM_LAYER, "visibility", "none");
    }
  }, [map, dsmVisible, dsmOpacity]);

  useEffect(() => {
    if (!map) return;

    if (dtmVisible) {
      if (!map.getSource(DTM_SOURCE)) {
        map.addSource(DTM_SOURCE, {
          type: "raster",
          tiles: ["http://localhost:8080/data/Chaharbagh_DTM/{z}/{x}/{y}.png"],
          tileSize: 256,
        });
      }

      if (!map.getLayer(DTM_LAYER)) {
        map.addLayer({
          id: DTM_LAYER,
          type: "raster",
          source: DTM_SOURCE,
          paint: { "raster-opacity": dtmOpacity / 100 },
          layout: { visibility: "visible" },
        });

        flyToChaharbagh();
      } else {
        map.setLayoutProperty(DTM_LAYER, "visibility", "visible");
        map.setPaintProperty(DTM_LAYER, "raster-opacity", dtmOpacity / 100);
      }
    } else if (map.getLayer(DTM_LAYER)) {
      map.setLayoutProperty(DTM_LAYER, "visibility", "none");
    }
  }, [map, dtmVisible, dtmOpacity]);

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#293445]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>TOPOGRAPHIC PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <RasterLayerRow
            label="Chaharbagh DSM"
            color="#ff8b24"
            checked={dsmVisible}
            opacity={dsmOpacity}
            onCheckedChange={setDsmVisible}
            onOpacityChange={setDsmOpacity}
          />

          <RasterLayerRow
            label="Chaharbagh DTM"
            color="#42a5f5"
            checked={dtmVisible}
            opacity={dtmOpacity}
            onCheckedChange={setDtmVisible}
            onOpacityChange={setDtmOpacity}
          />
        </div>
      )}
    </div>
  );
}

function RasterLayerRow({
  label,
  color,
  checked,
  opacity,
  onCheckedChange,
  onOpacityChange,
}) {
  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="accent-[#65c96b]"
          />
          <span
            className="h-4 w-4 rounded-sm border-2"
            style={{ borderColor: color }}
          />
          <span>{label}</span>
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
          className="h-[3px] flex-1 rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />
        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}