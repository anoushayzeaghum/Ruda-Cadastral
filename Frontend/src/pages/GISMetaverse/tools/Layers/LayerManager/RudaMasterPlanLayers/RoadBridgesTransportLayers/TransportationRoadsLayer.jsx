export const TRANSPORTATION_ROADS_LEGEND = [
  {
    label: "Motorway",
    color: "#f4b400",
    values: ["motorway", "motor way"],
  },
  {
    label: "National Highway",
    color: "#e31a1c",
    values: ["national highway", "national hwy"],
  },
  {
    label: "Primary Road",
    color: "#111111",
    values: ["primary road", "primary"],
  },
  {
    label: "Secondary Road",
    color: "#d1d5db",
    values: ["secondary road", "secondary"],
  },
];

const TRANSPORTATION_ROAD_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "type"],
      ["get", "TYPE"],
      ["get", "Type"],
      "other",
    ],
  ],
];

export const DEFAULT_TRANSPORTATION_ROAD_COLORS =
  TRANSPORTATION_ROADS_LEGEND.reduce((colors, item) => {
    colors[item.label] = item.color;
    return colors;
  }, {});

const buildMatchExpression = (valueByLabel, fallback) => [
  "match",
  TRANSPORTATION_ROAD_TYPE_EXPRESSION,
  ...TRANSPORTATION_ROADS_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [value, valueByLabel[item.label]]),
  ),
  fallback,
];

export const buildTransportationRoadColorExpression = (
  roadColors = DEFAULT_TRANSPORTATION_ROAD_COLORS,
) =>
  buildMatchExpression(
    TRANSPORTATION_ROADS_LEGEND.reduce((colors, item) => {
      colors[item.label] = roadColors[item.label] || item.color;
      return colors;
    }, {}),
    "#9ca3af",
  );

export const buildTransportationRoadWidthExpression = () =>
  buildMatchExpression(
    {
      Motorway: 4.5,
      "National Highway": 4.5,
      "Primary Road": 3.4,
      "Secondary Road": 2.6,
    },
    2.4,
  );

export const buildTransportationRoadCasingWidthExpression = () =>
  buildMatchExpression(
    {
      Motorway: 6.5,
      "National Highway": 6.5,
      "Primary Road": 0,
      "Secondary Road": 0,
    },
    0,
  );

export const getTransportationRoadLinePaint = (
  roadColors = DEFAULT_TRANSPORTATION_ROAD_COLORS,
  opacityRatio = 1,
) => ({
  "line-color": buildTransportationRoadColorExpression(roadColors),
  "line-width": buildTransportationRoadWidthExpression(),
  "line-opacity": opacityRatio,
});

export const getTransportationRoadCasingPaint = (
  _roadColors = DEFAULT_TRANSPORTATION_ROAD_COLORS,
  opacityRatio = 1,
) => ({
  "line-color": "#111111",
  "line-width": buildTransportationRoadCasingWidthExpression(),
  "line-opacity": opacityRatio,
});

export default function TransportationRoadsLayer({
  colors = DEFAULT_TRANSPORTATION_ROAD_COLORS,
  onColorChange,
}) {
  return (
    <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
      <div className="mb-1.5 font-semibold text-white/90">
        Transportation Road Classification
      </div>

      <div className="space-y-1.5">
        {TRANSPORTATION_ROADS_LEGEND.map((item) => {
          const currentColor = colors[item.label] || item.color;
          const hasCasing =
            item.label === "Motorway" || item.label === "National Highway";

          return (
            <div key={item.label} className="flex items-center gap-2">
              <label
                className="relative h-4 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/40 bg-white"
                title={`Change ${item.label} color`}
              >
                <span
                  className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 ${
                    hasCasing ? "h-[6px] bg-black" : "h-[4px]"
                  }`}
                  style={hasCasing ? undefined : { backgroundColor: currentColor }}
                />
                {hasCasing && (
                  <span
                    className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2"
                    style={{ backgroundColor: currentColor }}
                  />
                )}
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
