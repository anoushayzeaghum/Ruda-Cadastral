// import { ChevronDown } from "lucide-react";
// import { getItemId, getLabel, getMauzaId, getSocietyId } from "./api";

// export default function Society3DSubHeader({
//   districts = [],
//   tehsils = [],
//   mauzas = [],
//   societies = [],
//   selectedDistrict = "",
//   selectedTehsil = "",
//   selectedMauza = "",
//   selectedSociety = "",
//   loading = {},
//   onDistrictChange,
//   onTehsilChange,
//   onMauzaChange,
//   onSocietyChange,
// }) {
//   const districtName =
//     getLabel(
//       districts.find((item) => String(getItemId(item)) === String(selectedDistrict)),
//       ["name", "district", "district_name"],
//       "Select",
//     ) || "Select";

//   const tehsilName =
//     getLabel(
//       tehsils.find((item) => String(getItemId(item)) === String(selectedTehsil)),
//       ["name", "tehsil", "tehsil_name"],
//       "Select",
//     ) || "Select";

//   const mauzaName =
//     getLabel(
//       mauzas.find((item) => String(getMauzaId(item)) === String(selectedMauza)),
//       ["mauza", "name", "mauza_name"],
//       "Select",
//     ) || "Select";

//   const societyName =
//     getLabel(
//       societies.find((item) => String(getSocietyId(item)) === String(selectedSociety)),
//       ["society", "name", "society_name"],
//       "Select",
//     ) || "Select";

//   return (
//     <div className="absolute left-1/2 top-4 z-30 w-fit max-w-[calc(100vw-120px)] -translate-x-1/2 overflow-visible rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md">
//       <div className="flex w-fit items-center justify-center gap-2 px-2 py-2">
//         <FilterCard label="District — ضلع" value={loading.districts ? "Loading..." : districtName}>
//           <select
//             value={selectedDistrict}
//             onChange={(event) => onDistrictChange(event.target.value)}
//             disabled={loading.districts}
//             className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
//           >
//             <option value="">-- District --</option>
//             {districts.map((district) => {
//               const id = getItemId(district);
//               return (
//                 <option key={id} value={id}>
//                   {getLabel(district, ["name", "district", "district_name"])}
//                 </option>
//               );
//             })}
//           </select>
//         </FilterCard>

//         <FilterCard label="Tehsil — تحصیل" value={loading.tehsils ? "Loading..." : tehsilName}>
//           <select
//             value={selectedTehsil}
//             onChange={(event) => onTehsilChange(event.target.value)}
//             disabled={!selectedDistrict || loading.tehsils}
//             className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
//           >
//             <option value="">-- Tehsil --</option>
//             {tehsils.map((tehsil) => {
//               const id = getItemId(tehsil);
//               return (
//                 <option key={id} value={id}>
//                   {getLabel(tehsil, ["name", "tehsil", "tehsil_name"])}
//                 </option>
//               );
//             })}
//           </select>
//         </FilterCard>

//         <FilterCard label="Mauza — موضع" value={loading.mauzas ? "Loading..." : mauzaName}>
//           <select
//             value={selectedMauza}
//             onChange={(event) => onMauzaChange(event.target.value)}
//             disabled={!selectedTehsil || loading.mauzas}
//             className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
//           >
//             <option value="">-- Mauza --</option>
//             {mauzas.map((mauza) => {
//               const id = getMauzaId(mauza);
//               return (
//                 <option key={id} value={id}>
//                   {getLabel(mauza, ["mauza", "name", "mauza_name"])}
//                 </option>
//               );
//             })}
//           </select>
//         </FilterCard>

//         <FilterCard label="Society" value={loading.societies ? "Loading..." : societyName}>
//           <select
//             value={selectedSociety}
//             onChange={(event) => onSocietyChange(event.target.value)}
//             disabled={!selectedMauza || loading.societies || !societies.length}
//             className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
//           >
//             <option value="">
//               {loading.societies ? "Loading societies..." : societies.length ? "-- Society --" : "No society found"}
//             </option>
//             {societies.map((society) => {
//               const id = getSocietyId(society);
//               return (
//                 <option key={id} value={id}>
//                   {getLabel(society, ["society", "name", "society_name"])}
//                 </option>
//               );
//             })}
//           </select>
//         </FilterCard>
//       </div>
//     </div>
//   );
// }

// function FilterCard({ label, value, children }) {
//   return (
//     <div className="relative w-[132px] overflow-visible rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm hover:border-green-600">
//       <p className="text-[9px] text-gray-500">{label}</p>
//       <div className="flex items-center justify-between">
//         <p className="max-w-[110px] truncate text-xs font-semibold text-gray-800">{value}</p>
//         <ChevronDown size={13} className="ml-2 shrink-0 text-gray-400" />
//       </div>
//       {children}
//     </div>
//   );
// }


import { ChevronDown } from "lucide-react";
import { getItemId, getLabel } from "./api";
export default function Society3DSubHeader({
  projects = [],
  selectedProject = "",
  loading = {},
  onProjectChange,
}) {
  const projectName =
    getLabel(
      projects.find(
        (item) => String(getItemId(item)) === String(selectedProject)
      ),
      ["name", "project_name"],
      "Select"
    ) || "Select";

  return (
    <div className="absolute left-1/2 top-4 z-30 w-fit max-w-[calc(100vw-120px)] -translate-x-1/2 overflow-visible rounded-xl border border-white/40 bg-[#0f3d2e] shadow-xl backdrop-blur-md">
      <div className="flex w-fit items-center justify-center gap-2 px-2 py-2">
        <FilterCard
          label="Project — منصوبہ"
          value={loading.projects ? "Loading..." : projectName}
        >
          <select
            value={selectedProject}
            onChange={(event) => onProjectChange(event.target.value)}
            disabled={loading.projects}
            className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          >
            <option value="">-- Project --</option>

            {projects.map((project) => {
              const id = getItemId(project);

              return (
                <option key={id} value={id}>
                  {getLabel(project, ["name", "project_name"])}
                </option>
              );
            })}
          </select>
        </FilterCard>
      </div>
    </div>
  );
}

function FilterCard({ label, value, children }) {
  return (
    <div className="relative w-[160px] overflow-visible rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm hover:border-green-600">
      <p className="text-[9px] text-gray-500">{label}</p>
      <div className="flex items-center justify-between">
        <p className="max-w-[140px] truncate text-xs font-semibold text-gray-800">
          {value}
        </p>
        <ChevronDown size={13} className="ml-2 shrink-0 text-gray-400" />
      </div>
      {children}
    </div>
  );
}