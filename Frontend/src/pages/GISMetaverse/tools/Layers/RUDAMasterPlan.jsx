import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";

const RUDA_MASTER_PLAN_GROUPS = [
  {
    key: "rudaBoundaries",
    label: "RUDA Boundaries",
    children: [
      {
        key: "rudaPlanningBoundary",
        label: "RUDA Planning Boundary",
        color: "#6bb7e8",
      },
      {
        key: "rudaJurisdictionBoundary",
        label: "RUDA Jurisdiction Boundary",
        color: "#f8d56b",
      },
    ],
  },
  {
    key: "proposedRoads",
    label: "Proposed Roads",
    children: [
      {
        key: "rudaProposedRoads",
        label: "RUDA Proposed Roads",
        color: "#19598d",
      },
    ],
  },
  {
    key: "cityLevelServices",
    label: "City Level Services",
    children: [
      {
        key: "cityLevelServicesPoints",
        label: "City Level Services Points",
        color: "#ef4444",
      },
      {
        key: "cityLevelServicesLayer",
        label: "City Level Services",
        color: "#22c55e",
      },
    ],
  },
  {
    key: "forestBoundaries",
    label: "Forest Boundaries",
    children: [
      {
        key: "forestBoundary",
        label: "Forest Boundary",
        color: "#15803d",
      },
      {
        key: "existingForest",
        label: "Existing Forest",
        color: "#84cc16",
      },
    ],
  },
  {
    key: "precinctBoundary",
    label: "Precinct Boundary",
    children: [
      {
        key: "precinctBoundaryLayer",
        label: "Precinct Boundary",
        color: "#a855f7",
      },
    ],
  },
  {
    key: "riverBoundary",
    label: "River Boundary",
    children: [
      {
        key: "riverBoundaryLayer",
        label: "River Boundary",
        color: "#38bdf8",
      },
      {
        key: "riverRavi",
        label: "River Ravi",
        color: "#0ea5e9",
      },
    ],
  },
  {
    key: "mpPrincipalZoning",
    label: "MP Principal Zoning",
    children: [
      {
        key: "mpPrincipalZoningLayer",
        label: "MP Principal Zoning",
        color: "#f97316",
      },
    ],
  },
];

const createInitialLayerState = () => {
  const initialState = {};

  RUDA_MASTER_PLAN_GROUPS.forEach((group) => {
    group.children.forEach((layer) => {
      initialState[layer.key] = {
        checked: false,
        color: layer.color,
        opacity: 100,
        dropdownOpen: false,
      };
    });
  });

  return initialState;
};

const createInitialDropdownState = () =>
  RUDA_MASTER_PLAN_GROUPS.reduce((state, group) => {
    state[group.key] = false;
    return state;
  }, {});

