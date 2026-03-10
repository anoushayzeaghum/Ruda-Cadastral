import { useEffect, useState } from "react";
import {
  getDivisions,
  getDistricts,
  getTehsils,
  getMouzas,
} from "../../Services/api";

const sortByLabel = (items, key) =>
  [...items].sort((a, b) => {
    const left = String(a?.[key] ?? "").trim();
    const right = String(b?.[key] ?? "").trim();
    return left.localeCompare(right);
  });

export default function FilterPanel({ onMouzaSelect, isCollapsed, onToggle }) {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mouzas, setMouzas] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");

  const [loading, setLoading] = useState({
    divisions: false,
    districts: false,
    tehsils: false,
    mouzas: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadDivisions = async () => {
      setLoading((prev) => ({ ...prev, divisions: true }));
      setErrorMessage("");

      try {
        const data = await getDivisions();
        if (!ignore) {
          setDivisions(sortByLabel(data, "division"));
        }
      } catch {
        if (!ignore) {
          setDivisions([]);
          setErrorMessage("Unable to load divisions right now.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, divisions: false }));
        }
      }
    };

    loadDivisions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDivision) return undefined;

    let ignore = false;

    const loadDistricts = async () => {
      setLoading((prev) => ({ ...prev, districts: true }));
      setErrorMessage("");

      try {
        const data = await getDistricts(selectedDivision);
        if (!ignore) {
          setDistricts(sortByLabel(data, "name"));
        }
      } catch {
        if (!ignore) {
          setDistricts([]);
          setErrorMessage(
            "Unable to load districts for the selected division.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, districts: false }));
        }
      }
    };

    loadDistricts();

    return () => {
      ignore = true;
    };
  }, [selectedDivision]);

  useEffect(() => {
    if (!selectedDistrict) return undefined;

    let ignore = false;

    const loadTehsils = async () => {
      setLoading((prev) => ({ ...prev, tehsils: true }));
      setErrorMessage("");

      try {
        const data = await getTehsils(selectedDistrict);
        if (!ignore) {
          setTehsils(sortByLabel(data, "name"));
        }
      } catch {
        if (!ignore) {
          setTehsils([]);
          setErrorMessage("Unable to load tehsils for the selected district.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, tehsils: false }));
        }
      }
    };

    loadTehsils();

    return () => {
      ignore = true;
    };
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedTehsil) return undefined;

    let ignore = false;

    const loadMouzas = async () => {
      setLoading((prev) => ({ ...prev, mouzas: true }));
      setErrorMessage("");

      try {
        const data = await getMouzas(selectedTehsil);
        if (!ignore) {
          setMouzas(sortByLabel(data, "mouza"));
        }
      } catch {
        if (!ignore) {
          setMouzas([]);
          setErrorMessage("Unable to load mouzas for the selected tehsil.");
        }
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, mouzas: false }));
        }
      }
    };

    loadMouzas();

    return () => {
      ignore = true;
    };
  }, [selectedTehsil]);

  const selectedDivisionOption = divisions.find(
    (item) => String(item.division_i) === String(selectedDivision),
  );
  const selectedDistrictOption = districts.find(
    (item) => String(item.id) === String(selectedDistrict),
  );
  const selectedTehsilOption = tehsils.find(
    (item) => String(item.id) === String(selectedTehsil),
  );
  const selectedMouzaOption = mouzas.find(
    (item) => String(item.mouza_id) === String(selectedMouza),
  );

  useEffect(() => {
    if (!selectedMouzaOption) {
      onMouzaSelect(null);
      return;
    }

    onMouzaSelect({
      id: selectedMouzaOption.mouza_id,
      name: selectedMouzaOption.mouza,
      tehsil: selectedTehsilOption?.name ?? selectedMouzaOption.tehsil,
      tehsilId: selectedMouzaOption.tehsil_id,
      district: selectedDistrictOption?.name ?? selectedMouzaOption.district,
      districtId: selectedMouzaOption.dist_id,
      division: selectedDivisionOption?.division ?? "",
      divisionId: selectedDivisionOption?.division_i ?? "",
    });
  }, [
    onMouzaSelect,
    selectedDivisionOption,
    selectedDistrictOption,
    selectedMouzaOption,
    selectedTehsilOption,
  ]);

  const resetFilters = () => {
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");
    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
    setErrorMessage("");
    onMouzaSelect(null);
  };

  const hasSelection = Boolean(
    selectedDivision || selectedDistrict || selectedTehsil || selectedMouza,
  );

  const handleDivision = (e) => {
    const id = e.target.value;

    setSelectedDivision(id);
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");

    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
    setErrorMessage("");
    onMouzaSelect(null);
  };

  const handleDistrict = (e) => {
    const id = e.target.value;

    setSelectedDistrict(id);
    setSelectedTehsil("");
    setSelectedMouza("");

    setTehsils([]);
    setMouzas([]);
    setErrorMessage("");
    onMouzaSelect(null);
  };

  const handleTehsil = (e) => {
    const id = e.target.value;

    setSelectedTehsil(id);
    setSelectedMouza("");

    setMouzas([]);
    setErrorMessage("");
    onMouzaSelect(null);
  };

  const handleMouza = (e) => {
    const id = e.target.value;

    setSelectedMouza(id);
  };

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
        {isCollapsed ? "›" : "‹"}
      </button>

      <aside className="layer-panel">
        <div className="layer-panel__hero">
          <p className="layer-panel__eyebrow">
            RUDA Cadastral Management System
          </p>
          <h2 className="layer-panel__title">Administrative Filters</h2>
          <p className="layer-panel__description">
            Select a division, district, tehsil, and mouza to load the related
            cadastral data on the map.
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

        {/* Division */}

        <div className="layer-panel__field">
          <label className="layer-panel__label">Division</label>

          <select
            value={selectedDivision}
            onChange={handleDivision}
            disabled={loading.divisions}
          >
            <option value="">-- Division --</option>

            {divisions.map((d) => (
              <option key={d.division_i} value={d.division_i}>
                {d.division}
              </option>
            ))}
          </select>

          <p className="layer-panel__hint">
            {loading.divisions
              ? "Loading divisions..."
              : "Choose a division to filter its districts."}
          </p>
        </div>

        {/* District */}

        <div className="layer-panel__field">
          <label className="layer-panel__label">District</label>

          <select
            value={selectedDistrict}
            onChange={handleDistrict}
            disabled={!selectedDivision || loading.districts}
          >
            <option value="">-- District --</option>

            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <p className="layer-panel__hint">
            {!selectedDivision
              ? "Select a division first."
              : loading.districts
                ? "Loading districts..."
                : "Districts are filtered using the selected division ID."}
          </p>
        </div>

        {/* Tehsil */}

        <div className="layer-panel__field">
          <label className="layer-panel__label">Tehsil</label>

          <select
            value={selectedTehsil}
            onChange={handleTehsil}
            disabled={!selectedDistrict || loading.tehsils}
          >
            <option value="">-- Tehsil --</option>

            {tehsils.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <p className="layer-panel__hint">
            {!selectedDistrict
              ? "Select a district first."
              : loading.tehsils
                ? "Loading tehsils..."
                : "Tehsils are filtered using the selected district ID."}
          </p>
        </div>

        {/* Mouza */}

        <div className="layer-panel__field">
          <label className="layer-panel__label">Mouza</label>

          <select
            value={selectedMouza}
            onChange={handleMouza}
            disabled={!selectedTehsil || loading.mouzas}
          >
            <option value="">-- Mouza --</option>

            {mouzas.map((m) => (
              <option key={m.mouza_id} value={m.mouza_id}>
                {m.mouza}
              </option>
            ))}
          </select>

          <p className="layer-panel__hint">
            {!selectedTehsil
              ? "Select a tehsil first."
              : loading.mouzas
                ? "Loading mouzas..."
                : "Selecting a mouza loads its cadastral layer on the map."}
          </p>
        </div>

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
