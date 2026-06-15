import { useState, useEffect } from "react";
import {
  Layers,
  ScanLine,
  Filter,
  MousePointerClick,
  Hourglass,
  Send,
  Ruler,
  Box,
  Map,
  FileInput,
  ChevronRight,
  ChevronDown,
  Search,
  Info,
  Grid3X3,
} from "lucide-react";

const tools = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "droneImagery", label: "Drone Imagery", icon: ScanLine },
  { id: "filter", label: "Filter", icon: Filter },
  { id: "changeDetection", label: "Change Detection", icon: MousePointerClick },
  { id: "timeLapse", label: "Time Lapse", icon: Hourglass },
  { id: "flyTo", label: "Fly To", icon: Send },
  { id: "measurement", label: "Measurement", icon: Ruler },
  { id: "threeD", label: "3D View", icon: Box },
  { id: "basemaps", label: "Basemaps", icon: Map },
  { id: "import", label: "Import", icon: FileInput },
];

export default function MetaverseLeftToolbar({
  activeTool,
  setActiveTool,
  map,
}) {
  return (
    <>
      <div className="absolute left-2 top-3 z-30 flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              onClick={() => setActiveTool(isActive ? null : tool.id)}
              className={`h-9 w-9 rounded-md border flex items-center justify-center shadow-md transition
                ${
                  isActive
                    ? "bg-[#243041] border-[#8bd66f] text-white"
                    : "bg-[#1d2533] border-[#344055] text-white hover:bg-[#293445]"
                }`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </button>
          );
        })}
      </div>

      {activeTool && (
        <div className="absolute left-14 top-3 z-30 w-[270px] max-h-[calc(100vh-90px)] overflow-hidden rounded-md bg-[#202736] border border-[#3a4354] shadow-2xl text-white">
          {activeTool === "layers" && <LayersPanel map={map} />}
          {activeTool !== "layers" && (
            <GenericToolPanel tool={tools.find((t) => t.id === activeTool)} />
          )}
        </div>
      )}
    </>
  );
}

function LayersPanel({ map }) {
  return (
    <div className="text-[12px] font-semibold">
      <LayerSection title="MASTER PLAN" />
      <TopographicPlanSection map={map} />
      <LayerSection title="SERVICES - UTILITIES" />

      <div className="border-b border-[#343c4c]">
        <SectionHeader title="LAND REVENUE RECORD" open />

        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          <div className="flex items-center justify-between border border-[#394354] bg-[#202736] px-2 py-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Chahar Bagh Phase 1</span>
            </label>

            <div className="flex items-center gap-2 text-white/80">
              <Info size={13} />
              <Search size={13} />
              <ChevronDown size={14} />
            </div>
          </div>

          <LayerItem checked color="#ff8b24" label="Mauza Boundary" />
          <LayerItem color="#d7bf32" label="Murabba Boundary" />
          <LayerItem color="#d7bf32" label="Khasra Boundary" />

          <div className="mt-3 flex items-center justify-between border-t border-[#394354] pt-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span>CB Enclave</span>
            </label>

            <div className="flex items-center gap-2 text-white/80">
              <Info size={13} />
              <Search size={13} />
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      <LayerSection title="MISCELLANEOUS" />
      <LayerSection title="NOTIFIED BOUNDARIES" />
    </div>
  );
}

function TopographicPlanSection({ map }) {
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
    const bounds = [
      [74.42562653088396, 31.60509230706726],
      [74.43545280361002, 31.61121654113590]
    ];
    map.fitBounds(bounds, { padding: 50, duration: 1500 });
  };

  // DSM map effect
  useEffect(() => {
    if (!map) return;

    const updateDsm = () => {
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
          // Only fly if it was previously not visible. To keep it simple, fly every time it's toggled on.
        }
      } else {
        if (map.getLayer(DSM_LAYER)) {
          map.setLayoutProperty(DSM_LAYER, "visibility", "none");
        }
      }
    };

    updateDsm();
  }, [map, dsmVisible, dsmOpacity]);

  // DTM map effect
  useEffect(() => {
    if (!map) return;

    const updateDtm = () => {
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
      } else {
        if (map.getLayer(DTM_LAYER)) {
          map.setLayoutProperty(DTM_LAYER, "visibility", "none");
        }
      }
    };

    updateDtm();
  }, [map, dtmVisible, dtmOpacity]);

  return (
    <div className="border-b border-[#343c4c]">
      <div
        className="flex items-center justify-between px-4 py-3 text-white cursor-pointer hover:bg-[#293445]"
        onClick={() => setOpen(!open)}
      >
        <span>TOPOGRAPHIC PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#3b4558] bg-[#232b3a] p-2">
          {/* DSM Row */}
          <div className="mt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dsmVisible}
                  onChange={(e) => setDsmVisible(e.target.checked)}
                  className="accent-[#65c96b]"
                />
                <span className="h-4 w-4 rounded-sm border-2 border-[#ff8b24]" />
                <span>Chaharbagh DSM</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>

            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={dsmOpacity}
                onChange={(e) => setDsmOpacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]"
              />
              <span className="text-[11px] text-white/90 w-7 text-right">
                {dsmOpacity}%
              </span>
            </div>
          </div>

          {/* DTM Row */}
          <div className="mt-4 border-t border-[#394354] pt-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dtmVisible}
                  onChange={(e) => setDtmVisible(e.target.checked)}
                  className="accent-[#65c96b]"
                />
                <span className="h-4 w-4 rounded-sm border-2 border-[#42a5f5]" />
                <span>Chaharbagh DTM</span>
              </label>
              <Grid3X3 size={14} className="text-white/60" />
            </div>

            <div className="mt-2 flex items-center gap-2 pl-6">
              <input
                type="range"
                min="0"
                max="100"
                value={dtmOpacity}
                onChange={(e) => setDtmOpacity(Number(e.target.value))}
                className="h-[3px] flex-1 rounded-full accent-[#65c96b] bg-[#8fd36f]"
              />
              <span className="text-[11px] text-white/90 w-7 text-right">
                {dtmOpacity}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LayerSection({ title }) {
  return (
    <div className="border-b border-[#343c4c]">
      <SectionHeader title={title} />
    </div>
  );
}

function SectionHeader({ title, open = false }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-white">
      <span>{title}</span>
      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
    </div>
  );
}

function LayerItem({ checked = false, color, label }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked={checked} />
          <span
            className="h-4 w-4 rounded-sm border-2"
            style={{ borderColor: color }}
          />
          <span>{label}</span>
        </label>

        <Grid3X3 size={14} className="text-white/60" />
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <div className="h-[3px] flex-1 rounded-full bg-[#8fd36f]" />
        <div className="h-4 w-4 rounded-full border-2 border-white bg-[#65c96b]" />
        <span className="text-[11px] text-white/90">100%</span>
      </div>
    </div>
  );
}

function GenericToolPanel({ tool }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#343c4c] px-4 py-3 text-[12px] font-bold">
        <span>{tool?.label}</span>
        <ChevronRight size={15} />
      </div>

      <div className="p-4 text-sm text-white/75">
        Create your <b>{tool?.label}</b> component and render it here.
      </div>
    </div>
  );
}