export default function RUDAMasterPlan() {
  const [open, setOpen] = useState(false);
  const [groupDropdowns, setGroupDropdowns] = useState(
    createInitialDropdownState,
  );
  const [layerState, setLayerState] = useState(createInitialLayerState);
  const [activeAttributeLayer, setActiveAttributeLayer] = useState(null);

  const layerLookup = useMemo(() => {
    const lookup = {};

    RUDA_MASTER_PLAN_GROUPS.forEach((group) => {
      group.children.forEach((layer) => {
        lookup[layer.key] = layer;
      });
    });

    return lookup;
  }, []);

  const getGroupSelection = (group) => {
    const selectedCount = group.children.filter(
      (layer) => layerState[layer.key]?.checked,
    ).length;

    return {
      checked: selectedCount === group.children.length,
      partial: selectedCount > 0 && selectedCount < group.children.length,
    };
  };

  const toggleGroup = (group) => {
    setLayerState((prev) => {
      const allSelected = group.children.every(
        (layer) => prev[layer.key]?.checked,
      );
      const nextChecked = !allSelected;

      return group.children.reduce(
        (nextState, layer) => ({
          ...nextState,
          [layer.key]: {
            ...nextState[layer.key],
            checked: nextChecked,
          },
        }),
        { ...prev },
      );
    });
  };

  const toggleGroupDropdown = (groupKey) => {
    setGroupDropdowns((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleLayer = (layerKey) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        checked: !prev[layerKey]?.checked,
      },
    }));
  };

  const updateLayerColor = (layerKey, color) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        color,
      },
    }));
  };

  const updateLayerOpacity = (layerKey, opacity) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        opacity,
      },
    }));
  };

  const toggleLayerDropdown = (layerKey) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        dropdownOpen: !prev[layerKey]?.dropdownOpen,
      },
    }));
  };

  const activeAttributeLabel = activeAttributeLayer
    ? layerLookup[activeAttributeLayer]?.label
    : "";

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>RUDA MASTER PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {RUDA_MASTER_PLAN_GROUPS.map((group) => {
            const groupSelection = getGroupSelection(group);
            const isGroupOpen = groupDropdowns[group.key];

            return (
              <div key={group.key} className="mt-3 first:mt-1">
                <GroupItem
                  checked={groupSelection.checked}
                  partial={groupSelection.partial}
                  label={group.label}
                  dropdownOpen={isGroupOpen}
                  onChange={() => toggleGroup(group)}
                  onDropdownToggle={() => toggleGroupDropdown(group.key)}
                />

                {isGroupOpen && (
                  <div className=" mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-2 pb-2 pt-1">
                    {group.children.map((layer) => {
                      const currentLayerState = layerState[layer.key] || {};

                      return (
                        <div key={layer.key}>
                          <LayerItem
                            checked={!!currentLayerState.checked}
                            color={currentLayerState.color || layer.color}
                            label={layer.label}
                            opacity={currentLayerState.opacity ?? 100}
                            dropdownOpen={!!currentLayerState.dropdownOpen}
                            onChange={() => toggleLayer(layer.key)}
                            onColorChange={(value) =>
                              updateLayerColor(layer.key, value)
                            }
                            onOpacityChange={(value) =>
                              updateLayerOpacity(layer.key, value)
                            }
                            onDropdownToggle={() =>
                              toggleLayerDropdown(layer.key)
                            }
                           
                          />

                          {currentLayerState.dropdownOpen && (
                            <div
                              className={`ml-6 mt-2 max-h-28 rounded-sm border border-[#13593f]/30 bg-[#06291f] px-3 py-2 text-[11px] text-white/70 ${LAYER_PANEL_SCROLL}`}
                            >
                              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                                <span>Status</span>
                                <span>Frontend only</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Data source</span>
                                <span>Not connected yet</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeAttributeLayer && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">
              {activeAttributeLabel} attribute table will be connected later.
            </span>
            <button
              type="button"
              onClick={() => setActiveAttributeLayer(null)}
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#8fd36f] hover:bg-[#0f3d2e]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupItem({
  checked,
  partial,
  label,
  dropdownOpen,
  onChange,
  onDropdownToggle,
}) {
  return (
    <div className="flex items-center justify-between rounded-sm px-1 py-1 hover:bg-[#0f3d2e]/40">
      <label className="flex min-w-0 cursor-pointer items-center gap-2">
        <IndeterminateCheckbox
          checked={checked}
          partial={partial}
          onChange={onChange}
        />
        <span className="truncate text-[11px] text-white/90">{label}</span>
      </label>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDropdownToggle?.();
        }}
        className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
        title={`Show ${label} layers`}
      >
        {dropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
}

function IndeterminateCheckbox({ checked, partial, onChange }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = partial;
    }
  }, [partial]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-[#65c96b]"
    />
  );
}

function LayerItem({
  checked,
  color,
  label,
  opacity,
  dropdownOpen,
  onChange,
  onColorChange,
  onOpacityChange,
  onDropdownToggle,
}) {
  const handleColorEvent = (event) => {
    event.stopPropagation();
  };

  const handleColorChange = (event) => {
    event.stopPropagation();
    onColorChange?.(event.target.value);
  };

  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-[#65c96b]"
          />

          <span
            className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/50"
            style={{ backgroundColor: color, borderColor: color }}
            title={`Change ${label} color`}
            onClick={handleColorEvent}
            onMouseDown={handleColorEvent}
          >
            <input
              type="color"
              value={color}
              aria-label={`Change ${label} color`}
              onClick={handleColorEvent}
              onMouseDown={handleColorEvent}
              onInput={handleColorChange}
              onChange={handleColorChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>

          <span className="truncate text-[11px]">{label}</span>
        </label>

        <div className="flex items-center gap-1">
          

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDropdownToggle?.();
            }}
            className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
            title={`Show ${label} details`}
          >
            {dropdownOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}
