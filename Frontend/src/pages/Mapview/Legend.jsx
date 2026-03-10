export default function Legend() {
  return (
    <aside className="map-legend" aria-label="Map legend">
      <div className="map-legend__title">Legend</div>

      <div className="map-legend__item">
        <span
          className="map-legend__swatch map-legend__swatch--khasra"
          aria-hidden="true"
        />
        <span className="map-legend__label">Khasra boundary</span>
      </div>
    </aside>
  );
}

