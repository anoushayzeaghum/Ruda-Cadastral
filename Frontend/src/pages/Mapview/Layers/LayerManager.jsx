import { useState } from "react";
import { ChevronDown, Table2 } from "lucide-react";

const ADMINISTRATIVE_LAYERS = [
  { key: "districtBoundary", label: "District Boundary" },
  { key: "tehsilBoundary", label: "Tehsil Boundary" },
  { key: "mauzaBoundary", label: "Mauza Boundary" },
  { key: "khasraLayer", label: "Khasra Boundary" },
  { key: "squareLayer", label: "Square Boundary" },
  { key: "acreLayer", label: "Acre Boundary" },
];

const BASE_DATA_LAYERS = [
  { key: "triJunctionPoints", label: "Tri Junction Points" },
  { key: "fieldPoints", label: "Field Points" },
];

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

const hashString = (value = "") => {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
};

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

export default function LayerManager({
  isMobile,
  rudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  rudaProposedRoads,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  getAllProposedRoadIds,
  getLayerVisible,
  getLayerOpacity,
  toggleLayer,
  toggleVectorBoundaryLayer,
  toggleRudaBoundaryLayer,
  toggleProposedRoadLayer,
  updateLayer,
  getLayerColor,
  setLayerColor,
  dropdownOpenByKey,
  toggleDropdownForKey,
  openAttributeTable,
  layerRecordCache,
  loadLayerRecords,
  loadedParcelsGeojson,
  boundaryStatus,
  setBoundaryStatus,
}) {
  const [administrativeOpen, setAdministrativeOpen] = useState(true);
  const [rudaOpen, setRudaOpen] = useState(true);
  const [baseDataOpen, setBaseDataOpen] = useState(true);
  const [rudaDropdownOpen, setRudaDropdownOpen] = useState(false);
  const [proposedDropdownOpen, setProposedDropdownOpen] = useState(false);
  const [geodeticDropdownOpen, setGeodeticDropdownOpen] = useState(false);

  const getGeojsonForKey = (key) => {
    if (["mauzaBoundary", "khasraLayer", "squareLayer"].includes(key)) {
      return layerRecordCache?.[`${boundaryStatus}_${key}`]?.geojson || null;
    }

    return (
      layerRecordCache?.[key]?.geojson ||
      (["squareLayer", "acreLayer"].includes(key) ? loadedParcelsGeojson : null)
    );
  };

  const renderStandardLayer = (item, index, items, vectorLayer = false) => (
    <div key={item.key}>
      <AdminLayerRow
        label={item.label}
        checked={getLayerVisible(item.key)}
        opacity={getLayerOpacity(item.key)}
        color={getLayerColor(item.key)}
        isOpen={!!dropdownOpenByKey?.[item.key]}
        isLast={index === items.length - 1}
        onToggle={() =>
          vectorLayer
            ? toggleVectorBoundaryLayer(item.key)
            : toggleLayer(item.key)
        }
        onOpacity={(value) => updateLayer(item.key, { opacity: value })}
        onColor={(value) => setLayerColor(item.key, value)}
        onDropdownToggle={() => {
          toggleDropdownForKey(item.key);
          loadLayerRecords(item.key, boundaryStatus);
        }}
        onTable={() => {
          loadLayerRecords(item.key, boundaryStatus);
          openAttributeTable(item.key);
        }}
      />
      {dropdownOpenByKey?.[item.key] && (
        <LayerDropdownPanel geojson={getGeojsonForKey(item.key)} />
      )}
    </div>
  );

  return (
    <div
      className="overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={
        isMobile
          ? { maxHeight: "calc(70vh - 100px)" }
          : { maxHeight: "calc(100vh - 185px)" }
      }
    >
      <LayerSection
        title="Administrative Boundaries"
        open={administrativeOpen}
        setOpen={setAdministrativeOpen}
      >
        {/* Verified / Unverified buttons */}
        <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-3">
          {/* <div className="rounded-md border border-[#13593f] bg-[#06291f] p-2"> */}
          {/* <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Boundary Status
            </div> */}

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setBoundaryStatus("verified")}
              className={`h-7 w-24 px-2 py-0 text-[11px] font-semibold rounded-md transition
                  ${
                    boundaryStatus === "verified"
                      ? "bg-green-600 text-white"
                      : "border border-[#13593f] bg-[#031a14] text-white/70 hover:bg-[#0a3327]"
                  }`}
            >
              Verified
            </button>

            <button
              type="button"
              onClick={() => setBoundaryStatus("unverified")}
              className={`h-7 w-24 px-2 py-0 text-[11px] font-semibold rounded-md transition
                  ${
                    boundaryStatus === "unverified"
                      ? "bg-red-600 text-white"
                      : "border border-[#13593f] bg-[#031a14] text-white/70 hover:bg-[#0a3327]"
                  }`}
            >
              Unverified
            </button>
          </div>
          {/* </div> */}
        </div>

        {/* Existing Layers */}
        {ADMINISTRATIVE_LAYERS.map((item, index) =>
          renderStandardLayer(item, index, ADMINISTRATIVE_LAYERS, true),
        )}
      </LayerSection>

      <LayerSection
        title="RUDA Boundaries"
        open={rudaOpen}
        setOpen={setRudaOpen}
      >
        <AdminLayerRow
          label="RUDA Boundary"
          checked={getLayerVisible("rudaBoundary")}
          opacity={getLayerOpacity("rudaBoundary")}
          color={getLayerColor("rudaBoundary")}
          isOpen={rudaDropdownOpen}
          onToggle={toggleRudaBoundaryLayer}
          onOpacity={(value) => updateLayer("rudaBoundary", { opacity: value })}
          onDropdownToggle={() => setRudaDropdownOpen((value) => !value)}
          onTable={() => openAttributeTable("rudaBoundary")}
        />

        {rudaDropdownOpen && (
          <RudaPhaseDropdown
            phases={rudaPhases}
            selectedIds={selectedRudaPhaseIds}
            setSelectedIds={setSelectedRudaPhaseIds}
          />
        )}

        <AdminLayerRow
          label="Proposed Roads"
          checked={getLayerVisible("proposedRoads")}
          opacity={getLayerOpacity("proposedRoads")}
          color={getLayerColor("proposedRoads")}
          isOpen={proposedDropdownOpen}
          onToggle={toggleProposedRoadLayer}
          onOpacity={(value) =>
            updateLayer("proposedRoads", { opacity: value })
          }
          onDropdownToggle={() => setProposedDropdownOpen((value) => !value)}
          onTable={() => openAttributeTable("proposedRoads")}
        />

        {proposedDropdownOpen && (
          <ProposedRoadDropdown
            roads={rudaProposedRoads}
            selectedIds={selectedProposedRoadIds}
            setSelectedIds={setSelectedProposedRoadIds}
            getAllIds={getAllProposedRoadIds}
          />
        )}

        <AdminLayerRow
          label="Geodetic Network"
          checked={getLayerVisible("geodeticNetwork")}
          opacity={getLayerOpacity("geodeticNetwork")}
          color={getLayerColor("geodeticNetwork")}
          isOpen={geodeticDropdownOpen}
          isLast
          onToggle={() => toggleLayer("geodeticNetwork")}
          onOpacity={(value) =>
            updateLayer("geodeticNetwork", { opacity: value })
          }
          onColor={(value) => setLayerColor("geodeticNetwork", value)}
          onDropdownToggle={() => setGeodeticDropdownOpen((value) => !value)}
          onTable={() => openAttributeTable("geodeticNetwork")}
        />

        {geodeticDropdownOpen && (
          <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2 text-[12px] text-white/80">
            Open the attribute table to view all geodetic points.
          </div>
        )}
      </LayerSection>

      <LayerSection
        title="Base Data"
        open={baseDataOpen}
        setOpen={setBaseDataOpen}
      >
        {BASE_DATA_LAYERS.map((item, index) =>
          renderStandardLayer(item, index, BASE_DATA_LAYERS, false),
        )}
      </LayerSection>
    </div>
  );
}

