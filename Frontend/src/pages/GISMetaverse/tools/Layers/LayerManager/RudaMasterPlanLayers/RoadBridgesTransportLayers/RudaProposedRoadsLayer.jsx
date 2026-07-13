export const RUDA_PROPOSED_ROAD_LEGEND = [
  { label: "Ravi Ring Road", color: "#b30000", values: ["ravi ring road"] },
  { label: "Primary Road", color: "#ff1a1a", values: ["primary road"] },
  {
    label: "Secondary Road",
    color: "#55aa00",
    values: ["secondary road"],
  },
  { label: "Tertiary Road", color: "#f2b705", values: ["tertiary road"] },
  { label: "Bridge", color: "#ff4fc3", values: ["bridge"] },
  {
    label: "Jahangir Tomb Bridge and Flyover",
    color: "#f4cf78",
    values: ["jahangir tomb bridge and flyover", "jahangir tomb bridge"],
  },
  {
    label: "Proposed SL-4",
    color: "#d9a441",
    values: ["proposed sl-4", "proposed sl4"],
  },
  {
    label: "Promenade Road with Service Road",
    color: "#c02ad3",
    values: [
      "promenade road with service road",
      "promenade road with servi",
      "promenade road",
    ],
  },
];

const RUDA_PROPOSED_ROAD_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "type"],
      ["get", "TYPE"],
      ["get", "Type"],
      ["get", "road_type"],
      ["get", "layer"],
      ["get", "name"],
      ["get", "refname"],
      "other",
    ],
  ],
];

export const DEFAULT_RUDA_PROPOSED_ROAD_COLORS =
  RUDA_PROPOSED_ROAD_LEGEND.reduce((colors, item) => {
    colors[item.label] = item.color;
    return colors;
  }, {});

export const buildRudaProposedRoadColorExpression = (
  roadColors = DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
) => [
  "match",
  RUDA_PROPOSED_ROAD_TYPE_EXPRESSION,
  ...RUDA_PROPOSED_ROAD_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      roadColors[item.label] || item.color,
    ]),
  ),
  "#19598d",
];

export const getRudaProposedRoadLinePaint = (
  roadColors = DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  opacityRatio = 1,
) => ({
  "line-color": buildRudaProposedRoadColorExpression(roadColors),
  "line-width": 3,
  "line-opacity": opacityRatio,
});

export default function RudaProposedRoadsLayer({
  colors = DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  onColorChange,
}) {
  return (
    <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
      <div className="mb-1.5 font-semibold text-white/90">
        Road Classification
      </div>

      <div className="space-y-1.5">
        {RUDA_PROPOSED_ROAD_LEGEND.map((item) => {
          const currentColor = colors[item.label] || item.color;

          return (
            <div key={item.label} className="flex items-center gap-2">
              <label
                className="relative h-4 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/40"
                style={{ backgroundColor: currentColor }}
                title={`Change ${item.label} color`}
              >
                <input
                  type="color"
                  value={currentColor}
                  aria-label={`Change ${item.label} color`}
                  onChange={(event) =>
                    onColorChange?.(item.label, event.target.value)
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>

              <span className="leading-tight">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
