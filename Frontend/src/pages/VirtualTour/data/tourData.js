/**
 * RUDA Virtual Tour — Scene & Metadata Configuration
 *
 * Layout rules:
 *  - Do NOT move or rename tile files; they live under /public/virtual-tour/tiles/
 *  - Marzipano-required fields (id, levels, faceSize, initialViewParameters,
 *    linkHotspots, infoHotspots) must stay intact.
 *  - Extra RUDA fields (progress, status, zone, northOffset, mapPosition, …)
 *    are read only by the React UI layer.
 */

export const TOUR_DATA = {
  // ── Tour identity ──────────────────────────────────────────────────────────
  id: 'ruda-demo-tour',
  title: 'RUDA Virtual Tour',

  society: {
    id: 'chahar-bagh',
    name: 'Chahar Bagh',
  },

  /** ISO date of the most-recent capture used in this build */
  captureDate: '2026-09-01',

  // ── Global viewer settings ─────────────────────────────────────────────────
  settings: {
    mouseViewMode: 'qtvr',

    autorotate: {
      enabled: true,
      /** ms of user inactivity before autorotation resumes */
      idleDelay: 6000,
      yawSpeed: 0.025,
    },

    fullscreenButton: true,
    viewControlButtons: true,
    sceneCarousel: true,
    miniMap: true,
  },

  // ── Timeline / multi-capture support ──────────────────────────────────────
  // When multiple capture dates exist, add entries here and set the `active`
  // flag on the current one.  The viewer will load scenes from the active
  // version's tile paths.  For now we only have one version.
  tourVersions: [
    {
      id: '2026-09',
      label: 'September 2026',
      active: true,
    },
    // Future:
    // { id: '2026-08', label: 'August 2026', active: false },
    // { id: '2026-07', label: 'July 2026',   active: false },
  ],

  // ── Scenes ─────────────────────────────────────────────────────────────────
  scenes: [
    // ── Scene 0 ─────────────────────────────────────────────────────────────
    {
      // ---- Marzipano required -----------------------------------------------
      id: '0-bambanani_sunset_4k_marzipano',

      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
      ],
      faceSize: 1024,
      initialViewParameters: { pitch: 0, yaw: 0, fov: 1.5707963267948966 },

      linkHotspots: [
        {
          yaw: -2.477957318795779,
          pitch: 0.051151657370134274,
          rotation: 4.71238898038469,
          target: '1-scythian_tombs_2_4k_marzipano',
        },
      ],
      infoHotspots: [],

      // ---- RUDA metadata ----------------------------------------------------
      name: 'Main Entrance',
      description:
        'Primary entrance gate area of Chahar Bagh society. Access road and security booth construction is ongoing.',
      captureDate: '2026-09-01',
      zone: 'Zone A',
      progress: 45,
      status: 'In Progress', // 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'
      northOffset: 0,

      /** Position on the lightweight mini-map (0–100 percentage coords) */
      mapPosition: { x: 20, y: 50 },
    },

    // ── Scene 1 ─────────────────────────────────────────────────────────────
    {
      // ---- Marzipano required -----------------------------------------------
      id: '1-scythian_tombs_2_4k_marzipano',

      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
      ],
      faceSize: 1024,
      initialViewParameters: { pitch: 0, yaw: 0, fov: 1.5707963267948966 },

      linkHotspots: [
        {
          yaw: -1.0937739948402498,
          pitch: 0.04373798866017964,
          rotation: 0,
          target: '2-waterkloof_farm_4k_marzipano',
        },
      ],

      infoHotspots: [
        {
          yaw: -1.3484295936676105,
          pitch: 0.3596310697272962,

          // ---- RUDA extended info hotspot fields ----------------------------
          title: 'Main Boulevard',
          text: 'Primary access boulevard — double-lane road with central median landscaping.',

          category: 'Road Infrastructure',
          progress: 67,
          status: 'In Progress',
          date: 'September 2026',
          contractor: 'RDA Civil Works Dept.',

          // Optional image inside the info panel (place in /public/virtual-tour/tour-assets/)
          // image: '/virtual-tour/tour-assets/boulevard-progress.jpg',
        },
      ],

      // ---- RUDA metadata ----------------------------------------------------
      name: 'Main Boulevard',
      description:
        'Central boulevard connecting the main gate to the residential blocks. Road formation and kerbing underway.',
      captureDate: '2026-09-01',
      zone: 'Zone B',
      progress: 67,
      status: 'In Progress',
      northOffset: 0,
      mapPosition: { x: 50, y: 50 },
    },

    // ── Scene 2 ─────────────────────────────────────────────────────────────
    {
      // ---- Marzipano required -----------------------------------------------
      id: '2-waterkloof_farm_4k_marzipano',

      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
      ],
      faceSize: 1024,
      initialViewParameters: { pitch: 0, yaw: 0, fov: 1.5707963267948966 },

      linkHotspots: [
        {
          yaw: 2.504553158452749,
          pitch: 0.09188094924031986,
          rotation: 0,
          target: '0-bambanani_sunset_4k_marzipano',
        },
      ],
      infoHotspots: [],

      // ---- RUDA metadata ----------------------------------------------------
      name: 'Central Park',
      description:
        'Green belt and central recreation park area. Soil preparation and irrigation pipeline installation in progress.',
      captureDate: '2026-09-01',
      zone: 'Zone C',
      progress: 28,
      status: 'In Progress',
      northOffset: 0,
      mapPosition: { x: 80, y: 50 },
    },
  ],
};

// ── Convenience helpers ─────────────────────────────────────────────────────

/** Return a scene object by its Marzipano ID */
export const getSceneById = (id) =>
  TOUR_DATA.scenes.find((s) => s.id === id) ?? null;

/** Return the index of a scene in the scenes array */
export const getSceneIndex = (id) =>
  TOUR_DATA.scenes.findIndex((s) => s.id === id);

/** Status colour tokens */
export const STATUS_COLORS = {
  'Not Started': '#6b7280',
  'In Progress': '#f59e0b',
  'Completed': '#16a34a',
  'On Hold': '#ef4444',
};
