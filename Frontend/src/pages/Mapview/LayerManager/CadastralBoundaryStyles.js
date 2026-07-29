// Central styling for cadastral administrative boundaries.
// Change outline, fill, opacity, width, and verification colours here only.
export const CADASTRAL_BOUNDARY_STYLES = {
  district: {
    lineColor: "#D18B00",
    fillColor: "#F6C453",
    fillOpacity: 0.14,
    lineWidth: 2,
    lineOpacity: 0.95,
  },
  tehsil: {
    lineColor: "#0B3D91",
    fillColor: "#93C5FD",
    fillOpacity: 0.08,
    lineWidth: 2,
    lineOpacity: 0.95,
  },
  mauza: {
    lineColor: "#000000",
    fillColor: "#000000",
    fillOpacity: 0,
    lineWidth: 2,
    lineOpacity: 0.95,
  },
  khasra: {
    verifiedColor: "#16a34a",
    unverifiedColor: "#dc5a5a",
    fillOpacity: 0.12,
    lineWidth: 1.5,
    lineOpacity: 0.95,
    labelColor: "#000000",
    labelHaloColor: "#ffffff",
    labelHaloWidth: 1.2,
    labelHaloBlur: 0.15,
    labelMinZoom: 14,
  },
};

export const getKhasraStatusColorExpression = () => [
  "case",
  ["==", ["get", "_verification_status"], "unverified"],
  CADASTRAL_BOUNDARY_STYLES.khasra.unverifiedColor,
  CADASTRAL_BOUNDARY_STYLES.khasra.verifiedColor,
];
