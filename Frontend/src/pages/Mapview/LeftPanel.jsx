import { useState, useEffect } from "react";
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

export default function LeftPanel({
  layers,
  setLayers,
  rudaPhases,
  setRudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  basemap,
  setBasemap,
}) {
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [toolboxExpanded, setToolboxExpanded] = useState(true);
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);

  const toggleLayer = (layer) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  // fetch RUDA phases when component mounts if not provided
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (rudaPhases?.length) return;
      try {
        const { getRudaList } = await import("../../services/api");
        const list = await getRudaList();
        if (!mounted) return;
        setRudaPhases(list || []);
        // default select all phases
        const ids = (list || []).map((p) => p.gid ?? p.id ?? p.oid);
        setSelectedRudaPhaseIds(ids);
      } catch (e) {
        console.error("Failed to load RUDA phases", e);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [rudaPhases, setRudaPhases, setSelectedRudaPhaseIds]);

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
            <div>
              <label className="flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={layers.rudaBoundary}
                  onChange={() => toggleLayer("rudaBoundary")}
                  className="accent-green-600 w-4 h-4"
                />
                <span className="text-slate-700">RUDA Boundary</span>
                <button
                  onClick={() => setRudaDropdownOpen((s) => !s)}
                  className="ml-2 text-xs text-slate-500 px-2 py-1 rounded border"
                >
                  Phases
                </button>
              </label>

              {rudaDropdownOpen && (
                <div className="mt-2 ml-4 bg-white border rounded p-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(rudaPhases) &&
                        selectedRudaPhaseIds?.length === rudaPhases.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const ids = rudaPhases.map(
                            (p) => p.gid ?? p.id ?? p.oid,
                          );
                          setSelectedRudaPhaseIds(ids);
                        } else {
                          setSelectedRudaPhaseIds([]);
                        }
                      }}
                    />
                    <strong className="text-sm">Select All</strong>
                  </label>

                  {(rudaPhases || []).map((phase) => {
                    const id = phase.gid ?? phase.id ?? phase.oid;
                    const name =
                      phase.name ?? phase.folderpath ?? `Phase ${id}`;
                    const checked = selectedRudaPhaseIds?.includes(id);
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={!!checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedRudaPhaseIds((prev) =>
                                prev.filter((x) => x !== id),
                              );
                            } else {
                              setSelectedRudaPhaseIds((prev) => [
                                ...(prev || []),
                                id,
                              ]);
                            }
                          }}
                        />
                        <span className="text-slate-700">{name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <LayerCheckbox
              label="Division Boundaries"
              checked={layers.divisionBoundaries}
              onChange={() => toggleLayer("divisionBoundaries")}
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
        <div
          className={`rounded-lg h-24 overflow-hidden border ${
            basemap === "Satellite"
              ? "ring-2 ring-green-500"
              : "border-slate-200"
          }`}
        >
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/74.3587,31.5204,8/300x150?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
            alt="Satellite preview"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setBasemap && setBasemap("Satellite")}
          />
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
          <Star size={16} />M Favorites
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
