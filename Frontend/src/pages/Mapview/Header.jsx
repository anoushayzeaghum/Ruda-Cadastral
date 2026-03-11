import rudaFirmLogo from "../../assets/Rudafirm.png";
import { useNavigate } from "react-router-dom";

export default function Header({ filters }) {
  const navigate = useNavigate();

  return (
    <div className="w-full px-2 py-0 bg-white/90 backdrop-blur-md shadow-md border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Brand */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 cursor-pointer bg-transparent focus:outline-none"
        >
          <img src={rudaFirmLogo} alt="RUDA" className="h-12 object-contain" />

          <h1 className="text-3xl font-medium tracking-widest uppercase text-[#1e3a5f]">
            RCMS
          </h1>
        </button>

        {filters && (
          <div className="grid grid-cols-4 gap-3 w-[960px] max-w-full">
            {/* Division */}
            <div className="flex flex-col">
              <label className="text-[10px] uppercase text-slate-500">
                Division
              </label>

              <select
                value={filters.selectedDivision}
                onChange={filters.handleDivisionChange}
                disabled={filters.loading.divisions}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <option value="">-- Division --</option>
                {filters.divisions.map((division) => (
                  <option key={division.division_i} value={division.division_i}>
                    {division.division}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="flex flex-col">
              <label className="text-[10px] uppercase text-slate-500">
                District
              </label>

              <select
                value={filters.selectedDistrict}
                onChange={filters.handleDistrictChange}
                disabled={
                  !filters.selectedDivision || filters.loading.districts
                }
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <option value="">-- District --</option>
                {filters.districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tehsil */}
            <div className="flex flex-col">
              <label className="text-[10px] uppercase text-slate-500">
                Tehsil
              </label>

              <select
                value={filters.selectedTehsil}
                onChange={filters.handleTehsilChange}
                disabled={!filters.selectedDistrict || filters.loading.tehsils}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f]"
              >
                <option value="">-- Tehsil --</option>
                {filters.tehsils.map((tehsil) => (
                  <option key={tehsil.id} value={tehsil.id}>
                    {tehsil.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mouza */}
            <div className="flex flex-col">
              <label className="text-[10px] uppercase text-slate-500">
                Mouza
              </label>

              <select
                value={filters.selectedMouza}
                onChange={filters.handleMouzaChange}
                disabled={!filters.selectedTehsil || filters.loading.mouzas}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a5f]"
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
        )}
      </div>
    </div>
  );
}
