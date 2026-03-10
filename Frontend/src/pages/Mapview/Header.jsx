import rudaFirmLogo from "../../assets/Rudafirm.png";

export default function Header({ filters }) {
  return (
    <div className="app-header">
      <div className="app-header__main">
        <div className="app-header__brand">
          <img
            className="app-header__logo"
            src={rudaFirmLogo}
            alt="RUDA"
            loading="eager"
          />
          <h1 className="app-header__title">RCMS</h1>
        </div>

        {filters ? (
          <div
            className="app-header__filters"
            aria-label="Administrative filters"
          >
            <div className="app-header__filter-field">
              <label
                className="app-header__filter-label"
                htmlFor="header-division"
              >
                Division
              </label>
              <select
                id="header-division"
                className="app-header__filter-select"
                value={filters.selectedDivision}
                onChange={filters.handleDivisionChange}
                disabled={filters.loading.divisions}
              >
                <option value="">-- Division --</option>
                {filters.divisions.map((division) => (
                  <option key={division.division_i} value={division.division_i}>
                    {division.division}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-header__filter-field">
              <label
                className="app-header__filter-label"
                htmlFor="header-district"
              >
                District
              </label>
              <select
                id="header-district"
                className="app-header__filter-select"
                value={filters.selectedDistrict}
                onChange={filters.handleDistrictChange}
                disabled={
                  !filters.selectedDivision || filters.loading.districts
                }
              >
                <option value="">-- District --</option>
                {filters.districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-header__filter-field">
              <label
                className="app-header__filter-label"
                htmlFor="header-tehsil"
              >
                Tehsil
              </label>
              <select
                id="header-tehsil"
                className="app-header__filter-select"
                value={filters.selectedTehsil}
                onChange={filters.handleTehsilChange}
                disabled={!filters.selectedDistrict || filters.loading.tehsils}
              >
                <option value="">-- Tehsil --</option>
                {filters.tehsils.map((tehsil) => (
                  <option key={tehsil.id} value={tehsil.id}>
                    {tehsil.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-header__filter-field">
              <label
                className="app-header__filter-label"
                htmlFor="header-mouza"
              >
                Mouza
              </label>
              <select
                id="header-mouza"
                className="app-header__filter-select"
                value={filters.selectedMouza}
                onChange={filters.handleMouzaChange}
                disabled={!filters.selectedTehsil || filters.loading.mouzas}
              >
                <option value="">-- Mouza --</option>
                {filters.mouzas.map((mouza) => (
                  <option key={mouza.mouza_id} value={mouza.mouza_id}>
                    {mouza.mouza}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
