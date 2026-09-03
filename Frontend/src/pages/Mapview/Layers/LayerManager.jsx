import { useState } from "react";
import { ChevronDown, Table2 } from "lucide-react";
import {
  DEFAULT_POSSESSION_LAND_TYPES,
  POSSESSION_LAND_TYPES,
  normalizePossessionLandTypes,
} from "../LayerManager/PossessionLandLayer.js";
import {
  PolygonLegend,
  LineLegend,
  PointLegend,
  LegendSection,
  LayerLegend,
  roadLegendItems,
  getRudaPhaseColor,
  getRudaPhaseLabel,
} from "../Legend.jsx";

const ADMINISTRATIVE_LAYERS = [
  { key: "districtBoundary", label: "District Boundary" },
  { key: "tehsilBoundary", label: "Tehsil Boundary" },
  { key: "mauzaBoundary", label: "Mauza Boundary" },
  { key: "khasraLayer", label: "Khasra Boundary" },
  { key: "possessionLand", label: "Possession Land" },
  { key: "awardedLand", label: "Awarded Land" },
  { key: "stateLand", label: "State Land" },
  { key: "squareLayer", label: "Square Boundary" },
  { key: "acreLayer", label: "Acre Boundary" },
];

const KHASRA_CHILD_LAYERS = [];

const BASE_DATA_LAYERS = [
  { key: "triJunctionPoints", label: "Tri Junction Points" },
  { key: "fieldPoints", label: "Field Points" },
];

