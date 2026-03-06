import { useEffect, useState } from "react";
import {
  getDistricts,
  getTehsils,
  getMouzas,
  getKhasras,
} from "../../services/api";

export default function FilterPanel() {
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mouzas, setMouzas] = useState([]);
  const [khasras, setKhasras] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTehsil, setSelectedTehsil] = useState("");
  const [selectedMouza, setSelectedMouza] = useState("");

  useEffect(() => {
    getDistricts().then(setDistricts);
  }, []);

  const handleDistrict = (e) => {
    const id = e.target.value;
    setSelectedDistrict(id);
    getTehsils(id).then(setTehsils);
  };

  const handleTehsil = (e) => {
    const id = e.target.value;
    setSelectedTehsil(id);
    getMouzas(id).then(setMouzas);
  };

  const handleMouza = (e) => {
    const id = e.target.value;
    setSelectedMouza(id);
    getKhasras(id).then(setKhasras);
  };

  return (
    <div className="w-72 bg-white shadow-lg p-4 space-y-4">
      <select onChange={handleDistrict} className="w-full border p-2 rounded">
        <option>Select District</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select onChange={handleTehsil} className="w-full border p-2 rounded">
        <option>Select Tehsil</option>
        {tehsils.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select onChange={handleMouza} className="w-full border p-2 rounded">
        <option>Select Mouza</option>
        {mouzas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <select className="w-full border p-2 rounded">
        <option>Select Khasra</option>
        {khasras.map((k) => (
          <option key={k.id}>{k.label}</option>
        ))}
      </select>
    </div>
  );
}
