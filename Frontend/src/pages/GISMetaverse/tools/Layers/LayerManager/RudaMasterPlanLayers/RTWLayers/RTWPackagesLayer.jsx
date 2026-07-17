export const RTW_PACKAGE_LEGEND = [
  {
    label: "Package 1",
    color: "#e41a1c",
    values: [
      "1",
      "01",
      "i",
      "package 1",
      "package-1",
      "package 01",
      "package i",
      "package a",
      "rtw package 1",
      "rtw package i",
      "pkg 1",
      "pkg-i",
    ],
  },
  {
    label: "Package 2",
    color: "#377eb8",
    values: [
      "2",
      "02",
      "ii",
      "package 2",
      "package-2",
      "package 02",
      "package ii",
      "package b",
      "rtw package 2",
      "rtw package ii",
      "pkg 2",
      "pkg-ii",
    ],
  },
  {
    label: "Package 3",
    color: "#4daf4a",
    values: [
      "3",
      "03",
      "iii",
      "package 3",
      "package-3",
      "package 03",
      "package iii",
      "package c",
      "rtw package 3",
      "rtw package iii",
      "pkg 3",
      "pkg-iii",
    ],
  },
  {
    label: "Package 4",
    color: "#984ea3",
    values: [
      "4",
      "04",
      "iv",
      "package 4",
      "package-4",
      "package 04",
      "package iv",
      "package d",
      "rtw package 4",
      "rtw package iv",
      "pkg 4",
      "pkg-iv",
    ],
  },
  {
    label: "Package 5",
    color: "#ff7f00",
    values: [
      "5",
      "05",
      "v",
      "package 5",
      "package-5",
      "package 05",
      "package v",
      "package e",
      "rtw package 5",
      "rtw package v",
      "pkg 5",
      "pkg-v",
    ],
  },
  {
    label: "Package 6",
    color: "#a65628",
    values: [
      "6",
      "06",
      "vi",
      "package 6",
      "package-6",
      "package 06",
      "package vi",
      "package f",
      "rtw package 6",
      "rtw package vi",
      "pkg 6",
      "pkg-vi",
    ],
  },
  {
    label: "Package 7",
    color: "#f781bf",
    values: [
      "7",
      "07",
      "vii",
      "package 7",
      "package-7",
      "package 07",
      "package vii",
      "package g",
      "rtw package 7",
      "rtw package vii",
      "pkg 7",
      "pkg-vii",
    ],
  },
  {
    label: "Package 8",
    color: "#17becf",
    values: [
      "8",
      "08",
      "viii",
      "package 8",
      "package-8",
      "package 08",
      "package viii",
      "package h",
      "rtw package 8",
      "rtw package viii",
      "pkg 8",
      "pkg-viii",
    ],
  },
  {
    label: "Package 9",
    color: "#bcbd22",
    values: [
      "9",
      "09",
      "ix",
      "package 9",
      "package-9",
      "package 09",
      "package ix",
      "rtw package 9",
      "rtw package ix",
      "pkg 9",
      "pkg-ix",
    ],
  },
  {
    label: "Package 10",
    color: "#8c564b",
    values: [
      "10",
      "x",
      "package 10",
      "package-10",
      "package x",
      "package j",
      "rtw package 10",
      "rtw package x",
      "pkg 10",
      "pkg-x",
    ],
  },
];

const RTW_PACKAGE_VALUE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "package"],
      ["get", "package_no"],
      ["get", "package_number"],
      ["get", "package_name"],
      ["get", "pkg"],
      ["get", "pkg_no"],
      ["get", "pkg_name"],
      ["get", "name"],
      ["get", "refname"],
      "other",
    ],
  ],
];

const RTW_PACKAGE_LABEL_EXPRESSION = [
  "to-string",
  [
    "coalesce",
    ["get", "package_name"],
    ["get", "package"],
    ["get", "package_no"],
    ["get", "package_number"],
    ["get", "pkg_name"],
    ["get", "pkg"],
    ["get", "name"],
    ["get", "refname"],
    "RTW Package",
  ],
];

export const DEFAULT_RTW_PACKAGE_COLORS = RTW_PACKAGE_LEGEND.reduce(
  (colors, item) => {
    colors[item.label] = item.color;
    return colors;
  },
  {},
);

export const buildRtwPackageColorExpression = (
  packageColors = DEFAULT_RTW_PACKAGE_COLORS,
) => [
  "match",
  RTW_PACKAGE_VALUE_EXPRESSION,
  ...RTW_PACKAGE_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      packageColors[item.label] || item.color,
    ]),
  ),
  "#6b7280",
];

export const getRtwPackagesFillPaint = (
  packageColors = DEFAULT_RTW_PACKAGE_COLORS,
  opacity = 1,
) => ({
  "fill-color": buildRtwPackageColorExpression(packageColors),
  "fill-opacity": 0.48 * opacity,
});

export const getRtwPackagesOutlinePaint = (
  packageColors = DEFAULT_RTW_PACKAGE_COLORS,
  opacity = 1,
) => ({
  "line-color": buildRtwPackageColorExpression(packageColors),
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.5, 13, 3],
  "line-opacity": opacity,
});

export const getRtwPackagesLinePaint = getRtwPackagesOutlinePaint;

export const getRtwPackagesLabelLayout = () => ({
  "text-field": RTW_PACKAGE_LABEL_EXPRESSION,
  "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 14, 15],
  "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
  "text-max-width": 12,
  "text-anchor": "center",
  "text-allow-overlap": false,
  "text-ignore-placement": false,
});

export const getRtwPackagesLabelPaint = (opacity = 1) => ({
  "text-color": "#000000",
  "text-opacity": opacity,
  "text-halo-color": "#ffffff",
  "text-halo-width": 1.6,
  "text-halo-blur": 0.4,
});

export default function RTWPackagesLayer({
  colors = DEFAULT_RTW_PACKAGE_COLORS,
  onColorChange,
}) {
  return (
    <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
      <div className="mb-1.5 font-semibold text-white/90">
        RTW Package Classification
      </div>

      <div className="space-y-1.5">
        {RTW_PACKAGE_LEGEND.map((item) => {
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
