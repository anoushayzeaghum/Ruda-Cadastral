// dashboardData.js
// Single source of truth for the Admin Dashboard.
// STAT_GROUPS is the exact data set used on LandingPage.jsx — reused here
// so the landing page and the dashboard never drift out of sync.

export const STAT_GROUPS = [
  {
    key: "lis",
    title: "Land Information System",
    icon: "map",
    tone: "green",
    stats: [
      { value: "2", label: "Total Districts" },
      { value: "10", label: "Total Tehsil" },
      { value: "173", label: "Total Mauza" },
      { value: "237,754", label: "Total Khasra" },
    ],
  },
  {
    key: "metaverse",
    title: "RUDA Metaverse",
    icon: "layers",
    tone: "cyan",
    stats: [
      { value: "6", label: "Total Zones" },
      { value: "5", label: "Total Phases" },
      { value: "9", label: "Total Precincts" },
      { value: "70%", label: "Principal Zoning" },
    ],
  },
  {
    key: "rtw",
    title: "RTW Packages",
    icon: "package",
    tone: "amber",
    stats: [
      { value: "20", label: "Total Packages" },
      { value: "19", label: "Total Projects" },
      { value: "5", label: "Total Phases" },
    ],
  },
  {
    key: "chaharbagh",
    title: "Chahar Bagh Phase 1",
    icon: "grid",
    tone: "violet",
    stats: [
      { value: "68%", label: "Residential" },
      { value: "12%", label: "Commercial" },
      { value: "9%", label: "Green Spaces" },
      { value: "11%", label: "Utilities" },
    ],
  },
];

// ── Derived: land-use split for the doughnut chart ──────────────────────
// Pulled straight from the Chahar Bagh Phase 1 group above (already sums to 100%).
export const LAND_USE_DATA = STAT_GROUPS.find(
  (g) => g.key === "chaharbagh"
).stats.map((s) => ({
  label: s.label,
  value: parseFloat(s.value),
}));

// ── Derived: Metaverse vs RTW structural comparison for the bar chart ───
export const STRUCTURE_COMPARISON = {
  categories: ["Zones / Packages", "Phases", "Precincts / Projects"],
  series: [
    {
      label: "RUDA Metaverse",
      data: [6, 5, 9],
      color: "#4CCBFF",
    },
    {
      label: "RTW Packages",
      data: [20, 5, 19],
      color: "#f5b942",
    },
  ],
};

// ── Color tokens per KPI-group tone, matching the LandingPage palette ───
// Landing page brand colors: #00351f / #004225 / #0B7A3B (greens),
// #70D84F / #8FEA67 (bright accent green), #45C8FF / #4CCBFF (cyan accent).
export const TONE_STYLES = {
  green: {
    iconWrap: "text-white bg-gradient-to-br from-[#3cc96f] to-[#0B7A3B] shadow-[0_8px_18px_-9px_rgba(11,122,59,0.6)]",
    value: "text-[#0B7A3B] dark:text-[#70D84F]",
    chip: "bg-[#edf8ef] text-[#0B7A3B] dark:bg-[#0B7A3B]/15 dark:text-[#70D84F]",
    ring: "hover:ring-[#0B7A3B]/25",
  },
  cyan: {
    iconWrap: "text-white bg-gradient-to-br from-[#4CCBFF] to-[#0B87C7] shadow-[0_8px_18px_-9px_rgba(11,135,199,0.6)]",
    value: "text-[#0B87C7] dark:text-[#4CCBFF]",
    chip: "bg-[#e9f8ff] text-[#0B87C7] dark:bg-[#4CCBFF]/15 dark:text-[#4CCBFF]",
    ring: "hover:ring-[#0B87C7]/25",
  },
  amber: {
    iconWrap: "text-white bg-gradient-to-br from-[#f5b942] to-[#c8811a] shadow-[0_8px_18px_-9px_rgba(200,129,26,0.6)]",
    value: "text-[#c8811a] dark:text-[#f5b942]",
    chip: "bg-[#fef6e6] text-[#c8811a] dark:bg-[#f5b942]/15 dark:text-[#f5b942]",
    ring: "hover:ring-[#c8811a]/25",
  },
  violet: {
    iconWrap: "text-white bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] shadow-[0_8px_18px_-9px_rgba(109,40,217,0.6)]",
    value: "text-[#6d28d9] dark:text-[#c4b5fd]",
    chip: "bg-[#f3efff] text-[#6d28d9] dark:bg-[#a78bfa]/15 dark:text-[#c4b5fd]",
    ring: "hover:ring-[#6d28d9]/25",
  },
};
