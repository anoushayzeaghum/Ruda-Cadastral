/**
 * Centralized asset URL helpers for the integrated RUDA Virtual Tour.
 *
 * Local/Vite default:
 *   /virtual-tour/tiles/<scene-id>/...
 *
 * Optional production override:
 *   VITE_VIRTUAL_TOUR_MEDIA_URL=/media/virtual-tour
 *   (the value should point to the folder that contains scene directories)
 */
const configuredMediaUrl = import.meta.env.VITE_VIRTUAL_TOUR_MEDIA_URL?.replace(/\/$/, '');

export const VIRTUAL_TOUR_MEDIA_BASE =
  configuredMediaUrl ||
  `${import.meta.env.BASE_URL}virtual-tour/tiles`.replace(/([^:]\/)\/+/g, '$1');

export const getTourTileRoot = (sceneId) =>
  `${VIRTUAL_TOUR_MEDIA_BASE}/${sceneId}`;

export const getTourPreviewUrl = (sceneId) =>
  `${getTourTileRoot(sceneId)}/preview.jpg`;