export default function LayerManager({
  isMobile,
  rudaPhases,
  selectedRudaPhaseIds,
  setSelectedRudaPhaseIds,
  proposedRoads,
  selectedProposedRoadIds,
  setSelectedProposedRoadIds,
  getAllProposedRoadIds,
  getLayerVisible,
  getLayerOpacity,
  getLayerSelectedTypes = () => DEFAULT_POSSESSION_LAND_TYPES,
  setLayerSelectedTypes = () => {},
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
  const isBoundaryStatusActive = (status) =>
    boundaryStatus === status || boundaryStatus === "both";

  const toggleBoundaryStatus = (status) => {
    setBoundaryStatus((current) => {
      if (current === "both") {
        return status === "verified" ? "unverified" : "verified";
      }
      if (current === status) return current;
      return "both";
    });
  };

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

  const renderStandardLayer = (item, index, items, vectorLayer = false) => {
    const isPossessionLayer = item.key === "possessionLand";

    return (
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

            // Possession Land uses its subtype selector and already-loaded
            // map data, so opening this dropdown must not call an API.
            if (!isPossessionLayer) {
              loadLayerRecords(item.key, boundaryStatus);
            }
          }}
          onTable={() => {
            loadLayerRecords(item.key, boundaryStatus);
            openAttributeTable(item.key);
          }}
        />

        {dropdownOpenByKey?.[item.key] &&
          (isPossessionLayer ? (
            <PossessionLandTypeDropdown
              selectedTypes={getLayerSelectedTypes(item.key)}
              setSelectedTypes={(selectedTypes) =>
                setLayerSelectedTypes(item.key, selectedTypes)
              }
            />
          ) : (
            <LayerDropdownPanel
              layerKey={item.key}
              geojson={getGeojsonForKey(item.key)}
              getLayerColor={getLayerColor}
              boundaryStatus={boundaryStatus}
            />
          ))}
      </div>
    );
  };

  return (
    <div
      className="overflow-y-auto px-3 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={
        isMobile
          ? { maxHeight: "calc(70vh - 100px)" }
          : { maxHeight: "calc(100vh - 185px)" }
      }
    >
      {/* Cadastral data status selector — intentionally outside the
          Administrative Boundaries dropdown so the user understands that
          this selection controls which cadastral dataset is used throughout
          the subheader and status-sensitive layers. */}
      <div className="mt-3 rounded-md border border-[#13593f] bg-[#031a14] p-3 shadow-md">
        <div className="mb-2.5">
          <p className="mt-1 text-[10px] leading-4 text-white/80">
            * Select the Data Status to use for cadastral filters and layers in
            the map.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-[#06291f] p-1.5">
          <button
            type="button"
            onClick={() => toggleBoundaryStatus("verified")}
            aria-pressed={isBoundaryStatusActive("verified")}
            className={`flex h-8 items-center justify-center rounded-md border px-2 text-[11px] font-semibold transition ${
              isBoundaryStatusActive("verified")
                ? "border-green-400 bg-green-600 text-white shadow-sm"
                : "border-[#13593f] bg-[#031a14] text-white/65 hover:bg-[#0a3327] hover:text-white"
            }`}
          >
            Verified
          </button>

          <button
            type="button"
            onClick={() => toggleBoundaryStatus("unverified")}
            aria-pressed={isBoundaryStatusActive("unverified")}
            className={`flex h-8 items-center justify-center rounded-md border px-2 text-[11px] font-semibold transition ${
              isBoundaryStatusActive("unverified")
                ? "border-red-400 bg-red-600 text-white shadow-sm"
                : "border-[#13593f] bg-[#031a14] text-white/65 hover:bg-[#0a3327] hover:text-white"
            }`}
          >
            Unverified
          </button>
        </div>
      </div>

      <LayerSection
        title="Administrative Boundaries"
        open={administrativeOpen}
        setOpen={setAdministrativeOpen}
      >
        {/* Existing Layers */}
        {ADMINISTRATIVE_LAYERS.map((item, index) => (
          <div key={item.key}>
            {renderStandardLayer(item, index, ADMINISTRATIVE_LAYERS, true)}
            {item.key === "khasraLayer" && dropdownOpenByKey?.khasraLayer && (
              <div className="border-b border-[#0c3d2d] bg-[#031a14]">
                {KHASRA_CHILD_LAYERS.map((child, childIndex) => (
                  <AdminLayerRow
                    key={child.key}
                    child
                    label={child.label}
                    checked={getLayerVisible(child.key)}
                    opacity={getLayerOpacity(child.key)}
                    color={getLayerColor(child.key)}
                    isLast={childIndex === KHASRA_CHILD_LAYERS.length - 1}
                    onToggle={() => toggleLayer(child.key)}
                    onOpacity={(value) =>
                      updateLayer(child.key, { opacity: value })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}
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
            roads={proposedRoads}
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
          <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
            <div className="rounded-md border border-[#0c3d2d] bg-[#06291f] px-2.5 py-2 shadow-sm">
              <LegendSection title="Legend">
                <PointLegend
                  color={getLayerColor("geodeticNetwork")}
                  label="Geodetic Network Point"
                />
              </LegendSection>
              <div className="my-2 border-t border-[#0c3d2d]" />
              <div className="text-[12px] text-white/80">
                Open the attribute table to view all geodetic points.
              </div>
            </div>
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
  child = false,
}) {
  return (
    <div
      className={`bg-[#06291f] py-2 ${child ? "pl-8 pr-2.5" : "px-2.5"} ${isLast ? "" : "border-b border-[#0c3d2d]"}`}
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

function PossessionLandTypeDropdown({ selectedTypes, setSelectedTypes }) {
  const normalizedSelectedTypes = normalizePossessionLandTypes(selectedTypes);
  const selectedSet = new Set(normalizedSelectedTypes);

  const toggleType = (typeValue) => {
    const nextTypes = selectedSet.has(typeValue)
      ? normalizedSelectedTypes.filter((value) => value !== typeValue)
      : [...normalizedSelectedTypes, typeValue];

    setSelectedTypes(nextTypes);
  };

  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-60 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2.5 py-2 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Legend Section */}
        <LegendSection title="Legend">
          {POSSESSION_LAND_TYPES.map((item) => (
            <PolygonLegend
              key={`legend-possession-${item.value}`}
              label={item.label}
              fillColor={item.fillColor}
              lineColor={item.lineColor}
            />
          ))}
        </LegendSection>

        {/* Divider */}
        <div className="my-2 border-t border-[#0c3d2d]" />

        {/* Checkboxes */}
        {POSSESSION_LAND_TYPES.map((item) => (
          <label
            key={item.value}
            className="flex cursor-pointer items-center gap-2 border-b border-[#0c3d2d]/70 py-2 last:border-b-0"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(item.value)}
              onChange={() => toggleType(item.value)}
              className="h-3.5 w-3.5 shrink-0 accent-[#9be37b]"
            />
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-white/85">
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function LayerDropdownPanel({
  layerKey,
  geojson,
  getLayerColor,
  boundaryStatus,
}) {
  const features = geojson?.features || [];
  const color = getLayerColor ? getLayerColor(layerKey) : "#9be37b";

  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-60 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2.5 py-2 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Layer Legend Renderer */}
        <LayerLegend
          layerKey={layerKey}
          color={color}
          boundaryStatus={boundaryStatus}
        />

        {/* Divider */}
        <div className="my-2 border-t border-[#0c3d2d]" />

        {/* Records */}
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
      <div className="max-h-60 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2.5 py-2 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {(phases || []).length === 0 ? (
          <p className="px-1 py-1 text-[11px] font-medium text-white/50">
            No phases found
          </p>
        ) : (
          <>
            {/* Legend Section */}
            <LegendSection title="Legend">
              {(phases || []).map((phase) => {
                const id = phase.gid ?? phase.id ?? phase.oid;
                return (
                  <PolygonLegend
                    key={`legend-ruda-${id}`}
                    label={getRudaPhaseLabel(phase)}
                    fillColor={getRudaPhaseColor(id)}
                    lineColor={getRudaPhaseColor(id)}
                  />
                );
              })}
            </LegendSection>

            {/* Divider */}
            <div className="my-2 border-t border-[#0c3d2d]" />

            {/* Select All */}
            <SelectAllRow
              checked={allChecked}
              onChange={(checked) => setSelectedIds(checked ? allIds : [])}
              onReset={() => setSelectedIds([])}
            />

            {/* Checkboxes */}
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
                    {getRudaPhaseLabel(phase)}
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
  const allIds = (getAllIds?.() || []).filter(
    (id) => id !== undefined && id !== null,
  );
  const selectedSet = new Set((selectedIds || []).map(String));
  const allChecked =
    allIds.length > 0 && allIds.every((id) => selectedSet.has(String(id)));

  return (
    <div className="border-b border-[#0c3d2d] bg-[#031a14] px-3 py-2">
      <div className="max-h-60 overflow-y-auto rounded-md border border-[#0c3d2d] bg-[#06291f] px-2.5 py-2 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {(roads || []).length === 0 ? (
          <p className="px-1 py-1 text-[11px] text-white/50">
            No proposed roads found
          </p>
        ) : (
          <>
            {/* Legend Section */}
            <LegendSection title="Legend">
              {roadLegendItems.map((item) => (
                <LineLegend
                  key={item.label}
                  label={item.label}
                  color={item.color}
                  width={item.width}
                />
              ))}
            </LegendSection>

            {/* Divider */}
            <div className="my-2 border-t border-[#0c3d2d]" />

            {/* Select All */}
            <SelectAllRow
              checked={allChecked}
              onChange={(checked) => setSelectedIds(checked ? allIds : [])}
              onReset={() => setSelectedIds([])}
            />

            {/* Checkboxes */}
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
                    {road.road_type ??
                      road.type ??
                      road.name ??
                      road.layer ??
                      `Road ${id}`}
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
