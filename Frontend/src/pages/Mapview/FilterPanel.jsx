import { useEffect, useState } from "react";
import {
  getDivisions,
  getDistricts,
  getTehsils,
  getMouzas
} from "../../services/api";

export default function FilterPanel({ onMouzaSelect, isCollapsed, onToggle }) {

  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mouzas, setMouzas] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");

  useEffect(() => {
    getDivisions().then(setDivisions);
  }, []);

  const handleDivision = (e) => {
    const id = e.target.value;

    setSelectedDivision(id);
    setSelectedDistrict("");
    setSelectedTehsil("");
    setSelectedMouza("");

    setDistricts([]);
    setTehsils([]);
    setMouzas([]);

    if (id) getDistricts(id).then(setDistricts);
  };

  const handleDistrict = (e) => {
    const id = e.target.value;

    setSelectedDistrict(id);
    setSelectedTehsil("");
    setSelectedMouza("");

    setTehsils([]);
    setMouzas([]);

    if (id) getTehsils(id).then(setTehsils);
  };

  const handleTehsil = (e) => {
    const id = e.target.value;

    setSelectedTehsil(id);
    setSelectedMouza("");

    setMouzas([]);

    if (id) getMouzas(id).then(setMouzas);
  };

  const handleMouza = (e) => {
    const id = e.target.value;

    setSelectedMouza(id);

    // update map
    onMouzaSelect(id);
  };

  return (
    <div
      className={`layer-panel-wrapper ${isCollapsed ? "layer-panel-wrapper--collapsed" : ""}`}
    >
      <button
        type="button"
        className="layer-panel__toggle"
        onClick={onToggle}
      >
        {isCollapsed ? "›" : "‹"}
      </button>

      <aside className="layer-panel">

        <p className="layer-panel__system-title">
          RUDA Cadastral Management System
        </p>

        <h2 className="layer-panel__title">Filter Panel</h2>

        {/* Division */}

        <div className="layer-panel__field">
          <label>Division</label>

          <select value={selectedDivision} onChange={handleDivision}>
            <option value="">-- Division --</option>

            {divisions.map((d) => (
              <option key={d.gid} value={d.division_i}>
                {d.division}
              </option>
            ))}

          </select>
        </div>

        {/* District */}

        <div className="layer-panel__field">
          <label>District</label>

          <select value={selectedDistrict} onChange={handleDistrict}>
            <option value="">-- District --</option>

            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}

          </select>
        </div>

        {/* Tehsil */}

        <div className="layer-panel__field">
          <label>Tehsil</label>

          <select value={selectedTehsil} onChange={handleTehsil}>
            <option value="">-- Tehsil --</option>

            {tehsils.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}

          </select>
        </div>

        {/* Mouza */}

        <div className="layer-panel__field">
          <label>Mouza</label>

          <select value={selectedMouza} onChange={handleMouza}>
            <option value="">-- Mouza --</option>

            {mouzas.map((m) => (
              <option key={m.mouza_id} value={m.mouza_id}>
                {m.mouza}
              </option>
            ))}

          </select>
        </div>

      </aside>
    </div>
  );
}