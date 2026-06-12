import React, { useEffect, useState } from "react";
import { getDistricts, getTehsils, getMauzas } from "../../services/api";

export default function SpatialQuery({
  filters = {},
  onFiltersChange = () => {},
  parcelOptions = [],
}) {
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mauzas, setMauzas] = useState([]);

  useEffect(() => {
    async function loadDistricts() {
      try {
        const res = await getDistricts();
        setDistricts(
          res.map((it) => ({
            value: it.id ?? it.pk ?? it.district_i ?? it.i,
            label: it.name ?? it.district_name ?? it.title ?? String(it.id),
          })),
        );
      } catch (e) {
        setDistricts([]);
      }
    }
    loadDistricts();
  }, []);

  useEffect(() => {
    async function loadTehsils() {
      const id = filters?.selectedDistrictOptions?.value ?? null;
      if (!id) {
        setTehsils([]);
        return;
      }
      try {
        const res = await getTehsils(id);
        setTehsils(
          res.map((it) => ({
            value: it.id ?? it.pk ?? it.tehsil_i ?? it.i,
            label: it.name ?? it.tehsil_name ?? it.title ?? String(it.id),
          })),
        );
      } catch (e) {
        setTehsils([]);
      }
    }
    loadTehsils();
  }, [filters?.selectedDistrictOptions]);

  useEffect(() => {
    async function loadMauzas() {
      const id = filters?.selectedTehsilOptions?.value ?? null;
      if (!id) {
        setMauzas([]);
        return;
      }
      try {
        const fc = await getMauzas(id);
        const list = (fc?.features || []).map((f) => ({
          value: f.properties?.id ?? f.id ?? f.properties?.gid,
          label:
            f.properties?.mauza ||
            f.properties?.mauza_name ||
            f.properties?.name ||
            String(f.properties?.id ?? f.id),
          raw: f,
        }));
        setMauzas(list);
      } catch (e) {
        setMauzas([]);
      }
    }
    loadMauzas();
  }, [filters?.selectedTehsilOptions]);

  function handleChange(key, value) {
    onFiltersChange({ [key]: value });
  }

  function clearAll() {
    onFiltersChange({
      selectedDistrictOptions: null,
      selectedTehsilOptions: null,
      selectedMauzaDetails: null,
      selectedParcelNumber: "",
    });
  }

  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] h-[460px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Spatial Query
        </h2>
      </div>

      <div className="p-4 h-[calc(100%-56px)]">
        <div className="space-y-3">

          <select
            className="inputStyle"
            value={filters?.selectedDistrictOptions?.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const opt =
                districts.find((d) => String(d.value) === String(v)) ?? null;
              handleChange("selectedDistrictOptions", opt);
              handleChange("selectedTehsilOptions", null);
              handleChange("selectedMauzaDetails", null);
            }}
            disabled={!districts.length}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            className="inputStyle"
            value={filters?.selectedTehsilOptions?.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const opt =
                tehsils.find((d) => String(d.value) === String(v)) ?? null;
              handleChange("selectedTehsilOptions", opt);
              handleChange("selectedMauzaDetails", null);
            }}
            disabled={!tehsils.length}
          >
            <option value="">Select Tehsil</option>
            {tehsils.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            className="inputStyle"
            value={filters?.selectedMauzaDetails?.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const opt =
                mauzas.find((d) => String(d.value) === String(v)) ?? null;

              const normalized = opt
                ? {
                    value: opt.value, // fixed
                    label: opt.label, // fixed
                    id: opt.value,
                    mauza: opt.label,
                    mauza_id: opt.value,
                    raw: opt.raw,
                  }
                : null;

              handleChange("selectedMauzaDetails", normalized);
            }}
            disabled={!mauzas.length}
          >
            <option value="">Select Mauza</option>
            {mauzas.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="inputStyle"
            value={filters?.viewBy ?? "khasra"}
            onChange={(e) => {
              handleChange("viewBy", e.target.value);
              handleChange("selectedParcelNumber", "");
            }}
          >
            <option value="khasra">View By: Khasra</option>
            <option value="murabba">View By: Murabba</option>
            <option value="parcel">View By: Parcel ID</option>
          </select>

          <div>
            <input
              list="parcel-suggestions"
              className="inputStyle"
              placeholder="Search khasra / murabba"
              value={filters?.selectedParcelNumber ?? ""}
              onChange={(e) =>
                handleChange("selectedParcelNumber", e.target.value)
              }
            />
            <datalist id="parcel-suggestions">
              {parcelOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              className="h-9 rounded bg-green-700 text-white text-sm font-medium shadow-sm hover:bg-green-800"
            >
              Show
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="h-9 rounded bg-green-700 text-white text-sm font-medium shadow-sm hover:bg-green-800"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .inputStyle {
          width: 100%;
          height: 38px;
          border: 1px solid #d5dbe1;
          border-radius: 4px;
          background: white;
          padding: 0 12px;
          font-size: 14px;
          color: #4b5563;
          outline: none;
        }
        .inputStyle:focus {
          border-color: #0c6d30;
          box-shadow: 0 0 0 1px #0a5a27;
        }
      `}</style>
    </div>
  );
}
