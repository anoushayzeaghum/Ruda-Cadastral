import { TrendingUp } from "lucide-react";

export default function KPISection() {
  return (
    <div className="grid grid-cols-11 gap-3">

      {/* CARD 1 */}
      <div className="col-span-2 bg-[#0f1720] border border-green-500/90 rounded-xl px-5 py-4
      shadow-[0_0_20px_rgba(34,197,94,0.25)]">

        <p className="text-xs text-gray-400 mb-1">
          Total Khasra Parcel Data
        </p>

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-2xl font-bold text-white">
              750,000
            </h3>

            <p className="text-xs text-green-400 mt-1">
              Growth this month
            </p>
          </div>

          <TrendingUp className="text-green-400" size={28} />

        </div>

      </div>


      {/* CARD 2 */}
      <div className="col-span-3 bg-[#0f1720] border border-green-500/90 rounded-xl px-5 py-4
      shadow-[0_0_20px_rgba(234,179,8,0.25)]">

        <p className="text-xs text-gray-400 mb-2">
          Khasra Data Status
        </p>

        <div className="flex justify-between text-sm">

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-gray-400">Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span className="text-gray-400">Pending</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
            <span className="text-gray-400">Not Verified</span>
          </div>

        </div>

        <div className="flex justify-between mt-2 text-lg font-semibold">

          <span className="text-white">650,000</span>
          <span className="text-yellow-400">75,000</span>
          <span className="text-red-400">25,000</span>

        </div>

      </div>


      {/* CARD 3 */}
      <div className="col-span-2 bg-[#0f1720] border border-green-500/90 rounded-xl px-5 py-4
      shadow-[0_0_20px_rgba(34,197,94,0.25)]">

        <p className="text-xs text-gray-400 mb-2">
          Tehsil & Mouza Counts
        </p>

        <div className="text-white text-lg font-semibold mb-2">
          148 <span className="text-gray-400 text-sm">tehsils</span>
          <span className="text-gray-400 mx-1">/</span>
          55,000 <span className="text-gray-400 text-sm">Mouzes</span>
        </div>

        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 w-[65%] rounded-full"></div>
        </div>

      </div>


      {/* CARD 4 */}
      <div className="col-span-2 bg-[#0f1720] border border-green-500/90 rounded-xl px-5 py-4
      shadow-[0_0_20px_rgba(34,197,94,0.25)] flex items-center justify-between">

        <div>
          <p className="text-xs text-gray-400 mb-1">
            Acquired Land Progress
          </p>

          <h3 className="text-2xl font-bold text-white">
            25,800
            <span className="text-sm text-gray-400 ml-1">
              Acres
            </span>
          </h3>
        </div>

        <div className="w-12 h-12 rounded-full border-4 border-green-400"></div>

      </div>


      {/* CARD 5 */}
      <div className="col-span-2 bg-[#0f1720] border border-green-500/90 rounded-xl px-5 py-4
      shadow-[0_0_10px_rgba(255,255,255,0.05)]">

        <p className="text-xs text-gray-400 mb-1">
          Remaining Land
        </p>

        <div className="text-xl font-bold text-white">
          312,134
          <span className="text-gray-400 text-sm ml-1">
            Kanal
          </span>
        </div>

        <div className="text-sm text-gray-400">
          76,700 Acres
        </div>

      </div>

    </div>
  );
}