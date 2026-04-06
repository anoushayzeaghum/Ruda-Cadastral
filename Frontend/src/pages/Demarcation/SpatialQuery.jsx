import React, { useEffect, useState } from "react";
import {
  getDivisions,
  getDistricts,
  getTehsils,
  getMouzas,
} from "../../services/api";

export default function SpatialQuery({
  filters = {},
  onFiltersChange = () => {},
  parcelOptions = [],
}) {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [mouzas, setMouzas] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const d = await getDivisions();
        setDivisions(
          d.map((it) => {
            const label =
              it.division_name ||
              it.name ||
              it.title ||
              it.division ||
              it.display_name ||
              it.label ||
              String(it.id ?? it.pk ?? it.division_i ?? it.i);
            const value = it.id ?? it.pk ?? it.division_i ?? it.i ?? label;
            return { value, label };
          }),
        );
      } catch (e) {
        setDivisions([]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadDistricts() {
      const id = filters?.selectedDivisionOptions?.value ?? null;
      if (!id) {
        setDistricts([]);
        return;
      }
      try {
        const res = await getDistricts(id);
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
  }, [filters?.selectedDivisionOptions]);

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
    async function loadMouzas() {
      const id = filters?.selectedTehsilOptions?.value ?? null;
      if (!id) {
        setMouzas([]);
        return;
      }
      try {
        const fc = await getMouzas(id);
        const list = (fc?.features || []).map((f) => ({
          value: f.properties?.id ?? f.id ?? f.properties?.gid,
          label:
            f.properties?.mouza_name ??
            f.properties?.name ??
            String(f.properties?.id ?? f.id),
          raw: f,
        }));
        setMouzas(list);
      } catch (e) {
        setMouzas([]);
      }
    }
    loadMouzas();
  }, [filters?.selectedTehsilOptions]);

  function handleChange(key, value) {
    // value is option object or raw string
    onFiltersChange({ [key]: value });
  }

  function clearAll() {
    onFiltersChange({
      selectedDivisionOptions: null,
      selectedDistrictOptions: null,
      selectedTehsilOptions: null,
      selectedMouzaDetails: null,
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
            value={filters?.selectedDivisionOptions?.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const opt =
                divisions.find((d) => String(d.value) === String(v)) ?? null;
              handleChange("selectedDivisionOptions", opt);
              // clear downstream
              handleChange("selectedDistrictOptions", null);
              handleChange("selectedTehsilOptions", null);
              handleChange("selectedMouzaDetails", null);
            }}
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            className="inputStyle"
            value={filters?.selectedDistrictOptions?.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const opt =
                districts.find((d) => String(d.value) === String(v)) ?? null;
              handleChange("selectedDistrictOptions", opt);
              handleChange("selectedTehsilOptions", null);
              handleChange("selectedMouzaDetails", null);
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
              handleChange("selectedMouzaDetails", null);
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
            value={filters?.selectedMouzaDetails?.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const opt =
                mouzas.find((d) => String(d.value) === String(v)) ?? null;
              // normalize selected mouza object for MapView expectations
              const normalized = opt
                ? {
                    id: opt.value,
                    mouza: opt.label,
                    mouza_id: opt.value,
                    raw: opt.raw,
                  }
                : null;
              handleChange("selectedMouzaDetails", normalized);
            }}
            disabled={!mouzas.length}
          >
            <option value="">Select Mouza</option>
            {mouzas.map((m) => (
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
              onClick={() => {
                /* selections are live; parent map should react */
              }}
              className="h-9 rounded bg-[#0d3f82] text-white font-semibold shadow-sm hover:bg-[#0b3670]"
            >
              Show
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="h-9 rounded bg-[#0d3f82] text-white font-semibold shadow-sm hover:bg-[#0b3670]"
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
          border-color: #0d3f82;
          box-shadow: 0 0 0 1px #0d3f82;
        }
      `}</style>
    </div>
  );
}
