/** Centralized asset helpers for RUDA Virtual Tour. */
const configuredMediaUrl = import.meta.env.VITE_VIRTUAL_TOUR_MEDIA_URL?.replace(/\/$/, '');

export const VIRTUAL_TOUR_MEDIA_BASE =
  configuredMediaUrl ||
  `${import.meta.env.BASE_URL}virtual-tour/tiles`.replace(/([^:]\/)\/+/g, '$1');

export const getTourTileRoot = (sceneId) => `${VIRTUAL_TOUR_MEDIA_BASE}/${sceneId}`;
export const getTourPreviewUrl = (sceneId) => `${getTourTileRoot(sceneId)}/preview.jpg`;

// A normal-looking scene thumbnail. Marzipano's preview.jpg is a packed cube preview,
// so use the first-level front face for gallery/destination cards.
export const getTourThumbnailUrl = (sceneId) => `${getTourTileRoot(sceneId)}/1/f/0/0.jpg`;