function LayerSection({ title, open, setOpen, children }) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-[#13593f] bg-[#031a14] shadow-md">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-[#0c3d2d] bg-[#06291f] px-3 py-2.5 text-left transition hover:bg-[#0a3327]"
      >
        <h4 className="text-[12px] font-semibold leading-tight text-white">
          {title}
        </h4>
        <ChevronDown
          size={16}
          strokeWidth={2.6}
          className={`text-white/70 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="overflow-hidden rounded-md border border-[#0c3d2d] bg-[#06291f] shadow-sm">
          {children}
        </div>
      )}
    </div>
  );
}

function AdminLayerRow({
  label,
  checked,
  opacity,
  color,
  isOpen,
  isLast,
  onToggle,
  onOpacity,
  onColor,
  onDropdownToggle,
  onTable,
}) {
  return (
    <div
      className={`bg-[#06291f] px-2.5 py-2 ${isLast ? "" : "border-b border-[#0c3d2d]"}`}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggle}
          className="h-3.5 w-3.5 shrink-0 accent-[#9be37b]"
        />
        {onColor && <SmallColorPicker color={color} onChange={onColor} />}
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1.5 text-white/75">
          {onTable && (
            <button
              type="button"
              title="Attribute table"
              aria-label="Attribute table"
              onClick={onTable}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#0a3327]"
            >
              <Table2 size={14} strokeWidth={2.4} />
            </button>
          )}
          {onDropdownToggle && (
            <button
              type="button"
              title="Layer details"
              aria-label="Layer details"
              onClick={onDropdownToggle}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#0a3327]"
            >
              <ChevronDown
                size={16}
                fill="currentColor"
                strokeWidth={2.6}
                className={`transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(event) => onOpacity(Number(event.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-[#9be37b]"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-medium text-white/60">
          {opacity}%
        </span>
      </div>
    </div>
  );
}

function SmallColorPicker({ color, onChange }) {
  return (
    <label
      title="Change layer color"
      className="relative flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/30 hover:ring-1 hover:ring-[#9be37b]"
      style={{ backgroundColor: color || "#9be37b" }}
    >
      <input
        type="color"
        value={color || "#9be37b"}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function LayerDropdownPanel({ geojson }) {
  const features = geojson?.features || [];
  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-44 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {!geojson ? (
          <p className="px-1 py-1 text-[11px] text-white/50">
            Loading records...
          </p>
        ) : features.length === 0 ? (
          <p className="px-1 py-1 text-[11px] text-white/50">
            No records found
          </p>
        ) : (
          <>
            <div className="border-b border-[#0c3d2d] pb-1.5 text-[12px] font-semibold text-white">
              Total: {features.length}
            </div>
            {features.slice(0, 100).map((feature, index) => (
              <div
                key={feature?.properties?.gid || feature?.id || index}
                className="truncate border-b border-[#0c3d2d]/70 py-1.5 text-[12px] font-medium text-white/85 last:border-b-0"
              >
                {featureLabel(feature, "Record")}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function featureLabel(feature = {}, fallback = "Feature") {
  const props = feature.properties || feature || {};
  return (
    props.name ||
    props.Name ||
    props.mauza ||
    props.Mauza ||
    props.join_shp ||
    props.kh ||
    props.sq ||
    props.acre ||
    props.type ||
    `${fallback} ${props.gid || feature.id || ""}`
  );
}

function RudaPhaseDropdown({ phases, selectedIds, setSelectedIds }) {
  const allIds = (phases || [])
    .map((phase) => phase.gid ?? phase.id ?? phase.oid)
    .filter((id) => id !== undefined && id !== null);
  const selectedSet = new Set((selectedIds || []).map(String));
  const allChecked =
    allIds.length > 0 && allIds.every((id) => selectedSet.has(String(id)));

  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-44 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {(phases || []).length === 0 ? (
          <p className="px-1 py-1 text-[11px] font-medium text-white/50">
            No phases found
          </p>
        ) : (
          <>
            <SelectAllRow
              checked={allChecked}
              onChange={(checked) => setSelectedIds(checked ? allIds : [])}
              onReset={() => setSelectedIds([])}
            />
            {(phases || []).map((phase) => {
              const id = phase.gid ?? phase.id ?? phase.oid;
              const checked = selectedSet.has(String(id));
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 border-b border-[#0c3d2d]/70 py-1.5 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedIds((previous) =>
                        checked
                          ? (previous || []).filter(
                              (value) => String(value) !== String(id),
                            )
                          : [...(previous || []), id],
                      )
                    }
                    className="h-3.5 w-3.5 shrink-0 accent-[#9be37b]"
                  />
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/50"
                    style={{ backgroundColor: getRudaPhaseColor(id) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
                    {phase.name ?? phase.folderpath ?? `Phase ${id}`}
                  </span>
                </label>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function ProposedRoadDropdown({
  roads,
  selectedIds,
  setSelectedIds,
  getAllIds,
}) {
  const selectedSet = new Set((selectedIds || []).map(String));
  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-44 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2 py-1.5 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {(roads || []).length === 0 ? (
          <p className="px-1 py-1 text-[11px] text-white/50">
            No proposed roads found
          </p>
        ) : (
          <>
            <SelectAllRow
              checked={(selectedIds || []).length === roads.length}
              onChange={(checked) => setSelectedIds(checked ? getAllIds() : [])}
              onReset={() => setSelectedIds([])}
            />
            {(roads || []).map((road) => {
              const id = road.gid ?? road.id ?? road.oid;
              const checked = selectedSet.has(String(id));
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 border-b border-[#0c3d2d]/70 py-1.5 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedIds((previous) =>
                        checked
                          ? (previous || []).filter(
                              (value) => String(value) !== String(id),
                            )
                          : [...(previous || []), id],
                      )
                    }
                    className="h-3.5 w-3.5 accent-[#9be37b]"
                  />
                  <span className="truncate text-[12px] font-medium leading-tight text-white/85">
                    {road.name ?? road.layer ?? `Road ${id}`}
                  </span>
                </label>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function SelectAllRow({ checked, onChange, onReset }) {
  return (
    <div className="mb-1 flex items-center justify-between border-b border-[#0c3d2d] pb-1.5">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-3.5 w-3.5 accent-[#9be37b]"
        />
        <span className="text-[12px] font-semibold leading-tight text-white">
          Select All
        </span>
      </label>
      <button
        type="button"
        onClick={onReset}
        className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#9be37b] hover:bg-[#0a3327]"
      >
        Reset
      </button>
    </div>
  );
}
