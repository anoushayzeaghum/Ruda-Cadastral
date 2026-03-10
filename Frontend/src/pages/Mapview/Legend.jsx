export default function Legend({ featureCount, selectedMouzaName, isLoading }) {
  return (
    <aside className="map-legend" aria-label="Map legend">
      <div className="map-legend__title">Layer Details</div>

      <div className="map-legend__item">
        <span
          className="map-legend__swatch map-legend__swatch--khasra"
          aria-hidden="true"
        />
        <span className="map-legend__label">Khasra boundary</span>
      </div>

      <div className="map-legend__meta">
        <span className="map-legend__meta-label">Selected Mouza</span>
        <strong className="map-legend__meta-value">
          {selectedMouzaName ?? "None"}
        </strong>
      </div>

      <div className="map-legend__meta">
        <span className="map-legend__meta-label">Loaded Features</span>
        <strong className="map-legend__meta-value">{featureCount}</strong>
      </div>

      <div className="map-legend__meta">
        <span className="map-legend__meta-label">Status</span>
        <strong className="map-legend__meta-value">
          {isLoading ? "Loading" : "Ready"}
        </strong>
      </div>
    </aside>
  );
}
