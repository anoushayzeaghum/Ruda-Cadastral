export const CITY_LEVEL_SERVICES_LEGEND = [
  {
    label: "Command and Control Center",
    color: "#7b00a8",
    outlineColor: "#7b00a8",
    pattern: "horizontal",
    values: ["command and control center", "command & control center"],
  },
  {
    label: "Farmer Market",
    color: "#fff200",
    outlineColor: "#d900d9",
    pattern: "magenta-diagonal",
    values: ["farmer market", "farmers market"],
  },
  {
    label: "Freight Terminal",
    color: "#e7e7e7",
    outlineColor: "#6b2f1f",
    pattern: "brown-diagonal",
    values: ["freight terminal"],
  },
  {
    label: "Govt. Office",
    color: "#ff9f9f",
    outlineColor: "#ff5e5e",
    values: ["govt. office", "govt office", "government office"],
  },
  {
    label: "Graveyard",
    color: "#eaff00",
    outlineColor: "#65c900",
    pattern: "graveyard-dots",
    values: ["graveyard"],
  },
  {
    label: "Grid Station",
    color: "#ffffff",
    outlineColor: "#c000ff",
    values: ["grid station"],
  },
  {
    label: "Hospital",
    color: "#ffffff",
    outlineColor: "#ff1f2d",
    pattern: "red-diagonal",
    values: ["hospital"],
  },
  {
    label: "Judicial Complex",
    color: "#38b828",
    outlineColor: "#2d8f20",
    values: ["judicial complex"],
  },
  {
    label: "Landfill Site",
    color: "#fff200",
    outlineColor: "#b51e12",
    pattern: "orange-diagonal",
    values: ["landfill site", "land fill site"],
  },
  {
    label: "Multi Model Bus Terminal",
    color: "#ff1010",
    outlineColor: "#ff1010",
    values: [
      "multi model bus terminal",
      "multi modal bus terminal",
      "multimodal bus terminal",
    ],
  },
  {
    label: "Park",
    color: "#51ef10",
    outlineColor: "#238800",
    pattern: "green-diagonal",
    values: ["park"],
  },
  {
    label: "Social Housing",
    color: "#cfe89d",
    outlineColor: "#587c0b",
    values: ["social housing"],
  },
  {
    label: "Sports Complex",
    color: "#dff000",
    outlineColor: "#b9c900",
    values: ["sports complex"],
  },
  {
    label: "Transport Services",
    color: "#e26bb8",
    outlineColor: "#a00072",
    values: ["transport services", "transport service"],
  },
  {
    label: "University",
    color: "#fff200",
    outlineColor: "#ff1f1f",
    values: ["university"],
  },
];

const CITY_LEVEL_SERVICE_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "service_type"],
      ["get", "service"],
      ["get", "type"],
      ["get", "land_use"],
      ["get", "landuse"],
      ["get", "category"],
      ["get", "name"],
      ["get", "refname"],
      "other",
    ],
  ],
];

export const DEFAULT_CITY_LEVEL_SERVICE_COLORS =
  CITY_LEVEL_SERVICES_LEGEND.reduce((colors, item) => {
    colors[item.label] = item.color;
    return colors;
  }, {});

const buildServiceMatchExpression = (
  property,
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  fallback,
) => [
  "match",
  CITY_LEVEL_SERVICE_TYPE_EXPRESSION,
  ...CITY_LEVEL_SERVICES_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      property === "color"
        ? serviceColors[item.label] || item.color
        : item[property],
    ]),
  ),
  fallback,
];

export const buildCityLevelServiceColorExpression = (
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
) => buildServiceMatchExpression("color", serviceColors, "#22c55e");

export const buildCityLevelServiceOutlineExpression = (
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
) => buildServiceMatchExpression("outlineColor", serviceColors, "#147a31");

const PATTERN_IDS = {
  transparent: "ruda-city-service-transparent",
  horizontal: "ruda-city-service-horizontal",
  "magenta-diagonal": "ruda-city-service-magenta-diagonal",
  "brown-diagonal": "ruda-city-service-brown-diagonal",
  "graveyard-dots": "ruda-city-service-graveyard-dots",
  "red-diagonal": "ruda-city-service-red-diagonal",
  "orange-diagonal": "ruda-city-service-orange-diagonal",
  "green-diagonal": "ruda-city-service-green-diagonal",
};

const buildPatternExpression = () => [
  "match",
  CITY_LEVEL_SERVICE_TYPE_EXPRESSION,
  ...CITY_LEVEL_SERVICES_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      PATTERN_IDS[item.pattern] || PATTERN_IDS.transparent,
    ]),
  ),
  PATTERN_IDS.transparent,
];

const createPatternImage = (size, draw) => {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.clearRect(0, 0, size, size);
  draw(context, size);
  return context.getImageData(0, 0, size, size);
};

