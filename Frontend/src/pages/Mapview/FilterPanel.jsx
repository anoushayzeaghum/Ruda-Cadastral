import { useEffect, useState } from "react";
import {
  getDivisions,
  getDistricts,
  getTehsils,
  getMouzas
} from "../../services/api";

export default function FilterPanel({ onMouzaSelect }) {

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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white shadow-lg rounded-xl px-4 py-2 flex gap-4">

      <select onChange={handleDivision} className="border px-3 py-2 rounded">
        <option>--Division--</option>
        {divisions.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <select onChange={handleDistrict} className="border px-3 py-2 rounded">
        <option>--District--</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <select onChange={handleTehsil} className="border px-3 py-2 rounded">
        <option>--Tehsil--</option>
        {tehsils.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <select onChange={handleMouza} className="border px-3 py-2 rounded">
        <option>--Mauza--</option>
        {mouzas.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

    </div>
  );
}