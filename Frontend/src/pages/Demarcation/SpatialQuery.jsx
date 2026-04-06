import React from "react";

export default function SpatialQuery() {
  return (
    <div className="bg-white border border-[#b8c2cc] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] h-[460px]">
      <div className="h-[56px] border-b border-[#d4dbe2] px-4 flex items-center">
        <h2 className="text-[17px] font-bold uppercase tracking-wide text-[#5b5b5b]">
          Spatial Query
        </h2>
      </div>

      <div className="p-4 h-[calc(100%-56px)]">
        <div className="space-y-3">
          <select className="inputStyle">
            <option>Lahore</option>
          </select>
          <select className="inputStyle">
            <option>Raiwind</option>
          </select>
          <select className="inputStyle">
            <option>LDA Avenue</option>
          </select>
          <select className="inputStyle">
            <option>M</option>
          </select>
          <select className="inputStyle">
            <option>Select Plot</option>
          </select>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button className="h-9 rounded bg-[#0d3f82] text-white font-semibold shadow-sm hover:bg-[#0b3670]">
              Show
            </button>
            <button className="h-9 rounded bg-[#0d3f82] text-white font-semibold shadow-sm hover:bg-[#0b3670]">
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