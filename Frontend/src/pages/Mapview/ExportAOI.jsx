import { exportSelectedParcelKMZ } from "./exportKMZ.jsx";

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportAOIKMZ = (feature) => {
  if (!feature?.geometry) return;
  exportSelectedParcelKMZ(
    {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        name: "Drawn AOI",
        feature_type: "Area of Interest",
      },
    },
    { verified: true, filenamePrefix: "drawn_aoi", displayName: "Drawn AOI" },
  );
};

export const exportAOIGeoJSON = (feature) => {
  if (!feature?.geometry) return;
  const collection = {
    type: "FeatureCollection",
    features: [feature],
  };
  downloadBlob(
    new Blob([JSON.stringify(collection, null, 2)], {
      type: "application/geo+json",
    }),
    "drawn_aoi.geojson",
  );
};
