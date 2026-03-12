import { useState } from "react";

export default function LeftPanel() {
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [toolboxExpanded, setToolboxExpanded] = useState(true);
  const [layers, setLayers] = useState({
    rudaBoundary: true,
    districtBoundaries: true,
    tehsilBoundaries: true,
    mouzaBoundaries: true,
    khasraParcels: true,
    landOwnership: false,
    landAcquisition: false,
    roadNetwork: false,
    canalRiver: false,
    satelliteImagery: true,
  });

  const toggleLayer = (layer) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  return (
    <div className="absolute left-5 top-32 w-72 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
      {/* Layer Manager Section */}
      <div className="border-b border-slate-200">
        <button
          onClick={() => setLayersExpanded(!layersExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 font-semibold text-green-700 data-[expanded=false]:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            Layer Manager
          </span>
          <span
            className={`text-xs transition-transform ${!layersExpanded ? "rotate-0" : ""}`}
          >
            ▼
          </span>
        </button>

        {layersExpanded && (
          <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto border-b border-slate-100">
            <LayerCheckbox
              label="RUDA Boundary"
              checked={layers.rudaBoundary}
              onChange={() => toggleLayer("rudaBoundary")}
            />
            <LayerCheckbox
              label="District Boundaries"
              checked={layers.districtBoundaries}
              onChange={() => toggleLayer("districtBoundaries")}
            />
            <LayerCheckbox
              label="Tehsil Boundaries"
              checked={layers.tehsilBoundaries}
              onChange={() => toggleLayer("tehsilBoundaries")}
            />
            <LayerCheckbox
              label="Mouza Boundaries"
              checked={layers.mouzaBoundaries}
              onChange={() => toggleLayer("mouzaBoundaries")}
            />
            <LayerCheckbox
              label="Khasra Parcels"
              checked={layers.khasraParcels}
              onChange={() => toggleLayer("khasraParcels")}
              highlight
            />
            <LayerCheckbox
              label="Land Ownership"
              checked={layers.landOwnership}
              onChange={() => toggleLayer("landOwnership")}
            />
            <LayerCheckbox
              label="Land Acquisition"
              checked={layers.landAcquisition}
              onChange={() => toggleLayer("landAcquisition")}
            />
            <LayerCheckbox
              label="Road Network"
              checked={layers.roadNetwork}
              onChange={() => toggleLayer("roadNetwork")}
            />
            <LayerCheckbox
              label="Canal / River"
              checked={layers.canalRiver}
              onChange={() => toggleLayer("canalRiver")}
            />
            <LayerCheckbox
              label="Satellite Imagery"
              checked={layers.satelliteImagery}
              onChange={() => toggleLayer("satelliteImagery")}
            />
          </div>
        )}
      </div>

      {/* Toolbox Section */}
      <div className="border-b border-slate-200">
        <button
          onClick={() => setToolboxExpanded(!toolboxExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 font-semibold text-green-700"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">🔧</span>
            Toolbox
          </span>
          <span
            className={`text-xs transition-transform ${!toolboxExpanded ? "rotate-0" : ""}`}
          >
            ▼
          </span>
        </button>

        {toolboxExpanded && (
          <div className="px-3 py-3 grid grid-cols-3 gap-2 border-b border-slate-100">
            <ToolboxButton icon="📍" label="Ownership" />
            <ToolboxButton icon="🔒" label="Parcel" />
            <ToolboxButton icon="📦" label="Mouza" />
            <ToolboxButton icon="🛰️" label="Satellite" />
            <ToolboxButton icon="📐" label="Demarcation" />
            <ToolboxButton icon="👤" label="Demyaki" />
          </div>
        )}
      </div>

      {/* Satellite Imagery Preview */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="bg-gradient-to-br from-slate-300 to-slate-400 rounded h-24 flex items-center justify-center text-xs text-slate-600 font-medium">
          Satellite preview
        </div>
      </div>

      {/* Favorites */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">
          ⏱️ Favorites
        </span>
        <button className="text-xl text-slate-600 hover:text-slate-900">
          +
        </button>
      </div>

      {/* Favorites List - Scrollable */}
      <div className="px-4 pb-3 flex-1 overflow-y-auto">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded border border-slate-200 font-medium">
          <span className="text-lg">⏱️</span>
          <span>M Favorites</span>
        </button>
      </div>
    </div>
  );
}

function LayerCheckbox({ label, checked, onChange, highlight = false }) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer p-2 rounded transition-colors ${
        highlight ? "bg-yellow-100 hover:bg-yellow-150" : "hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 cursor-pointer accent-green-600"
      />
      <span className="text-sm content-start text-slate-700 font-medium">
        {label}
      </span>
    </label>
  );
}

function ToolboxButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 p-3 rounded border border-slate-200 hover:bg-green-50 hover:border-green-400 transition-colors">
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] text-slate-700 text-center font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}
