export default function FilterPanel({ filters, isCollapsed, onToggle }) {
  if (!filters) return null;

  const {
    divisions,
    districts,
    tehsils,
    mouzas,
    errorMessage,
    hasSelection,
    resetFilters,
    selectedDivisionOption,
    selectedDistrictOption,
    selectedTehsilOption,
    selectedMouzaOption,
  } = filters;

  return (
    <div
      className={`layer-panel-wrapper ${isCollapsed ? "layer-panel-wrapper--collapsed" : ""}`}
    >
      <button
        type="button"
        className="layer-panel__toggle"
        onClick={onToggle}
        aria-label={
          isCollapsed ? "Expand filter panel" : "Collapse filter panel"
        }
      >
        {isCollapsed ? "‹" : "›"}
      </button>

      <aside className="layer-panel">
        <div className="layer-panel__hero">
          <p className="layer-panel__eyebrow">Filter Panel</p>
          <h2 className="layer-panel__title">Selection Overview</h2>
          <p className="layer-panel__description">
            Use the header dropdowns to choose the administrative boundary, then
            review the current selection here without leaving the map.
          </p>
        </div>

        <div className="layer-panel__stats" aria-label="Loaded filter counts">
          <div className="layer-panel__stat">
            <span className="layer-panel__stat-label">Divisions</span>
            <strong className="layer-panel__stat-value">
              {divisions.length}
            </strong>
          </div>
          <div className="layer-panel__stat">
            <span className="layer-panel__stat-label">Districts</span>
            <strong className="layer-panel__stat-value">
              {districts.length}
            </strong>
          </div>
          <div className="layer-panel__stat">
            <span className="layer-panel__stat-label">Tehsils</span>
            <strong className="layer-panel__stat-value">
              {tehsils.length}
            </strong>
          </div>
          <div className="layer-panel__stat">
            <span className="layer-panel__stat-label">Mouzas</span>
            <strong className="layer-panel__stat-value">{mouzas.length}</strong>
          </div>
        </div>

        {errorMessage ? (
          <p className="layer-panel__error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <p className="layer-panel__hint">
          The administrative dropdowns now live in the header so they stay
          visible while the map remains fully open.
        </p>

        <div className="layer-panel__actions">
          <button
            type="button"
            className="layer-panel__reset"
            onClick={resetFilters}
            disabled={!hasSelection}
          >
            Reset filters
          </button>
        </div>

        <section
          className="layer-panel__summary"
          aria-label="Current map selection"
        >
          <h3 className="layer-panel__summary-title">Current Selection</h3>

          <ul className="layer-panel__summary-list">
            <li className="layer-panel__summary-item">
              <span>Division</span>
              <strong>
                {selectedDivisionOption?.division ?? "Not selected"}
              </strong>
            </li>
            <li className="layer-panel__summary-item">
              <span>District</span>
              <strong>{selectedDistrictOption?.name ?? "Not selected"}</strong>
            </li>
            <li className="layer-panel__summary-item">
              <span>Tehsil</span>
              <strong>{selectedTehsilOption?.name ?? "Not selected"}</strong>
            </li>
            <li className="layer-panel__summary-item">
              <span>Mouza</span>
              <strong>{selectedMouzaOption?.mouza ?? "Not selected"}</strong>
            </li>
            <li className="layer-panel__summary-item">
              <span>Mouza ID</span>
              <strong>{selectedMouzaOption?.mouza_id ?? "—"}</strong>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
