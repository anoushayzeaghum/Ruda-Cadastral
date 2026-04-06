import React from "react";

export default function PlotDetails({ parcel = null }) {
  const p = parcel?.properties ?? {};

  const fields = [
    { label: "Division", value: p.division_name || p.division || p.division_name_en || p.division_i || "-" },
    { label: "District", value: p.district_name || p.district || p.district_name_en || p.district_i || "-" },
    { label: "Tehsil", value: p.tehsil_name || p.tehsil || p.tehsil_name_en || p.tehsil_i || "-" },
    { label: "Mouza", value: p.mouza_name || p.mouza || p.mouza_name_en || p.mouza_id || "-" },
    { label: "Type", value: p.type || p.landuse || p.land_type || "-" },
    { label: "K", value: p.k ?? p.K ?? p.khasra ?? p.khasra_no ?? p.khasra_id ?? p.karam ?? p.karam_no ?? "-" },
    { label: "Karam", value: p.karam ?? p.karam_no ?? p.karam_value ?? "-" },
    { label: "Area", value: p._area_acres ? `${p._area_acres.toFixed(2)} Acres` : p._area_m2 ? `${p._area_m2} m²` : p.area ?? "-" },
  ];

  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] flex-1 min-h-[300px] flex flex-col">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">Plot Details</h2>
      </div>

      <div className="p-4 h-full overflow-auto">
        {!parcel && (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No plot selected.
          </div>
        )}

        {parcel && (
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">{f.label}</div>
                <div className="font-medium text-sm text-gray-800">{String(f.value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}