const addPattern = (map, id, image) => {
  if (!image || map.hasImage?.(id)) return;
  map.addImage(id, image, { pixelRatio: 2 });
};

export const ensureCityLevelServicePatterns = (map) => {
  if (!map?.addImage) return;

  addPattern(
    map,
    PATTERN_IDS.transparent,
    createPatternImage(8, () => {}),
  );

  addPattern(
    map,
    PATTERN_IDS.horizontal,
    createPatternImage(12, (context, size) => {
      context.strokeStyle = "rgba(255,255,255,0.95)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, size / 2);
      context.lineTo(size, size / 2);
      context.stroke();
    }),
  );

  const addDiagonal = (id, strokeStyle) =>
    addPattern(
      map,
      id,
      createPatternImage(12, (context, size) => {
        context.strokeStyle = strokeStyle;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(-2, size - 2);
        context.lineTo(size - 2, -2);
        context.moveTo(4, size + 2);
        context.lineTo(size + 2, 4);
        context.stroke();
      }),
    );

  addDiagonal(PATTERN_IDS["magenta-diagonal"], "#e100d7");
  addDiagonal(PATTERN_IDS["brown-diagonal"], "#6b2f1f");
  addDiagonal(PATTERN_IDS["red-diagonal"], "#ff2020");
  addDiagonal(PATTERN_IDS["orange-diagonal"], "#ff6a00");
  addDiagonal(PATTERN_IDS["green-diagonal"], "#238800");

  addPattern(
    map,
    PATTERN_IDS["graveyard-dots"],
    createPatternImage(12, (context) => {
      context.fillStyle = "#65c900";
      context.beginPath();
      context.arc(3, 3, 1.5, 0, Math.PI * 2);
      context.arc(9, 9, 1.5, 0, Math.PI * 2);
      context.fill();
    }),
  );
};

export const getCityLevelServicesFillPaint = (
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  opacity = 1,
) => ({
  "fill-color": buildCityLevelServiceColorExpression(serviceColors),
  "fill-opacity": 0.78 * opacity,
});

export const getCityLevelServicesPatternFillPaint = (
  _serviceColors,
  opacity = 1,
) => ({
  "fill-pattern": buildPatternExpression(),
  "fill-opacity": opacity,
});

export const getCityLevelServicesOutlinePaint = (
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  opacity = 1,
) => ({
  "line-color": buildCityLevelServiceOutlineExpression(serviceColors),
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.2, 13, 2.2],
  "line-opacity": opacity,
});

export const getCityLevelServicesLinePaint = getCityLevelServicesOutlinePaint;

export const getCityLevelServicesCirclePaint = (
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  opacity = 1,
) => ({
  "circle-radius": 5,
  "circle-color": buildCityLevelServiceColorExpression(serviceColors),
  "circle-opacity": opacity,
  "circle-stroke-color": buildCityLevelServiceOutlineExpression(serviceColors),
  "circle-stroke-width": 1.5,
  "circle-stroke-opacity": opacity,
});

const getLegendSwatchStyle = (item, color) => {
  const base = { backgroundColor: color, borderColor: item.outlineColor };

  const patternStyles = {
    horizontal: {
      background: `repeating-linear-gradient(0deg, ${color} 0 4px, #ffffff 4px 6px)`,
    },
    "magenta-diagonal": {
      background: `repeating-linear-gradient(135deg, ${color} 0 4px, #e100d7 4px 6px)`,
    },
    "brown-diagonal": {
      background: `repeating-linear-gradient(135deg, ${color} 0 4px, #6b2f1f 4px 6px)`,
    },
    "red-diagonal": {
      background: `repeating-linear-gradient(135deg, ${color} 0 4px, #ff2020 4px 6px)`,
    },
    "orange-diagonal": {
      background: `repeating-linear-gradient(135deg, ${color} 0 4px, #ff6a00 4px 6px)`,
    },
    "green-diagonal": {
      background: `repeating-linear-gradient(135deg, ${color} 0 4px, #238800 4px 6px)`,
    },
    "graveyard-dots": {
      backgroundColor: color,
      backgroundImage:
        "radial-gradient(circle at 3px 3px, #65c900 0 1.5px, transparent 1.7px)",
      backgroundSize: "7px 7px",
    },
  };

  return { ...base, ...(patternStyles[item.pattern] || {}) };
};

export default function CityLevelServicesLayer({
  colors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  onColorChange,
}) {
  return (
    <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
      <div className="mb-1.5 font-semibold text-white/90">
        City Level Services Classification
      </div>

      <div className="space-y-1.5">
        {CITY_LEVEL_SERVICES_LEGEND.map((item) => {
          const currentColor = colors[item.label] || item.color;

          return (
            <div key={item.label} className="flex items-center gap-2">
              <label
                className="relative h-4 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border-2"
                style={getLegendSwatchStyle(item, currentColor)}
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
