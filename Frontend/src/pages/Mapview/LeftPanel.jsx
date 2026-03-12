import { useState } from "react";
import {
  Layers,
  ChevronDown,
  Wrench,
  MapPin,
  Lock,
  Package,
  Satellite,
  Ruler,
  User,
  Star,
  Plus,
} from "lucide-react";

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
    <div className="h-full w-full bg-white border-r border-slate-200 flex flex-col">

      {/* Layer Manager */}
      <div className="border-b border-slate-200">
        <button
          onClick={() => setLayersExpanded(!layersExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between font-semibold text-slate-800 hover:bg-slate-50"
        >
          <span className="flex items-center gap-2 text-sm">
            <Layers size={18} />
            Layer Manager
          </span>

          <ChevronDown
            size={16}
            className={`transition-transform ${
              layersExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {layersExpanded && (
          <div className="px-3 pb-3 space-y-1 max-h-72 overflow-y-auto">
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

      {/* Toolbox */}
      <div className="border-b border-slate-200">
        <button
          onClick={() => setToolboxExpanded(!toolboxExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between font-semibold text-slate-800 hover:bg-slate-50"
        >
          <span className="flex items-center gap-2 text-sm">
            <Wrench size={18} />
            Toolbox
          </span>

          <ChevronDown
            size={16}
            className={`transition-transform ${
              toolboxExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {toolboxExpanded && (
          <div className="grid grid-cols-3 gap-2 px-3 pb-3">
            <ToolboxButton icon={<MapPin size={18} />} label="Connect" />
            <ToolboxButton icon={<Lock size={18} />} label="Parcel" />
            <ToolboxButton icon={<Package size={18} />} label="Mouza" />

            <ToolboxButton icon={<Satellite size={18} />} label="Satellite" />
            <ToolboxButton icon={<Ruler size={18} />} label="Demarcate" />
            <ToolboxButton icon={<User size={18} />} label="Default" />
          </div>
        )}
      </div>

      {/* Satellite Preview */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="bg-slate-200 rounded-lg h-24 flex items-center justify-center text-xs text-slate-600 font-medium">
          Satellite Preview
        </div>
      </div>

      {/* Favorites */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Star size={16} />
          Favorites
        </span>

        <button className="text-slate-500 hover:text-slate-800">
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded border border-slate-200 font-medium">
          <Star size={16} />
          M Favorites
        </button>
      </div>
    </div>
  );
}

/* Layer Checkbox */
function LayerCheckbox({ label, checked, onChange, highlight = false }) {
  return (
    <label
      className={`flex items-center justify-between cursor-pointer px-2 py-2 rounded-md text-sm ${
        highlight ? "bg-yellow-100 hover:bg-yellow-200" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="accent-green-600 w-4 h-4"
        />

        <span className="text-slate-700">{label}</span>
      </div>

      {checked && <span className="text-green-600 text-sm">✓</span>}
    </label>
  );
}

/* Toolbox Button */
function ToolboxButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-slate-200 rounded-md hover:bg-green-50 hover:border-green-400 transition-colors">
      {icon}

      <span className="text-[10px] text-slate-700 text-center font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}