export default function Legend({ featureCount, selectedMouzaName, isLoading }) {
  return (
    <aside className="absolute bottom-5 left-5 z-20 bg-white/95 backdrop-blur-md border rounded-xl shadow-lg p-4 min-w-[180px]">

      <div className="font-bold text-[#1e3a5f] border-b border-green-500 pb-1 mb-3">
        Layer Details
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="w-4 h-4 bg-green-400 border-2 border-green-600 rounded"></span>
        <span>Khasra boundary</span>
      </div>

      <div className="text-xs mt-3 border-t pt-2">
        <p className="text-slate-500 uppercase">Selected Mouza</p>
        <p className="text-[#1e3a5f] font-semibold">
          {selectedMouzaName ?? "None"}
        </p>
      </div>

      <div className="text-xs mt-3">
        <p className="text-slate-500 uppercase">Loaded Features</p>
        <p className="text-[#1e3a5f] font-semibold">{featureCount}</p>
      </div>

      <div className="text-xs mt-3">
        <p className="text-slate-500 uppercase">Status</p>
        <p className="text-[#1e3a5f] font-semibold">
          {isLoading ? "Loading" : "Ready"}
        </p>
      </div>

    </aside>
  );
}