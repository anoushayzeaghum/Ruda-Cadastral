/**
 * droneProjectConfig.js
 *
 * Single source of truth for all drone imagery configurations.
 * Keys must match String(p.gid || p.id) as built by MetaverseSubHeader.
 *
 * To add a new project:
 *
 *   PROJECT_DRONE_DATA["NEW_PROJECT_ID"] = {
 *     projectId: "NEW_PROJECT_ID",
 *     projectCode: "PROJECT-2",
 *     projectName: "Another Project",
 *     location: "City, Province, Country",
 *     dataSource: "RUDA Drone Survey Programme",
 *     bounds: [
 *       [west, south],
 *       [east, north],
 *     ],
 *     center: [longitude, latitude],
 *     defaultZoom: 15,
 *     maxZoom: 17.5,
 *     imagery: [
 *       {
 *         id: "survey-2026",
 *         label: "Survey 2026",
 *         shortLabel: "Survey 2026",
 *         reportLabel: "Survey 2026",
 *         captureDate: "2026-01-01",
 *         color: "#3b82f6",
 *         tileUrl: "https://.../{z}/{x}/{y}.png",
 *       },
 *     ],
 *   };
 */

// ── Project ID: "5"  (gid=5, brief_name="CB Ph-I", Chahar Bagh Phase-I) ────────
export const PROJECT_DRONE_DATA = {
  "5": {
    projectId: "5",
    projectCode: "CB-1",
    projectName: "Chahar Bagh Phase 1",
    location: "Lahore, Punjab, Pakistan",
    dataSource: "RUDA Drone Survey Programme",

    bounds: [
      [74.42562653088396, 31.60509230706726],
      [74.43545280361002, 31.6112165411359],
    ],

    center: [74.4305, 31.6081],
    defaultZoom: 15,
    maxZoom: 17.5,

    imagery: [
      {
        id: "jan2023",
        label: "Jan 2023",
        shortLabel: "Jan 2023",
        reportLabel: "AsBuilt Jan 2023",
        captureDate: "2023-01-01",
        color: "#a855f7",
        tileUrl:
          "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_AsBuilt_Jan2023/{z}/{x}/{y}.png",
      },
      {
        id: "june2023",
        label: "June 2023",
        shortLabel: "Jun 2023",
        reportLabel: "Ortho June 2023",
        captureDate: "2023-06-01",
        color: "#3b82f6",
        tileUrl:
          "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_Ortho_June2023/{z}/{x}/{y}.png",
      },
      {
        id: "nov2024",
        label: "Nov 2024",
        shortLabel: "Nov 2024",
        reportLabel: "Ortho Nov 2024",
        captureDate: "2024-11-01",
        color: "#ef4444",
        tileUrl:
          "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chahar_Bagh_Ortho_Nov2024/{z}/{x}/{y}.png",
      },
      {
        id: "apr2026",
        label: "Apr 2026",
        shortLabel: "Apr 2026",
        reportLabel: "Ortho Apr 2026",
        captureDate: "2026-04-01",
        color: "#f59e0b",
        tileUrl:
          "https://rudametaverse.nespakprogresscenter.com/tiles/data/Chaharbagh_Ortho/{z}/{x}/{y}.png",
      },
    ],
  },
};

// ── ID normalisation ─────────────────────────────────────────────────────────

export const normalizeProjectId = (projectId) =>
  String(projectId ?? "").trim();

// ── Config lookup ────────────────────────────────────────────────────────────

export const getProjectDroneConfig = (projectId) => {
  const normalizedId = normalizeProjectId(projectId);
  if (!normalizedId) return null;
  return PROJECT_DRONE_DATA[normalizedId] || null;
};

// Returns imagery sorted oldest → newest
export const getProjectImagery = (projectId) => {
  const config = getProjectDroneConfig(projectId);
  if (!Array.isArray(config?.imagery)) return [];
  return [...config.imagery].sort(
    (a, b) =>
      new Date(a.captureDate).getTime() - new Date(b.captureDate).getTime(),
  );
};

export const hasProjectDroneImagery = (projectId) =>
  getProjectImagery(projectId).length > 0;

export const canUseChangeDetection = (projectId) =>
  getProjectImagery(projectId).length >= 2;

export const canUseTimeLapse = (projectId) =>
  getProjectImagery(projectId).length >= 2;

// ── Mapbox-safe source / layer ID helpers ────────────────────────────────────

const sanitizeMapId = (value) =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-");

export const getDroneSourceId = (projectId, imageryId, prefix = "drone") =>
  `${prefix}-${sanitizeMapId(projectId)}-${sanitizeMapId(imageryId)}-source`;

export const getDroneLayerId = (projectId, imageryId, prefix = "drone") =>
  `${prefix}-${sanitizeMapId(projectId)}-${sanitizeMapId(imageryId)}-layer`;
