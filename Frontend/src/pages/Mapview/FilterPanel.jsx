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
    setDistricts([]);
    setTehsils([]);
    setMouzas([]);
    getDistricts(id).then(setDistricts);
  };

  const handleDistrict = (e) => {
    const id = e.target.value;
    setSelectedDistrict(id);
    setTehsils([]);
    setMouzas([]);
    getTehsils(id).then(setTehsils);
  };

  const handleTehsil = (e) => {
    const id = e.target.value;
    setSelectedTehsil(id);
    setMouzas([]);
    getMouzas(id).then(setMouzas);
  };

  const handleMouza = (e) => {
    const id = e.target.value;
    setSelectedMouza(id);

    // trigger map update
    onMouzaSelect(id);
  };

  return (
    <div
      className={`layer-panel-wrapper ${isCollapsed ? "layer-panel-wrapper--collapsed" : ""}`}
      aria-label="Location panel"
    >
      <button
        type="button"
        className="layer-panel__toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        title={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? "›" : "‹"}
      </button>
      <aside className="layer-panel" aria-label="Filter by location">
        <h2 className="layer-panel__title">Location</h2>

        <div className="layer-panel__field">
        <label className="layer-panel__label" htmlFor="filter-division">Division</label>
        <select id="filter-division" onChange={handleDivision} value={selectedDivision}>
          <option value="">-- Division --</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="layer-panel__field">
        <label className="layer-panel__label" htmlFor="filter-district">District</label>
        <select id="filter-district" onChange={handleDistrict} value={selectedDistrict}>
          <option value="">-- District --</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="layer-panel__field">
        <label className="layer-panel__label" htmlFor="filter-tehsil">Tehsil</label>
        <select id="filter-tehsil" onChange={handleTehsil} value={selectedTehsil}>
          <option value="">-- Tehsil --</option>
          {tehsils.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="layer-panel__field">
        <label className="layer-panel__label" htmlFor="filter-mauza">Mauza</label>
        <select id="filter-mauza" onChange={handleMouza} value={selectedMouza}>
          <option value="">-- Mauza --</option>
          {mouzas.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      </aside>
    </div>
  );
}