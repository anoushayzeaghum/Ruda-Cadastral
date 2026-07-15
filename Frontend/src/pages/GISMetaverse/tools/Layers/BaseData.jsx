import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import RUDAMasterPlan from "./RUDAMasterPlan";

export default function BaseData({ map }) {
 const [open,setOpen]=useState(false);
 return <div className="border-b border-[#343c4c]">
  <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]" onClick={()=>setOpen(v=>!v)}><span>BASE DATA</span>{open?<ChevronDown size={15}/>:<ChevronRight size={15}/>}</button>
  {open && <div className="mx-2 mb-2 rounded-sm border border-[#13593f]/40 bg-[#071f18]">
    <div className="px-4 py-3 text-[11px] text-white/80">EXISTING LAND USE</div>
    <RUDAMasterPlan map={map} />
    <div className="px-4 py-3 text-[11px] text-white/80">FLOOD INUNDATION: Flood 2025, Flood QC Maps</div>
  </div>}
 </div>
}
